# app/routes/admin.py

# === Standard Bibliotek Imports ===
import json  # For Redis session data
import logging
import os
import re  # For email validering
import secrets  # For generating secure tokens
import uuid
from datetime import datetime, timedelta, timezone  # <<< TILFØJET timedelta

import redis  # For Redis health check and error handling

# === Tredjeparts Bibliotek Imports ===
from flask import (
    Blueprint,
    current_app,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required
from sqlalchemy import (
    exc as sqlalchemy_exc,  # For DB health check, error handling, and select statements
)
from sqlalchemy import select, text

from .. import utils  # <<< TILFØJET admin_required decorator

# === Lokale Applikationsimports ===
# (Grupperet og evt. alfabetiseret)
from ..config import Config
from ..data_access import add_audit_log  # <<< TILFØJET for audit logs
from ..data_access import load_audit_logs  # <<< TILFØJET for audit logs
from ..data_access import load_invite_codes  # For liste af invite objekter
from ..data_access import save_invite_codes  # For liste af invite objekter
from ..data_access import (
    DEFAULT_SYSTEM_SETTINGS,
    load_players,
    load_system_settings,
    save_players,
    save_system_settings,
)
from ..extensions import (  # <<< TILFØJET scheduler, socketio
    db,
    redis_client,
    scheduler,
    socketio,
)
from ..models import InviteCode, PrivateMessage  # <<< TILFØJET for cleanup job
from ..search import rebuild_index  # <<< TILFØJET for manual reindex
from .sessions import (  # Import Redis prefixes from sessions.py
    SESSION_KEY_PREFIX,
    SESSION_PLAYERS_KEY_PREFIX,
)

# import flask_whooshalchemy as wa # <<< REMOVED


# Blueprint oprettelse etc.
log = logging.getLogger(__name__)
admin_bp = Blueprint("admin", __name__, template_folder="../templates/admin")


# --- Admin Routes ---
@admin_bp.route("/")
@login_required
@utils.admin_required  # Use decorator
def index():
    """Redirecter til admin menu hvis brugeren er admin, ellers til main index."""
    # No need for manual check if decorator is used
    log.debug(f"Admin user '{current_user.id}' accessing /admin, redirecting to menu.")
    return redirect(url_for(".admin_menu"))


@admin_bp.route("/menu")
@login_required
@utils.admin_required  # Use decorator
def admin_menu():
    """Viser admin menu siden. Kræver at brugeren er admin."""
    # No need for manual check if decorator is used
    log.debug(f"Admin user '{current_user.id}' accessed admin menu.")
    try:
        context = utils.get_common_context()
        context["active_page"] = "admin_menu"  # Tilføj specifik context for menuen
        return render_template("admin/menu.html", **context)
    except Exception as e:
        log.exception(f"Error in admin_menu for admin {current_user.id}: {e}")
        flash("Der opstod en intern fejl ved visning af admin menuen.", "error")
        return redirect(url_for("main.index"))


# ==================================
# === Admin API Endpoints / Actions ===
# ==================================

# --- Invite Koder ---


# POST /admin/generate_invite_code (OPDATERET)
@admin_bp.route("/generate_invite_code", methods=["POST"])
@login_required
@utils.admin_required
def generate_invite_code():
    """Genererer en ny invite kode som et objekt og gemmer den (Kræver admin)."""
    try:
        new_code_str = "INVITE-" + str(uuid.uuid4())[:8].upper()
        now_utc = datetime.now(timezone.utc)
        now_iso_utc = now_utc.isoformat(timespec="seconds").replace("+00:00", "Z")

        new_code_obj = {
            "code": new_code_str,
            "created_at": now_iso_utc,
            "created_by": current_user.id,
            "used": False,
            "used_at": None,
            "used_by": None,
        }
        invite_codes_list = load_invite_codes()
        if any(c.get("code") == new_code_str for c in invite_codes_list):
            log.error(
                f"Admin '{current_user.id}': UUID collision generating invite code: {new_code_str}. Retrying might help."
            )
            return (
                jsonify(
                    {"error": "Kode genereringsfejl (kollision), prøv venligst igen."}
                ),
                500,
            )
        invite_codes_list.append(new_code_obj)
        if save_invite_codes(invite_codes_list):
            log.info(
                f"Admin '{current_user.id}' generated new invite code: {new_code_str}"
            )
            # Audit Log
            add_audit_log(
                action="generate_invite",
                admin_user=current_user.id,
                target_resource=new_code_str,
            )
            return (
                jsonify(
                    {"message": "Ny invite-kode genereret", "invite_code": new_code_str}
                ),
                200,
            )
        else:
            log.error(
                f"Admin '{current_user.id}': FAILED to save invite codes file after attempting to add {new_code_str}."
            )
            return (
                jsonify({"error": "Kunne ikke gemme den nye invite kode til filen."}),
                500,
            )
    except Exception as e:
        log.exception(
            f"Unexpected error in generate_invite_code for admin {current_user.id}: {e}"
        )
        return (
            jsonify({"error": "Intern serverfejl ved generering af invite kode."}),
            500,
        )


# GET /admin/invites (NY ROUTE)
@admin_bp.route("/invites", methods=["GET"])
@login_required
@utils.admin_required
def admin_get_invites():
    """API: Hent liste over alle invite kode objekter (Kræver admin)."""
    try:
        invite_codes_list = load_invite_codes()
        log.info(
            f"Admin '{current_user.id}' requested list of {len(invite_codes_list)} invite codes."
        )

        def get_sort_key(item):
            try:
                return datetime.fromisoformat(
                    item.get("created_at", "1970-01-01T00:00:00Z").replace(
                        "Z", "+00:00"
                    )
                )
            except ValueError:
                return datetime(1970, 1, 1, tzinfo=timezone.utc)

        sorted_invites = sorted(invite_codes_list, key=get_sort_key, reverse=True)
        return jsonify({"invites": sorted_invites}), 200
    except Exception as e:
        log.exception(f"Fejl i admin_get_invites for admin {current_user.id}: {e}")
        return (
            jsonify({"error": "Intern serverfejl ved hentning af invite koder."}),
            500,
        )


# DELETE /admin/invites/<code> (NY ROUTE)
@admin_bp.route("/invites/<code>", methods=["DELETE"])
@login_required
@utils.admin_required
def admin_delete_invite(code):
    """API: Slet en specifik invite kode ved dens kode-streng (Kræver admin)."""
    if not code:
        return jsonify({"error": "Ingen invite kode specificeret i URL."}), 400
    try:
        invite_codes_list = load_invite_codes()
        original_length = len(invite_codes_list)
        code_to_delete_obj = None
        for invite_obj in invite_codes_list:
            if invite_obj.get("code") == code:
                code_to_delete_obj = invite_obj
                break
        if not code_to_delete_obj:
            log.warning(
                f"Admin '{current_user.id}' tried to delete non-existent invite code: {code}"
            )
            return jsonify({"error": "Invite kode ikke fundet."}), 404
        updated_invite_list = [
            obj for obj in invite_codes_list if obj.get("code") != code
        ]
        if len(updated_invite_list) < original_length:
            log.info(
                f"Admin '{current_user.id}' attempting to delete invite code: {code} "
                f"(Created by: {code_to_delete_obj.get('created_by', 'N/A')}, Used: {code_to_delete_obj.get('used', 'N/A')})"
            )
            if save_invite_codes(updated_invite_list):
                log.info(f"Successfully saved invite codes file after deleting {code}.")
                # Audit Log
                add_audit_log(
                    action="delete_invite",
                    admin_user=current_user.id,
                    target_resource=code,
                )
                return jsonify({"message": f"Invite kode '{code}' blev slettet."}), 200
            else:
                log.error(
                    f"Admin '{current_user.id}': FAILED to save invite codes file after removing {code}. File might be out of sync."
                )
                return (
                    jsonify(
                        {
                            "error": "Kunne ikke gemme ændringer efter sletning af invite kode."
                        }
                    ),
                    500,
                )
        else:
            log.error(
                f"Logic error: Invite code {code} found but list filtering failed for admin {current_user.id}."
            )
            return (
                jsonify({"error": "Intern fejl ved filtrering af invite koder."}),
                500,
            )
    except Exception as e:
        log.exception(
            f"Fejl i admin_delete_invite for code '{code}', admin {current_user.id}: {e}"
        )
        return jsonify({"error": "Intern serverfejl ved sletning af invite kode."}), 500


# GET /admin/api/all_sessions (NY ROUTE FOR ADMIN)
@admin_bp.route("/api/all_sessions", methods=["GET"])
@login_required
@utils.admin_required
def admin_get_all_sessions():
    """API: Henter en liste af ALLE aktive og evt. inaktive game sessions (Kræver admin)."""
    log.info(f"Admin '{current_user.id}' requested list of all game sessions.")
    all_sessions_list = []
    try:
        cursor = 0  # Initialize cursor as integer
        while True:
            # Assuming redis_client.scan is synchronous. If it's async, this route needs to be async.
            # Pylance error "Awaitable[Any]" is not iterable might be a type stub issue.
            cursor, keys_from_scan = redis_client.scan(cursor=cursor, match=f"{SESSION_KEY_PREFIX}*", count=100)  # type: ignore

            if keys_from_scan:
                pipe = redis_client.pipeline(transaction=False)
                valid_keys_and_session_ids = (
                    []
                )  # Store (key, session_id) tuples for valid keys

                for key_bytes in keys_from_scan:
                    key_str = (
                        key_bytes
                        if isinstance(key_bytes, str)
                        else key_bytes.decode("utf-8")
                    )
                    parts = key_str.split(":", 1)
                    if len(parts) < 2:
                        log.warning(
                            f"Malformed session key from Redis (cannot split session_id): {key_str}"
                        )
                        continue  # Skip this malformed key

                    current_session_id = parts[1]
                    valid_keys_and_session_ids.append((key_str, current_session_id))

                    players_key = f"{SESSION_PLAYERS_KEY_PREFIX}{current_session_id}"
                    pipe.hgetall(key_str)
                    pipe.smembers(players_key)
                    pipe.scard(players_key)

                if (
                    not pipe.command_stack
                ):  # No valid keys were processed to add commands
                    if cursor == 0:
                        break
                    else:
                        continue

                results = pipe.execute()

                chunk_size = 3
                # Iterate through valid_keys_and_session_ids to correctly associate results
                for idx, (processed_key_str, processed_session_id) in enumerate(
                    valid_keys_and_session_ids
                ):
                    result_start_index = idx * chunk_size
                    if result_start_index + chunk_size > len(results):
                        log.error(
                            f"Mismatch in Redis pipe results and processed keys for key: {processed_key_str}. Results length: {len(results)}, expected index: {result_start_index}"
                        )
                        break  # Avoid index out of bounds

                    session_data_raw = results[result_start_index]
                    player_usernames_bytes = results[result_start_index + 1]
                    player_count = results[result_start_index + 2]

                    if session_data_raw:
                        sdata = {
                            (k.decode("utf-8") if isinstance(k, bytes) else k): (
                                v.decode("utf-8") if isinstance(v, bytes) else v
                            )
                            for k, v in session_data_raw.items()
                        }
                        player_usernames = {
                            p.decode("utf-8") if isinstance(p, bytes) else str(p)
                            for p in player_usernames_bytes
                        }

                        sdata_processed = {
                            "session_id": sdata.get(
                                "session_id", processed_session_id
                            ),  # Use session_id for this specific key
                            "session_name": sdata.get(
                                "session_name", f"Session {processed_session_id[:8]}"
                            ),
                            "creator": sdata.get("creator", "Ukendt"),
                            "admin_code": sdata.get("admin_code", "N/A"),
                            "game_mode": sdata.get("game_mode", "Ukendt"),
                            "outcomes": json.loads(sdata.get("outcomes", "[]")),
                            "bets": json.loads(sdata.get("bets", "[]")),
                            "created_at": sdata.get(
                                "created_at", datetime.now(timezone.utc).isoformat()
                            ),
                            "status": sdata.get("status", "unknown"),
                            "players_count": player_count or 0,
                            "players": list(player_usernames),
                        }
                        all_sessions_list.append(sdata_processed)

            if cursor == 0:
                break

        all_sessions_list.sort(
            key=lambda x: x.get("created_at", "0") or "0", reverse=True
        )
        log.info(f"Admin API: Returning {len(all_sessions_list)} total sessions.")
        return jsonify({"sessions": all_sessions_list})

    except redis.RedisError as e:
        log.exception(
            f"Redis error fetching all sessions for admin {current_user.id}: {e}"
        )
        return jsonify({"error": "Databasefejl ved hentning af alle sessioner."}), 500
    except Exception as e:
        log.exception(f"Fejl i admin_get_all_sessions for admin {current_user.id}: {e}")
        return (
            jsonify({"error": "Intern serverfejl ved hentning af alle sessioner."}),
            500,
        )


# --- Brugere & Balance ---


# GET /admin/users
@admin_bp.route("/users", methods=["GET"])
@login_required
@utils.admin_required
def admin_get_users():
    """Henter en liste af alle brugere med avatar URL (Kræver admin rolle)."""
    try:
        players_data = load_players()
        users_list = []
        default_avatar_url = url_for(
            "static", filename="avatars/default_avatar.png", _external=False
        )
        for username_key, udata in players_data.items():
            if isinstance(udata, dict):
                safe_data = udata.copy()
                avatar_filename = safe_data.get("avatar")
                safe_data["avatar_url"] = (
                    url_for(
                        "static", filename=f"avatars/{avatar_filename}", _external=False
                    )
                    if avatar_filename
                    else default_avatar_url
                )
                sensitive_keys = ["password_hash", "backup_codes", "2fa_secret"]
                for key in sensitive_keys:
                    safe_data.pop(key, None)
                safe_data["id"] = username_key
                if "username" not in safe_data:
                    safe_data["username"] = username_key
                users_list.append(safe_data)
            else:
                log.warning(
                    f"Invalid data type for key '{username_key}' in players file: {type(udata)}. Skipping."
                )
        log.info(
            f"Admin '{current_user.id}' requested list of {len(users_list)} users."
        )
        return jsonify({"users": users_list}), 200
    except Exception as e:
        log.exception(f"Fejl i admin_get_users for admin {current_user.id}: {e}")
        return jsonify({"error": "Intern serverfejl ved brugerhentning."}), 500


# PUT /admin/users/<username>
@admin_bp.route("/users/<string:username>", methods=["PUT"])
@login_required
@utils.admin_required
def admin_edit_user(username):
    """API: Rediger brugeroplysninger (email, role, about_me). Kræver admin. (Case-insensitive lookup)"""
    username_lookup_key = username.lower()
    data = request.get_json()
    if not data:
        return jsonify({"error": "Manglende JSON data for opdatering."}), 400
    allowed_fields = {"email", "role", "about_me"}
    provided_fields = set(data.keys())
    unknown_fields = provided_fields - allowed_fields
    if unknown_fields:
        log.warning(
            f"Admin '{current_user.id}' tried to edit unknown/forbidden fields for '{username}': {unknown_fields}"
        )
        return (
            jsonify(
                {"error": f"Ugyldige felter angivet: {', '.join(unknown_fields)}."}
            ),
            400,
        )
    errors = {}
    new_email = data.get("email").strip() if "email" in data else None
    new_role = data.get("role").strip().lower() if "role" in data else None
    new_about_me = data.get("about_me").strip() if "about_me" in data else None
    if new_email is not None:
        if new_email == "":
            pass
        elif not re.match(r"[^@\s]+@[^@\s]+\.[^@\s]+", new_email):
            errors["email"] = "Ugyldigt email format."
    if new_role is not None:
        if new_role not in ["user", "admin"]:
            errors["role"] = "Ugyldig rolle. Skal være 'user' eller 'admin'."
    if new_about_me is not None:
        MAX_ABOUT_ME_LENGTH = (
            Config.MAX_ABOUT_ME_LENGTH
            if hasattr(Config, "MAX_ABOUT_ME_LENGTH")
            else 500
        )
        if len(new_about_me) > MAX_ABOUT_ME_LENGTH:
            errors["about_me"] = f"Beskrivelse må maks være {MAX_ABOUT_ME_LENGTH} tegn."
    if errors:
        return jsonify({"error": "Valideringsfejl", "details": errors}), 400
    primary_admin_lower = (
        os.environ.get("ADMIN_USERNAME") or Config.ADMIN_USERNAME or ""
    ).lower()
    try:
        players_data = load_players()
        original_user_key = None
        for key in players_data.keys():
            if key.lower() == username_lookup_key:
                original_user_key = key
                break
        if original_user_key is None or not isinstance(
            players_data.get(original_user_key), dict
        ):
            log.warning(
                f"Admin '{current_user.id}' failed edit: User '{username}' (lookup: {username_lookup_key}) not found."
            )
            return jsonify({"error": "Bruger ikke fundet."}), 404
        user_data_to_update = players_data[original_user_key]
        if (
            primary_admin_lower
            and original_user_key.lower() == primary_admin_lower
            and new_role is not None
            and new_role != "admin"
        ):
            log.error(
                f"DENIED: Admin '{current_user.id}' attempted to change role of primary admin '{original_user_key}' to '{new_role}'."
            )
            return (
                jsonify(
                    {"error": "Kan ikke ændre rollen for den primære admin bruger."}
                ),
                403,
            )
        updated_fields = []
        if new_email is not None and user_data_to_update.get("email") != new_email:
            user_data_to_update["email"] = new_email
            updated_fields.append("email")
        if new_role is not None and user_data_to_update.get("role") != new_role:
            user_data_to_update["role"] = new_role
            updated_fields.append("role")
        if (
            new_about_me is not None
            and user_data_to_update.get("about_me") != new_about_me
        ):
            user_data_to_update["about_me"] = new_about_me
            updated_fields.append("about_me")
        if not updated_fields:
            log.info(
                f"Admin '{current_user.id}' submitted edit for '{original_user_key}', but no changes detected."
            )
            return (
                jsonify(
                    {"message": "Ingen ændringer blev gemt.", "updated_fields": []}
                ),
                200,
            )
        if save_players(players_data):
            log.info(
                f"Admin '{current_user.id}' successfully edited user '{original_user_key}'. Fields changed: {', '.join(updated_fields)}."
            )
            # Audit Log
            add_audit_log(
                action="edit_user",
                admin_user=current_user.id,
                target_resource=original_user_key,
                details={"updated_fields": updated_fields},
            )
            response_user_data = {
                field: user_data_to_update.get(field) for field in updated_fields
            }
            response_user_data["id"] = original_user_key
            response_user_data["username"] = original_user_key
            return (
                jsonify(
                    {
                        "message": f"Bruger '{original_user_key}' blev opdateret.",
                        "updated_fields": updated_fields,
                        "user": response_user_data,
                    }
                ),
                200,
            )
        else:
            log.error(
                f"Admin '{current_user.id}': FAILED to save player data after editing '{original_user_key}'."
            )
            return (
                jsonify({"error": "Kunne ikke gemme de opdaterede brugeroplysninger."}),
                500,
            )
    except Exception as e:
        log.exception(
            f"Unexpected error editing user '{username}' for admin '{current_user.id}': {e}"
        )
        return jsonify({"error": "Intern serverfejl ved redigering af bruger."}), 500


# DELETE /admin/users/<username>
@admin_bp.route("/users/<string:username>", methods=["DELETE"])
@login_required
@utils.admin_required
def admin_delete_user(username):
    """Sletter en specifik bruger (case-insensitiv lookup, sletter original key). Kræver admin."""
    username_lookup_key = username.lower()
    primary_admin_lower = (
        os.environ.get("ADMIN_USERNAME") or Config.ADMIN_USERNAME or ""
    ).lower()
    if not username_lookup_key:
        return jsonify({"error": "Brugernavn mangler i URL"}), 400
    if primary_admin_lower and username_lookup_key == primary_admin_lower:
        log.error(
            f"DENIED: Admin '{current_user.id}' attempted to delete primary admin user '{username}'."
        )
        return jsonify({"error": "Kan ikke slette den primære admin bruger."}), 403
    try:
        players_data = load_players()
        original_key_to_delete = None
        for key in players_data.keys():
            if key.lower() == username_lookup_key:
                original_key_to_delete = key
                break
        if original_key_to_delete is None:
            log.warning(
                f"Admin '{current_user.id}' failed delete: User '{username}' not found."
            )
            return jsonify({"error": "Bruger ikke fundet"}), 404
        del players_data[original_key_to_delete]
        if save_players(players_data):
            log.info(
                f"Admin '{current_user.id}' successfully deleted user: {original_key_to_delete} (Requested as: {username})"
            )
            log.warning(
                f"Note: Related session data for '{original_key_to_delete}' (if file-based) was not cleared."
            )
            # Audit Log
            add_audit_log(
                action="delete_user",
                admin_user=current_user.id,
                target_resource=original_key_to_delete,
            )
            return (
                jsonify(
                    {"message": f"Bruger '{original_key_to_delete}' blev slettet."}
                ),
                200,
            )
        else:
            log.error(
                f"Admin '{current_user.id}': FAILED to save player data after deleting {original_key_to_delete}."
            )
            return (
                jsonify(
                    {"error": "Kunne ikke gemme ændringer efter sletning af bruger."}
                ),
                500,
            )
    except Exception as e:
        log.exception(
            f"Fejl i admin_delete_user for '{username}', admin {current_user.id}: {e}"
        )
        return jsonify({"error": "Intern serverfejl ved sletning af bruger."}), 500


# POST /admin/users/<username>/balance
@admin_bp.route("/users/<string:username>/balance", methods=["POST"])
@login_required
@utils.admin_required
def update_balance(username):
    """Opdaterer en brugers balance (case-insensitiv lookup). Kræver admin."""
    username_lookup_key = username.lower()
    data = request.get_json()
    if not data or "operation" not in data or "amount" not in data:
        return (
            jsonify(
                {"error": "Manglende JSON data ('operation' og 'amount' påkrævet)"}
            ),
            400,
        )
    operation = data.get("operation", "").strip().lower()
    reason = data.get("reason")
    if operation not in ["add", "remove", "set"]:
        return (
            jsonify(
                {
                    "error": "Ugyldig 'operation'. Skal være 'add', 'remove', eller 'set'."
                }
            ),
            400,
        )
    try:
        amount = float(data["amount"])
        if amount < 0:
            return jsonify({"error": "Beløb ('amount') må ikke være negativt."}), 400
    except (ValueError, TypeError, KeyError):
        return (
            jsonify({"error": "Ugyldigt format for 'amount'. Skal være et tal."}),
            400,
        )
    try:
        players_data = load_players()
        original_user_key = None
        for key in players_data.keys():
            if key.lower() == username_lookup_key:
                original_user_key = key
                break
        if original_user_key is None or not isinstance(
            players_data.get(original_user_key), dict
        ):
            log.warning(
                f"Admin '{current_user.id}' failed balance update: User '{username}' not found."
            )
            return jsonify({"error": "Bruger ikke fundet"}), 404
        user_data = players_data[original_user_key]
        current_balance = float(user_data.get("balance", 0.0))
        new_balance = current_balance
        if operation == "add":
            new_balance += amount
        elif operation == "remove":
            if new_balance < amount:
                log.warning(
                    f"Admin '{current_user.id}' failed remove balance for '{original_user_key}'. Insufficient funds ({current_balance:.2f} < {amount:.2f})"
                )
                return (
                    jsonify(
                        {
                            "error": f"Utilstrækkelig saldo ({current_balance:.2f}). Kan ikke fjerne {amount:.2f}."
                        }
                    ),
                    400,
                )
            new_balance -= amount
        elif operation == "set":
            new_balance = amount
        user_data["balance"] = round(new_balance, 2)
        if save_players(players_data):
            log.info(
                f"Admin '{current_user.id}' updated balance for '{original_user_key}'. "
                f"Op: {operation}, Amt: {amount:.2f}, NewBal: {user_data['balance']:.2f}. "
                f"Reason: {reason or 'N/A'}"
            )
            # Audit Log
            add_audit_log(
                action="update_balance",
                admin_user=current_user.id,
                target_resource=original_user_key,
                details={
                    "operation": operation,
                    "amount": amount,
                    "reason": reason or "N/A",
                    "new_balance": user_data["balance"],
                },
            )
            return (
                jsonify(
                    {
                        "message": f"Balance for '{original_user_key}' opdateret.",
                        "new_balance": user_data["balance"],
                    }
                ),
                200,
            )
        else:
            log.error(
                f"Admin '{current_user.id}': FAILED to save player data after balance update for {original_user_key}."
            )
            return jsonify({"error": "Kunne ikke gemme den opdaterede balance."}), 500
    except Exception as e:
        log.exception(
            f"Fejl i update_balance for '{username}', admin {current_user.id}: {e}"
        )
        return jsonify({"error": "Intern serverfejl ved opdatering af balance."}), 500


# --- Øvrige Admin Actions ---


# POST /admin/sessions/<session_id> (Disabled)
@admin_bp.route("/sessions/<string:session_id>", methods=["POST"])
@login_required
@utils.admin_required
def admin_update_session(session_id):
    """Opdaterer session data (MIDLERTIDIGT DEAKTIVERET pga. state problemer)."""
    log.error(
        f"Admin action skipped: Session update for '{session_id}' is disabled due to implementation limits."
    )
    return (
        jsonify(
            {
                "error": "Opdatering af sessioner er ikke implementeret på en sikker måde."
            }
        ),
        501,
    )


# POST /admin/apply_maintenance
@admin_bp.route("/apply_maintenance", methods=["POST"])
@login_required
@utils.admin_required
def apply_maintenance():
    """Aktiverer/deaktiverer vedligeholdelsestilstand (påvirker kun app.config)."""
    data = request.get_json()
    if data is None or "maintenance_mode" not in data:
        return (
            jsonify({"error": "Manglende JSON data ('maintenance_mode' er påkrævet)"}),
            400,
        )
    maintenance_mode_input = data.get("maintenance_mode")
    if isinstance(maintenance_mode_input, str):
        maintenance_mode = maintenance_mode_input.lower() in ["true", "on", "yes", "1"]
    else:
        maintenance_mode = bool(maintenance_mode_input)
    message = data.get("notification_message", "").strip()
    try:
        current_app.config["MAINTENANCE_MODE"] = maintenance_mode
        current_app.config["MAINTENANCE_MESSAGE"] = message if maintenance_mode else ""
        status_text = "aktiveret" if maintenance_mode else "deaktiveret"
        log.info(
            f"Admin '{current_user.id}' {status_text} maintenance mode. Message: '{message or 'Ingen'}'"
        )
        # Audit Log (Note: This only changes app.config, not the persisted setting)
        add_audit_log(
            action="apply_maintenance",
            admin_user=current_user.id,
            details={
                "maintenance_mode": maintenance_mode,
                "message": message or "Ingen",
            },
        )
        return (
            jsonify(
                {
                    "message": f"Vedligeholdelsestilstand blev {status_text}.",
                    "maintenance_mode": maintenance_mode,
                }
            ),
            200,
        )
    except Exception as e:
        log.exception(
            f"Error applying maintenance mode by admin {current_user.id}: {e}"
        )
        return (
            jsonify({"error": "Fejl ved opdatering af vedligeholdelsestilstand."}),
            500,
        )


# POST /admin/generate_financial_report
@admin_bp.route("/generate_financial_report", methods=["POST"])
@login_required
@utils.admin_required
def generate_financial_report():
    """Genererer en simpel finansiel rapport baseret på player data."""
    try:
        players_data = load_players()
        total_balance = 0.0
        total_staked = 0.0
        total_won = 0.0
        total_lost = 0.0
        valid_users = 0
        for udata in players_data.values():
            if isinstance(udata, dict):
                valid_users += 1
                total_balance += float(udata.get("balance", 0.0))
                total_staked += float(udata.get("total_staked", 0.0))
                total_won += float(udata.get("total_won", 0.0))
                total_lost += float(udata.get("total_lost", 0.0))
        now_utc = datetime.now(timezone.utc)
        report = {
            "report_generated_at": now_utc.isoformat(timespec="seconds").replace(
                "+00:00", "Z"
            ),
            "total_users": valid_users,
            "total_platform_balance": round(total_balance, 2),
            "total_staked_overall": round(total_staked, 2),
            "total_won_overall": round(total_won, 2),
            "total_lost_overall": round(total_lost, 2),
            "platform_net_result": round(total_staked - total_won, 2),
        }
        log.info(
            f"Admin '{current_user.id}' generated financial report for {valid_users} users."
        )
        return jsonify({"report": report}), 200
    except Exception as e:
        log.exception(
            f"Error generating financial report for admin {current_user.id}: {e}"
        )
        return jsonify({"error": "Fejl under generering af finansiel rapport."}), 500


# --- System Settings API ---
@admin_bp.route("/api/system_settings", methods=["GET"])
@login_required
@utils.admin_required
def admin_get_system_settings():
    """API: Henter systemets konfigurationsindstillinger (Kræver admin)."""
    try:
        settings = load_system_settings()
        log.info(f"Admin '{current_user.id}' requested system settings.")
        return jsonify(settings), 200
    except Exception as e:
        log.exception(
            f"Fejl i admin_get_system_settings for admin {current_user.id}: {e}"
        )
        return (
            jsonify(
                {"error": "Intern serverfejl ved hentning af systemindstillinger."}
            ),
            500,
        )


@admin_bp.route("/api/system_settings", methods=["POST"])
@login_required
@utils.admin_required
def admin_update_system_settings():
    """API: Opdaterer systemets konfigurationsindstillinger (Kræver admin)."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Manglende JSON data for opdatering."}), 400

    current_settings = load_system_settings()
    updated_settings = current_settings.copy()  # Start med eksisterende værdier
    errors = {}

    # Valider og opdater hver indstilling
    field_validations = {
        "sports_api_key": ("str", None, None),
        "max_players_per_session": ("int", 1, 1000),
        "min_bet_amount": ("float", 0.01, 100000.0),
        "max_bet_amount": ("float", 0.01, 1000000.0),
        "registration_enabled": ("bool", None, None),
        "welcome_message_new_users": ("str", None, None),
        "session_timeout_minutes": ("int", 5, 10080),
        "maintenance_mode": ("bool", None, None),
        "maintenance_message": ("str", None, None),
        # Password Complexity Rules
        "password_min_length": ("int", 6, 128),  # Example range 6-128
        "password_require_uppercase": ("bool", None, None),
        "password_require_lowercase": ("bool", None, None),
        "password_require_number": ("bool", None, None),
        "password_require_symbol": ("bool", None, None),
    }

    for key, (expected_type, min_val, max_val) in field_validations.items():
        if key in data:
            value = data[key]
            try:
                if expected_type == "str":
                    updated_settings[key] = str(value).strip()
                elif expected_type == "int":
                    val_int = int(value)
                    if min_val is not None and val_int < min_val:
                        errors[key] = f"Værdi skal være mindst {min_val}."
                    elif max_val is not None and val_int > max_val:
                        errors[key] = f"Værdi må højst være {max_val}."
                    else:
                        updated_settings[key] = val_int
                elif expected_type == "float":
                    val_float = float(value)
                    if min_val is not None and val_float < min_val:
                        errors[key] = f"Værdi skal være mindst {min_val}."
                    elif max_val is not None and val_float > max_val:
                        errors[key] = f"Værdi må højst være {max_val}."
                    else:
                        updated_settings[key] = round(val_float, 2)
                elif expected_type == "bool":
                    if isinstance(value, str):
                        updated_settings[key] = value.lower() in [
                            "true",
                            "on",
                            "yes",
                            "1",
                        ]
                    else:
                        updated_settings[key] = bool(value)
            except ValueError:
                errors[key] = f"Ugyldigt format. Forventede {expected_type}."
            except Exception as e_val:
                errors[key] = f"Fejl ved validering af felt: {str(e_val)}"

    min_bet = updated_settings.get(
        "min_bet_amount", DEFAULT_SYSTEM_SETTINGS["min_bet_amount"]
    )
    max_bet = updated_settings.get(
        "max_bet_amount", DEFAULT_SYSTEM_SETTINGS["max_bet_amount"]
    )
    if (
        isinstance(min_bet, (int, float))
        and isinstance(max_bet, (int, float))
        and max_bet < min_bet
    ):
        errors["max_bet_amount"] = "Max bet skal være større end eller lig med min bet."

    if errors:
        log.warning(
            f"Admin '{current_user.id}' system settings update failed validation: {errors}"
        )
        return jsonify({"error": "Valideringsfejl", "details": errors}), 400

    try:
        if save_system_settings(updated_settings):
            log.info(
                f"Admin '{current_user.id}' successfully updated system settings. New settings: {updated_settings}"
            )
            changed_details = {
                k: updated_settings[k]
                for k in updated_settings
                if k in data and updated_settings[k] != current_settings.get(k)
            }
            add_audit_log(
                action="update_system_settings",
                admin_user=current_user.id,
                details=changed_details or {"message": "No effective changes detected"},
            )
            return (
                jsonify(
                    {
                        "message": "Systemindstillinger blev gemt.",
                        "settings": updated_settings,
                    }
                ),
                200,
            )
        else:
            log.error(f"Admin '{current_user.id}': FAILED to save system settings.")
            return jsonify({"error": "Kunne ikke gemme systemindstillingerne."}), 500
    except Exception as e:
        log.exception(
            f"Unexpected error updating system_settings for admin '{current_user.id}': {e}"
        )
        return (
            jsonify(
                {"error": "Intern serverfejl ved opdatering af systemindstillinger."}
            ),
            500,
        )


# --- Audit Log API ---
@admin_bp.route("/api/audit_logs", methods=["GET"])
@login_required
@utils.admin_required
def admin_get_audit_logs():
    """API: Henter audit log entries (Kræver admin)."""
    try:
        limit_str = request.args.get("limit", "100")
        try:
            limit = int(limit_str)
            if limit <= 0:
                limit = 100
        except ValueError:
            limit = 100

        logs = load_audit_logs(limit=limit)
        log.info(
            f"Admin '{current_user.id}' requested audit logs (limit: {limit}). Returning {len(logs)} entries."
        )
        return jsonify({"logs": logs}), 200
    except Exception as e:
        log.exception(f"Fejl i admin_get_audit_logs for admin {current_user.id}: {e}")
        return jsonify({"error": "Intern serverfejl ved hentning af audit logs."}), 500


# --- Cache Management API ---
@admin_bp.route("/api/clear_cache", methods=["POST"])
@login_required
@utils.admin_required
def admin_clear_cache():
    """API: Rydder specifikke cache-typer (pt. Redis session cache). Kræver admin."""
    cleared_count = 0
    errors_occurred = False
    try:
        log.info(
            f"Admin '{current_user.id}' initiated cache clearing (Redis sessions)."
        )
        session_keys_to_delete = []
        for key in redis_client.scan_iter(match=f"{SESSION_KEY_PREFIX}*"):
            session_keys_to_delete.append(key)
        for key in redis_client.scan_iter(match=f"{SESSION_PLAYERS_KEY_PREFIX}*"):
            session_keys_to_delete.append(key)

        if session_keys_to_delete:
            log.debug(
                f"Found {len(session_keys_to_delete)} Redis session keys to delete."
            )
            pipe = redis_client.pipeline()
            for key in session_keys_to_delete:
                pipe.delete(key)
            results = pipe.execute()
            cleared_count = sum(results)
            log.info(f"Successfully deleted {cleared_count} Redis session keys.")
        else:
            log.info("No Redis session keys found matching prefixes to clear.")

        add_audit_log(
            action="clear_cache",
            admin_user=current_user.id,
            details={"cache_type": "redis_sessions", "keys_cleared": cleared_count},
        )
        return (
            jsonify(
                {
                    "message": f"Redis session cache ryddet. {cleared_count} nøgler blev fjernet."
                }
            ),
            200,
        )

    except redis.RedisError as e:
        log.exception(
            f"Redis error during cache clearing for admin {current_user.id}: {e}"
        )
        errors_occurred = True
        # Ensure the error message is a string for jsonify
        return jsonify({"error": f"Redis fejl under cache rydning: {str(e)}"}), 500
    except Exception as e:
        log.exception(
            f"Unexpected error during cache clearing for admin {current_user.id}: {e}"
        )
        errors_occurred = True
        return jsonify({"error": "Intern serverfejl under cache rydning."}), 500
    finally:
        if errors_occurred:
            add_audit_log(
                action="clear_cache_failed",
                admin_user=current_user.id,
                details={
                    "cache_type": "redis_sessions",
                    "error": "An error occurred during clearing",
                },
            )


# --- Search Index Management API ---
@admin_bp.route("/api/reindex_search", methods=["POST"])
@login_required
@utils.admin_required
def admin_reindex_search():
    """API: Rebuilds the manual Whoosh search index. Kræver admin."""
    log.info(f"Admin '{current_user.id}' initiated manual search reindex.")
    try:
        indexed_count = rebuild_index()
        log.info(
            f"Successfully completed manual reindex triggered by admin '{current_user.id}'. Indexed {indexed_count} posts."
        )
        add_audit_log(
            action="reindex_search",
            admin_user=current_user.id,
            details={"indexed_count": indexed_count},
        )
        return (
            jsonify(
                {
                    "message": f"Søgeindeks er blevet genopbygget. {indexed_count} posts indekseret."
                }
            ),
            200,
        )

    except Exception as e:
        log.exception(
            f"Error during manual search reindex for admin {current_user.id}: {e}"
        )
        add_audit_log(
            action="reindex_search_failed",
            admin_user=current_user.id,
            details={"error": str(e)},
        )
        return (
            jsonify({"error": f"Fejl under genopbygning af søgeindeks: {str(e)}"}),
            500,
        )


# --- Scheduled Tasks API ---
@admin_bp.route("/api/scheduled_tasks", methods=["GET"])
@login_required
@utils.admin_required
def admin_get_scheduled_tasks():
    """API: Henter en liste over planlagte opgaver fra APScheduler (Kræver admin)."""
    if scheduler is None or not hasattr(scheduler, "get_jobs"):
        log.error(
            "APScheduler (scheduler) is not available or not initialized correctly."
        )
        return (
            jsonify({"error": "Scheduler service er ikke tilgængelig.", "tasks": []}),
            503,
        )

    try:
        jobs = scheduler.get_jobs()
        scheduled_tasks = []
        for job in jobs:
            trigger_info = str(job.trigger)
            if hasattr(job.trigger, "interval"):
                trigger_info = f"Interval: {job.trigger.interval}"
            elif hasattr(job.trigger, "fields"):
                cron_fields = [str(f) for f in job.trigger.fields]
                trigger_info = f"Cron: {' '.join(cron_fields)}"

            task_info = {
                "id": job.id,
                "name": job.name,
                "func_ref": str(job.func_ref),
                "trigger": trigger_info,
                "next_run_time": (
                    job.next_run_time.isoformat() if job.next_run_time else None
                ),
                "pending": job.pending,
                "coalesce": job.coalesce,
                "max_instances": job.max_instances,
            }
            scheduled_tasks.append(task_info)

        log.info(
            f"Admin '{current_user.id}' requested scheduled tasks. Returning {len(scheduled_tasks)} tasks."
        )
        return jsonify({"tasks": scheduled_tasks}), 200
    except Exception as e:
        log.exception(
            f"Fejl i admin_get_scheduled_tasks for admin {current_user.id}: {e}"
        )
        return (
            jsonify(
                {
                    "error": "Intern serverfejl ved hentning af planlagte opgaver.",
                    "tasks": [],
                }
            ),
            500,
        )


# --- Cleanup Job API ---
@admin_bp.route("/api/run_cleanup_job", methods=["POST"])
@login_required
@utils.admin_required
def admin_run_cleanup_job():
    """API: Runs cleanup tasks (e.g., prune old invites, messages). Kræver admin."""
    log.info(f"Admin '{current_user.id}' initiated cleanup job.")
    results = {"invites_deactivated": 0, "messages_deleted": 0}
    now = datetime.now(timezone.utc)
    ninety_days_ago = now - timedelta(days=90)

    try:
        # 1. Deactivate expired/used Invite Codes (using DB model)
        invites_to_deactivate_stmt = db.select(InviteCode).where(
            InviteCode.is_active,
            (InviteCode.expires_at < now)
            | (InviteCode.uses_count >= InviteCode.max_uses),
        )
        invites_to_deactivate = db.session.scalars(invites_to_deactivate_stmt).all()

        if invites_to_deactivate:
            deactivated_ids = []
            for invite in invites_to_deactivate:
                invite.is_active = False
                deactivated_ids.append(invite.id)
            results["invites_deactivated"] = len(invites_to_deactivate)
            log.info(
                f"Cleanup job: Deactivating {len(invites_to_deactivate)} invite codes (IDs: {deactivated_ids})."
            )
        else:
            log.info("Cleanup job: No expired/used invite codes found to deactivate.")

        # 2. Delete old, soft-deleted Private Messages
        messages_to_delete_stmt = db.delete(PrivateMessage).where(
            PrivateMessage.sender_deleted,
            PrivateMessage.recipient_deleted,
            PrivateMessage.timestamp < ninety_days_ago,
        )
        delete_result = db.session.execute(messages_to_delete_stmt)
        results["messages_deleted"] = delete_result.rowcount  # type: ignore Pylance struggles with Result object type hints
        log.info(
            f"Cleanup job: Deleted {results['messages_deleted']} old soft-deleted private messages (older than {ninety_days_ago.date()})."
        )

        # Commit all changes
        db.session.commit()

        # Audit Log
        add_audit_log(
            action="run_cleanup_job", admin_user=current_user.id, details=results
        )

        return jsonify({"message": "Oprydningsjob fuldført.", "details": results}), 200

    except sqlalchemy_exc.SQLAlchemyError as e:
        db.session.rollback()
        log.exception(
            f"Database error during cleanup job for admin {current_user.id}: {e}"
        )
        add_audit_log(
            action="run_cleanup_job_failed",
            admin_user=current_user.id,
            details={"error": f"DB error: {str(e)}"},
        )
        return jsonify({"error": f"Databasefejl under oprydning: {str(e)}"}), 500
    except Exception as e:
        db.session.rollback()
        log.exception(
            f"Unexpected error during cleanup job for admin {current_user.id}: {e}"
        )
        add_audit_log(
            action="run_cleanup_job_failed",
            admin_user=current_user.id,
            details={"error": str(e)},
        )
        return jsonify({"error": f"Uventet systemfejl under oprydning: {str(e)}"}), 500


# --- Server Health Check API ---
@admin_bp.route("/check_server_health", methods=["GET"])
@login_required
@utils.admin_required
def check_server_health():
    """
    Checks the status of critical services (DB, Redis, API Key).
    Returns a JSON response with the status of each check.
    """
    current_app.logger.info(f"Admin '{current_user.id}' initiated server health check.")
    health_status = {
        "database": {"status": "error", "message": "Check failed"},
        "redis": {"status": "error", "message": "Check failed"},
        "sports_api_key": {"status": "error", "message": "Not configured"},
    }

    # 1. Check Database Connection
    try:
        db.session.execute(text("SELECT 1"))
        health_status["database"]["status"] = "ok"
        health_status["database"]["message"] = "Connected successfully."
        current_app.logger.debug("Health Check: Database connection OK.")
    except Exception as e:
        current_app.logger.error(
            f"Health Check: Database connection failed: {e}", exc_info=True
        )
        health_status["database"]["message"] = f"Connection failed: {str(e)[:100]}"

    # 2. Check Redis Connection
    if redis_client:
        try:
            redis_client.ping()
            health_status["redis"]["status"] = "ok"
            health_status["redis"]["message"] = "Connected successfully."
            current_app.logger.debug("Health Check: Redis connection OK.")
        except redis.ConnectionError as e:  # Use correct exception type
            current_app.logger.error(
                f"Health Check: Redis connection failed: {e}", exc_info=False
            )
            health_status["redis"]["message"] = f"Connection failed: {str(e)[:100]}"
        except Exception as e:  # Catch other potential redis errors or general errors
            current_app.logger.error(
                f"Health Check: Redis check failed unexpectedly: {e}", exc_info=True
            )
            health_status["redis"]["message"] = f"Unexpected error: {str(e)[:100]}"
    else:  # Moved else block outside try/except
        health_status["redis"]["status"] = "warning"
        health_status["redis"]["message"] = "Redis client not configured/initialized."
        current_app.logger.warning("Health Check: Redis client not available.")

    # 3. Check Sports API Key Presence
    api_key = current_app.config.get("SPORTS_API_KEY")
    if api_key and isinstance(api_key, str) and len(api_key) > 5:
        health_status["sports_api_key"]["status"] = "ok"
        health_status["sports_api_key"]["message"] = "API Key is configured."
        current_app.logger.debug("Health Check: Sports API Key OK.")
    else:
        health_status["sports_api_key"]["status"] = "warning"
        health_status["sports_api_key"]["message"] = "API Key is missing or too short."
        current_app.logger.warning(
            "Health Check: Sports API Key is missing or seems invalid."
        )

    # Determine overall status
    overall_status = "ok"
    if any(v["status"] == "error" for v in health_status.values()):
        overall_status = "error"
    elif any(v["status"] == "warning" for v in health_status.values()):
        overall_status = "warning"

    return jsonify({"overall_status": overall_status, "checks": health_status})


# --- Broadcast Message API ---
@admin_bp.route("/broadcast", methods=["POST"])
@login_required
@utils.admin_required
def admin_broadcast_message():
    """API: Sends a broadcast message to all connected SocketIO clients. Kræver admin."""
    data = request.get_json()
    if not data or not data.get("message"):
        return jsonify({"error": "Manglende JSON data ('message' er påkrævet)"}), 400

    message_text = str(data["message"]).strip()
    if not message_text:
        return jsonify({"error": "Besked må ikke være tom."}), 400

    try:
        log.info(
            f"Admin '{current_user.id}' is broadcasting message: '{message_text[:100]}...'"
        )
        # Emit to all connected clients.
        # The event name 'admin_broadcast' should be listened for on the client-side.
        socketio.emit("admin_broadcast", {"message": message_text, "sender": "Admin"})

        add_audit_log(
            action="broadcast_message",
            admin_user=current_user.id,
            details={"message_length": len(message_text)},
        )  # <<< CORRECTED CLOSING PARENTHESIS
        return jsonify({"message": "Broadcast besked sendt succesfuldt."}), 200
    except Exception as e:
        log.exception(f"Error broadcasting message by admin {current_user.id}: {e}")
        return jsonify({"error": f"Fejl under udsendelse af broadcast: {str(e)}"}), 500


# --- Failed Login Attempts API ---
@admin_bp.route("/api/failed_logins", methods=["GET"])
@login_required
@utils.admin_required
def admin_get_failed_logins():
    """API: Henter en liste over de seneste mislykkede login forsøg. Kræver admin."""
    try:
        limit_str = request.args.get("limit", "100")
        try:
            limit = int(limit_str)
            if limit <= 0 or limit > 500:  # Max limit to prevent abuse
                limit = 100
        except ValueError:
            limit = 100

        # Import FailedLoginAttempt model here to avoid potential circular imports at top level
        from ..models import FailedLoginAttempt

        attempts = (
            FailedLoginAttempt.query.order_by(FailedLoginAttempt.timestamp.desc())
            .limit(limit)
            .all()
        )

        attempts_data = [
            {
                "id": attempt.id,
                "timestamp": attempt.timestamp.isoformat(),
                "ip_address": attempt.ip_address,
                "username_attempt": attempt.username_attempt,
                "user_agent": attempt.user_agent,
            }
            for attempt in attempts
        ]

        log.info(
            f"Admin '{current_user.id}' requested failed login attempts (limit: {limit}). Returning {len(attempts_data)} entries."
        )
        return jsonify({"failed_logins": attempts_data}), 200
    except Exception as e:  # <<< Moved this except block here
        log.exception(
            f"Fejl i admin_get_failed_logins for admin {current_user.id}: {e}"
        )
        return (
            jsonify(
                {"error": "Intern serverfejl ved hentning af mislykkede login forsøg."}
            ),
            500,
        )


# --- Forum Moderation API ---
@admin_bp.route("/api/forum_posts", methods=["GET"])
@login_required
@utils.admin_required
def admin_get_forum_posts():
    """API: Henter en liste over de seneste forum posts til moderation. Kræver admin."""
    try:
        limit_str = request.args.get("limit", "100")
        try:
            limit = int(limit_str)
            if limit <= 0 or limit > 500:
                limit = 100
        except ValueError:
            limit = 100

        # Import models needed for the query
        from ..models import ForumPost, ForumThread

        posts = (
            db.session.query(
                ForumPost.id,
                ForumPost.author_username,
                ForumPost.created_at,
                ForumPost.body,
                ForumThread.title.label("thread_title"),
                ForumThread.id.label("thread_id"),
            )
            .join(ForumThread, ForumPost.thread_id == ForumThread.id)
            .order_by(ForumPost.created_at.desc())
            .limit(limit)
            .all()
        )

        posts_data = [
            {
                "id": post.id,
                "author": post.author_username,
                "created_at": post.created_at.isoformat(),
                "body_snippet": (
                    (post.body[:100] + "...") if len(post.body) > 100 else post.body
                ),
                "thread_title": post.thread_title,
                "thread_id": post.thread_id,
            }
            for post in posts
        ]

        log.info(
            f"Admin '{current_user.id}' requested latest forum posts (limit: {limit}). Returning {len(posts_data)} posts."
        )
        return jsonify({"posts": posts_data}), 200
    except Exception as e:
        log.exception(f"Fejl i admin_get_forum_posts for admin {current_user.id}: {e}")
        return jsonify({"error": "Intern serverfejl ved hentning af forum posts."}), 500


@admin_bp.route("/api/forum_posts/<int:post_id>", methods=["DELETE"])
@login_required
@utils.admin_required
def admin_delete_forum_post(post_id):
    """API: Deletes a specific forum post. Kræver admin."""
    log.info(f"Admin '{current_user.id}' attempting to delete forum post ID: {post_id}")
    try:
        # Import models needed
        from ..models import ForumPost

        post = ForumPost.query.get(post_id)
        if not post:
            log.warning(
                f"Admin '{current_user.id}' failed to delete post: ID {post_id} not found."
            )
            return jsonify({"error": "Forum post ikke fundet."}), 404

        # Optional: Check if it's the first post of a thread? Deleting might break things.
        # For now, allow deletion of any post. Consider adding checks later if needed.
        # thread = post.thread # Access the thread if needed

        db.session.delete(post)
        db.session.commit()
        log.info(
            f"Admin '{current_user.id}' successfully deleted forum post ID: {post_id}"
        )

        # Audit Log
        add_audit_log(
            action="delete_forum_post",
            admin_user=current_user.id,
            target_resource=f"PostID:{post_id}",
            details={"author": post.author_username, "thread_id": post.thread_id},
        )

        return jsonify({"message": f"Forum post #{post_id} blev slettet."}), 200

    except Exception as e:
        db.session.rollback()
        log.exception(
            f"Error deleting forum post ID {post_id} for admin {current_user.id}: {e}"
        )
        return jsonify({"error": "Intern serverfejl ved sletning af forum post."}), 500


# --- Password Reset Request API ---
@admin_bp.route("/api/password_reset_requests", methods=["GET"])
@login_required
@utils.admin_required
def admin_get_password_reset_requests():
    """API: Henter en liste over afventende password nulstillingsanmodninger. Kræver admin."""
    try:
        # Import models needed
        from sqlalchemy import select  # Import select

        from ..models import PasswordResetRequest
        from ..models import User as DBUser

        # Refactored query using db.select()
        # Pylance errors on select() arguments are likely type hint issues with SQLAlchemy
        stmt = (
            select(  # type: ignore[call-overload] Pylance struggles with select() overloads
                PasswordResetRequest.id,
                PasswordResetRequest.user_id,  # type: ignore[arg-type] Pylance struggles with Mapped types
                PasswordResetRequest.requested_at,
                PasswordResetRequest.expires_at,  # type: ignore[arg-type] Pylance struggles with Mapped types
                DBUser.username,
            )
            .join(DBUser, PasswordResetRequest.user_id == DBUser.id)
            .where(PasswordResetRequest.status == "pending")
            .where(PasswordResetRequest.expires_at > datetime.now(timezone.utc))
            .order_by(PasswordResetRequest.requested_at.asc())
        )

        pending_requests = db.session.execute(
            stmt
        ).all()  # Execute the select statement

        requests_data = [
            {
                "request_id": req.id,  # Access attributes directly from Row object
                "user_id": req.user_id,
                "username": req.username,
                "requested_at": req.requested_at.isoformat(),
                "expires_at": req.expires_at.isoformat(),
            }
            for req in pending_requests
        ]

        log.info(
            f"Admin '{current_user.id}' requested pending password resets. Returning {len(requests_data)} requests."
        )
        return jsonify({"requests": requests_data}), 200

    except Exception as e:
        log.exception(
            f"Fejl i admin_get_password_reset_requests for admin {current_user.id}: {e}"
        )
        return (
            jsonify(
                {
                    "error": "Intern serverfejl ved hentning af password nulstillingsanmodninger."
                }
            ),
            500,
        )


@admin_bp.route(
    "/api/password_reset_requests/<int:request_id>/generate_link", methods=["POST"]
)
@login_required
@utils.admin_required
def admin_generate_password_reset_link(request_id):
    """
    API: Genererer et nyt token og reset link for en specifik password nulstillingsanmodning.
    Kræver admin.
    """
    log.info(
        f"Admin '{current_user.id}' attempting to generate reset link for request ID: {request_id}"
    )
    try:
        # Import models needed
        from ..models import PasswordResetRequest
        from ..models import User as DBUser

        reset_request = db.session.get(
            PasswordResetRequest, request_id
        )  # Use db.session.get for PK lookup

        if not reset_request:
            log.warning(
                f"Admin '{current_user.id}' failed: PasswordResetRequest ID {request_id} not found."
            )
            return (
                jsonify({"error": "Password nulstillingsanmodning ikke fundet."}),
                404,
            )

        if reset_request.status == "used":
            log.warning(
                f"Admin '{current_user.id}' attempted to generate link for already used request ID {request_id}."
            )
            return (
                jsonify({"error": "Denne anmodning er allerede blevet brugt."}),
                409,
            )  # Conflict

        user = db.session.get(DBUser, reset_request.user_id)
        if not user:
            log.error(
                f"CRITICAL: User ID {reset_request.user_id} associated with PasswordResetRequest ID {request_id} not found in DB."
            )
            reset_request.status = "error_user_not_found"  # Mark as problematic
            db.session.commit()
            return (
                jsonify(
                    {
                        "error": "Tilknyttet bruger ikke fundet. Anmodningen kan ikke behandles."
                    }
                ),
                500,
            )

        # Generate a new secure token
        new_token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)

        # Get expiry from request or use default
        data = request.get_json() if request.is_json else {}
        expires_in_hours_input = data.get("expires_in_hours")

        default_expiry_hours = current_app.config.get(
            "PASSWORD_RESET_TOKEN_EXPIRES_HOURS", 1
        )
        expires_in_hours = default_expiry_hours

        if expires_in_hours_input is not None:
            try:
                candidate_hours = int(expires_in_hours_input)
                if (
                    candidate_hours > 0 and candidate_hours <= 72
                ):  # Max 3 days for example
                    expires_in_hours = candidate_hours
                else:
                    log.warning(
                        f"Admin '{current_user.id}' provided invalid expires_in_hours '{expires_in_hours_input}' for request {request_id}. Using default {default_expiry_hours}h."
                    )
            except ValueError:
                log.warning(
                    f"Admin '{current_user.id}' provided non-integer expires_in_hours '{expires_in_hours_input}' for request {request_id}. Using default {default_expiry_hours}h."
                )

        # Update the request
        reset_request.token = new_token
        reset_request.expires_at = now + timedelta(hours=expires_in_hours)
        reset_request.status = "pending"  # Ensure it's pending
        reset_request.handled_by_admin_id = current_user.id
        reset_request.handled_at = now

        db.session.commit()
        log.info(
            f"Admin '{current_user.id}' generated new reset token for request ID {request_id} (User: {user.username}). Token: {new_token[:8]}..."
        )

        # Construct the full reset URL
        # This will point to a route we need to create in auth.py, e.g., 'auth.reset_with_token'
        reset_url = url_for("auth.reset_with_token", token=new_token, _external=True)

        # Audit Log
        add_audit_log(
            action="generate_password_reset_link",
            admin_user=current_user.id,
            target_resource=f"ResetRequestID:{request_id}",
            details={
                "user_id": user.id,
                "username": user.username,
                "token_generated_at": now.isoformat(),
            },
        )

        return (
            jsonify(
                {
                    "message": f"Nyt password reset link genereret for bruger '{user.username}'.",
                    "reset_link": reset_url,
                    "token": new_token,  # Optionally return token if frontend wants to display part of it
                }
            ),
            200,
        )

    except sqlalchemy_exc.SQLAlchemyError as db_err:
        db.session.rollback()
        log.exception(
            f"Database error generating reset link for request ID {request_id} by admin {current_user.id}: {db_err}"
        )
        return jsonify({"error": "Databasefejl under generering af link."}), 500
    except Exception as e:
        db.session.rollback()
        log.exception(
            f"Error generating reset link for request ID {request_id} by admin {current_user.id}: {e}"
        )
        return jsonify({"error": "Intern serverfejl ved generering af link."}), 500


@admin_bp.route("/api/password_reset_requests/<int:request_id>", methods=["DELETE"])
@login_required
@utils.admin_required
def admin_reject_password_reset_request(request_id):
    """
    API: Rejects (deletes) a specific password reset request.
    Kræver admin.
    """
    log.info(
        f"Admin '{current_user.id}' attempting to reject password reset request ID: {request_id}"
    )
    try:
        from ..models import PasswordResetRequest  # Import model

        reset_request = db.session.get(PasswordResetRequest, request_id)

        if not reset_request:
            log.warning(
                f"Admin '{current_user.id}' failed: PasswordResetRequest ID {request_id} not found for rejection."
            )
            return (
                jsonify({"error": "Password nulstillingsanmodning ikke fundet."}),
                404,
            )

        # Store details for audit log before deleting
        user_id_for_log = reset_request.user_id
        username_for_log = "Ukendt"  # Default if user somehow not found

        # Attempt to get username for logging, but don't fail if user is gone
        from ..models import User as DBUser

        user = db.session.get(DBUser, reset_request.user_id)
        if user:
            username_for_log = user.username

        db.session.delete(reset_request)
        db.session.commit()
        log.info(
            f"Admin '{current_user.id}' successfully rejected password reset request ID: {request_id} for user_id: {user_id_for_log}"
        )

        add_audit_log(
            action="reject_password_reset_request",
            admin_user=current_user.id,
            target_resource=f"ResetRequestID:{request_id}",
            details={
                "user_id": user_id_for_log,
                "username": username_for_log,
                "rejected_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        return (
            jsonify(
                {
                    "message": f"Password nulstillingsanmodning #{request_id} blev afvist/slettet."
                }
            ),
            200,
        )

    except sqlalchemy_exc.SQLAlchemyError as db_err:
        db.session.rollback()
        log.exception(
            f"Database error rejecting reset request ID {request_id} by admin {current_user.id}: {db_err}"
        )
        return jsonify({"error": "Databasefejl under afvisning af anmodning."}), 500
    except Exception as e:
        db.session.rollback()
        log.exception(
            f"Error rejecting reset request ID {request_id} by admin {current_user.id}: {e}"
        )
        return jsonify({"error": "Intern serverfejl ved afvisning af anmodning."}), 500


# Removed duplicated return and except block from here

# === EOF: app/routes/admin.py ===

# @admin_bp.route("/users/<string:username>", methods=["PUT"]) # Bemærk: Den er nu implementeret ovenfor
# def admin_edit_user(username): ...

# @admin_bp.route("/invites", methods=["GET"])
# @login_required
# def admin_get_invites(): ...

# @admin_bp.route("/invites/<code>", methods=["DELETE"])
# @login_required
# def admin_delete_invite(code): ...

# --- POTENTIELLE FREMTIDIGE ADMIN FUNKTIONER (Eksempler) ---

# @admin_bp.route("/users/<string:username>", methods=["PUT"])
# @login_required
# def admin_edit_user(username):
#     """ API: Rediger brugeroplysninger (Kræver admin). """
#     if not getattr(current_user, 'is_admin', False): return jsonify({"error": "Admin påkrævet"}), 403
#     # Implementer logik til at modtage JSON data, validere, opdatere players.json og gemme.
#     # Vær MEGET forsigtig med hvilke felter der kan redigeres.
#     pass # Implementer senere

# @admin_bp.route("/invites", methods=["GET"])
# @login_required
# def admin_get_invites():
#      """ API: Hent liste over invite koder (Kræver admin). """
#      if not getattr(current_user, 'is_admin', False): return jsonify({"error": "Admin påkrævet"}), 403
#      # Implementer logik til at loade invite_codes.json (opdateret format),
#      # og returnere listen af invite objekter.
#      pass # Implementer senere

# @admin_bp.route("/invites/<code>", methods=["DELETE"])
# @login_required
# def admin_delete_invite(code):
#     """ API: Slet en specifik invite kode (Kræver admin). """
#     if not getattr(current_user, 'is_admin', False): return jsonify({"error": "Admin påkrævet"}), 403
#     # Implementer logik til at finde og fjerne invite objektet fra listen
#     # i invite_codes.json (opdateret format) og gemme.
#     pass # Implementer senere
