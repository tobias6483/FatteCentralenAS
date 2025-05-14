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
                   current_app)
from flask_login import login_user, logout_user, login_required, current_user
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity # Added for JWT
from flask_wtf.csrf import generate_csrf # Importer denne
from jinja2 import TemplateNotFound
import pyotp
import qrcode

# === Lokale Applikationsimports ===
# Removed data_access imports for players and invite codes
from ..data_access import load_system_settings # Keep DataIOException if used elsewhere
from ..extensions import bcrypt, csrf, db # Added db
from ..forms import LoginForm
from ..forms import ResetPasswordForm # Import the form
from ..models import User as DBUser, InviteCode, FailedLoginAttempt, PasswordResetRequest # ADDED PasswordResetRequest
# from ..utils import get_user_data_by_id
from ..utils import generate_backup_codes, is_safe_url

# Opsæt logger
log = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


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
@auth_bp.route("/api/v1/auth/register", methods=["POST"]) # Add API v1 route
def register():
    """
    Handles user registration based on JSON data using SQLAlchemy.
    Validates invite codes against the database.
    Marks invite code as used upon successful registration.
    Returns structured JSON errors for frontend field validation.
    """
    log.info("Registration attempt received via POST /auth/register")
    if not request.is_json:
        log.warning("Register failed: Non-JSON request received.")
        return jsonify({"error": "Forkert anmodningsformat (forventede JSON)."}), 415

    try:
        data = request.get_json()
        if not data:
            log.warning("Register failed: Empty JSON payload.")
            return jsonify({"error": "Tom anmodning modtaget."}), 400

        username_req = data.get("username", "").strip()
        password_req = data.get("password", "") # Keep original for hashing
        referral_req = data.get("referral", "").strip()
        email_req = data.get("email", "").strip().lower() # Store email as lowercase

        errors = {}
        if not username_req: errors['username'] = 'Brugernavn er påkrævet.'
        if not password_req: errors['password'] = 'Password er påkrævet.'
        if not referral_req: errors['referral'] = 'Invite Kode er påkrævet.'
        
        if email_req and not re.match(r"[^@\s]+@[^@\s]+\.[^@\s]+", email_req):
            errors['email'] = 'Ugyldigt email format.'

        if errors: # Initial basic field check
            log.warning(f"Register failed for '{username_req}': Missing/Invalid basic fields: {list(errors.keys())}")
            return jsonify({"errors": errors}), 400

        if not re.fullmatch(r'^[A-Za-z0-9_]+$', username_req):
            errors['username'] = "Må kun indeholde bogstaver (a-z, A-Z), tal (0-9) og underscore (_)."
        
        # --- Password Complexity Validation ---
        settings = load_system_settings()
        pw_errors = []
        min_len = settings.get("password_min_length", 8)
        if len(password_req) < min_len: # Check actual password, not stripped
            pw_errors.append(f"mindst {min_len} tegn")
        if settings.get("password_require_uppercase", True) and not re.search(r"[A-Z]", password_req):
            pw_errors.append("mindst ét stort bogstav")
        if settings.get("password_require_lowercase", True) and not re.search(r"[a-z]", password_req):
            pw_errors.append("mindst ét lille bogstav")
        if settings.get("password_require_number", True) and not re.search(r"[0-9]", password_req):
            pw_errors.append("mindst ét tal")
        if settings.get("password_require_symbol", False) and not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password_req): # Example symbols
            pw_errors.append("mindst ét symbol")
            
        if pw_errors:
            errors['password'] = "Password skal indeholde: " + ", ".join(pw_errors) + "."
        # --- End Password Complexity Validation ---

        if errors: # Check again after all validations
            log.warning(f"Register failed for '{username_req}': Field validation errors: {errors}")
            return jsonify({"errors": errors}), 400

        # === Database Checks (Username, Email, Invite Code) ===
        # Check for existing username (case-insensitive)
        existing_user_by_username = DBUser.query.filter(func.lower(DBUser.username) == func.lower(username_req)).first()
        if existing_user_by_username:
            log.warning(f"Register failed: Username '{username_req}' already taken.")
            return jsonify({"errors": {"username": "Brugernavn er allerede taget."}}), 409 # Conflict

        if email_req:
            existing_user_by_email = DBUser.query.filter_by(email=email_req).first()
            if existing_user_by_email:
                log.warning(f"Register failed: Email '{email_req}' already taken.")
                return jsonify({"errors": {"email": "Email er allerede i brug."}}), 409 # Conflict

        # Validate Invite Code from DB
        invite_code_obj = InviteCode.query.filter_by(code=referral_req).first()
        if not invite_code_obj:
            log.warning(f"Register failed: Invite code '{referral_req}' not found.")
            return jsonify({"errors": {"referral": "Ugyldig invite kode."}}), 400
        
        if not invite_code_obj.is_valid: # Uses the @property in InviteCode model
            msg = "Invite koden er ugyldig eller er allerede brugt." # Generic message
            if invite_code_obj.uses_count >= invite_code_obj.max_uses:
                msg = "Invite koden er allerede brugt det maksimale antal gange."
            elif not invite_code_obj.is_active:
                msg = "Invite koden er ikke længere aktiv."
            elif invite_code_obj.expires_at and invite_code_obj.expires_at < datetime.now(timezone.utc):
                msg = "Invite koden er udløbet."
            log.warning(f"Register failed: Invite code '{referral_req}' is not valid. Reason: {msg}")
            return jsonify({"errors": {"referral": msg}}), 400

        # === Create New User in DB ===
        try:
            hashed_password = bcrypt.generate_password_hash(password_req.strip()).decode('utf-8') # Strip for hashing
            now_utc = datetime.now(timezone.utc)
            
            default_avatar_config = current_app.config.get('DEFAULT_AVATAR', 'avatars/default_avatar.png')
            default_avatar_filename = default_avatar_config.split('/')[-1] if '/' in default_avatar_config else default_avatar_config
            
            initial_balance = float(current_app.config.get('INITIAL_BALANCE', 1000.0))

            # Instantiate DBUser and set attributes
            new_user = DBUser()
            new_user.username = username_req # Store original case for display
            new_user.email = email_req or None
            new_user.password_hash = hashed_password
            new_user.balance = initial_balance
            new_user.registration_date = now_utc
            new_user.avatar = default_avatar_filename
            new_user.role = 'user'
            # new_user.is_active = True # This uses the property, set the underlying field
            new_user._is_active_db = True # Set the actual database field
            # uid is likely auto-generated by the model default

            # If you need to link the invite code object directly:
            # new_user.used_invite_code_obj = invite_code_obj # If you add such a relationship
            new_user.invited_by = invite_code_obj.created_by_username or "SystemGenerated" # Example if tracking creator

            db.session.add(new_user)
            
            # Update Invite Code object
            invite_code_obj.uses_count += 1
            invite_code_obj.used_by_username = new_user.username # Link to the new user's username
            invite_code_obj.used_at = now_utc
            if invite_code_obj.uses_count >= invite_code_obj.max_uses:
                invite_code_obj.is_active = False # Deactivate if max uses reached
            
            db.session.commit()
            log.info(f"User '{new_user.username}' (ID: {new_user.id}) registered successfully. Invite code '{referral_req}' updated.")
            
            # --- Auto-login and generate JWT tokens ---
            access_token = create_access_token(identity=new_user.id)
            refresh_token = create_refresh_token(identity=new_user.id)
            log.info(f"Generated JWT tokens for newly registered user '{new_user.username}'.")
            
            avatar_full_url = None
            try:
                avatar_full_url = new_user.avatar_url
            except Exception:
                 log.warning(f"Could not generate avatar_url for {new_user.username} during registration response.")

            return jsonify({
                "message": "Bruger oprettet og logget ind!",
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": {
                    "id": new_user.id,
                    "username": new_user.username,
                    "avatar": avatar_full_url
                }
            }), 201

        except Exception as e_db: # Catch SQLAlchemy errors or other DB issues
            db.session.rollback()
            log.exception(f"Database error during user registration for '{username_req}': {e_db}")
            return jsonify({"error": "Serverfejl ved oprettelse af bruger. Prøv igen senere."}), 500

    except json.JSONDecodeError:
        log.warning("Register failed: Invalid JSON received.")
        return jsonify({"error": "Ugyldigt JSON format."}), 400
    except Exception as e: # Catch any other unexpected errors
        log.exception(f"Unexpected top-level error in /register: {e}")
        return jsonify({"error": "Intern serverfejl under registrering."}), 500

# Removed _get_user_data_by_id_local as it's no longer needed.
# Direct DB queries will be used.

# ===========================================================
# === Login (Bruger) - Håndterer GET (HTML) & POST (JSON) ===
# ===========================================================
@auth_bp.route("/login", methods=["GET", "POST"])
def login_route():
    """Handles user login via GET (render form) and POST (process JSON credentials)."""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    form = LoginForm() # Bruges til CSRF validering selv for JSON

    # --- POST Request (Login Forsøg via JSON) ---
    if request.method == 'POST':
        log.debug("POST /auth/login attempt received.")
        if not form.validate_on_submit(): # Validerer CSRF token her
            # Pylance Error: Cannot access attribute "csrf_token" for class "LoginForm" - Likely type hint issue
            csrf_errors = form.csrf_token.errors # type: ignore
            err_msg = "Login fejlede: Ugyldig eller manglende sikkerhedstoken." if csrf_errors else "Formularvalideringsfejl."
            log.warning(f"Login failed: Initial form validation failed (CSRF={csrf_errors is not None}). Errors: {form.errors}")
            return jsonify({"error": err_msg, "errors": form.errors}), 400 # Altid 400 for client fejl

        if not request.is_json:
            log.error("POST /auth/login received non-JSON data after CSRF validation. Unexpected.")
            return jsonify({"error": "Forkert data format (forventede JSON)."}), 415

        try:
            data = request.get_json()
            if not data:
                 log.warning("Login failed: Empty JSON payload received.")
                 return jsonify({"error": "Tom login anmodning."}), 400

            username_req = data.get('username', '').strip()
            password_req = data.get('password', '')
            remember_me_req = data.get('remember', False)

            log.info(f"Processing JSON login for user: '{username_req}' (Remember: {remember_me_req})")
            username_lower = username_req.lower()

            errors = {}
            if not username_req: errors['username'] = 'Brugernavn er påkrævet.'
            if not password_req: errors['password'] = 'Password er påkrævet.'
            if errors:
                log.warning(f"Login failed for '{username_req}': Missing fields in JSON.")
                return jsonify({"errors": errors}), 400

            # --- Database Lookup and Validation ---
            # Find user by username (case-insensitive)
            user_obj = DBUser.query.filter(func.lower(DBUser.username) == func.lower(username_req)).first()

            if user_obj and bcrypt.check_password_hash(user_obj.password_hash, password_req):
                log.debug(f"Password VERIFIED for user '{user_obj.username}'.")

                if not user_obj.is_active:
                    log.warning(f"Login denied for inactive user '{user_obj.username}'.")
                    return jsonify({"error": "Denne brugerkonto er deaktiveret."}), 403

                if user_obj.twofa_enabled: # Check against DBUser object
                    log.info(f"2FA required for '{user_obj.username}'. Preparing 2FA session.")
                    session.clear()
                    session['_2fa_login_user_id'] = user_obj.id # Store integer PK from DBUser
                    session['_2fa_login_remember'] = remember_me_req
                    session.modified = True
                    return jsonify({
                        "message": "Two-Factor Authentication Required.",
                        "twofa_required": True
                    }), 200
                else: # Direct Login (No 2FA)
                    log.info(f"2FA not enabled for '{user_obj.username}'. Proceeding with direct login.")
                    session.clear()
                    if login_user(user_obj, remember=remember_me_req): # Pass DBUser object
                        user_obj.last_login = datetime.now(timezone.utc)
                        try:
                            db.session.commit()
                            log.info(f"Direct login successful for '{user_obj.username}' (Remember: {remember_me_req}). Last login updated.")
                        except Exception as e_db_commit:
                            db.session.rollback()
                            log.exception(f"DB error updating last_login for '{user_obj.username}': {e_db_commit}")
                            # Login still proceeds, last_login update is best effort here

                        next_url_param = request.args.get('next')
                        redirect_url = url_for('main.index')
                        if next_url_param and is_safe_url(next_url_param): redirect_url = next_url_param
                        
                        avatar_full_url = None
                        try:
                            # Generate avatar_url using the property from DBUser model
                            avatar_full_url = user_obj.avatar_url
                        except Exception:
                            log.warning(f"Could not generate avatar_url for {user_obj.username} during login response.")
                        
                        # Create JWT tokens
                        access_token = create_access_token(identity=user_obj.id)
                        refresh_token = create_refresh_token(identity=user_obj.id) # Optional

                        return jsonify({
                            "message": "Login succesfuldt!",
                            "access_token": access_token,
                            "refresh_token": refresh_token, # Optional
                            # Keep existing response fields for compatibility if needed by older parts
                            "redirect_url": redirect_url,
                            "username": user_obj.username,
                            "avatar": avatar_full_url
                        }), 200
                    else:
                        log.critical(f"Flask-Login login_user() returned False unexpectedly for '{user_obj.username}'.")
                        return jsonify({"error": "Intern login systemfejl."}), 500
            else: # Invalid username or password
                log.warning(f"Login failed for user '{username_req}': Invalid credentials.")
                # --- Log failed attempt ---
                try:
                    # Instantiate FailedLoginAttempt and set attributes
                    failed_attempt = FailedLoginAttempt()
                    failed_attempt.ip_address = request.remote_addr
                    failed_attempt.username_attempt = username_req
                    failed_attempt.user_agent = request.user_agent.string
                    # timestamp is set by default in the model

                    db.session.add(failed_attempt)
                    db.session.commit()
                    log.debug(f"Logged failed login attempt for username '{username_req}' from IP {request.remote_addr}")
                except Exception as log_err:
                    db.session.rollback()
                    log.error(f"Failed to log failed login attempt for '{username_req}': {log_err}")
                # --- End log failed attempt ---
                return jsonify({"error": "Ugyldigt brugernavn eller password."}), 401
        
        except json.JSONDecodeError:
            log.warning("Login failed: Invalid JSON in request body.")
            return jsonify({"error": "Ugyldigt JSON format."}), 400
        except Exception as e:
            log.exception(f"Unexpected error during JSON login processing: {e}")
            db.session.rollback() # Rollback on any unexpected error during DB interaction
            return jsonify({"error": "Intern serverfejl under login."}), 500

    # --- GET Request (Vis Login Side) ---
    elif request.method == 'GET':
        log.debug("GET /auth/login: Rendering login page.")
        try:
            return render_template('auth/login.html',
                                   title="Log Ind",
                                   form=form,
                                   active_form='login')
        except TemplateNotFound:
            log.exception("CRITICAL: Login template 'auth/login.html' not found!")
            return "<h1>Error 500: Login template missing.</h1>", 500
        except Exception as render_err:
            log.exception(f"Error rendering login template: {render_err}")
            return "<h1>Error 500: Failed to render login page.</h1>", 500

    # --- Ugyldig Metode ---
    log.warning(f"Received unsupported method {request.method} on /auth/login.")
    return jsonify({"error": "Metode ikke tilladt"}), 405

# Removed _get_logged_in_user_data_and_players as it's no longer needed.
# Direct DB queries and current_user (which is a DBUser object) will be used.

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

    user_pk_from_session = session.get('_2fa_login_user_id') # This should be the integer PK

    if not user_pk_from_session:
        log.warning("Verify 2FA TOTP failed: No _2fa_login_user_id found in session.")
        return jsonify({"error": "Ingen aktiv 2FA login session. Prøv at logge ind igen."}), 403

    try:
        remember = session.get('_2fa_login_remember', False)
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
            session.pop('_2fa_login_user_id', None); session.pop('_2fa_login_remember', None)
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
                
                session.pop('_2fa_login_user_id', None); session.pop('_2fa_login_remember', None)
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
                session.pop('_2fa_login_user_id', None); session.pop('_2fa_login_remember', None)
                return jsonify({"error": "Intern systemfejl ved afslutning af login."}), 500
        else: # TOTP code invalid
            log.warning(f"Invalid 2FA TOTP code provided by user '{user_obj.username}'.")
            return jsonify({"errors": {"code": "Ugyldig 2FA kode."}}), 401

    except json.JSONDecodeError: return jsonify({"error": "Ugyldigt JSON format."}), 400
    except Exception as e:
        log.exception(f"Unexpected error in /verify_2fa_login for user PK '{user_pk_from_session}': {e}")
        db.session.rollback() # Ensure rollback on general exceptions too
        session.pop('_2fa_login_user_id', None); session.pop('_2fa_login_remember', None)
        return jsonify({"error": "Intern serverfejl ved 2FA check."}), 500

@auth_bp.route("/verify_backup_code", methods=["POST"])
def verify_backup_code():
    """Verifies backup code during login flow (JSON API) using database."""
    log.info("Attempting 2FA Backup code verification (DB).")
    if not request.is_json: return jsonify({"error": "Forkert format (JSON påkrævet)."}), 415

    user_pk_from_session = session.get('_2fa_login_user_id') # Integer PK
    if not user_pk_from_session:
        log.warning("Verify Backup Code failed: No _2fa_login_user_id in session.")
        return jsonify({"error": "Ingen aktiv 2FA login session."}), 403

    try:
        remember = session.get('_2fa_login_remember', False)
        data = request.get_json()
        if not data: return jsonify({"error": "Tom anmodning."}), 400

        backup_code_input = data.get("backup_code", "").strip()
        errors = {}
        if not backup_code_input: errors['backup_code'] = "Backup kode er påkrævet."
        if errors: return jsonify({"errors": errors}), 400

        user_obj = DBUser.query.get(user_pk_from_session)
        if not user_obj:
            log.error(f"Verify Backup Code CRITICAL: DBUser not found for PK '{user_pk_from_session}'.")
            session.pop('_2fa_login_user_id', None); session.pop('_2fa_login_remember', None)
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

                session.pop('_2fa_login_user_id', None); session.pop('_2fa_login_remember', None)
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

                return jsonify({
                    "message": "Login succesfuldt med backup kode!",
                    "access_token": access_token,
                    "refresh_token": refresh_token, # Optional
                    "redirect_url": redirect_url,
                    "username": user_obj.username,
                    "avatar": avatar_full_url,
                    "flashes": flashed_msgs
                 }), 200
            else: # login_user failed
                log.critical(f"Flask-Login login_user() failed AFTER valid backup code for '{user_obj.username}'.")
                session.pop('_2fa_login_user_id', None); session.pop('_2fa_login_remember', None)
                return jsonify({"error": "Intern systemfejl ved login."}), 500
        else: # Backup code invalid
            log.warning(f"Invalid backup code provided by user '{user_obj.username}'.")
            return jsonify({"errors": {"backup_code": "Ugyldig backup kode."}}), 401

    except json.JSONDecodeError: return jsonify({"error": "Ugyldigt JSON format."}), 400
    except Exception as e:
        log.exception(f"Unexpected error in /verify_backup_code for user PK '{user_pk_from_session}': {e}")
        db.session.rollback() 
        session.pop('_2fa_login_user_id', None); session.pop('_2fa_login_remember', None)
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
            # --- Create Password Reset Request Record ---
            try:
                # Generate a secure, URL-safe token
                token = secrets.token_urlsafe(32)
                # Create the request object (expires in e.g., 24 hours)
                reset_request = PasswordResetRequest(user_id=user.id, token=token, expires_in_hours=24)
                db.session.add(reset_request)
                db.session.commit()
                log.info(f"Password reset request CREATED in DB for user '{user.username}' (ID: {user.id}). Token: {token[:8]}...") # Log only prefix
                flash(f"Anmodning om nulstilling af password for '{user.username.title()}' er modtaget. En administrator vil behandle den snarest.", "success")
            except Exception as e_req:
                db.session.rollback()
                log.exception(f"Failed to create password reset request for user '{user.username}': {e_req}")
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

# === EOF: app/routes/auth.py ===
