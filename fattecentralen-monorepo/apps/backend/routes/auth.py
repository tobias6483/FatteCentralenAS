# app/routes/auth.py

# === Standard Bibliotek Imports ===
import io
import json
import logging
import secrets # For generating secure tokens
import hmac # Import hmac for compare_digest
import os
import re
from datetime import datetime, timezone, timedelta
from typing import Optional
import traceback
# import threading # Removed

# import base64
from sqlalchemy import func # Added for case-insensitive queries

# === Tredjeparts Bibliotek Imports ===
from flask import (Blueprint, request, jsonify, session, redirect, flash,
                   send_file, url_for, render_template, get_flashed_messages,
                   current_app, g as flask_g)
from flask_login import login_user, logout_user, login_required, current_user
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity # Added for JWT
from flask_wtf.csrf import generate_csrf # Importer denne
from jinja2 import TemplateNotFound
import pyotp
import qrcode
from firebase_admin import auth as firebase_auth

# === Lokale Applikationsimports ===
# Removed data_access imports for players and invite codes
from ..data_access import load_system_settings # Keep DataIOException if used elsewhere
from ..extensions import bcrypt, csrf, db # Added db
from ..forms import LoginForm
from ..forms import ResetPasswordForm # Import the form
from ..models import User as DBUser, InviteCode, FailedLoginAttempt, PasswordResetRequest # ADDED PasswordResetRequest
# from ..utils import get_user_data_by_id
from ..utils import generate_backup_codes, is_safe_url, firebase_token_required

# Opsæt logger
log = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__, url_prefix="/auth", template_folder='../../templates')


@auth_bp.route('/csrf_token', methods=['GET'])
@csrf.exempt # VIGTIGT: Undtag denne rute fra CSRF beskyttelse
def get_csrf_token_api():
    """Returnerer et gyldigt CSRF token."""
    try:
        # generate_csrf() giver det token der forventes i DENNE session
        csrf_token = generate_csrf()
        return jsonify({'csrf_token': csrf_token}), 200
    except Exception as e:
        log.exception("Error generating CSRF token in API.")
        return jsonify(error="Kunne ikke generere CSRF token."), 500


@auth_bp.route('/api/auth/session_check', methods=['GET'])
@login_required
def api_auth_session_check():
    """
    Checks if the current user has an active session.
    Protected by @login_required.
    """
    log.info(f"API session check for user: {current_user.username} (ID: {current_user.id})")
    return jsonify({
        "authenticated": True,
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": getattr(current_user, 'email', None), # Assuming email might not always be present
            "avatar_url": current_user.avatar_url # Uses the model's property
        }
    }), 200


# ====================================================
# === Registrering (JSON API - OPDATERET!)         ===
# ====================================================
@auth_bp.route("/api/v1/auth/register", methods=["POST"])
@firebase_token_required
def register_or_sync_firebase_user():
    """
    Handles synchronizing a Firebase-authenticated user with the local backend database
    or creating a new local profile if one doesn't exist for the Firebase UID.
    Expects a Firebase ID token (verified by @firebase_token_required).
    For new local profile creation, expects 'invite_code' and optionally 'username' in JSON payload.
    """
    firebase_user_data = flask_g.firebase_user
    firebase_uid = firebase_user_data['uid']
    firebase_email = firebase_user_data.get('email')
    firebase_email_verified = firebase_user_data.get('email_verified', False)
    firebase_display_name = firebase_user_data.get('name') # Firebase 'name' is often display name

    log.info(f"Attempting to register/sync Firebase user. UID: {firebase_uid}, Email: {firebase_email}")

    if not request.is_json:
        log.warning(f"Register/Sync Firebase user ({firebase_uid}) failed: Non-JSON request.")
        return jsonify({"error": "Forkert anmodningsformat (forventede JSON)."}), 415

    data = request.get_json()
    if not data: # data can be an empty JSON object {} if only token is needed for sync
        log.debug(f"Register/Sync Firebase user ({firebase_uid}): Empty JSON payload, proceeding with sync logic if user exists.")
        data = {} # Ensure data is a dict

    try:
        existing_user = DBUser.query.filter_by(firebase_uid=firebase_uid).first()

        if existing_user:
            # --- User with this Firebase UID already exists, sync their info ---
            log.info(f"Firebase user {firebase_uid} (local: {existing_user.username}) already exists. Syncing info.")
            existing_user.last_login = datetime.now(timezone.utc)
            
            # Optionally sync email if it's verified in Firebase and different from local
            if firebase_email and firebase_email_verified and existing_user.email != firebase_email:
                # Check if the new Firebase email is already taken by another local user (excluding self)
                other_user_with_new_email = DBUser.query.filter(
                    DBUser.email == firebase_email,
                    DBUser.id != existing_user.id
                ).first()
                if not other_user_with_new_email:
                    log.info(f"Updating email for user {existing_user.username} from '{existing_user.email}' to '{firebase_email}' based on verified Firebase email.")
                    existing_user.email = firebase_email
                else:
                    log.warning(f"Could not update email for user {existing_user.username} to '{firebase_email}' as it's already in use by user {other_user_with_new_email.username}.")

            db.session.commit()
            avatar_full_url = existing_user.avatar_url
            return jsonify({
                "message": "Brugerprofil synkroniseret.",
                "user": {
                    "id": existing_user.id,
                    "username": existing_user.username,
                    "email": existing_user.email,
                    "avatar_url": avatar_full_url,
                    "firebase_uid": existing_user.firebase_uid
                }
            }), 200
        else:
            # --- New Firebase user, create a local profile ---
            log.info(f"Firebase user {firebase_uid} not found locally. Attempting new local profile creation.")
            invite_code_req = data.get("invite_code", "").strip()
            username_payload = data.get("username", "").strip()

            errors = {}
            if not invite_code_req: errors['invite_code'] = 'Invite Kode er påkrævet for ny profil.'

            # Determine username: from payload, or derive from Firebase display name or email
            final_username = username_payload
            if not final_username and firebase_display_name:
                final_username = firebase_display_name.replace(" ", "_").lower() # Basic derivation
            if not final_username and firebase_email:
                final_username = firebase_email.split('@')[0].replace(".", "_").lower() # Basic derivation
            
            if not final_username: # Still no username
                 errors['username'] = 'Brugernavn kunne ikke bestemmes og blev ikke angivet.'
            elif not re.fullmatch(r'^[A-Za-z0-9_]+$', final_username):
                 errors['username'] = "Brugernavn (angivet eller afledt) må kun indeholde bogstaver, tal og underscore."

            if errors:
                log.warning(f"New local profile for Firebase UID {firebase_uid} failed validation: {errors}")
                return jsonify({"errors": errors}), 400

            # Validate derived/provided username for uniqueness (case-insensitive)
            existing_user_by_username = DBUser.query.filter(func.lower(DBUser.username) == func.lower(final_username)).first()
            if existing_user_by_username:
                log.warning(f"New local profile for Firebase UID {firebase_uid}: Username '{final_username}' already taken.")
                return jsonify({"errors": {"username": f"Brugernavnet '{final_username}' er allerede taget. Angiv et andet i payload."}}), 409

            # Validate Invite Code
            invite_code_obj = InviteCode.query.filter_by(code=invite_code_req).first()
            if not invite_code_obj or not invite_code_obj.is_valid:
                msg = "Invite koden er ugyldig, udløbet eller allerede brugt."
                log.warning(f"New local profile for Firebase UID {firebase_uid}: Invalid invite code '{invite_code_req}'.")
                return jsonify({"errors": {"invite_code": msg}}), 400

            # Create new local user
            now_utc = datetime.now(timezone.utc)
            default_avatar_config = current_app.config.get('DEFAULT_AVATAR', 'avatars/default_avatar.png')
            default_avatar_filename = default_avatar_config.split('/')[-1] if '/' in default_avatar_config else default_avatar_config
            initial_balance = float(current_app.config.get('INITIAL_BALANCE', 1000.0))

            new_user = DBUser(
                firebase_uid=firebase_uid,
                username=final_username, # Store original case if provided, or derived
                email=firebase_email if firebase_email_verified else None, # Only store verified Firebase email
                password_hash=None, # No local password for Firebase users
                balance=initial_balance,
                registration_date=now_utc,
                last_login=now_utc,
                avatar=default_avatar_filename,
                role='user',
                _is_active_db=True,
                invited_by=invite_code_obj.created_by_username or "SystemGenerated"
            )
            db.session.add(new_user)

            # Update Invite Code
            invite_code_obj.uses_count += 1
            invite_code_obj.used_by_username = new_user.username
            invite_code_obj.used_at = now_utc
            if invite_code_obj.uses_count >= invite_code_obj.max_uses:
                invite_code_obj.is_active = False
            
            db.session.commit()
            log.info(f"New local profile (ID: {new_user.id}, Username: {new_user.username}) created and linked for Firebase UID {firebase_uid}. Invite code '{invite_code_req}' consumed.")
            
            avatar_full_url = new_user.avatar_url
            return jsonify({
                "message": "Lokal brugerprofil oprettet og forbundet med din Firebase konto.",
                "user": {
                    "id": new_user.id,
                    "username": new_user.username,
                    "email": new_user.email,
                    "avatar_url": avatar_full_url,
                    "firebase_uid": new_user.firebase_uid
                }
            }), 201

    except json.JSONDecodeError:
        log.warning(f"Register/Sync Firebase user ({firebase_uid}) failed: Invalid JSON received.")
        return jsonify({"error": "Ugyldigt JSON format."}), 400
    except Exception as e:
        db.session.rollback()
        log.exception(f"Unexpected error during Firebase user register/sync (UID: {firebase_uid}): {e}")
        return jsonify({"error": "Intern serverfejl under profil synkronisering."}), 500

# Removed _get_user_data_by_id_local as it's no longer needed.
# Direct DB queries will be used.

# ===========================================================
# === Login (Bruger) - Håndterer GET (HTML) & POST (JSON) ===
# ===========================================================
@auth_bp.route("/login", methods=["GET", "POST"])
def login_route():
    """Handles user login.
    GET: Displays the login form.
    POST: Processes JSON credentials for API login or form data for web login.
    """
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    form = LoginForm() # For GET and traditional POST

    if request.method == 'POST':
        if request.is_json:
            # --- API JSON Login ---
            log.debug("POST /auth/login API attempt received (JSON).")
            try:
                data = request.get_json()
                if not data:
                    log.warning("API Login failed: Empty JSON payload received.")
                    return jsonify({"error": "Tom login anmodning."}), 400
            except json.JSONDecodeError:
                log.warning("API Login failed: Invalid JSON in request body.")
                return jsonify({"error": "Ugyldigt JSON format."}), 400

            # Populate form from JSON for validation, including CSRF if sent
            form = LoginForm(data=data)
            if not form.validate_on_submit(): # Validates CSRF if present and form fields
                all_errors = form.errors
                is_csrf_failure = bool(all_errors.get('csrf_token'))
                err_msg = "Login fejlede: Ugyldig eller manglende sikkerhedstoken." if is_csrf_failure else "Formularvalideringsfejl."
                log.warning(f"API Login failed: Form validation failed. CSRF-related: {is_csrf_failure}. Errors: {all_errors}")
                return jsonify({"error": err_msg, "errors": all_errors}), 400

            username_req = (form.username.data or "").strip()
            password_req = form.password.data
            remember_me_from_json = form.remember_me.data # Get 'remember' from the form populated by JSON
            log.info(f"Processing API JSON login for user: '{username_req}' (Remember: {remember_me_from_json})")
            # ... (rest of JSON login logic from original code, adapted) ...
            user_obj = DBUser.query.filter(func.lower(DBUser.username) == func.lower(username_req)).first()
            if user_obj and bcrypt.check_password_hash(user_obj.password_hash, password_req):
                if not user_obj.is_active:
                    return jsonify({"error": "Denne brugerkonto er deaktiveret."}), 403

                if user_obj.twofa_enabled:
                    session.clear()
                    session['_2fa_api_login_user_id'] = user_obj.id
                    session['_2fa_api_login_remember'] = remember_me_from_json # Store remember for 2FA flow
                    session.modified = True
                    log.debug(f"2FA required for API user {user_obj.username}. Stored remember_me: {remember_me_from_json} in session.")
                    return jsonify({"message": "Two-Factor Authentication Required.", "twofa_required": True, "user_id_for_2fa": user_obj.id}), 200
                else:
                    # *** LOGIN USER FOR SESSION HERE for non-2FA API login ***
                    login_user(user_obj, remember=remember_me_from_json)
                    user_obj.last_login = datetime.now(timezone.utc)
                    try:
                        db.session.commit()
                        log.info(f"User '{user_obj.username}' (API JSON login, no 2FA) logged in successfully via Flask-Login. Last login updated. Remember: {remember_me_from_json}")
                    except Exception as e_db_commit:
                        db.session.rollback()
                        log.exception(f"DB error updating last_login for '{user_obj.username}' (API JSON login): {e_db_commit}")
                    access_token = create_access_token(identity=user_obj.id)
                    refresh_token = create_refresh_token(identity=user_obj.id)
                    avatar_full_url = user_obj.avatar_url
                    return jsonify({
                        "message": "Login succesfuldt!", "access_token": access_token, "refresh_token": refresh_token,
                        "user": {"id": user_obj.id, "username": user_obj.username, "avatar_url": avatar_full_url, "email": user_obj.email}
                    }), 200
            else:
                # Log failed attempt
                try:
                    failed_attempt = FailedLoginAttempt(ip_address=request.remote_addr, username_attempt=username_req, user_agent=request.user_agent.string)
                    db.session.add(failed_attempt)
                    db.session.commit()
                except Exception as log_err: db.session.rollback(); log.error(f"Failed to log failed API login: {log_err}")
                return jsonify({"error": "Ugyldigt brugernavn eller password."}), 401
        else:
            # --- Traditional Form POST Login ---
            log.debug("POST /auth/login form submission received.")
            if form.validate_on_submit(): # Validates CSRF and form fields from request.form
                username = (form.username.data or "").strip() # Ensure data is not None before strip
                password = form.password.data
                remember = form.remember_me.data

                log.info(f"Processing form login for user: '{username}'")
                user = DBUser.query.filter(func.lower(DBUser.username) == func.lower(username)).first()

                if user and bcrypt.check_password_hash(user.password_hash, password):
                    if not user.is_active:
                        flash("Denne brugerkonto er deaktiveret.", "danger")
                        return redirect(url_for('.login_route'))

                    if user.twofa_enabled:
                        log.info(f"2FA required for '{user.username}'. Storing user ID for 2FA verification.")
                        session.clear()
                        session['_2fa_login_user_id'] = user.id
                        session['_2fa_login_remember'] = remember
                        session.modified = True
                        # Redirect to a page that asks for 2FA code, or handle in login.html
                        return render_template('auth/login.html', title="Bekræft 2FA", form=form, twofa_required=True, user_id_for_2fa=user.id)
                    else:
                        login_user(user, remember=remember)
                        user.last_login = datetime.now(timezone.utc)
                        try:
                            db.session.commit()
                            log.info(f"User '{user.username}' logged in successfully. Last login updated.")
                        except Exception as e_db_commit:
                            db.session.rollback()
                            log.exception(f"DB error updating last_login for '{user.username}': {e_db_commit}")

                        next_page = request.args.get('next')
                        if next_page and is_safe_url(next_page):
                            log.debug(f"Redirecting to safe next_page: {next_page}")
                            return redirect(next_page)
                        log.debug("Redirecting to main.index after successful login.")
                        return redirect(url_for('main.index'))
                else:
                    log.warning(f"Form login failed for user '{username}': Invalid credentials.")
                    flash("Ugyldigt brugernavn eller password.", "danger")
                    try:
                        failed_attempt = FailedLoginAttempt(ip_address=request.remote_addr, username_attempt=username, user_agent=request.user_agent.string)
                        db.session.add(failed_attempt)
                        db.session.commit()
                    except Exception as log_err: db.session.rollback(); log.error(f"Failed to log failed form login: {log_err}")
            else: # Form validation failed (e.g. CSRF, missing fields)
                log.warning(f"Form login failed: Validation errors: {form.errors}")
                # Flash messages are usually handled by render_template if WTForms-Flask is set up for it
                # or you can manually flash them. For now, errors will be in form.errors.

    # --- GET Request or POST with form validation errors ---
    # The 'active_form' variable can be used in login.html to show the correct form part
    # For a simple login page, it might not be needed if there's only one form.
    # If login.html also handles password reset, then it's useful.
    # For now, assume login.html is primarily for login.
    active_form_type = request.args.get('active_form', 'login') # Default to login
    return render_template('auth/login.html', title="Login", form=form, active_form=active_form_type)

# Removed _get_logged_in_user_data_and_players as it's no longer needed.
# Direct DB queries and current_user (which is a DBUser object) will be used.

# ======================================================
# === Get Current User Info (Firebase Token Protected) ===
# ======================================================
@auth_bp.route("/api/v1/auth/me", methods=["GET"])
@firebase_token_required
def me_route():
    """
    Returns information about the currently authenticated user (identified by Firebase ID token).
    """
    try:
        firebase_uid = flask_g.firebase_user['uid']
        log.info(f"/api/v1/auth/me - Attempting to fetch user by firebase_uid: {firebase_uid}")
        user = DBUser.query.filter_by(firebase_uid=firebase_uid).first()

        if not user:
            log.warning(f"/api/v1/auth/me - User with firebase_uid {firebase_uid} not found in local DB.")
            return jsonify({"error": "Brugerprofil ikke fundet i systemet."}), 404

        if not user.is_active:
            log.warning(f"/api/v1/auth/me - User {user.username} (firebase_uid: {firebase_uid}) is inactive.")
            return jsonify({"error": "Brugerkonto er deaktiveret."}), 403

        avatar_full_url = None
        try:
            avatar_full_url = user.avatar_url
        except Exception:
            log.warning(f"Could not generate avatar_url for {user.username} in /me response.")

        return jsonify({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar_url": avatar_full_url,
            "role": user.role,
            "is_admin": user.is_admin, # Property from DBUser model
            "twofa_enabled": user.twofa_enabled,
            "balance": user.balance,
            "registration_date": user.registration_date.isoformat() if user.registration_date else None,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }), 200

    except Exception as e:
        log.exception(f"Unexpected error in /api/v1/auth/me: {e}")
        return jsonify({"error": "Intern serverfejl."}), 500

# ====================================
# === Admin Login (JSON Baseret) ===
# ====================================
@auth_bp.route("/admin_login", methods=["POST"])
def admin_login():
    """Handles admin login based on config credentials (JSON API)."""
    log.info("Admin login attempt received.")
    if not request.is_json:
        return jsonify({"error": "Forkert format (JSON påkrævet)."}), 415

    try:
        data = request.get_json()
        if not data: return jsonify({"error": "Tom anmodning."}), 400

        username_req = data.get("username", "").strip()
        password_req = data.get("password", "") # Undlad strip initielt
        if not password_req: password_req = " " # Sæt til mellemrum for at undgå typefejl ved None, check sker nedenfor

        errors = {}
        if not username_req: errors['username'] = "Admin brugernavn påkrævet."
        if password_req == " " or not password_req: errors['password'] = "Admin password påkrævet." # Tjek for tom efter evt. " "
        if errors: return jsonify({"errors": errors}), 400

        admin_config_user = current_app.config.get('ADMIN_USERNAME')
        admin_config_pass = current_app.config.get('ADMIN_PASSWORD')

        if not admin_config_user or not admin_config_pass:
             log.critical("Admin login function accessed, but ADMIN credentials not set in config.")
             return jsonify({"error": "Admin login er ikke konfigureret korrekt."}), 503

        # === Validate Credentials ===
        # Simpel streng sammenligning for admin er ofte ok, men konstant tids-sammenligning er bedre
        # Use hmac.compare_digest for constant-time comparison (requires bytes)
        creds_match = (username_req == admin_config_user and
                       hmac.compare_digest(password_req.encode('utf-8'), admin_config_pass.encode('utf-8')))

        if creds_match:
            log.info(f"Admin config credentials VALID for '{username_req}'. Verifying DB user data & role...")
            
            # Fetch admin user from DB (case-insensitive username check)
            admin_user_obj = DBUser.query.filter(func.lower(DBUser.username) == func.lower(username_req)).first()

            if not admin_user_obj:
                 log.critical(f"FATAL: Admin '{username_req}' valid config credentials, but NO DBUser found in database!")
                 return jsonify({"error": "Admin brugerkonto data mangler. Kontakt systemadministrator."}), 500

            if admin_user_obj.role != 'admin':
                 log.critical(f"SECURITY ALERT: User '{admin_user_obj.username}' (DB ID: {admin_user_obj.id}) used valid admin config creds, but DB role is '{admin_user_obj.role}'! Denying login.")
                 return jsonify({"error": "Adgang nægtet (konto er ikke admin)."}), 403

            if not admin_user_obj.is_active:
                 log.critical(f"SECURITY ALERT: Admin account '{admin_user_obj.username}' (DB ID: {admin_user_obj.id}) is INACTIVE in DB but correct config credentials were used!")
                 return jsonify({"error": "Adgang nægtet (admin konto deaktiveret)."}), 403

            # --- Login Admin User (DBUser object) ---
            session.clear() # Clear session before admin login
            if login_user(admin_user_obj, remember=True): # Remember admin session
                 admin_user_obj.last_login = datetime.now(timezone.utc)
                 try:
                     db.session.commit()
                     log.info(f"Admin user '{admin_user_obj.username}' (DB ID: {admin_user_obj.id}) logged in successfully. Last login updated.")
                 except Exception as e_db_commit:
                     db.session.rollback()
                     log.exception(f"DB error updating admin last_login for '{admin_user_obj.username}': {e_db_commit}")
                     # Login still proceeds, last_login update is best effort
                 
                 redirect_url = url_for('admin.admin_menu') # Redirect to admin menu
                 
                 avatar_full_url = None
                 try:
                     avatar_full_url = admin_user_obj.avatar_url
                 except Exception:
                     log.warning(f"Could not generate avatar_url for admin {admin_user_obj.username} during login response.")

                 return jsonify({
                      "message": "Admin login succesfuldt!",
                      "redirect_url": redirect_url,
                      "username": admin_user_obj.username, # Original case from DB
                      "is_admin": admin_user_obj.is_admin # Property from DBUser model
                 }), 200
            else:
                 log.critical(f"Flask-Login login_user() failed for verified admin DBUser '{admin_user_obj.username}'!")
                 return jsonify({"error": "Intern admin login systemfejl."}), 500
        else: # Config credentials did not match
            log.warning(f"Failed admin login attempt for user '{username_req}': Invalid config credentials.")
            return jsonify({"error": "Ugyldigt admin brugernavn eller password."}), 401

    except json.JSONDecodeError:
        log.warning("Admin login failed: Invalid JSON format.")
        return jsonify({"error": "Ugyldigt JSON format."}), 400
    except Exception as e:
        log.exception(f"Unexpected error during /admin_login: {e}")
        db.session.rollback() # Rollback on any unexpected error during DB interaction
        return jsonify({"error": "Intern serverfejl ved admin login."}), 500

# ======================================================
# === 2FA Verifikation (TOTP / Backup - JSON API)   ===
# ======================================================

@auth_bp.route("/verify_2fa_login", methods=["POST"])
def verify_2fa_login():
    """Verifies TOTP code during login flow (JSON API) using database."""
    log.info("Attempting 2FA TOTP code verification (DB).")
    if not request.is_json: return jsonify({"error": "Forkert format (JSON påkrævet)."}), 415

    user_pk_from_session = session.get('_2fa_api_login_user_id') # Use API-specific session key

    if not user_pk_from_session:
        log.warning("Verify 2FA TOTP failed: No _2fa_api_login_user_id found in session for API flow.")
        return jsonify({"error": "Ingen aktiv 2FA login session. Prøv at logge ind igen."}), 403

    try:
        remember = session.get('_2fa_api_login_remember', False) # Get remember status from session
        data = request.get_json()
        if not data: return jsonify({"error": "Tom anmodning."}), 400

        code = data.get("code", "").strip()
        errors = {}
        if not code: errors['code'] = "2FA kode er påkrævet."
        elif not re.fullmatch(r'\d{6}', code): errors['code'] = "Ugyldigt format (forventede 6 tal)."
        if errors: return jsonify({"errors": errors}), 400

        user_obj = DBUser.query.get(user_pk_from_session)

        if not user_obj:
            log.error(f"Verify 2FA CRITICAL: DBUser NOT found for PK '{user_pk_from_session}' from session.")
            session.pop('_2fa_api_login_user_id', None) # Clear API-specific session key
            # session.pop('_2fa_login_remember', None) # Not used in API flow
            return jsonify({"error": "Brugerdata fejl under 2FA. Log ind igen."}), 500

        if not user_obj.twofa_enabled or not user_obj.twofa_secret:
            log.error(f"Verify 2FA attempted for '{user_obj.username}', but 2FA not properly configured in DB.")
            session.pop('_2fa_login_user_id', None); session.pop('_2fa_login_remember', None)
            return jsonify({"error": "2FA opsætning mangler eller er korrupt. Prøv evt. login med backup kode."}), 400

        totp = pyotp.TOTP(user_obj.twofa_secret)
        if totp.verify(code, valid_window=1):
            log.info(f"2FA TOTP code VALID for user '{user_obj.username}'. Finalizing login.")
            if login_user(user_obj, remember=remember):
                user_obj.last_login = datetime.now(timezone.utc)
                try:
                    db.session.commit()
                    log.info(f"DB: last_login updated for user '{user_obj.username}' post-2FA.")
                except Exception as e_db_commit:
                    db.session.rollback()
                    log.exception(f"DB error updating last_login post-2FA for '{user_obj.username}': {e_db_commit}")
                
                session.pop('_2fa_api_login_user_id', None)
                redirect_url = url_for('admin.admin_menu') if user_obj.is_admin else url_for('main.index')
                
                avatar_full_url = None
                try:
                    avatar_full_url = user_obj.avatar_url
                except RuntimeError: # Handle if url_for fails (e.g. outside app context, though unlikely here)
                    log.warning(f"Could not generate avatar_url for {user_obj.username} during 2FA login response due to RuntimeError.")
                    default_avatar_path = current_app.config.get('DEFAULT_AVATAR', 'avatars/default_avatar.png')
                    avatar_full_url = f"/static/{default_avatar_path}" # Fallback
                except Exception as e_avatar:
                    log.warning(f"Could not generate avatar_url for {user_obj.username} during 2FA login response: {e_avatar}")
                    default_avatar_path = current_app.config.get('DEFAULT_AVATAR', 'avatars/default_avatar.png')
                    avatar_full_url = f"/static/{default_avatar_path}" # Fallback

                # Create JWT tokens
                access_token = create_access_token(identity=user_obj.id)
                refresh_token = create_refresh_token(identity=user_obj.id) # Optional

                return jsonify({
                    "message": "Login succesfuldt!",
                    "access_token": access_token,
                    "refresh_token": refresh_token, # Optional
                    "redirect_url": redirect_url,
                    "username": user_obj.username,
                    "avatar": avatar_full_url
                }), 200
            else: # login_user failed
                log.critical(f"Flask-Login login_user() failed AFTER valid 2FA for '{user_obj.username}'.")
                session.pop('_2fa_api_login_user_id', None)
                session.pop('_2fa_api_login_remember', None)
                return jsonify({"error": "Intern systemfejl ved afslutning af login."}), 500
        else: # TOTP code invalid
            log.warning(f"Invalid 2FA TOTP code provided by user '{user_obj.username}'.")
            return jsonify({"errors": {"code": "Ugyldig 2FA kode."}}), 401

    except json.JSONDecodeError: return jsonify({"error": "Ugyldigt JSON format."}), 400
    except Exception as e:
        log.exception(f"Unexpected error in /verify_2fa_login for user PK '{user_pk_from_session}': {e}")
        db.session.rollback() # Ensure rollback on general exceptions too
        session.pop('_2fa_api_login_user_id', None)
        return jsonify({"error": "Intern serverfejl ved 2FA check."}), 500

@auth_bp.route("/verify_backup_code", methods=["POST"])
def verify_backup_code():
    """Verifies backup code during login flow (JSON API) using database."""
    log.info("Attempting 2FA Backup code verification (DB).")
    if not request.is_json: return jsonify({"error": "Forkert format (JSON påkrævet)."}), 415

    user_pk_from_session = session.get('_2fa_api_login_user_id') # Use API-specific session key
    if not user_pk_from_session:
        log.warning("Verify Backup Code failed: No _2fa_api_login_user_id in session for API flow.")
        return jsonify({"error": "Ingen aktiv 2FA login session."}), 403

    try:
        remember = session.get('_2fa_api_login_remember', False) # Get remember status from session
        data = request.get_json()
        if not data: return jsonify({"error": "Tom anmodning."}), 400

        backup_code_input = data.get("backup_code", "").strip()
        errors = {}
        if not backup_code_input: errors['backup_code'] = "Backup kode er påkrævet."
        if errors: return jsonify({"errors": errors}), 400

        user_obj = DBUser.query.get(user_pk_from_session)
        if not user_obj:
            log.error(f"Verify Backup Code CRITICAL: DBUser not found for PK '{user_pk_from_session}'.")
            session.pop('_2fa_api_login_user_id', None)
            return jsonify({"error": "Brugerkonto datafejl under 2FA."}), 500

        if not user_obj.twofa_enabled:
            log.error(f"Backup code use attempted for '{user_obj.username}', but 2FA is not enabled in DB.")
            session.pop('_2fa_login_user_id', None); session.pop('_2fa_login_remember', None)
            return jsonify({"error": "2FA er ikke aktiveret for denne konto."}), 400

        stored_backup_codes_json = user_obj.backup_codes # This is a JSON string from DB
        stored_codes_list = json.loads(stored_backup_codes_json) if stored_backup_codes_json else []
        
        hash_backup_codes_config = current_app.config.get('HASH_BACKUP_CODES', True)
        code_found_and_valid = False
        matched_code_to_remove = None

        for stored_code_entry in stored_codes_list:
            is_match = False
            if hash_backup_codes_config:
                if bcrypt.check_password_hash(stored_code_entry, backup_code_input):
                    is_match = True
                    matched_code_to_remove = stored_code_entry
            else: # Plaintext comparison
                if stored_code_entry == backup_code_input:
                    is_match = True
                    matched_code_to_remove = stored_code_entry
            
            if is_match:
                code_found_and_valid = True
                break
        
        if code_found_and_valid:
            log.info(f"Backup code VERIFIED for user '{user_obj.username}'. Finalizing login and removing code.")
            if login_user(user_obj, remember=remember):
                if matched_code_to_remove:
                    stored_codes_list.remove(matched_code_to_remove)
                    user_obj.backup_codes = json.dumps(stored_codes_list) 
                
                user_obj.last_login = datetime.now(timezone.utc)
                codes_remaining = len(stored_codes_list)
                try:
                    db.session.commit()
                    log.info(f"DB: Backup code removed for '{user_obj.username}'. Remaining: {codes_remaining}. Last login updated.")
                    if codes_remaining <= current_app.config.get('LOW_BACKUP_CODE_THRESHOLD', 3):
                        flash(f"ADVARSEL: Kun {codes_remaining} backup kode(r) tilbage! Generer nye via indstillinger.", "warning")
                except Exception as e_db_commit:
                    db.session.rollback()
                    log.exception(f"DB error updating backup codes/last_login for '{user_obj.username}': {e_db_commit}")
                    flash("Serverfejl ved opdatering af konto status efter backup login.", "danger")

                session.pop('_2fa_api_login_user_id', None)
                redirect_url = url_for('admin.admin_menu') if user_obj.is_admin else url_for('main.index')
                flashed_msgs = get_flashed_messages(with_categories=True)
                
                avatar_full_url = None
                try:
                    avatar_full_url = user_obj.avatar_url
                except RuntimeError: 
                    log.warning(f"Could not generate avatar_url for {user_obj.username} during backup code login response due to RuntimeError.")
                    default_avatar_path = current_app.config.get('DEFAULT_AVATAR', 'avatars/default_avatar.png')
                    avatar_full_url = f"/static/{default_avatar_path}" 
                except Exception as e_avatar:
                    log.warning(f"Could not generate avatar_url for {user_obj.username} during backup code login response: {e_avatar}")
                    default_avatar_path = current_app.config.get('DEFAULT_AVATAR', 'avatars/default_avatar.png')
                    avatar_full_url = f"/static/{default_avatar_path}"

                # Create JWT tokens
                access_token = create_access_token(identity=user_obj.id)
                refresh_token = create_refresh_token(identity=user_obj.id) # Optional

                response_data = {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "redirect_url": redirect_url,
                    "username": user_obj.username,
                    "avatar": avatar_full_url,
                    "flashes": flashed_msgs
                }

                if user_obj.firebase_uid is None:
                    response_data["message"] = "Login succesfuldt med backup kode! Overvej at forbinde din konto til Firebase for forbedret sikkerhed og funktioner."
                    response_data["needs_firebase_link"] = True
                else:
                    response_data["message"] = "Login succesfuldt med backup kode! Tip: Du kan også logge ind via Firebase."
                    response_data["prompt_firebase_login"] = True
                
                return jsonify(response_data), 200
            else: # login_user failed
                log.critical(f"Flask-Login login_user() failed AFTER valid backup code for '{user_obj.username}'.")
                session.pop('_2fa_api_login_user_id', None)
                session.pop('_2fa_api_login_remember', None)
                return jsonify({"error": "Intern systemfejl ved login."}), 500
        else: # Backup code invalid
            log.warning(f"Invalid backup code provided by user '{user_obj.username}'.")
            return jsonify({"errors": {"backup_code": "Ugyldig backup kode."}}), 401

    except json.JSONDecodeError: return jsonify({"error": "Ugyldigt JSON format."}), 400
    except Exception as e:
        log.exception(f"Unexpected error in /verify_backup_code for user PK '{user_pk_from_session}': {e}")
        db.session.rollback() 
        session.pop('_2fa_api_login_user_id', None)
        return jsonify({"error": "Intern serverfejl ved backup kode check."}), 500

# =========================================
# === 2FA Opsætning og Håndtering        ===
# =========================================

# --- Vis QR Kode (GET Request) ---
@auth_bp.route("/setup_2fa", methods=["GET"])
@login_required
def setup_2fa_qr():
    """Generates and serves a QR code image for initial TOTP setup, using database."""
    user_obj = current_user # This is a DBUser instance from Flask-Login
    log.info(f"Initiating 2FA QR code setup for user '{user_obj.username}' (ID: {user_obj.id}).")
    
    try:
        if user_obj.twofa_enabled:
            log.info(f"User '{user_obj.username}' accessed /setup_2fa, but 2FA is already enabled.")
            flash("To-faktor godkendelse er allerede aktiveret.", "info")
            return redirect(url_for('main.settings'))

        secret = user_obj.twofa_secret
        if not secret:
            log.debug(f"Generating NEW 2FA secret for '{user_obj.username}'.")
            secret = pyotp.random_base32()
            user_obj.twofa_secret = secret
            try:
                db.session.commit()
                log.info(f"New 2FA secret generated and SAVED to DB for '{user_obj.username}'.")
            except Exception as e_commit:
                db.session.rollback()
                log.exception(f"DB error: Failed to save newly generated 2FA secret for '{user_obj.username}': {e_commit}")
                flash("Serverfejl ved lagring af 2FA opsætning. Prøv igen.", "danger")
                return redirect(url_for('main.settings'))
        else:
            log.debug(f"Re-using existing 2FA secret from DB to generate QR for '{user_obj.username}'.")

        totp = pyotp.TOTP(secret)
        # Use email for provisioning URI if available, otherwise username.
        # This is often preferred by authenticator apps.
        display_name_for_uri = user_obj.email if user_obj.email else user_obj.username
        safe_name_for_uri = re.sub(r'[^\w\.@\-\_]', '_', display_name_for_uri)
        issuer_name = re.sub(r'[^\w\.\-]', '', current_app.config.get('APP_NAME', 'FatteCentralen'))
        provisioning_uri = totp.provisioning_uri(name=safe_name_for_uri, issuer_name=issuer_name)

        log.debug(f"Generating QR for URI: {provisioning_uri}")
        qr_img = qrcode.make(provisioning_uri)
        img_buffer = io.BytesIO()
        qr_img.save(img_buffer) # Remove format="PNG" when saving to stream
        img_buffer.seek(0)

        log.info(f"Serving 2FA QR code image for '{user_obj.username}'.")
        return send_file(img_buffer, mimetype="image/png")

    except Exception as e:
         log.exception(f"Unexpected error during /setup_2fa GET for '{user_obj.username}': {e}")
         # Attempt rollback if a DB session was active and an error occurred before commit
         if db.session.is_active: # Check if a session is active before trying to rollback
            db.session.rollback()
         flash("Intern serverfejl under 2FA opsætning. Prøv venligst igen.", "danger")
    return redirect(url_for('main.settings'))


# --- Verificer & Aktivér 2FA (JSON POST fra Settings) ---
@auth_bp.route("/settings/verify-2fa", methods=["POST"])
@login_required
def verify_and_enable_2fa():
    """Verifies TOTP code from user during setup and enables 2FA (JSON API) using database."""
    user_obj = current_user # DBUser object
    log.info(f"Attempting 2FA verification and activation for user '{user_obj.username}' (ID: {user_obj.id}).")
    if not request.is_json: return jsonify({"error": "Forkert format (JSON påkrævet)."}), 415

    try:
        data = request.get_json()
        if not data: return jsonify({"error": "Tom anmodning."}), 400

        code = data.get("code", "").strip()
        errors = {}
        if not code: errors['code'] = "Verifikationskode er påkrævet."
        elif not re.fullmatch(r'\d{6}', code): errors['code'] = "Ugyldigt format (6 tal)."
        if errors: return jsonify({"errors": errors}), 400

        secret = user_obj.twofa_secret
        if not secret:
             log.error(f"CRITICAL: 2FA secret missing for user '{user_obj.username}' on activation verify step. User should re-initiate setup.")
             return jsonify({"error": "2FA hemmelighed mangler. Genstart venligst opsætningen fra din profilside."}), 400

        if user_obj.twofa_enabled:
             log.info(f"User '{user_obj.username}' attempted to re-enable already active 2FA.")
             return jsonify({"message": "2FA er allerede aktiveret."}), 200

        totp = pyotp.TOTP(secret)
        if totp.verify(code, valid_window=1):
            log.info(f"2FA activation code VALID for '{user_obj.username}'. Enabling 2FA & generating backup codes...")
            new_backup_codes_plain = generate_backup_codes()
            hash_backup_codes_config = current_app.config.get('HASH_BACKUP_CODES', True)
            
            codes_to_store_in_db = []
            if hash_backup_codes_config:
                codes_to_store_in_db = [bcrypt.generate_password_hash(c).decode('utf-8') for c in new_backup_codes_plain]
            else:
                codes_to_store_in_db = new_backup_codes_plain
            
            user_obj.twofa_enabled = True
            user_obj.backup_codes = json.dumps(codes_to_store_in_db) # Store as JSON string
            
            try:
                db.session.commit()
                log.info(f"Successfully ENABLED 2FA and saved backup codes for '{user_obj.username}'.")
                return jsonify({
                    "message": "2FA aktiveret! VIGTIGT: Gem disse backup koder sikkert. De vises IKKE igen.",
                    "backup_codes": new_backup_codes_plain 
                }), 200
            except Exception as e_commit:
                db.session.rollback()
                log.exception(f"DB error: Failed to save 2FA activation state for '{user_obj.username}': {e_commit}")
                return jsonify({"error": "Server datafejl ved aktivering af 2FA."}), 500
        else:
            log.warning(f"Invalid 2FA code provided during activation by '{user_obj.username}'.")
            return jsonify({"errors": {"code": "Ugyldig verifikationskode."}}), 401

    except json.JSONDecodeError: return jsonify({"error": "Ugyldigt JSON format."}), 400
    except Exception as e:
        log.exception(f"Unexpected error in /settings/verify-2fa for '{user_obj.username}': {e}")
        if db.session.is_active:
            db.session.rollback()
        return jsonify({"error": "Intern serverfejl ved 2FA aktivering."}), 500


# --- Deaktiver 2FA (JSON POST fra Settings - kræver password) ---
@auth_bp.route("/settings/disable-2fa", methods=["POST"])
@login_required
def disable_2fa():
    """Disables 2FA for the current user via Settings (requires password confirmation, JSON API) using database."""
    user_obj = current_user # DBUser object
    log.info(f"Attempting to disable 2FA for user '{user_obj.username}' (ID: {user_obj.id}) via settings.")
    if not request.is_json: return jsonify({"error": "Forkert format (JSON påkrævet)."}), 415

    try:
        data = request.get_json()
        if not data: return jsonify({"error": "Tom anmodning."}), 400

        password_check = data.get('password')
        errors = {}
        if not password_check: errors['password'] = "Password er påkrævet for at deaktivere."
        if errors: return jsonify({"errors": errors}), 400

        if not bcrypt.check_password_hash(user_obj.password_hash, password_check):
             log.warning(f"Disable 2FA FAILED for '{user_obj.username}': Incorrect password.")
             return jsonify({"errors": {"password": "Forkert adgangskode angivet."}}), 401

        log.debug(f"Password confirmed for '{user_obj.username}'. Proceeding with 2FA disable.")
        if not user_obj.twofa_enabled:
             log.info(f"User '{user_obj.username}' tried to disable already inactive 2FA.")
             return jsonify({"message": "2FA er allerede deaktiveret."}), 200

        user_obj.twofa_enabled = False
        user_obj.twofa_secret = None
        user_obj.backup_codes = None # Or json.dumps([]) to clear it as an empty list
        
        try:
            db.session.commit()
            log.info(f"Successfully DISABLED 2FA for user '{user_obj.username}'.")
            flash("To-faktor godkendelse er blevet deaktiveret.", "success")
            flashed_msgs = get_flashed_messages(with_categories=True)
            return jsonify({
                 "message": "2FA deaktiveret succesfuldt.",
                 "flashes": flashed_msgs
            }), 200
        except Exception as e_commit:
            db.session.rollback()
            log.exception(f"DB error: Failed to save data after disabling 2FA for '{user_obj.username}': {e_commit}")
            return jsonify({"error": "Server datafejl. Kunne ikke gemme deaktivering."}), 500

    except json.JSONDecodeError: return jsonify({"error": "Ugyldigt JSON format."}), 400
    except Exception as e:
        log.exception(f"Unexpected exception disabling 2FA for '{user_obj.username}': {e}")
        if db.session.is_active:
            db.session.rollback()
        return jsonify({"error": "Intern serverfejl ved deaktivering af 2FA."}), 500


# --- Generer Nye Backup Koder (JSON POST fra Settings) ---
@auth_bp.route("/settings/generate-backup-codes", methods=["POST"])
@login_required
def generate_new_backup_codes_endpoint():
    """Generates a new set of backup codes, replacing old ones (JSON API) using database."""
    user_obj = current_user # DBUser object
    log.info(f"Request to generate new backup codes for user '{user_obj.username}' (ID: {user_obj.id}).")
    # No JSON body expected for this request, so no need to check request.is_json or get data

    try:
        if not user_obj.twofa_enabled:
            log.warning(f"User '{user_obj.username}' requested new backup codes, but 2FA is not enabled.")
            return jsonify({"error": "2FA skal være aktiveret for at generere backup koder."}), 403

        log.debug(f"Generating new backup codes for 2FA-enabled user '{user_obj.username}'.")
        new_codes_plain = generate_backup_codes()
        hash_backup_codes_config = current_app.config.get('HASH_BACKUP_CODES', True)
        
        codes_to_store_in_db = []
        if hash_backup_codes_config:
            codes_to_store_in_db = [bcrypt.generate_password_hash(c).decode('utf-8') for c in new_codes_plain]
        else:
            codes_to_store_in_db = new_codes_plain
            
        user_obj.backup_codes = json.dumps(codes_to_store_in_db) # Store as JSON string
        
        try:
            db.session.commit()
            log.info(f"Successfully generated and SAVED new backup codes to DB for user '{user_obj.username}'.")
            return jsonify({
                 "message": "Nye backup koder genereret! VIGTIGT: Gem disse og slet de gamle. De vises IKKE igen.",
                 "backup_codes": new_codes_plain
            }), 200
        except Exception as e_commit:
            db.session.rollback()
            log.exception(f"DB error: Failed to save new backup codes for '{user_obj.username}': {e_commit}")
            return jsonify({"error": "Server datafejl ved lagring af nye backup koder."}), 500

    except Exception as e:
         log.exception(f"Unexpected error generating backup codes for '{user_obj.username}': {e}")
         if db.session.is_active:
            db.session.rollback()
         return jsonify({"error": "Intern serverfejl ved generering af backup koder."}), 500


# =============================
# === Logout (GET Request)   ===
# =============================
@auth_bp.route("/logout")
@login_required
def logout_route():
    """Logs the current user out and redirects to the login page."""
    user_id_before = "N/A"
    username_before = "N/A"
    try:
        if hasattr(current_user, 'id'): user_id_before = current_user.id
        if hasattr(current_user, 'username'): username_before = current_user.username
        log.info(f"Logout initiated for user '{username_before}' (ID: {user_id_before}).")
        
        logout_user()
        session.clear() # Ryd session grundigt
        flash("Du er nu logget ud.", "success")
        log.info(f"User '{username_before}' (ID: {user_id_before}) logged out successfully and session cleared.")
    except Exception as e:
        log.exception(f"Exception during logout process for user '{username_before}' (ID: {user_id_before}): {e}")
        flash("Der opstod en fejl under logout.", "danger")

    return redirect(url_for('.login_route'))
# ======================================================
# === Password Reset Request (Manual Admin Handling) ===
# ======================================================
@auth_bp.route("/request-reset", methods=["GET", "POST"])
def request_password_reset():
    """
    Handles the initial request from a user to reset their password.
    GET: Displays the request form.
    POST: Validates username and logs the request for admin action.
    """
    if current_user.is_authenticated:
        # Authenticated users should change password via settings, not reset
        flash("Du er allerede logget ind. Skift password via Indstillinger.", "info")
        return redirect(url_for('main.index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        if not username:
            flash("Brugernavn er påkrævet.", "warning")
            # Render template again instead of redirect to keep error context if needed
            return render_template('auth/request_reset.html', title="Anmod om Nulstilling - Fejl")

        # Check if user exists (case-insensitive)
        user = DBUser.query.filter(func.lower(DBUser.username) == func.lower(username)).first()

        if user:
            if user.firebase_uid:
                log.info(f"Password reset requested for Firebase-linked user '{user.username}'. Guiding to Firebase reset.")
                flash(f"Din konto er forbundet med Firebase. Brug venligst Firebase til at nulstille dit password.", "info")
            else:
                # --- Create Password Reset Request Record for local-only user ---
                try:
                    # Generate a secure, URL-safe token
                    token = secrets.token_urlsafe(32)
                    # Create the request object (expires in e.g., 24 hours)
                    reset_request = PasswordResetRequest(user_id=user.id, token=token, expires_in_hours=24)
                    db.session.add(reset_request)
                    db.session.commit()
                    log.info(f"Password reset request CREATED in DB for local user '{user.username}' (ID: {user.id}). Token: {token[:8]}...") # Log only prefix
                    flash(f"Anmodning om nulstilling af password for '{user.username.title()}' er modtaget. En administrator vil behandle den snarest.", "success")
                except Exception as e_req:
                    db.session.rollback()
                    log.exception(f"Failed to create password reset request for local user '{user.username}': {e_req}")
                    flash("Der opstod en serverfejl under behandling af din anmodning. Prøv igen.", "danger")
                    # Render template again on error to show flash message immediately
                    return render_template('auth/request_reset.html', title="Anmod om Nulstilling - Fejl")
        else:
            # Avoid confirming if username exists for security (no change needed here)
            log.warning(f"Password reset requested for potentially non-existent user: '{username}'")
            # Capitalize the username entered by the user for the flash message
            flash(f"Hvis brugernavnet '{username.title()}' findes i systemet, er din anmodning modtaget og vil blive behandlet af en administrator.", "info")

        # Redirect to login page regardless of whether user exists
        return redirect(url_for('.login_route'))

    # GET request: Render the form
    try:
        return render_template('auth/request_reset.html', title="Anmod om Nulstilling af Password")
    except TemplateNotFound:
        log.exception("CRITICAL: Password reset request template 'auth/request_reset.html' not found!")
        return "<h1>Error 500: Template missing.</h1>", 500
    except Exception as render_err:
        log.exception(f"Error rendering password reset request template: {render_err}")
        return "<h1>Error 500: Failed to render page.</h1>", 500

@auth_bp.route("/reset/<token>", methods=["GET", "POST"])
def reset_with_token(token):
   """
   Handles password reset using a token.
   GET: Displays the password reset form if the token is valid.
   POST: Processes the new password if the token is valid.
   """
   if current_user.is_authenticated:
       flash("Du er allerede logget ind.", "info")
       return redirect(url_for('main.index'))

   reset_request = PasswordResetRequest.query.filter_by(token=token).first()

   if not reset_request or not reset_request.is_valid:
       log.warning(f"Invalid or expired password reset token used: {token}")
       flash("Linket til nulstilling af password er ugyldigt eller udløbet. Prøv at anmode om et nyt.", "danger")
       return redirect(url_for('.login_route'))

   user = DBUser.query.get(reset_request.user_id)
   if not user:
       log.error(f"User ID {reset_request.user_id} for valid token {token} not found in DB.")
       flash("Der opstod en fejl. Brugeren tilknyttet dette link findes ikke.", "danger")
       reset_request.status = 'error_user_not_found'
       db.session.commit()
       return redirect(url_for('.login_route'))

   form = ResetPasswordForm()

   if form.validate_on_submit(): # This handles POST request
       try:
           new_password = form.password.data
           # --- Password Complexity Validation (re-use from registration or define centrally) ---
           settings = load_system_settings()
           pw_errors = []
           min_len = settings.get("password_min_length", 8)
           # Add check if new_password is not None before using it
           if new_password:
               if len(new_password) < min_len:
                   pw_errors.append(f"mindst {min_len} tegn")
               if settings.get("password_require_uppercase", True) and not re.search(r"[A-Z]", new_password):
                   pw_errors.append("mindst ét stort bogstav")
               if settings.get("password_require_lowercase", True) and not re.search(r"[a-z]", new_password):
                   pw_errors.append("mindst ét lille bogstav")
               if settings.get("password_require_number", True) and not re.search(r"[0-9]", new_password):
                   pw_errors.append("mindst ét tal")
               if settings.get("password_require_symbol", False) and not re.search(r"[!@#$%^&*(),.?\":{}|<>]", new_password):
                   pw_errors.append("mindst ét symbol")
           else:
               # This case should ideally not happen if form validation runs correctly, but handle defensively
               pw_errors.append("Password mangler.")

           if pw_errors:
               # Add errors to the form field for display
               # Pylance Error: Cannot access attribute "append" for class "Sequence[str]" - Likely type hint issue
               if hasattr(form.password, 'errors') and isinstance(form.password.errors, list):
                   form.password.errors.append("Password skal indeholde: " + ", ".join(pw_errors) + ".")
               else:
                    log.error("Could not append password complexity errors to form field.")
               log.warning(f"Password reset for user '{user.username}' failed complexity check.")
               # Fall through to render_template below to show errors
           else:
               user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
               reset_request.status = 'used'
               reset_request.handled_at = datetime.now(timezone.utc) # Mark when it was used
               # Optionally, clear handled_by_admin_id if it was an admin generated link now used by user
               
               db.session.commit()
               log.info(f"Password successfully reset for user '{user.username}' (ID: {user.id}) using token {token[:8]}...")
               flash("Dit password er blevet nulstillet. Du kan nu logge ind med dit nye password.", "success")
               return redirect(url_for('.login_route'))

       except Exception as e_reset:
           db.session.rollback()
           log.exception(f"Error processing password reset for user '{user.username}' with token {token[:8]}...: {e_reset}")
           flash("Der skete en serverfejl under nulstilling af password. Prøv igen.", "danger")
           # Render login template with reset form active
           return render_template('auth/login.html', title="Nulstil Password - Fejl", form=form, token=token, active_form='reset')

   # GET request or POST with validation errors
   try:
       # Render login template with reset form active
       return render_template('auth/login.html', title="Nulstil Password", form=form, token=token, active_form='reset')
   except TemplateNotFound:
       log.exception("CRITICAL: Password reset form template 'auth/reset_password_form.html' not found!")
       return "<h1>Error 500: Template missing.</h1>", 500
   except Exception as render_err:
       log.exception(f"Error rendering password reset form template: {render_err}")
       return "<h1>Error 500: Failed to render page.</h1>", 500


# ======================================================
# === Link Local Account to Firebase (JSON API)      ===
# ======================================================
@auth_bp.route("/api/v1/auth/link-firebase", methods=["POST"])
@login_required # Ensures a local user is already logged in via Flask-Login session
def link_local_account_to_firebase():
   """
   Links the currently authenticated local user account to a Firebase account.
   Expects a Firebase ID token in the JSON payload.
   """
   log.info(f"Attempting to link Firebase account for local user: {current_user.username} (ID: {current_user.id})")

   if not request.is_json:
       log.warning(f"Link Firebase failed for {current_user.username}: Non-JSON request.")
       return jsonify({"error": "Forkert anmodningsformat (forventede JSON)."}), 415

   data = request.get_json()
   if not data:
       log.warning(f"Link Firebase failed for {current_user.username}: Empty JSON payload.")
       return jsonify({"error": "Tom anmodning modtaget."}), 400

   firebase_id_token = data.get("firebase_id_token")
   if not firebase_id_token:
       log.warning(f"Link Firebase failed for {current_user.username}: Missing 'firebase_id_token' in payload.")
       return jsonify({"errors": {"firebase_id_token": "Firebase ID token er påkrævet."}}), 400

   try:
       # Verify the Firebase ID token
       decoded_token = firebase_auth.verify_id_token(firebase_id_token, check_revoked=True)
       firebase_uid = decoded_token['uid']
       log.info(f"Firebase ID token verified for linking. UID: {firebase_uid}. Local user: {current_user.username}")

       # Check if this Firebase account (UID) is already linked to another local user
       other_user_with_firebase_uid = DBUser.query.filter(
           DBUser.firebase_uid == firebase_uid,
           DBUser.id != current_user.id
       ).first()

       if other_user_with_firebase_uid:
           log.warning(f"Link Firebase failed for {current_user.username}: Firebase UID {firebase_uid} is already linked to local user {other_user_with_firebase_uid.username} (ID: {other_user_with_firebase_uid.id}).")
           return jsonify({"error": "Denne Firebase konto er allerede forbundet til en anden lokal brugerprofil."}), 409 # Conflict

       # Check if the current user is already linked to a different Firebase account
       if current_user.firebase_uid and current_user.firebase_uid != firebase_uid:
           log.warning(f"Link Firebase failed for {current_user.username}: Account already linked to a different Firebase UID ({current_user.firebase_uid}). Attempted to link to {firebase_uid}.")
           return jsonify({"error": "Din lokale konto er allerede forbundet til en anden Firebase konto. Kontakt support hvis du mener dette er en fejl."}), 409 # Conflict
       
       if current_user.firebase_uid == firebase_uid:
           log.info(f"User {current_user.username} is already linked to this Firebase account (UID: {firebase_uid}). No action needed.")
           return jsonify({"message": "Konto er allerede forbundet til denne Firebase profil."}), 200


       # Link the account
       current_user.firebase_uid = firebase_uid
       # current_user.password_hash = None # Optional: Consider nullifying local password. Deferred for now.
       # if current_user.password_hash is not None:
       #    log.info(f"Password hash for user {current_user.username} will be kept for now after linking Firebase UID {firebase_uid}.")


       db.session.commit()
       log.info(f"Successfully linked local user {current_user.username} (ID: {current_user.id}) to Firebase UID: {firebase_uid}.")
       
       # Optionally, if local password was nullified, you might want to log the user out of local session
       # and force re-login via Firebase, but for now, they remain logged in.

       return jsonify({"message": "Din konto er nu succesfuldt forbundet med Firebase!"}), 200

   except firebase_auth.RevokedIdTokenError:
       log.warning(f"Link Firebase failed for {current_user.username}: Firebase token revoked.")
       return jsonify({"error": "Firebase token er blevet tilbagekaldt. Prøv at logge ind på Firebase igen."}), 401
   except firebase_auth.UserDisabledError:
       log.warning(f"Link Firebase failed for {current_user.username}: Firebase user account is disabled.")
       return jsonify({"error": "Din Firebase brugerkonto er deaktiveret."}), 403
   except firebase_auth.InvalidIdTokenError as e:
       log.warning(f"Link Firebase failed for {current_user.username}: Invalid Firebase ID token: {e}")
       return jsonify({"error": f"Ugyldigt Firebase ID token: {e}"}), 401
   except Exception as e:
       db.session.rollback()
       log.exception(f"Unexpected error linking Firebase account for {current_user.username}: {e}")
       return jsonify({"error": "Intern serverfejl under sammenkædning af Firebase konto."}), 500

# === EOF: app/routes/auth.py ===
