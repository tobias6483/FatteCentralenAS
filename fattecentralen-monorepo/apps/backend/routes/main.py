# app/routes/main.py

# === Standard Bibliotek Imports ===
import json
import logging
import os
import re
import uuid
from datetime import MINYEAR, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set  # Added Set, Any

import bleach

# === Tredjeparts Bibliotek Imports ===
import requests
from flask import (
    Blueprint,
    Response,
    abort,
    current_app,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask.typing import ResponseReturnValue  # Import ResponseReturnValue
from flask_login import current_user, login_required, logout_user
from sqlalchemy import desc, func
from werkzeug.utils import secure_filename

from .. import data_access

# === Lokale Applikationsimports ===
from ..config import Config
from ..data_access import DataIOException
from ..extensions import db, limiter, redis_client, socketio
from ..forms import ChangePasswordForm, UpdateAccountForm
from ..models import (  # Added ForumPost, ForumThread
    Badge,
    BetHistory,
    ForumPost,
    ForumThread,
    League,
    Notification,
    SportEvent,
    SportOutcome,
    User,
)
from ..utils import (
    calculate_portfolio_value,
    clean_base_url,
    dt_filter_func,
    get_balance_history,
    get_common_context,
    get_user_data_by_id,
)

# Import session-related constants
SESSION_KEY_PREFIX = "session:"
SESSION_PLAYERS_KEY_PREFIX = "session_players:"
USER_SESSIONS_KEY_PREFIX = "user_sessions:"

# --- Bleach Konfiguration ---
ALLOWED_TAGS_ABOUT_ME = ["p", "br", "b", "strong", "i", "em", "a"]
ALLOWED_ATTRIBUTES_ABOUT_ME = {"a": ["href", "title", "rel"]}
ALLOWED_PROTOCOLS_ABOUT_ME = ["http", "https", "mailto"]

# Blueprint og Logger setup
log = logging.getLogger(__name__)
main_bp = Blueprint("main", __name__)


# --- _parse_datetime_string Definition ---
def _parse_datetime_string(timestamp_str):
    if not timestamp_str or not isinstance(timestamp_str, str):
        return None
    formats_aware = [
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%SZ",
    ]
    formats_naive_assume_utc = [
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ]
    for fmt in formats_aware:
        try:
            return datetime.strptime(timestamp_str, fmt).astimezone(timezone.utc)
        except (ValueError, TypeError):
            continue
    for fmt in formats_naive_assume_utc:
        try:
            return datetime.strptime(timestamp_str, fmt).replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            continue
    log.warning(
        f"Could not parse timestamp string '{timestamp_str}'. Returning minimal aware datetime."
    )
    try:
        return datetime(max(MINYEAR, 1), 1, 1, tzinfo=timezone.utc)
    except ValueError:
        return datetime(1900, 1, 1, tzinfo=timezone.utc)


# --- Helper to decode Redis results ---
def decode_redis(val):
    return val.decode("utf-8") if isinstance(val, bytes) else val


# --- Index Route (Dashboard) ---
@main_bp.route("/")
@main_bp.route("/index")
@login_required
def index():
    log.info(f"Index route accessed by user: {current_user.id}")
    try:
        if not current_user.is_authenticated:
            log.warning("Index accessed by non-authenticated user!")
            return redirect(url_for("auth.login_route"))
        user_id_lookup = current_user.id
        try:
            fresh_user_data = get_user_data_by_id(user_id_lookup)
        except Exception as e:
            log.exception(
                f"Failed to load fresh data for {user_id_lookup} in index view: {e}"
            )
            flash("Kunne ikke indlæse dine aktuelle brugerdata.", "danger")
            return redirect(url_for("auth.login_route"))
        if not fresh_user_data:
            log.critical(
                f"Logged-in user '{user_id_lookup}' data not found during FRESH load in index!"
            )
            flash("Kritisk brugerdata fejl. Du er blevet logget ud.", "danger")
            logout_user()
            return redirect(url_for("auth.login_route"))
        context = get_common_context()
        total_won = (
            fresh_user_data.total_won if fresh_user_data.total_won is not None else 0.0
        )
        total_lost = (
            fresh_user_data.total_lost
            if fresh_user_data.total_lost is not None
            else 0.0
        )
        context.update(
            {
                "email": fresh_user_data.email,
                "registration_date": fresh_user_data.registration_date,
                "last_login": fresh_user_data.last_login,
                "wins": fresh_user_data.wins if fresh_user_data.wins is not None else 0,
                "losses": (
                    fresh_user_data.losses if fresh_user_data.losses is not None else 0
                ),
                "total_staked": (
                    fresh_user_data.total_staked
                    if fresh_user_data.total_staked is not None
                    else 0.0
                ),
                "total_won": total_won,
                "total_lost": total_lost,
                "net": round(total_won - total_lost, 2),
                "largest_win": (
                    fresh_user_data.largest_win
                    if fresh_user_data.largest_win is not None
                    else 0.0
                ),
                "largest_loss": (
                    fresh_user_data.largest_loss
                    if fresh_user_data.largest_loss is not None
                    else 0.0
                ),
                "user_rank": (
                    fresh_user_data.rank if fresh_user_data.rank is not None else "N/A"
                ),
                "active_page": "home",
                "MAX_ABOUT_ME_LENGTH": current_app.config.get(
                    "MAX_ABOUT_ME_LENGTH", 500
                ),
                "level": (
                    fresh_user_data.level if fresh_user_data.level is not None else 1
                ),
                "balance": (
                    fresh_user_data.balance
                    if fresh_user_data.balance is not None
                    else 0.0
                ),
                "user": fresh_user_data,
            }
        )
        try:
            chart_labels, chart_data = get_balance_history(current_user.id, days=7)
            context["chart_labels_json"] = json.dumps(chart_labels)
            context["chart_data_json"] = json.dumps(chart_data)
            log.info(
                f"Prepared chart data ({len(chart_labels)} points) for user {current_user.id}"
            )
        except Exception:
            log.exception(
                f"Failed to get/process chart data for user {current_user.id}"
            )
            context["chart_labels_json"] = json.dumps([])
            context["chart_data_json"] = json.dumps([])
        return render_template("index.html", **context)
    except Exception:
        log.exception(
            f"Generic error rendering index for user {getattr(current_user, 'id', 'Unknown')}"
        )
        abort(500)


# --- Profil Route ---
@main_bp.route("/profile")
@login_required
def profile():
    target_username_query = request.args.get("username", "").strip()
    if target_username_query:
        target_username_for_lookup = target_username_query
        is_own_profile = (
            hasattr(current_user, "username")
            and isinstance(current_user.username, str)
            and target_username_query.lower() == current_user.username.lower()
        )
    else:
        target_username_for_lookup = (
            current_user.username
            if hasattr(current_user, "username")
            else str(current_user.id)
        )
        is_own_profile = True
    log.info(
        f"Profile view request: Target='{target_username_for_lookup}', Viewer='{current_user.id}', Own={is_own_profile}"
    )
    try:
        target_user_object = get_user_data_by_id(target_username_for_lookup)
        if not target_user_object:
            log.warning(
                f"Profile data for '{target_username_for_lookup}' not found in database."
            )
            flash("Brugerprofilen findes ikke.", "danger")
            return redirect(url_for("main.index"))
        actual_username = target_user_object.username
        try:
            total_bets_count = BetHistory.query.filter_by(
                user_id=target_user_object.id
            ).count()
            recent_bets = BetHistory.query.filter_by(user_id=target_user_object.id).order_by(desc(BetHistory.timestamp)).limit(15).all()  # type: ignore[arg-type]
            log.debug(
                f"Fetched {total_bets_count} total bets and {len(recent_bets)} recent bets for user {actual_username}"
            )
        except Exception as e_stats:
            log.exception(
                f"Error fetching bet stats/history for user {actual_username}: {e_stats}"
            )
            total_bets_count = 0
            recent_bets = []
            flash("Kunne ikke indlæse betting historik.", "warning")
        context = {}
        total_won = (
            target_user_object.total_won
            if target_user_object.total_won is not None
            else 0.0
        )
        total_lost = (
            target_user_object.total_lost
            if target_user_object.total_lost is not None
            else 0.0
        )
        xp_current = target_user_object.xp if target_user_object.xp is not None else 0
        xp_needed = (
            target_user_object.xp_next_level
            if target_user_object.xp_next_level is not None
            else 1
        )
        xp_percentage = round((xp_current / max(xp_needed, 1)) * 100, 1)
        profile_avatar_url = target_user_object.avatar_url
        if not profile_avatar_url:
            default_avatar_rel_path = (
                current_app.config.get("DEFAULT_AVATAR", "avatars/default_avatar.png")
                .lstrip("/")
                .replace("static/", "", 1)
            )
            profile_avatar_url = url_for("static", filename=default_avatar_rel_path)

        badges_iterable = []
        _badges_rel = target_user_object.badges
        if _badges_rel is not None:
            try:
                badges_iterable = list(_badges_rel)  # type: ignore[assignment]
            except TypeError:
                if hasattr(_badges_rel, "all"):
                    badges_iterable = _badges_rel.all()  # type: ignore[assignment]
                else:
                    log.warning(
                        f"Could not iterate or call .all() on badges for user {target_user_object.id}"
                    )
        badges_info = [{"id": b.id, "name": b.name, "icon": b.icon} for b in badges_iterable]  # type: ignore[attr-defined]

        context.update(
            {
                "profile_user": target_user_object,
                "is_own_profile": is_own_profile,
                "profile_username_display": actual_username,
                "profile_registration_date": target_user_object.registration_date,
                "profile_last_login": target_user_object.last_login,
                "profile_wins": (
                    target_user_object.wins
                    if target_user_object.wins is not None
                    else 0
                ),
                "profile_losses": (
                    target_user_object.losses
                    if target_user_object.losses is not None
                    else 0
                ),
                "profile_level": (
                    target_user_object.level
                    if target_user_object.level is not None
                    else 1
                ),
                "profile_rank": target_user_object.rank or "N/A",
                "profile_total_staked": (
                    target_user_object.total_staked
                    if target_user_object.total_staked is not None
                    else 0.0
                ),
                "profile_total_won": total_won,
                "profile_total_lost": total_lost,
                "profile_net": round(total_won - total_lost, 2),
                "profile_largest_win": (
                    target_user_object.largest_win
                    if target_user_object.largest_win is not None
                    else 0.0
                ),
                "profile_largest_loss": (
                    target_user_object.largest_loss
                    if target_user_object.largest_loss is not None
                    else 0.0
                ),
                "about_me_text": target_user_object.about_me or "",
                "badges": badges_info,
                "xp_current": xp_current,
                "xp_needed": xp_needed,
                "xp_percentage": xp_percentage,
                "profile_avatar_url": profile_avatar_url,
                "active_page": "profile",
                "total_bets_placed": total_bets_count,
                "recent_bet_history": recent_bets,
                "profile_email": target_user_object.email if is_own_profile else None,
                "profile_user_balance": (
                    target_user_object.balance
                    if is_own_profile and target_user_object.balance is not None
                    else None
                ),
                "profile_uid": target_user_object.uid if is_own_profile else None,
                "profile_invited_by": target_user_object.invited_by or "N/A",
                "MAX_AVATAR_SIZE_MB": current_app.config.get("MAX_AVATAR_SIZE_MB", 2),
                "MAX_ABOUT_ME_LENGTH": current_app.config.get(
                    "MAX_ABOUT_ME_LENGTH", 500
                ),
            }
        )
        log.debug(f"Rendering profile template for user: {actual_username}")
        return render_template("profile.html", **context)
    except Exception:
        log.exception(
            f"Unexpected error rendering profile for target '{target_username_for_lookup}', viewed by '{current_user.id}'. Error: {e}"
        )
        flash("Der opstod en uventet fejl under indlæsning af profilen.", "danger")
        return redirect(url_for("main.index"))


# --- Søge Route ---
@main_bp.route("/search", methods=["GET"])
@login_required
def search():
    query_display = request.args.get("q", "").strip()
    query_search = query_display.lower()
    search_performed = bool(query_display)
    context = get_common_context()
    log.info(f"User '{current_user.id}' searching for: '{query_display}'")
    try:
        matched_users = []
        if search_performed:
            search_limit = current_app.config.get("SEARCH_RESULT_LIMIT", 50)
            matched_users = (
                User.query.filter(User.username.ilike(f"%{query_search}%"))
                .order_by(User.username)
                .limit(search_limit)
                .all()
            )
            log.info(
                f"Database search for '{query_display}' yielded {len(matched_users)} results (limit: {search_limit})."
            )
        users_for_display = {}
        if matched_users:
            for user_obj in matched_users:
                formatted_join_date = (
                    dt_filter_func(user_obj.registration_date)
                    if user_obj.registration_date
                    else "Ukendt"
                )
                users_for_display[user_obj.username] = {
                    "username": user_obj.username,
                    "avatar_url": user_obj.avatar_url,
                    "level": user_obj.level if user_obj.level is not None else 1,
                    "rank": user_obj.rank or "N/A",
                    "join_date": formatted_join_date,
                    "profile_url": url_for("main.profile", username=user_obj.username),
                }
        context.update(
            {
                "query": query_display,
                "matched_users_data": users_for_display,
                "search_performed": search_performed,
                "active_page": "search",
            }
        )
        return render_template("search_results.html", **context)
    except Exception:
        log.exception(
            f"Error in search for query '{query_display}', user '{current_user.id}'"
        )
        flash("Der opstod en uventet fejl under søgningen.", "danger")
        return redirect(url_for("main.index"))


# --- Avatar Upload Route ---
@main_bp.route("/upload_avatar", methods=["POST"])
@login_required
def upload_avatar():
    log.info(f"Avatar upload attempt by user: {current_user.id}")
    if "avatarFile" not in request.files:
        return jsonify({"error": "Ingen fil sendt."}), 400
    file = request.files["avatarFile"]
    if not file or file.filename == "":
        return jsonify({"error": "Ingen fil valgt."}), 400
    save_path_abs = None
    new_safe_filename = None
    old_avatar_fullpath_to_delete = None
    avatar_save_dir = None
    user_obj = None
    try:
        original_filename = secure_filename(file.filename or "")
        allowed_extensions = current_app.config.get(
            "ALLOWED_AVATAR_EXTENSIONS", {"png", "jpg", "jpeg", "gif"}
        )
        if (
            "." not in original_filename
            or original_filename.rsplit(".", 1)[1].lower() not in allowed_extensions
        ):
            return (
                jsonify(
                    {
                        "error": f"Ugyldig filtype. Tilladte: {', '.join(allowed_extensions)}"
                    }
                ),
                400,
            )
        max_size_mb = current_app.config.get("MAX_CONTENT_LENGTH", 3 * 1024 * 1024) / (
            1024 * 1024
        )
        max_size_bytes = int(max_size_mb * 1024 * 1024)
        file.seek(0, os.SEEK_END)
        file_length = file.tell()
        file.seek(0)
        if file_length > max_size_bytes:
            return (
                jsonify({"error": f"Filen er for stor (max {max_size_mb:.1f}MB)."}),
                413,
            )
        avatar_save_dir = current_app.config.get("AVATAR_UPLOAD_FOLDER")
        avatar_subdir = current_app.config.get("AVATAR_UPLOAD_SUBDIR", "avatars")
        if not avatar_save_dir or not os.path.isdir(avatar_save_dir):
            return jsonify({"error": "Server konfigurationsfejl (avatar mappe)."}), 500
        os.makedirs(avatar_save_dir, exist_ok=True)
        file_ext = original_filename.rsplit(".", 1)[1].lower()
        if isinstance(current_user.uid, int):
            new_filename_base = (
                f"{secure_filename(current_user.username)}_{current_user.uid}"
            )
        else:
            new_filename_base = f"{secure_filename(current_user.username)}_fallback_{uuid.uuid4().hex[:8]}"
            log.warning(f"User UID not int. Fallback filename: {new_filename_base}")
        new_safe_filename = f"{new_filename_base}.{file_ext}"
        save_path_abs = os.path.join(avatar_save_dir, new_safe_filename)
        try:
            user_obj = User.query.get(current_user.id)
            if not user_obj:
                return jsonify({"error": "Bruger ikke fundet."}), 404
            old_avatar_filename = user_obj.avatar
            default_avatar_filename = os.path.basename(
                current_app.config.get("DEFAULT_AVATAR", "avatars/default_avatar.png")
            )
            if old_avatar_filename and old_avatar_filename != default_avatar_filename:
                old_avatar_fullpath_to_delete = os.path.join(
                    avatar_save_dir, old_avatar_filename
                )
        except Exception as e_old:
            log.exception(f"Error old avatar path: {e_old}")
        try:
            file.save(save_path_abs)
        except Exception:
            log.exception("Failed to save avatar")
            return jsonify({"error": "Fejl ved gemning."}), 500
        if not user_obj:
            return jsonify({"error": "Intern serverfejl."}), 500
        user_obj.avatar = new_safe_filename
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            log.exception("DB commit failed for avatar")
            if os.path.exists(save_path_abs):
                os.remove(save_path_abs)
            return jsonify({"error": "Databasefejl ved avatar."}), 500
        else:
            if hasattr(current_user, "avatar"):
                current_user.avatar = new_safe_filename
            if old_avatar_fullpath_to_delete and os.path.isfile(
                old_avatar_fullpath_to_delete
            ):
                try:
                    os.remove(old_avatar_fullpath_to_delete)
                except OSError as e_del:
                    log.error(f"Error deleting old avatar: {e_del}")
            new_avatar_url_response = user_obj.avatar_url or url_for(
                "static", filename=f"{avatar_subdir}/{new_safe_filename}"
            )
            return (
                jsonify(
                    {
                        "message": "Avatar opdateret!",
                        "new_avatar_url": new_avatar_url_response,
                    }
                ),
                200,
            )
    except Exception:
        log.exception("Unexpected avatar upload error")
        if save_path_abs and os.path.exists(save_path_abs):
            try:
                os.remove(save_path_abs)
            except OSError:
                pass
        return jsonify({"error": "Intern serverfejl."}), 500


# --- Leaderboard Routes ---
@main_bp.route("/leaderboard")
@login_required
def leaderboard():
    log.info(f"Leaderboard page accessed by user: {current_user.id}")
    try:
        context = get_common_context()
        context["active_page"] = "leaderboard"
        return render_template("leaderboard.html", **context)
    except Exception:
        log.exception("Error rendering leaderboard")
        abort(500)


@main_bp.route("/api/leaderboard")
@login_required
def api_leaderboard():
    sort_by = request.args.get("sort_by", "balance").lower()
    log.info(f"API leaderboard request by {current_user.id}, sort: {sort_by}")
    try:
        leaderboard_limit = current_app.config.get("LEADERBOARD_LIMIT", 100)
        query = User.query
        if sort_by == "win_rate":
            query = query.order_by(
                db.case(
                    (
                        (User.wins + User.losses) > 0,
                        User.wins / (User.wins + User.losses),
                    ),
                    else_=-1,
                ).desc(),
                User.balance.desc(),
            )
        elif sort_by == "profit":
            query = query.order_by(
                (User.total_won - User.total_lost).desc(), User.balance.desc()
            )
        else:
            sort_by = "balance"
            query = query.order_by(User.balance.desc())
        users_query = query.limit(leaderboard_limit).all()
        if not users_query:
            return jsonify([])
        ranked_data = []
        for i, user_obj in enumerate(users_query):
            profile_url = url_for("main.profile", username=user_obj.username)
            wins = int(user_obj.wins or 0)
            losses = int(user_obj.losses or 0)
            total_bets = wins + losses
            win_rate = round((wins / total_bets) * 100, 1) if total_bets > 0 else 0.0
            net_profit = round(
                (user_obj.total_won or 0.0) - (user_obj.total_lost or 0.0), 2
            )
            ranked_data.append(
                {
                    "rank": i + 1,
                    "username": user_obj.username,
                    "balance": float(user_obj.balance or 0.0),
                    "wins": wins,
                    "losses": losses,
                    "win_rate": win_rate,
                    "net_profit": net_profit,
                    "level": int(user_obj.level or 1),
                    "rank_display": user_obj.rank or "N/A",
                    "avatar_url": user_obj.avatar_url,
                    "profile_url": profile_url,
                    "largest_win": float(user_obj.largest_win or 0.0),
                }
            )
        return jsonify({"leaderboard": ranked_data, "sorted_by": sort_by})
    except Exception as e:
        log.exception("Error generating leaderboard API")
        return jsonify({"error": "Server error"}), 500


@main_bp.route("/api/auth/session_check", methods=["GET"])
@login_required
def api_auth_session_check():
    """
    Checks if the current user has an active session.
    Protected by @login_required.
    Returns user info if authenticated.
    """
    log.info(
        f"API session check for user: {current_user.username} (ID: {current_user.id})"
    )
    # Ensure all attributes are accessed safely, especially if they can be None
    user_data = {
        "id": getattr(current_user, "id", None),
        "username": getattr(current_user, "username", None),
        "email": getattr(current_user, "email", None),
        "avatar_url": getattr(
            current_user, "avatar_url", None
        ),  # Uses the model's property
    }
    # Filter out None values if you only want to send existing data
    # user_data_filtered = {k: v for k, v in user_data.items() if v is not None}
    return jsonify({"authenticated": True, "user": user_data}), 200


# --- API Route for User Stats ---
@main_bp.route("/api/user/stats/<string:username>")
@login_required
def get_user_stats_api(username) -> ResponseReturnValue:  # Use ResponseReturnValue
    log.info(
        f"API: Fetching stats for user '{username}' requested by '{getattr(current_user, 'username', 'N/A')}'"
    )
    target_user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first()
    if not target_user:
        return jsonify({"error": "User not found"}), 404

    total_won = target_user.total_won if target_user.total_won is not None else 0.0
    total_lost = target_user.total_lost if target_user.total_lost is not None else 0.0

    # Calculate relative last login time
    last_login_relative = (
        dt_filter_func(target_user.last_login, relative=True)
        if target_user.last_login
        else "Aldrig set"
    )

    stats = {
        "username": target_user.username,
        "email": target_user.email,  # Ensure email is included
        "balance": target_user.balance if target_user.balance is not None else 0.0,
        "wins": target_user.wins if target_user.wins is not None else 0,
        "losses": target_user.losses if target_user.losses is not None else 0,
        "total_staked": (
            target_user.total_staked if target_user.total_staked is not None else 0.0
        ),
        "total_won": total_won,
        "total_lost": total_lost,
        "net_profit_loss": round(total_won - total_lost, 2),
        "largest_win": (
            target_user.largest_win if target_user.largest_win is not None else 0.0
        ),
        "largest_loss": (
            target_user.largest_loss if target_user.largest_loss is not None else 0.0
        ),
        "level": target_user.level if target_user.level is not None else 1,
        "rank": target_user.rank or "N/A",
        "avatar_url": target_user.avatar_url,  # Uses the model's property
        "registration_date": (
            target_user.registration_date.isoformat()
            if target_user.registration_date
            else None
        ),
        "last_login": (
            target_user.last_login.isoformat() if target_user.last_login else None
        ),
        "last_login_relative": last_login_relative,  # Add the relative time string
    }
    return jsonify(stats)


# --- API Route for Recent Activity ---
@main_bp.route("/api/user/recent_activity/<string:username>")
@login_required
def get_user_recent_activity(
    username,
) -> ResponseReturnValue:  # Use ResponseReturnValue
    log.info(
        f"API: Fetching recent activity for user '{username}' requested by '{getattr(current_user, 'username', 'N/A')}'"
    )

    target_user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first()
    if not target_user:
        return jsonify({"error": "User not found"}), 404

    # Privacy Check
    is_own_profile = current_user.is_authenticated and current_user.id == target_user.id
    if not is_own_profile and not target_user.privacy_show_activity:
        # If it's not the user's own profile and they've set activity to private
        log.info(
            f"User {target_user.id} has set their activity to private. Denying access to {getattr(current_user, 'id', 'Anonymous')}."
        )
        return jsonify({"error": "This user's activity is private."}), 403

    # Allow any authenticated user to fetch activity if public or their own
    if not current_user.is_authenticated:
        log.warning(f"Unauthenticated attempt to fetch activity for '{username}'")
        return jsonify({"error": "Authentication required"}), 401

    limit = request.args.get("limit", 5, type=int)
    limit = max(1, min(limit, 20))  # Clamp limit

    try:
        # Fetch recent bets as a primary source of activity
        recent_bets = (
            BetHistory.query.filter_by(user_id=target_user.id)
            .order_by(db.desc(BetHistory.timestamp))
            .limit(limit)
            .all()
        )

        activities = []
        for bet in recent_bets:
            # Determine activity type based on bet status
            activity_type = "stake"  # Default
            icon = "bi-receipt-cutoff"
            iconColor = "text-primary"
            amount = bet.stake

            if bet.status == "Win":
                activity_type = "win"
                description = f"Bet won: {bet.match_name} ({bet.outcome_name})"
                icon = "bi-trophy-fill"
                iconColor = "text-success"
                amount = bet.payout  # Show payout on win
            elif bet.status == "Loss":
                activity_type = "loss"
                description = f"Bet lost: {bet.match_name} ({bet.outcome_name})"
                icon = "bi-emoji-frown-fill"
                iconColor = "text-danger"
                amount = bet.stake  # Show stake on loss
            elif bet.status == "Pending":
                description = f"Bet pending: {bet.match_name} ({bet.outcome_name})"
                icon = "bi-hourglass-split"
                iconColor = "text-warning"
                amount = bet.stake
            elif bet.status == "Cancelled":
                description = f"Bet cancelled: {bet.match_name} ({bet.outcome_name})"
                icon = "bi-x-octagon-fill"
                iconColor = "text-secondary"
                amount = bet.stake  # Or maybe 0 if refunded?
            else:  # Default for 'Stake' or unknown status
                description = f"Bet placed: {bet.match_name} ({bet.outcome_name})"

            activities.append(
                {
                    "id": f"bet_{bet.id}",
                    "type": activity_type,
                    "description": description,
                    "amount": amount,
                    "timestamp": bet.timestamp.isoformat() if bet.timestamp else None,
                    "icon": icon,
                    "iconColor": iconColor,
                }
            )

        # Fetch recent forum posts
        try:
            recent_posts = (
                ForumPost.query.filter_by(author_username=target_user.username)
                .order_by(db.desc(ForumPost.created_at))
                .limit(limit)
                .options(db.joinedload(ForumPost.thread))
                .all()
            )  # type: ignore[attr-defined]

            for post in recent_posts:
                thread_title = post.thread.title if post.thread else "Ukendt tråd"
                post_url = (
                    url_for(
                        "forum.view_thread", thread_id=post.thread_id, _external=False
                    )
                    + f"#post-{post.id}"
                    if post.thread_id and post.id
                    else "#"
                )

                activities.append(
                    {
                        "id": f"post_{post.id}",
                        "type": "forum_post",
                        "description": f"Skrev i: {thread_title}",
                        "amount": None,  # No amount for forum posts
                        "timestamp": (
                            post.created_at.isoformat() if post.created_at else None
                        ),
                        "icon": "bi-chat-left-text-fill",
                        "iconColor": "text-info",
                        "link": post_url,
                    }
                )
        except Exception as post_err:
            log.error(f"Error fetching recent forum posts for {username}: {post_err}")
            # Don't fail the whole request, just log the error

        # Sort all combined activities by timestamp descending
        # Handle potential None timestamps during sort
        activities.sort(
            key=lambda x: x.get("timestamp") or "0001-01-01T00:00:00+00:00",
            reverse=True,
        )

        return jsonify(
            {"activities": activities[:limit]}
        )  # Return combined and limited list

    except Exception as e:
        log.exception(f"Error fetching recent activity for {username}: {e}")
        return jsonify({"error": "Server error fetching activity"}), 500
    return jsonify(stats)


# --- History Route ---
@main_bp.route("/history")
@login_required
def history():
    log.info(f"History route by {current_user.id}")
    context = get_common_context()
    HISTORY_LIMIT = current_app.config.get("HISTORY_DISPLAY_LIMIT", 50)
    try:
        all_users_db = User.query.order_by(User.balance.desc()).all()
        aggregated_list = [
            {
                "username": u.username,
                "balance": u.balance or 0.0,
                "wins": u.wins or 0,
                "losses": u.losses or 0,
                "total_won": u.total_won or 0.0,
                "total_lost": u.total_lost or 0.0,
                "last_login": u.last_login.isoformat() if u.last_login else None,
                "level": u.level or 1,
                "profile_url": url_for("main.profile", username=u.username),
            }
            for u in all_users_db
        ]
        all_bets_q = db.session.query(BetHistory, User.username).join(User, BetHistory.user_id == User.id).order_by(desc(BetHistory.timestamp))  # type: ignore[arg-type]
        detailed_hist_db = all_bets_q.all()
        detailed_hist_fmt = [
            {
                "id": b.id,
                "username": bu,
                "match_name": b.match_name,
                "outcome_name": b.outcome_name,
                "stake": b.stake,
                "payout": b.payout,
                "result": b.result,
                "status": b.status,
                "timestamp": b.timestamp.isoformat(),
                "parsed_timestamp": b.timestamp,
            }
            for b, bu in detailed_hist_db
        ]
        context.update(
            {
                "aggregated_data": aggregated_list,
                "detailed_history": detailed_hist_fmt[:HISTORY_LIMIT],
                "active_page": "history",
            }
        )
        return render_template("history.html", **context)
    except Exception:
        log.exception("Error history page")
        abort(500)


# --- Simple Page Routes Helper ---
def render_simple_page(template_name, page_key):
    user_id = getattr(current_user, "id", "Guest")
    log.info(f"Serving page '{template_name}' for user: {user_id}")
    try:
        context = get_common_context() if current_user.is_authenticated else {}
        context["active_page"] = page_key
        return render_template(template_name, **context)
    except Exception:
        log.exception(f"Error rendering {template_name}")
        abort(500)


# --- Simple Page Route Implementations ---
@main_bp.route("/game_area")
@login_required
def game_area_page():
    return render_simple_page("game_area.html", "game_area")


@main_bp.route("/live_sports")
@login_required
def live_sports_page():
    return render_simple_page("live_sports.html", "live_sports")


@main_bp.route("/join_game")
@login_required
def join_game_page():
    return render_simple_page("join_game.html", "join_game")


@main_bp.route("/aktiedyst")
@login_required
def aktiedyst():
    log.info(f"Aktiedyst by {current_user.id}")
    try:
        context = get_common_context()
        portfolio = current_user.portfolio or {}
        if not isinstance(portfolio, dict):
            portfolio = {}
        transactions = current_user.stock_transactions or []
        if not isinstance(transactions, list):
            transactions = []
        stock_bal_set = (
            current_user.settings.get("stock_balance")
            if current_user.settings and isinstance(current_user.settings, dict)
            else None
        )
        actual_stock_bal = (
            stock_bal_set
            if stock_bal_set is not None
            else (current_user.balance or 0.0)
        )
        context.update(
            {
                "portfolio_value": calculate_portfolio_value(portfolio),
                "portfolio": portfolio,
                "transactions": sorted(
                    transactions,
                    key=lambda x: _parse_datetime_string(x.get("timestamp"))
                    or datetime(MINYEAR, 1, 1, tzinfo=timezone.utc),
                    reverse=True,
                )[:20],
                "stock_balance": actual_stock_bal,
                "active_page": "aktiedyst",
            }
        )
        return render_template("aktiedyst.html", **context)
    except Exception:
        log.exception("Error aktiedyst")
        abort(500)


@main_bp.route("/settings")
@login_required
def settings():
    log.info(f"Settings page accessed by user: {current_user.id}")

    # Instantiate forms
    # Assuming UpdateAccountForm now includes email, about_me, and privacy settings
    account_form = UpdateAccountForm(
        obj=current_user
    )  # Pre-populate with current user's data
    password_form = ChangePasswordForm()  # This form is separate

    if request.method == "POST":
        # Determine which form was submitted if multiple forms are on the page
        # This example assumes a single "Save All Settings" button or separate submit buttons with distinct names/values
        # For simplicity, let's assume UpdateAccountForm is submitted.
        # A more robust solution might use different action URLs or named submit buttons.

        # Handling UpdateAccountForm (Email, About Me, Privacy)
        # Check if the submit button for this form was clicked (if you add specific submit buttons)
        # For now, assume if it's POST and password_form doesn't validate, it's account_form

        # Attempt to validate and process account_form if its data is present
        # A simple check: if 'email' field is in request.form, it's likely the account_form
        if (
            "email" in request.form or "privacy_profile_public" in request.form
        ):  # Check for a field from account_form
            if account_form.validate_on_submit():
                log.info(
                    f"Attempting to update account settings for user {current_user.id}"
                )
                try:
                    user_to_update = User.query.get(current_user.id)
                    if not user_to_update:
                        flash("Bruger ikke fundet.", "danger")
                        return redirect(url_for("main.settings"))

                    # Update email and about_me (from existing logic if it were here)
                    user_to_update.email = account_form.email.data

                    # Sanitize about_me text before saving
                    if account_form.about_me.data:
                        cleaned_about_me = bleach.clean(
                            account_form.about_me.data,
                            tags=ALLOWED_TAGS_ABOUT_ME,
                            attributes=ALLOWED_ATTRIBUTES_ABOUT_ME,
                            protocols=ALLOWED_PROTOCOLS_ABOUT_ME,
                            strip=True,
                        )
                        user_to_update.about_me = cleaned_about_me
                        user_to_update.about_me_last_updated = datetime.now(
                            timezone.utc
                        )
                    else:
                        user_to_update.about_me = None  # Clear if submitted empty
                        user_to_update.about_me_last_updated = datetime.now(
                            timezone.utc
                        )

                    # Update privacy settings
                    user_to_update.privacy_profile_public = (
                        account_form.privacy_profile_public.data
                    )
                    user_to_update.privacy_show_activity = (
                        account_form.privacy_show_activity.data
                    )
                    user_to_update.privacy_show_bet_history = (
                        account_form.privacy_show_bet_history.data
                    )
                    user_to_update.privacy_show_online_status = (
                        account_form.privacy_show_online_status.data
                    )

                    db.session.commit()
                    flash("Dine kontoindstillinger er blevet opdateret.", "success")
                    log.info(
                        f"Account and privacy settings updated for user {current_user.id}"
                    )
                    return redirect(url_for("main.settings"))
                except Exception as e:
                    db.session.rollback()
                    log.exception(
                        f"Error updating account/privacy settings for user {current_user.id}: {e}"
                    )
                    flash(
                        "Der opstod en fejl under opdatering af dine indstillinger.",
                        "danger",
                    )
            else:
                log.warning(
                    f"UpdateAccountForm validation failed for user {current_user.id}: {account_form.errors}"
                )
                flash("Fejl i formular. Tjek venligst felterne.", "warning")

        # Handling ChangePasswordForm (if it were submitted)
        # This part would need its own submit button or a way to distinguish
        # For now, this is just a placeholder if you combine forms.
        # if password_form.validate_on_submit():
        #     # ... password change logic ...
        #     pass

    # For GET requests or if POST validation fails, re-populate form for display
    # Ensure fresh_user_data is loaded for displaying current settings
    fresh_user_data = get_user_data_by_id(current_user.id)
    if not fresh_user_data:
        log.critical(
            f"Fresh user data not found for settings page! User: {current_user.id}"
        )
        flash("Kritisk brugerdata fejl. Du er blevet logget ud.", "danger")
        logout_user()
        return redirect(url_for("auth.login_route"))

    # Pre-populate account_form again for GET or if POST failed, ensuring current DB values are shown
    account_form.email.data = fresh_user_data.email
    account_form.about_me.data = fresh_user_data.about_me
    account_form.privacy_profile_public.data = fresh_user_data.privacy_profile_public
    account_form.privacy_show_activity.data = fresh_user_data.privacy_show_activity
    account_form.privacy_show_bet_history.data = (
        fresh_user_data.privacy_show_bet_history
    )
    account_form.privacy_show_online_status.data = (
        fresh_user_data.privacy_show_online_status
    )

    context = get_common_context()
    avatar_url = getattr(fresh_user_data, "avatar_url", None) or url_for(
        "static", filename=Config.DEFAULT_AVATAR
    )
    is_2fa_enabled_status = getattr(fresh_user_data, "twofa_enabled", False)

    context.update(
        {
            "user_settings": {  # This is used by the 2FA part of the template
                "username": getattr(fresh_user_data, "username", current_user.id),
                "email": getattr(fresh_user_data, "email", ""),
                "avatar_url": avatar_url,
                "about_me": getattr(fresh_user_data, "about_me", ""),
                "is_2fa_enabled": is_2fa_enabled_status,
            },
            "form": account_form,  # Pass the account_form to the template
            "password_form": password_form,  # Pass the password_form
            "active_page": "settings",
            "MAX_AVATAR_SIZE_MB": current_app.config.get("MAX_AVATAR_SIZE_MB", 2),
            "MAX_ABOUT_ME_LENGTH": current_app.config.get("MAX_ABOUT_ME_LENGTH", 500),
        }
    )
    return render_template("settings.html", **context)


# --- API Routes for External Data ---
@main_bp.route("/api/odds", methods=["GET"])
@limiter.limit("100 per hour")
@login_required
def odds_api():
    log.debug("'/api/odds' V4 called.")
    api_key = current_app.config.get("SPORTS_API_KEY")
    base_url_raw = current_app.config.get("SPORTS_API_BASE_URL")
    timeout = current_app.config.get("EXTERNAL_API_TIMEOUT", 10)
    if not api_key or not base_url_raw:
        return jsonify({"error": "Odds API not configured."}), 503
    base_url = clean_base_url(base_url_raw)
    sport_key = request.args.get("sport", "").strip().lower()
    if not sport_key:
        return jsonify({"error": "'sport' param missing."}), 400
    if len(sport_key) < 3 or not re.match(r"^[a-z0-9_]+$", sport_key):
        return jsonify({"error": "Invalid 'sport' param."}), 400
    endpoint_url = f"{base_url}/v4/sports/{sport_key}/odds"
    params = {
        "apiKey": api_key,
        "regions": request.args.get("regions", "eu").strip(),
        "markets": request.args.get("markets", "h2h").strip(),
        "dateFormat": "iso",
        "oddsFormat": "decimal",
    }
    try:
        response = requests.get(
            endpoint_url,
            params=params,
            timeout=timeout,
            headers={"User-Agent": "Fattecentralen-Proxy/1.0"},
        )
        response_data = response.json() if response.content else None
        if not response.ok:
            error_detail = (
                response_data.get("message", response.text[:200])
                if response_data and isinstance(response_data, dict)
                else response.text[:200]
            )
            log.error(
                f"Odds API V4 HTTP Error ({response.status_code}): {error_detail}"
            )
            return jsonify(
                {"error": f"Odds service error ({response.status_code})."}
            ), (response.status_code if 400 <= response.status_code < 500 else 502)
        if isinstance(response_data, list):
            return jsonify(response_data)
        else:
            return jsonify({"error": "Unexpected data from Odds service."}), 502
    except requests.exceptions.Timeout:
        return jsonify({"error": "Timeout Odds service."}), 504
    except requests.exceptions.RequestException:
        return jsonify({"error": "Network error Odds service."}), 502
    except Exception:
        log.exception("Odds API proxy error")
        return jsonify({"error": "Server error odds."}), 500


@main_bp.route("/api/live_score/<sportKey>/<eventId>")
@limiter.limit("200 per 15 minute")
@login_required
def live_score(sportKey, eventId):
    log.info(f"Dummy live score for {sportKey}/{eventId}")
    try:
        base_seed = abs(hash(f"{sportKey}-{eventId}"))
        now = datetime.now(timezone.utc)
        start_mins = 5 + (base_seed % 116)
        start_time = now - timedelta(minutes=start_mins)
        elapsed_sec = (now - start_time).total_seconds()
        curr_min = max(0, int(elapsed_sec // 60))
        home = (base_seed // (10**6) + curr_min // 15) % 6
        away = (base_seed // (10**3) + curr_min // 18) % 6
        status = "In Progress"
        minute_disp = min(curr_min, 90)
        if curr_min >= 105 + (base_seed % 10):
            status = "Ended"
            minute_disp = None
        elif 90 <= curr_min < 105 + (base_seed % 10) and (base_seed % 6 == 0):
            minute_disp = f"90+{curr_min - 90}"
        elif 45 <= curr_min < 60 and (base_seed % 7 == 0):
            status = "Halftime"
            home = max(0, home - (base_seed % 2))
            away = max(0, away - (base_seed % 3))
            minute_disp = None
        elif curr_min == 0:
            status = "Scheduled"
            home = 0
            away = 0
            minute_disp = None
        return jsonify(
            {
                "status": status,
                "home_score": home,
                "away_score": away,
                "score": f"{home}-{away}",
                "minute": minute_disp,
                "completed": status == "Ended",
                "last_updated": now.isoformat(),
            }
        )
    except Exception:
        log.exception("Error dummy live_score")
        return jsonify({"error": "Server error livescore"}), 500


@main_bp.route("/api/sports_catalog")
@limiter.limit("30 per hour")
@login_required
def sports_catalog():
    log.info("Sports catalog V4 API request.")
    api_key = current_app.config.get("SPORTS_API_KEY")
    base_url_raw = current_app.config.get("SPORTS_API_BASE_URL")
    timeout = current_app.config.get("EXTERNAL_API_TIMEOUT", 10)
    if not api_key or not base_url_raw:
        return jsonify({"error": "Sports API not configured."}), 503
    base_url = clean_base_url(base_url_raw)
    catalog_url = f"{base_url}/v4/sports"
    params = {"apiKey": api_key}
    try:
        response = requests.get(
            catalog_url,
            params=params,
            timeout=timeout,
            headers={"User-Agent": "Fattecentralen-Proxy/1.0"},
        )
        api_catalog_raw = response.json() if response.content else None
        if not response.ok:
            error_detail = (
                api_catalog_raw.get("message", response.text[:200])
                if api_catalog_raw and isinstance(api_catalog_raw, dict)
                else response.text[:200]
            )
            return jsonify(
                {"error": f"Catalog service error ({response.status_code})."}
            ), (response.status_code if 400 <= response.status_code < 500 else 502)
        if not isinstance(api_catalog_raw, list):
            return jsonify({"error": "Unexpected data from Catalog API."}), 502
        catalog = [
            {
                "key": s["key"],
                "title": s.get("title", s["key"].replace("_", " ").title()),
                "group": s.get("group", "Øvrige").title(),
            }
            for s in api_catalog_raw
            if isinstance(s, dict) and s.get("key") and s.get("active")
        ]
        return jsonify(
            sorted(catalog, key=lambda x: (x["group"].lower(), x["title"].lower()))
        )
    except requests.exceptions.Timeout:
        return jsonify({"error": "Timeout Catalog service."}), 504
    except requests.exceptions.RequestException:
        return jsonify({"error": "Network error Catalog service."}), 502
    except Exception:
        log.exception("Error sports_catalog")
        return jsonify({"error": "Server error catalog."}), 500


# --- API Route for User Sessions and Invites (Dashboard) ---
@main_bp.route("/api/sessions/open", methods=["GET"])
@login_required
def get_open_sessions_and_invites():  # Route is synchronous
    limit = request.args.get("limit", 4, type=int)
    limit = max(1, min(limit, 10))
    user_id_str = str(current_user.id)
    log.info(f"API: Fetching active sessions/invites for {user_id_str} (limit={limit})")
    items = []
    try:
        user_sessions_key = f"{USER_SESSIONS_KEY_PREFIX}{user_id_str}"
        # redis_client is configured with decode_responses=True, so smembers returns a set of strings.
        # Add type hint to guide Pylance
        session_ids: Set[str] = redis_client.smembers(user_sessions_key)  # type: ignore[assignment]
        log.debug(
            f"Found {len(session_ids)} session IDs in set {user_sessions_key} for user {user_id_str}"
        )

        if session_ids:
            pipe = redis_client.pipeline()
            session_keys = [f"{SESSION_KEY_PREFIX}{sid}" for sid in session_ids]
            player_keys = [f"{SESSION_PLAYERS_KEY_PREFIX}{sid}" for sid in session_ids]
            for i, session_key in enumerate(session_keys):
                pipe.hmget(
                    session_key, ["session_id", "session_name", "status", "created_at"]
                )
                pipe.scard(player_keys[i])
            results = pipe.execute()  # Synchronous execution

            chunk_size = 2
            session_ids_list = list(session_ids)
            for i in range(0, len(results), chunk_size):
                session_details_values = results[i]  # Expected List[Optional[str]]
                player_count = results[i + 1]  # Expected int

                # Values from hmget are already strings (or None) due to decode_responses=True
                if (
                    session_details_values
                    and isinstance(session_details_values, list)
                    and len(session_details_values) >= 4
                    and session_details_values[0] is not None
                ):
                    session_id = session_details_values[0]
                    session_name = (
                        session_details_values[1] or session_id
                    )  # Use session_id as fallback
                    status = session_details_values[2] or "unknown"
                    created_at = session_details_values[3]
                    if status in ["open", "in_progress"]:
                        items.append(
                            {
                                "id": session_id,
                                "type": "session",
                                "title": session_name,
                                "status": status,
                                "details": f"{player_count if isinstance(player_count, int) else '?'} spillere",
                                "timestamp": created_at,
                                "icon": "bi-controller",
                                "iconColor": (
                                    "text-success"
                                    if status == "open"
                                    else "text-primary"
                                ),
                                "url": url_for(
                                    "sessions.session_detail_page",
                                    session_id=session_id,
                                ),
                            }
                        )
                else:
                    idx = i // chunk_size
                    if idx < len(session_ids_list):
                        log.warning(
                            f"Dashboard API: Session details for {session_ids_list[idx]} not found or incomplete. Details: {session_details_values}"
                        )
        # Dummy invites for testing UI - can be removed later
        dummy_invites = [
            {
                "id": "i1",
                "type": "invite",
                "title": "Duel Invitation",
                "details": "Fra: Kong Hans",
                "timestamp": (
                    datetime.now(timezone.utc) - timedelta(minutes=15)
                ).isoformat(),
                "icon": "bi-envelope-paper-heart",
                "iconColor": "text-info",
                "url": "#invite-i1",
            },
            {
                "id": "s_aktiedyst3",
                "type": "session",
                "title": "Aktiedyst #3",
                "status": "in_progress",
                "details": "Dag 2/7",
                "timestamp": (
                    datetime.now(timezone.utc) - timedelta(hours=26)
                ).isoformat(),
                "icon": "bi-graph-up-arrow",
                "iconColor": "text-primary",
                "url": "#",
            },
        ]
        items.extend(dummy_invites)
        items.sort(key=lambda x: x.get("timestamp", "0") or "0", reverse=True)
        return jsonify(items[:limit])
    except Exception as e:
        log.exception(
            f"Error fetching open sessions/invites for {current_user.id}: {e}"
        )
        return jsonify([])


# --- Badge Showcase Page Route ---
@main_bp.route("/badges")
@login_required
def badge_showcase_page():
    log.info(f"Badge showcase page by {current_user.id}")
    try:
        all_badges = Badge.query.order_by(Badge.name).all()
        context = get_common_context()
        context.update(
            {"title": "Badge Oversigt", "badges": all_badges, "active_page": "badges"}
        )
        return render_template("badges/showcase.html", **context)
    except Exception as e:
        log.exception(f"Error badge showcase: {e}")
        flash("Error loading badges.", "danger")
        return redirect(url_for("main.index"))


# --- API Route for Bettable Sports Events ---
@main_bp.route("/api/sports/events", methods=["GET"])
@login_required
def get_bettable_events():
    log.info(f"API bettable events by {current_user.id}")
    try:
        now = datetime.now(timezone.utc)
        upcoming_threshold = now + timedelta(days=7)
        events_query = (
            db.session.query(SportEvent)
            .join(League)
            .filter(
                League.active == True,  # type: ignore[arg-type]
                SportEvent.commence_time > now,  # type: ignore[arg-type]
                SportEvent.commence_time < upcoming_threshold,  # type: ignore[arg-type]
            )
            .options(db.joinedload(SportEvent.league))
            .order_by(SportEvent.commence_time)
            .all()
        )  # type: ignore[attr-defined]
        sports_events_dict = {}
        for event in events_query:
            league_slug = event.league.slug  # type: ignore[attr-defined]
            if league_slug not in sports_events_dict:
                sports_events_dict[league_slug] = {"title": event.league.name, "group": event.league.sport_category.name if event.league.sport_category else "Unknown", "events": []}  # type: ignore[attr-defined]
            outcomes_iterable = event.outcomes  # type: ignore[attr-defined]
            if not hasattr(outcomes_iterable, "__iter__") and hasattr(
                outcomes_iterable, "all"
            ):
                outcomes_iterable = outcomes_iterable.all()  # type: ignore[assignment]
            elif not hasattr(outcomes_iterable, "__iter__"):
                outcomes_iterable = []  # type: ignore[assignment]
            outcomes_list = [
                {
                    "id": o.id,
                    "name": o.name,
                    "price": o.price,
                    "bookmaker": o.bookmaker,
                    "market": o.market_key,
                }
                for o in (outcomes_iterable or [])
                if o.market_key == "h2h"
            ]  # type: ignore[attr-defined]
            if outcomes_list:
                sports_events_dict[league_slug]["events"].append(
                    {
                        "id": event.id,
                        "home_team": event.home_team_display_name,
                        "away_team": event.away_team_display_name,
                        "commence_time": event.commence_time.isoformat(),
                        "outcomes": outcomes_list,
                    }
                )
        return jsonify(sports_events_dict)
    except Exception as e:
        log.exception(f"Error fetching bettable events: {e}")
        return jsonify({"error": "Server error fetching events"}), 500


# --- All Notifications Page Route ---
@main_bp.route("/notifications")
@login_required
def all_notifications_page():
    log.info(f"All notifications page by {current_user.id}")
    try:
        page = request.args.get("page", 1, type=int)
        per_page = current_app.config.get("NOTIFICATIONS_PER_PAGE", 20)
        pagination = current_user.notifications.order_by(desc(Notification.created_at)).paginate(  # type: ignore[arg-type, operator]
            page=page, per_page=per_page, error_out=False
        )
        notifications_on_page = pagination.items
        ids_to_mark_read = [n.id for n in notifications_on_page if not n.is_read]
        if ids_to_mark_read:
            try:
                Notification.query.filter(
                    Notification.id.in_(ids_to_mark_read),
                    Notification.user_id == current_user.id,
                ).update({"is_read": True}, synchronize_session=False)
                db.session.commit()
                log.info(
                    f"Marked {len(ids_to_mark_read)} notifications read for {current_user.id}."
                )
                socketio.emit("notifications_marked_read", {"ids": ids_to_mark_read}, room=f"user_{current_user.id}")  # type: ignore[attr-defined]
            except Exception as mark_err:
                db.session.rollback()
                log.error(f"Error marking notifications read: {mark_err}")
        context = get_common_context()
        context.update(
            {
                "title": "Alle Notifikationer",
                "notifications": notifications_on_page,
                "pagination": pagination,
                "active_page": "notifications_all",
            }
        )
        return render_template("notifications/index.html", **context)
    except Exception as e:
        log.exception(f"Error loading notifications page: {e}")
        flash("Error loading notifications.", "danger")
        return redirect(url_for("main.index"))


# --- Notification API Endpoints ---
@main_bp.route("/api/notifications", methods=["GET"])
@login_required
def get_notifications_api():  # Renamed
    try:
        limit = max(1, min(request.args.get("limit", 7, type=int), 20))
        notifications_query = current_user.notifications.order_by(desc(Notification.created_at))  # type: ignore[arg-type, operator]
        unread_total = Notification.query.with_parent(current_user).filter(Notification.is_read == False).count()  # type: ignore[attr-defined]
        recent_notifications = notifications_query.limit(limit).all()
        notifications_list = [
            {
                "id": n.id,
                "message": n.message,
                "link": n.link,
                "icon": n.icon,
                "category": n.category,
                "created_at": n.created_at.isoformat(),
                "is_read": n.is_read,
            }
            for n in recent_notifications
        ]
        return jsonify(
            {"notifications": notifications_list, "unread_total": unread_total}
        )
    except Exception as e:
        log.exception(f"Error API notifications for {current_user.id}: {e}")
        return jsonify({"error": "Failed to fetch notifications"}), 500


@main_bp.route("/api/notifications/mark_read", methods=["POST"])
@login_required
def mark_notifications_read_api():  # Renamed
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request"}), 400
    try:
        notification_ids = data.get("ids")
        mark_all = data.get("all", False)
        updated_count = 0
        if mark_all:
            updated_count = Notification.query.filter(Notification.user_id == current_user.id, Notification.is_read == False).update(  # type: ignore[attr-defined]
                {"is_read": True}, synchronize_session=False
            )
        elif isinstance(notification_ids, list) and notification_ids:
            updated_count = Notification.query.filter(
                Notification.id.in_(notification_ids),
                Notification.user_id == current_user.id,
                Notification.is_read == False,  # type: ignore[attr-defined]
            ).update({"is_read": True}, synchronize_session=False)
        else:
            return jsonify({"error": "No IDs or 'all' flag."}), 400
        db.session.commit()
        log.info(
            f"API: Marked {updated_count} notifications read for {current_user.id}."
        )
        if socketio:
            socketio.emit("notifications_marked_read", {"count": updated_count, "all": mark_all, "ids": notification_ids if not mark_all else []}, room=f"user_{current_user.id}")  # type: ignore[attr-defined]
        return jsonify(
            {"success": True, "message": f"{updated_count} notifications marked read."}
        )
    except Exception as e:
        db.session.rollback()
        log.exception(f"API Error marking notifications read: {e}")
        return jsonify({"error": "Failed to mark notifications read"}), 500


# --- API Route for User Bet History (Paginated) ---
@main_bp.route("/api/user/<string:username>/bet_history", methods=["GET"])
@login_required
def get_user_bet_history_api(username: str) -> ResponseReturnValue:
    log.info(
        f"API: Fetching bet history for user '{username}' requested by '{getattr(current_user, 'username', 'N/A')}'"
    )

    target_user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first()
    if not target_user:
        return jsonify({"error": "User not found"}), 404

    # Privacy Check
    is_own_profile = current_user.is_authenticated and current_user.id == target_user.id
    if not is_own_profile and not target_user.privacy_show_bet_history:
        log.info(
            f"User {target_user.id} has set their bet history to private. Denying access to {getattr(current_user, 'id', 'Anonymous')}."
        )
        return jsonify({"error": "This user's bet history is private."}), 403

    # Allow any authenticated user to fetch if public or their own
    if (
        not current_user.is_authenticated
    ):  # Should be caught by @login_required, but defensive
        log.warning(f"Unauthenticated attempt to fetch bet history for '{username}'")
        return jsonify({"error": "Authentication required"}), 401

    target_user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first()
    if not target_user:
        return jsonify({"error": "User not found"}), 404

    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get(
            "per_page", 15, type=int
        )  # Default to 15, matching JS
        per_page = max(1, min(per_page, 50))  # Clamp per_page

        # Date filtering (optional)
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")

        query = BetHistory.query.filter_by(user_id=target_user.id)

        if start_date_str:
            try:
                start_date = datetime.fromisoformat(
                    start_date_str.split("T")[0] + "T00:00:00"
                ).replace(tzinfo=timezone.utc)
                query = query.filter(getattr(BetHistory, "timestamp") >= start_date)
            except ValueError:
                log.warning(f"Invalid start_date format: {start_date_str}")
                # Optionally return a 400 error or ignore

        if end_date_str:
            try:
                end_date = datetime.fromisoformat(
                    end_date_str.split("T")[0] + "T23:59:59.999999"
                ).replace(tzinfo=timezone.utc)
                query = query.filter(getattr(BetHistory, "timestamp") <= end_date)
            except ValueError:
                log.warning(f"Invalid end_date format: {end_date_str}")
                # Optionally return a 400 error or ignore

        pagination = query.order_by(desc(getattr(BetHistory, "timestamp"))).paginate(
            page=page, per_page=per_page, error_out=False
        )

        bets_data = [
            {
                "id": bet.id,
                "session_id": bet.session_id,
                "match_name": bet.match_name,
                "outcome_name": bet.outcome_name,
                "stake": bet.stake,
                "payout": bet.payout,
                "result": bet.result,
                "status": bet.status,  # e.g., "afgjort", "open"
                "timestamp": bet.timestamp.isoformat() if bet.timestamp else None,
            }
            for bet in pagination.items
        ]

        return jsonify(
            {
                "bets": bets_data,
                "pagination": {
                    "page": pagination.page,
                    "per_page": pagination.per_page,
                    "total_pages": pagination.pages,
                    "total_items": pagination.total,
                    "has_next": pagination.has_next,
                    "has_prev": pagination.has_prev,
                },
            }
        )

    except Exception as e:
        log.exception(f"Error fetching bet history for {username}: {e}")
        return jsonify({"error": "Server error fetching bet history"}), 500


# --- API Route for User Balance History (for Charts) ---
@main_bp.route("/api/user/<string:username>/balance_history", methods=["GET"])
@login_required
def get_user_balance_history_api(username: str) -> ResponseReturnValue:
    log.info(
        f"API: Fetching balance history for user '{username}' requested by '{getattr(current_user, 'username', 'N/A')}'"
    )

    target_user = User.query.filter(
        func.lower(User.username) == func.lower(username)
    ).first()
    if not target_user:
        log.warning(f"API: Balance history request for non-existent user '{username}'")
        return jsonify({"error": "User not found"}), 404

    # Optional: Add privacy check if balance history should be private.
    # For now, assuming it's okay if the requester is authenticated and viewing any profile's chart.
    # is_own_profile = current_user.is_authenticated and current_user.id == target_user.id
    # if not is_own_profile and not getattr(target_user, 'privacy_show_balance_history', True): # Assuming a potential new privacy setting
    #     log.info(f"User {target_user.id} has set their balance history to private. Denying access to {getattr(current_user, 'id', 'Anonymous')}.")
    #     return jsonify({"error": "This user's balance history is private."}), 403

    try:
        days_param = request.args.get("days", 7, type=int)
        # Clamp the number of days to a reasonable range, e.g., 1 to 90 days
        days_to_fetch = max(1, min(days_param, 90))

        chart_labels, chart_data = get_balance_history(
            target_user.id, days=days_to_fetch
        )

        log.info(
            f"API: Successfully fetched {len(chart_labels)} points of balance history for '{username}' over {days_to_fetch} days."
        )
        return jsonify(
            {
                "username": target_user.username,
                "days_requested": days_to_fetch,
                "labels": chart_labels,
                "data": chart_data,
            }
        )
    except Exception as e:
        log.exception(f"API: Error fetching balance history for user '{username}': {e}")
        return jsonify({"error": "Server error while fetching balance history"}), 500
