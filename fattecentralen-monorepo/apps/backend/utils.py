from functools import wraps
from flask import flash, redirect, url_for, current_app
from flask_login import current_user
# app/utils.py

# === Standard Bibliotek Imports ===
import logging
import os
import random
import string
import uuid
import re # For clean_base_url
import json # For JSON processing
from datetime import datetime, timedelta, date, timezone
from typing import Optional, Dict, Any, Tuple, List, Set, Callable, Union
from urllib.parse import urlparse, urljoin

# === Tredjeparts Bibliotek Imports ===
from flask import url_for, current_app, request, jsonify, g as flask_g # Added jsonify and flask_g
from flask_login import current_user
import requests
import firebase_admin
from firebase_admin import auth as firebase_auth

# === Lokale Applikationsimports ===
from .models import User as DBUser, PrivateMessage, League, SportEvent, SportOutcome, Notification, Badge # Added Notification, Badge
from sqlalchemy import func
from .extensions import db, socketio # Added socketio

# Konfigurer logger
log = logging.getLogger(__name__)

# === Konstanter ===
BACKUP_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

# --- Helper function to clean base URL (Moved from routes.main) ---
def clean_base_url(url: str) -> str:
    """ Helper function to clean the base URL: removes trailing slashes and /v3 or /v4 paths. """
    if not isinstance(url, str):
        return ''
    # Remove known API version paths from the end first
    cleaned_url = re.sub(r'/v[34]/?$', '', url.rstrip('/'))
    # Then remove any remaining trailing slashes
    return cleaned_url.rstrip('/')

def admin_required(f):
    """
    Decorator to ensure a user is an admin.
    If not, flashes a message and redirects to the main index.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if user is authenticated AND is an admin
        if not current_user.is_authenticated or not getattr(current_user, 'is_admin', False):
            # Log the attempt, including IP and path for better tracking
            current_app.logger.warning(
                f"Unauthorized access attempt to admin route by user '{getattr(current_user, 'id', 'Anonymous')}' "
                f"(Authenticated: {current_user.is_authenticated}, Admin: {getattr(current_user, 'is_admin', False)}) "
                f"from IP: {request.remote_addr} to {request.path}"
            )
            flash("Du har ikke de nødvendige rettigheder for at tilgå denne side.", "danger")
            return redirect(url_for('main.index'))
        # If checks pass, execute the original function
        return f(*args, **kwargs)
    return decorated_function

def firebase_token_required(f):
    """
    Decorator to ensure a valid Firebase ID token is provided in the Authorization header.
    If valid, the decoded token is available in flask_g.firebase_user.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            current_app.logger.warning("Firebase token required: Missing Authorization header.")
            return jsonify({"message": "Authorization header is missing"}), 401

        parts = auth_header.split()
        if parts[0].lower() != 'bearer':
            current_app.logger.warning(f"Firebase token required: Invalid Authorization header format (expected Bearer token). Header: {auth_header}")
            return jsonify({"message": "Authorization header must start with Bearer"}), 401
        elif len(parts) == 1:
            current_app.logger.warning(f"Firebase token required: Token not found after Bearer. Header: {auth_header}")
            return jsonify({"message": "Token not found"}), 401
        elif len(parts) > 2:
            current_app.logger.warning(f"Firebase token required: Invalid Authorization header format (too many parts). Header: {auth_header}")
            return jsonify({"message": "Authorization header must be Bearer token"}), 401

        id_token = parts[1]
        try:
            # Verify the ID token while checking if the token is revoked.
            # The check_revoked flag causes an error if the token has been revoked.
            decoded_token = firebase_auth.verify_id_token(id_token, check_revoked=True)
            flask_g.firebase_user = decoded_token # Store the decoded token in Flask's g object
            current_app.logger.debug(f"Firebase token verified successfully for UID: {decoded_token.get('uid')}")
        except firebase_auth.RevokedIdTokenError:
            current_app.logger.warning(f"Firebase token revoked for UID: {decoded_token.get('uid') if 'decoded_token' in locals() else 'unknown'}. Token: {id_token[:20]}...")
            return jsonify({"message": "Token has been revoked. Please re-authenticate."}), 401
        except firebase_auth.UserDisabledError:
            current_app.logger.warning(f"Firebase user disabled for UID: {decoded_token.get('uid') if 'decoded_token' in locals() else 'unknown'}. Token: {id_token[:20]}...")
            return jsonify({"message": "User account has been disabled."}), 403
        except firebase_auth.InvalidIdTokenError as e:
            current_app.logger.warning(f"Invalid Firebase ID token: {e}. Token: {id_token[:20]}...")
            return jsonify({"message": f"Invalid ID token: {e}"}), 401
        except Exception as e: # Catch any other Firebase Admin SDK errors
            current_app.logger.error(f"Error verifying Firebase ID token: {e}. Token: {id_token[:20]}...")
            return jsonify({"message": "Could not verify authentication token."}), 500

        return f(*args, **kwargs)
    return decorated_function

def dt_filter_func(dt_obj, relative=False, default='N/A'):
    """Simpel datetime formateringsfunktion."""
    if not isinstance(dt_obj, datetime):
        log.warning(f"dt_filter_func received non-datetime object: {type(dt_obj)}, value: {dt_obj}")
        if isinstance(dt_obj, str):
             # Attempt to parse the string (assuming _parse_datetime_string is defined below or imported)
             parsed_dt = _parse_datetime_string(dt_obj)
             if not parsed_dt:
                 return default
             dt_obj = parsed_dt
        else:
            return default

    if relative:
        try:
            now = datetime.now(timezone.utc)
            if dt_obj.tzinfo is None or dt_obj.tzinfo.utcoffset(dt_obj) is None:
                 dt_aware = dt_obj.replace(tzinfo=timezone.utc)
            else:
                 dt_aware = dt_obj.astimezone(timezone.utc)
            delta = now - dt_aware
            if delta.days >= 365: return f"for {delta.days // 365} år siden"
            if delta.days >= 30: return f"for {delta.days // 30} måneder siden"
            if delta.days > 1: return f"for {delta.days} dage siden"
            elif delta.days == 1: return "i går"
            elif delta.total_seconds() < 0: return "i fremtiden"
            elif delta.total_seconds() < 10: return "lige nu"
            elif delta.total_seconds() < 60: return f"for {int(delta.total_seconds())} sek. siden"
            elif delta.total_seconds() < 3600: return f"for {int(delta.total_seconds() // 60)} min. siden"
            else: return f"for {int(delta.total_seconds() // 3600)} timer siden"
        except Exception as e:
            log.exception(f"Error calculating relative time in dt_filter_func for: {dt_obj} - {e}")
            try: return dt_obj.strftime('%d.%m.%Y %H:%M')
            except: return default
    else:
        try:
            if dt_obj.tzinfo is None or dt_obj.tzinfo.utcoffset(dt_obj) is None:
                 dt_aware = dt_obj.replace(tzinfo=timezone.utc)
            else:
                 dt_aware = dt_obj.astimezone(timezone.utc)
            return dt_aware.isoformat(timespec='seconds').replace('+00:00', 'Z')
        except Exception as e:
             log.error(f"Error applying isoformat in dt_filter_func for: {dt_obj} - {e}")
             return default

def get_user_data_by_id(user_identifier: Optional[Union[str, int]]) -> Optional[DBUser]:
    if not user_identifier:
        log.debug("get_user_data_by_id: called with empty user_identifier.")
        return None
    user_obj = None
    try:
        if isinstance(user_identifier, int):
            user_obj = DBUser.query.get(user_identifier)
            if user_obj: log.debug(f"get_user_data_by_id: Found user by PK '{user_identifier}'.")
            else: log.debug(f"get_user_data_by_id: No user found for PK '{user_identifier}'.")
        elif isinstance(user_identifier, str):
            user_obj = DBUser.query.filter(func.lower(DBUser.username) == func.lower(user_identifier)).first()
            if user_obj: log.debug(f"get_user_data_by_id: Found user by username '{user_identifier}'.")
            else: log.debug(f"get_user_data_by_id: No user found for username '{user_identifier}'.")
        else:
            log.warning(f"get_user_data_by_id: Invalid type for user_identifier: {type(user_identifier)}")
            return None
        return user_obj
    except RuntimeError as e:
        log.error(f"Application context needed for get_user_data_by_id. Error: {e}")
        return None
    except Exception as e:
        log.exception(f"get_user_data_by_id: Unexpected error processing user_identifier '{user_identifier}'.")
        return None

def get_user_data_batch(usernames: Union[List[str], Set[str]]) -> Dict[str, Optional[DBUser]]:
    if not usernames: return {}
    original_case_map: Dict[str, str] = {name.lower(): name for name in usernames}
    lower_usernames_to_query: List[str] = list(original_case_map.keys())
    log.debug(f"get_user_data_batch: Fetching DBUser objects for {len(lower_usernames_to_query)} unique lowercase usernames.")
    results: Dict[str, Optional[DBUser]] = {original_name: None for original_name in usernames}
    try:
        found_users: List[DBUser] = DBUser.query.filter(func.lower(DBUser.username).in_(lower_usernames_to_query)).all()
        for user_obj in found_users:
            original_username = original_case_map.get(user_obj.username.lower())
            if original_username: results[original_username] = user_obj
            else: log.warning(f"get_user_data_batch: Found user '{user_obj.username}' in DB but couldn't map back...")
        found_count = sum(1 for user_obj in results.values() if user_obj is not None)
        log.info(f"get_user_data_batch: Fetched {found_count} DBUser objects out of {len(usernames)} requested.")
        not_found_original_keys = [uname for uname, user_obj in results.items() if user_obj is None]
        if not_found_original_keys: log.debug(f"get_user_data_batch: Could not find DBUser objects for: {not_found_original_keys}")
        return results
    except RuntimeError as e:
        log.error(f"get_user_data_batch: Application context needed. Error: {e}")
        return {name: None for name in usernames}
    except Exception as e:
        log.exception(f"get_user_data_batch: Unexpected error processing usernames {list(usernames)}.")
        return {name: None for name in usernames}

def generate_uid() -> str:
    new_uuid = str(uuid.uuid4())
    log.debug(f"Generated new UID: {new_uuid}")
    return new_uuid

def generate_backup_codes(num_codes: int = 0, code_length: int = 10) -> List[str]:
    final_num_codes = num_codes
    if final_num_codes <= 0:
        try:
            cfg_num = current_app.config.get('NUM_BACKUP_CODES', 10)
            final_num_codes = int(cfg_num) if cfg_num is not None else 10
        except (RuntimeError, ValueError, TypeError) as e:
            log.warning(f"Could not read/parse NUM_BACKUP_CODES from config ({e}). Using default: 10.")
            final_num_codes = 10
    if final_num_codes <= 0: return []
    codes = []
    half_len = code_length // 2
    sep = '-'
    for _ in range(final_num_codes):
        chars = ''.join(random.choices(BACKUP_CODE_ALPHABET, k=code_length))
        formatted = f"{chars[:half_len]}{sep}{chars[half_len:]}"
        codes.append(formatted)
    log.info(f"Generated {len(codes)} backup codes.")
    return codes

def _parse_datetime_string(timestamp_str: Optional[str]) -> Optional[datetime]:
    if not isinstance(timestamp_str, str) or not timestamp_str: return None
    try:
        ts = timestamp_str.replace('Z', '+00:00')
        dt_aware = datetime.fromisoformat(ts)
        dt_naive_utc = dt_aware.astimezone(timezone.utc).replace(tzinfo=None)
        return dt_naive_utc
    except ValueError:
        log.warning(f"Could not parse timestamp '{timestamp_str}' using fromisoformat.")
    except Exception as e:
        log.error(f"Error parsing timestamp '{timestamp_str}': {e}")
    return None

def is_safe_url(target: str) -> bool:
    if not target: return False
    try:
        ref_url = urlparse(request.host_url)
        test_url = urlparse(urljoin(request.host_url, target))
        is_safe = (test_url.scheme in ('http', 'https') and ref_url.netloc == test_url.netloc) or \
                  (not test_url.scheme and not test_url.netloc)
        if not is_safe: log.warning(f"Blocked unsafe redirect target: '{target}' (Evaluated against host: {request.host_url})")
        return is_safe
    except RuntimeError:
         log.error("is_safe_url called outside of a request context!")
         return False
    except Exception as e:
        log.exception(f"Error validating safety of URL '{target}': {e}")
        return False

def get_common_context() -> Dict[str, Any]:
    log.debug("Generating common template context...")
    default_avatar_rel_path = 'avatars/default_avatar.png'
    app_name = "FatteCentralen"
    final_default_avatar_url = "/static/avatars/default_avatar.png"
    try:
        app_name = current_app.config.get('APP_NAME', app_name)
        cfg_default_avatar = current_app.config.get('DEFAULT_AVATAR')
        if cfg_default_avatar and isinstance(cfg_default_avatar, str):
            default_avatar_rel_path = cfg_default_avatar.lstrip('/').replace('static/', '', 1)
        final_default_avatar_url = url_for('static', filename=default_avatar_rel_path)
    except RuntimeError: log.error("Cannot generate URLs in get_common_context: No application context.")
    except Exception as e: log.exception(f"Error generating default avatar URL in context: {e}")
    context: Dict[str, Any] = {
        "currentUser": None, "user_balance": 0.0,
        "user_avatar_url": final_default_avatar_url,
        "isAdmin": False, "is_authenticated": False,
        "user_level": 1, "user_rank": "N/A",
        "app_name": app_name,
        "debug_mode": current_app.config.get('DEBUG', False) if 'current_app' in locals() else False
    }
    if current_user and current_user.is_authenticated:
        username = current_user.username
        log.debug(f"Populating context for authenticated user: '{username}' (ID: {current_user.id})")
        user_avatar_url = current_user.avatar_url
        if not user_avatar_url:
            user_avatar_url = final_default_avatar_url
            log.debug(f"User '{username}' avatar_url from model was empty or failed. Using default: {user_avatar_url}")
        else: log.debug(f"User avatar URL from model property: '{user_avatar_url}'")
        context.update({
            "currentUser": username, "user_balance": current_user.balance,
            "user_avatar_url": user_avatar_url, "isAdmin": current_user.is_admin,
            "is_authenticated": True, "user_level": current_user.level,
            "user_rank": current_user.rank or "N/A", "app_name": app_name,
            "debug_mode": current_app.config.get('DEBUG', False) if 'current_app' in locals() and hasattr(current_app, 'config') else False,
            "unread_message_count": PrivateMessage.query.filter_by(recipient_id=current_user.id, is_read=False, recipient_deleted=False).count()
        })
    else: log.debug("Context generated for anonymous user.")
    return context

def get_user_portfolio() -> Dict[str, Any]:
    if current_user and current_user.is_authenticated:
        return getattr(current_user, 'portfolio', {})
    return {}

def get_user_transactions() -> List[Dict[str, Any]]:
    if current_user and current_user.is_authenticated:
        return getattr(current_user, 'stock_transactions', [])
    return []

def get_balance_history(user_id: str, days: int = 7) -> Tuple[List[str], List[float]]:
    log.debug(f"Simulating balance history for user='{user_id}', days={days}")
    labels: List[str] = []
    data_points: List[float] = []
    if not user_id or days <= 0: return labels, data_points
    try:
        user_obj = get_user_data_by_id(user_id)
        if not user_obj:
             log.warning(f"User '{user_id}' not found for balance history sim.")
             return labels, data_points
        current_balance = user_obj.balance
        history = [max(0.0, current_balance)] * days
        for i in range(days - 2, -1, -1):
             change = random.uniform(-0.08, 0.08)
             previous = history[i+1] * (1 + change)
             history[i] = round(max(0, previous), 2)
        data_points = history
        today = date.today()
        labels = [(today - timedelta(days=i)).strftime('%d/%m') for i in range(days - 1, -1, -1)]
        return labels[:len(data_points)], data_points
    except RuntimeError as e:
        log.error(f"App context potentially missing or other RuntimeError in get_balance_history: {e}")
        return [], []
    except Exception as e:
        log.exception(f"Error simulating balance history for user '{user_id}': {e}")
        return [], []

def calculate_portfolio_value(
    portfolio_data: Optional[Dict[str, Dict]],
    get_current_price_func: Optional[Callable[[str], float]] = None
) -> float:
    if not isinstance(portfolio_data, dict) or not portfolio_data: return 0.0
    total_value = 0.0
    log.debug(f"Calculating value for portfolio symbols: {list(portfolio_data.keys())}")
    for symbol, holdings in portfolio_data.items():
        if not isinstance(holdings, dict): continue
        try:
            shares = int(holdings.get("shares", 0))
            if shares <= 0: continue
        except (ValueError, TypeError): continue
        current_price = 0.0
        try:
            if get_current_price_func:
                 current_price = float(get_current_price_func(symbol))
            else:
                 current_price = max(1.0, (sum(ord(c) for c in symbol) % 500) / 10.0 + random.uniform(-2, 2))
                 log.debug(f"Using dummy price for {symbol}: {current_price:.2f}")
            if current_price >= 0: total_value += shares * current_price
            else: log.warning(f"Received non-positive price ({current_price}) for symbol '{symbol}'. Ignored in total.")
        except Exception as price_err:
             log.exception(f"Error getting or processing price for symbol '{symbol}' during portfolio calculation: {price_err}")
    calculated_value = round(total_value, 2)
    log.info(f"Portfolio calculated. Total value: {calculated_value}")
    return calculated_value

# ==================================================
# == Badge Awarding Utility                       ==
# ==================================================
from .models import Badge, user_badge_association # Import Badge model and association if needed directly

def award_badge(user_id: int, badge_key: str) -> bool:
    """
    Awards a specific badge to a user if they don't already have it.

    Args:
        user_id: The ID of the user to award the badge to.
        badge_key: The unique key/name of the badge to award.

    Returns:
        True if the badge was newly awarded, False otherwise (already had it, error, etc.).
    """
    log.debug(f"Attempting to award badge '{badge_key}' to user ID {user_id}")
    try:
        user = DBUser.query.get(user_id)
        if not user:
            log.warning(f"Cannot award badge: User ID {user_id} not found.")
            return False

        # Find the badge by its unique key/name
        badge = Badge.query.filter_by(name=badge_key).first()
        if not badge:
            log.warning(f"Cannot award badge: Badge with key '{badge_key}' not found in database.")
            return False

        # Check if the user already has this badge
        # Using the relationship directly is often easiest if lazy='dynamic' or loaded
        # Alternatively, query the association table explicitly
        already_has = db.session.query(user_badge_association).filter_by(user_id=user_id, badge_id=badge.id).count() > 0
        
        # Or using the relationship:
        # already_has = user.badges.filter(Badge.id == badge.id).count() > 0 

        if already_has:
            log.debug(f"User {user_id} already has badge '{badge_key}'. No action taken.")
            return False # Not newly awarded

        # Award the badge by appending to the relationship
        user.badges.append(badge)
        # The association table entry (with timestamp) should be created automatically by SQLAlchemy
        
        db.session.commit()
        log.info(f"Successfully awarded badge '{badge_key}' (ID: {badge.id}) to user {user_id} ('{user.username}').")
        
        # --- Create a notification for the awarded badge ---
        try:
            notification_message = f"Tillykke! Du har optjent badgen: \"{badge.name}\"."
            # Construct a link to the user's profile page, badge section (if you have one)
            # For now, just link to their profile.
            profile_link = url_for('main.profile', username=user.username, _external=False) # Assuming 'main.profile' is the route
            create_notification(
                user_id=user_id,
                message=notification_message,
                link=profile_link,
                icon=badge.icon or 'bi-award-fill', # Fallback icon
                category='badge'
            )
            log.debug(f"Notification creation initiated for badge '{badge_key}' awarded to user {user_id}.")
        except Exception as notify_err:
            log.error(f"Failed to create notification for badge award '{badge_key}' to user {user_id}: {notify_err}")
        # --- End notification creation ---
        
        return True # Badge was newly awarded

    except Exception as e:
        log.exception(f"Error awarding badge '{badge_key}' to user {user_id}: {e}")
        db.session.rollback()
        return False
# ==================================================
# == Notification Utility                         ==
# ==================================================
def create_notification(user_id: int, message: str, link: Optional[str] = None, icon: Optional[str] = None, category: Optional[str] = None):
    """
    Creates a notification for a user and emits a WebSocket event.

    Args:
        user_id: The ID of the user to notify.
        message: The notification message text.
        link: Optional URL for the notification.
        icon: Optional icon class (e.g., 'bi-trophy-fill').
        category: Optional category string (e.g., 'badge', 'message').

    Returns:
        True if notification was created successfully, False otherwise.
    """
    log.debug(f"Attempting to create notification for user {user_id}: '{message[:50]}...'")
    try:
        # Basic validation
        if not user_id or not message:
            log.warning("Cannot create notification: Missing user_id or message.")
            return False

        # Ensure user exists (optional, but good practice)
        user = DBUser.query.get(user_id)
        if not user:
            log.warning(f"Cannot create notification: User ID {user_id} not found.")
            return False

        notification = Notification( # type: ignore[call-arg]
            user_id=user_id,
            message=message,
            link=link,
            icon=icon,
            category=category
            # is_read defaults to False
            # created_at defaults to now
        )
        db.session.add(notification)
        db.session.commit()
        log.info(f"Notification created for user {user_id} (ID: {notification.id}, Category: {category})")

        # Emit WebSocket event to the specific user's room/SID
        # This requires tracking user SIDs or having user-specific rooms.
        # For simplicity, let's assume a room named 'user_{user_id}' exists.
        # A more robust solution might involve mapping user IDs to SIDs.
        user_room = f"user_{user_id}"
        notification_payload = {
            "id": notification.id,
            "message": notification.message,
            "link": notification.link,
            "icon": notification.icon,
            "category": notification.category,
            "created_at": notification.created_at.isoformat(),
            "is_read": notification.is_read
        }
        # Ensure socketio is available (might need to be passed or accessed globally)
        if socketio:
             socketio.emit('new_notification', notification_payload, room=user_room) # type: ignore[call-arg] # Already present, ensure correct
             log.debug(f"Emitted 'new_notification' to room {user_room}")
        else:
             log.warning("SocketIO instance not available in create_notification. Cannot emit real-time update.")

        return True

    except Exception as e:
        log.exception(f"Error creating notification for user {user_id}: {e}")
        db.session.rollback()
        return False
# ==================================================
# == Sports Catalog Update Utility                ==
# ==================================================

def update_sports_catalog_from_api():
    """
    Fetches the sports catalog directly from the external Odds API
    and updates the Sport table in the database.
    Requires application context for config and DB access.
    """
    log.info("Starting update of sports catalog directly from external API...")
    updated_count = 0
    created_count = 0
    skipped_count = 0
    api_error = False
    api_catalog_raw = None 
    sports_data = [] 
    catalog_url = "" 

    try:
        api_key = current_app.config.get('SPORTS_API_KEY')
        base_url_raw = current_app.config.get('SPORTS_API_BASE_URL')
        timeout = current_app.config.get('EXTERNAL_API_TIMEOUT', 10)

        if not api_key or not base_url_raw:
            log.error("Sports API Key or Base URL not configured. Cannot update sports catalog.")
            return False

        base_url = clean_base_url(base_url_raw) 
        catalog_url = f"{base_url}/v4/sports"
        params = {"apiKey": api_key}
        log.info(f"Requesting Sports Catalog V4 from external API: {catalog_url}")

        response = requests.get(catalog_url, params=params, timeout=timeout, headers={'User-Agent': 'Fattecentralen-Util/1.0'})
        log.debug(f"External Catalog V4 URL called: {response.url}")

        try:
            api_catalog_raw = response.json()
        except json.JSONDecodeError:
            if response.ok:
                log.error(f"External Catalog API V4 OK status but invalid JSON. Status: {response.status_code}, Content: {response.text[:200]}")
            api_error = True
        
        if not response.ok:
            status_code = response.status_code
            error_detail = response.text[:200]
            if api_catalog_raw and isinstance(api_catalog_raw, dict) and 'message' in api_catalog_raw:
                error_detail = api_catalog_raw['message']
            log.error(f"External Catalog API V4 HTTP Error ({status_code}): {error_detail}")
            api_error = True

        if api_error or not isinstance(api_catalog_raw, list):
             if not api_error:
                 log.error(f"External Catalog API V4 returned OK but data is not a list. Type: {type(api_catalog_raw)}")
             sports_data = [] 
             api_error = True 
        else:
             sports_data = api_catalog_raw 
             log.info(f"Received {len(sports_data)} sports from external API.")

        existing_sports_db = {league.slug: league for league in League.query.all()}
        processed_keys = set()

        for sport_api in sports_data: 
            if not isinstance(sport_api, dict):
                log.warning(f"Skipping invalid item in API response: {sport_api}")
                skipped_count += 1
                continue
            key = sport_api.get('key')
            title = sport_api.get('title')
            group = sport_api.get('group')
            if not key or not title or not group:
                log.warning(f"Skipping sport item with missing key, title, or group: {sport_api}")
                skipped_count += 1
                continue

            processed_keys.add(key)
            existing_sport = existing_sports_db.get(key)

            if existing_sport:
                # Check if sport_category needs update (more complex, involves SportCategory model)
                sport_category_name_changed = False
                if existing_sport.sport_category:
                    if existing_sport.sport_category.name != group:
                        sport_category_name_changed = True
                elif group: # existing_sport has no category, but API provides one
                    sport_category_name_changed = True
                
                if (existing_sport.name != title or
                        sport_category_name_changed or # If category name from API differs
                        not existing_sport.active):
                    existing_sport.name = title
                    # TODO: Handle SportCategory update based on 'group' string from API.
                    # This requires finding or creating a SportCategory object.
                    # For now, we are not changing existing_sport.sport_category_id here if only 'group' name differs.
                    # If sport_category_name_changed is True, it indicates a difference that needs addressing.
                    # Example:
                    # if sport_category_name_changed:
                    #   target_category = SportCategory.query.filter_by(name=group).first()
                    #   if not target_category:
                    #       target_category = SportCategory(name=group)
                    #       db.session.add(target_category)
                    #       # db.session.flush() # To get ID if needed before commit
                    #   existing_sport.sport_category = target_category

                    existing_sport.active = True
                    existing_sport.last_api_check = datetime.now(timezone.utc)
                    db.session.add(existing_sport)
                    updated_count += 1
                    log.debug(f"Updating league: {key} (Name: {title}, Active: True)")
                else:
                    # If only last_api_check needs updating
                    existing_sport.last_api_check = datetime.now(timezone.utc)
                    db.session.add(existing_sport)
            else:
                new_sport = League( # type: ignore[call-arg]
                    name=title, sport_category_id=1, # Assuming a default sport_category_id for now. TODO: Resolve SportCategory from 'group'.
                    active=True
                    # slug will be auto-generated from name (title)
                    # last_api_check will use its default from the model
                    # country and logo_url are not available from this API response for sports catalog
                )
                # For 'group', this would now relate to SportCategory.name
                # We'd need to find or create a SportCategory with name=group
                # and then assign its ID to new_sport.sport_category_id.
                # This is a placeholder and needs proper implementation.
                # For example:
                # sport_cat = SportCategory.query.filter_by(name=group).first()
                # if not sport_cat:
                #     sport_cat = SportCategory(name=group)
                #     db.session.add(sport_cat)
                #     # Potentially commit here or handle as part of larger transaction
                # new_sport.sport_category = sport_cat
                db.session.add(new_sport)
                created_count += 1
                log.debug(f"Creating new sport: {key}")

        deactivated_count = 0
        for key, sport_db in existing_sports_db.items():
            if key not in processed_keys and sport_db.active:
                sport_db.active = False
                sport_db.last_api_check = datetime.now(timezone.utc) # Corrected attribute
                db.session.add(sport_db)
                deactivated_count += 1
                log.info(f"Deactivating sport no longer in API response: {key}")

        db.session.commit() 
        log.info(f"Sports catalog DB update finished. Created: {created_count}, Updated: {updated_count}, Deactivated: {deactivated_count}, Skipped: {skipped_count}.")
        
        return not api_error

    except requests.exceptions.RequestException as req_err: 
        log.exception(f"Failed to fetch sports catalog from external API ({catalog_url}): {req_err}")
        db.session.rollback() 
        return False
    except json.JSONDecodeError as json_err: 
        log.exception(f"Failed to decode JSON response from external API ({catalog_url}): {json_err}")
        db.session.rollback()
        return False
    except Exception as e: 
        log.exception(f"Unexpected error updating sports catalog: {e}")
        db.session.rollback()
        return False

def update_sport_events():
    """
    Fetches upcoming events and odds for active sports from the Odds API
    and updates the SportEvent and SportOutcome tables.
    Requires application context.
    """
    log.info("Starting update of sport events and outcomes from API...")
    total_events_processed = 0
    total_outcomes_processed = 0
    api_errors = 0

    try:
        active_sports = League.query.filter_by(active=True).all()
        if not active_sports:
            log.warning("No active sports found in the database. Cannot fetch events.")
            return False

        log.info(f"Found {len(active_sports)} active sports to check for events.")

        api_key = current_app.config.get('SPORTS_API_KEY')
        base_url_raw = current_app.config.get('SPORTS_API_BASE_URL')
        timeout = current_app.config.get('EXTERNAL_API_TIMEOUT', 15)
        regions = 'eu'

        if not api_key or not base_url_raw:
            log.error("Sports API Key or Base URL not configured. Cannot fetch events.")
            return False

        base_url = clean_base_url(base_url_raw) # Uses local clean_base_url

        for league in active_sports:
            # Assuming league.slug corresponds to the old sport.key for API calls
            # and league.name to sport.title
            # The concept of 'group' is now handled by league.sport_category.name
            if '_winner' in league.slug or 'politics' in league.slug: # Use league.slug
                markets_to_fetch = 'outrights'
            else:
                markets_to_fetch = 'h2h'
            
            log.debug(f"Fetching events for league: {league.slug} ({league.name}) with market: {markets_to_fetch}")
            events_url = f"{base_url}/v4/sports/{league.slug}/odds"
            params = {
                "apiKey": api_key, "regions": regions, "markets": markets_to_fetch,
                "dateFormat": "iso", "oddsFormat": "decimal",
            }

            try:
                response = requests.get(events_url, params=params, timeout=timeout, headers={'User-Agent': 'Fattecentralen-EventUtil/1.0'})
                response.raise_for_status()
                events_data = response.json()

                if not isinstance(events_data, list):
                    log.warning(f"Received non-list data for league {league.slug} from {events_url}. Skipping.")
                    api_errors += 1
                    continue

                log.debug(f"Received {len(events_data)} events for {league.slug}.")
                
                for event_api in events_data:
                    if not isinstance(event_api, dict): continue
                    event_id = event_api.get('id')
                    commence_time_str = event_api.get('commence_time')
                    # home_team and away_team from API are now raw names
                    home_team_name_raw_api = event_api.get('home_team')
                    away_team_name_raw_api = event_api.get('away_team')

                    if not event_id or not commence_time_str:
                        log.warning(f"Skipping event with missing ID or commence_time for league {league.slug}: {event_api}")
                        continue

                    commence_time_dt = _parse_datetime_string(commence_time_str)
                    if not commence_time_dt:
                         log.warning(f"Could not parse commence_time '{commence_time_str}' for event {event_id}. Skipping.")
                         continue
                    commence_time_aware = commence_time_dt.replace(tzinfo=timezone.utc)

                    event_db = SportEvent.query.get(event_id)
                    if not event_db:
                        # TODO: Implement logic to find/create Team objects for home_team_id and away_team_id
                        # For now, we'll just store the raw names.
                        event_db = SportEvent(
                            id=event_id,
                            league_id=league.id, # Link to the current league
                            commence_time=commence_time_aware,
                            home_team_name_raw=home_team_name_raw_api,
                            away_team_name_raw=away_team_name_raw_api
                            # home_team_id and away_team_id would be set after finding/creating Teams
                        )
                        db.session.add(event_db)
                        log.debug(f"Creating new SportEvent: {event_id} ({home_team_name_raw_api} vs {away_team_name_raw_api}) for league {league.id}")
                    else:
                        # Update existing event
                        needs_update = False
                        if event_db.commence_time != commence_time_aware:
                            event_db.commence_time = commence_time_aware
                            needs_update = True
                        if event_db.home_team_name_raw != home_team_name_raw_api:
                            event_db.home_team_name_raw = home_team_name_raw_api
                            # Potentially re-evaluate home_team_id
                            needs_update = True
                        if event_db.away_team_name_raw != away_team_name_raw_api:
                            event_db.away_team_name_raw = away_team_name_raw_api
                            # Potentially re-evaluate away_team_id
                            needs_update = True
                        if event_db.league_id != league.id: # Ensure it's linked to the correct league
                            event_db.league_id = league.id
                            needs_update = True

                        if needs_update:
                             log.debug(f"Updating existing SportEvent: {event_id}")
                        event_db.last_api_data_fetch = datetime.now(timezone.utc) # Corrected attribute name
                        db.session.add(event_db)
                    total_events_processed += 1

                    bookmakers = event_api.get('bookmakers', [])
                    for bookmaker in bookmakers:
                         bookmaker_key = bookmaker.get('key')
                         bookmaker_last_update_str = bookmaker.get('last_update')
                         bookmaker_last_update_dt = _parse_datetime_string(bookmaker_last_update_str)
                         bookmaker_last_update_aware = bookmaker_last_update_dt.replace(tzinfo=timezone.utc) if bookmaker_last_update_dt else None

                         markets_data = bookmaker.get('markets', [])
                         for market in markets_data:
                             market_key_api = market.get('key')
                             if market_key_api != markets_to_fetch: continue

                             outcomes_api = market.get('outcomes', [])
                             for outcome in outcomes_api:
                                 outcome_name = outcome.get('name')
                                 outcome_price = outcome.get('price')
                                 outcome_point = outcome.get('point')

                                 if outcome_name is None or outcome_price is None: continue
                                 try:
                                     outcome_price_float = float(outcome_price)
                                     outcome_point_float = float(outcome_point) if outcome_point is not None else None
                                 except (ValueError, TypeError):
                                     log.warning(f"Could not parse price/point for outcome in event {event_id}: {outcome}")
                                     continue

                                 outcome_db = SportOutcome.query.filter_by(
                                     event_id=event_id, bookmaker=bookmaker_key, market_key=market_key_api,
                                     name=outcome_name, point=outcome_point_float
                                 ).first()

                                 if not outcome_db:
                                     outcome_db = SportOutcome( # type: ignore[call-arg]
                                         event_id=event_id, bookmaker=bookmaker_key, market_key=market_key_api,
                                         name=outcome_name, price=outcome_price_float, point=outcome_point_float,
                                         last_update_api=bookmaker_last_update_aware
                                     )
                                     db.session.add(outcome_db)
                                     log.debug(f"Creating new SportOutcome: Event {event_id}, Bookie {bookmaker_key}, Name {outcome_name}, Price {outcome_price_float}")
                                 else:
                                     if outcome_db.price != outcome_price_float or outcome_db.last_update_api != bookmaker_last_update_aware:
                                         outcome_db.price = outcome_price_float
                                         outcome_db.last_update_api = bookmaker_last_update_aware
                                         db.session.add(outcome_db)
                                         log.debug(f"Updating SportOutcome: Event {event_id}, Bookie {bookmaker_key}, Name {outcome_name}, Price {outcome_price_float}")
                                 total_outcomes_processed += 1
                db.session.commit() 
                log.debug(f"Committed changes for league {league.slug}")
            except requests.exceptions.RequestException as req_err:
                log.error(f"Failed to fetch events for league {league.slug} from {events_url}: {req_err}")
                api_errors += 1
                db.session.rollback()
            except json.JSONDecodeError as json_err:
                log.error(f"Failed to decode JSON for league {league.slug} from {events_url}: {json_err}")
                api_errors += 1
                db.session.rollback()
            except Exception as e:
                log.exception(f"Unexpected error processing league {league.slug}: {e}")
                api_errors += 1
                db.session.rollback()
        log.info(f"Event update process finished. Processed Events: {total_events_processed}, Processed Outcomes: {total_outcomes_processed}, API Errors: {api_errors}")
        return api_errors == 0
    except Exception as e:
        log.exception(f"Critical error during event update process: {e}")
        db.session.rollback()
        return False
