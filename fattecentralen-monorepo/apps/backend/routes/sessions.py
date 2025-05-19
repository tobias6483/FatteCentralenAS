# app/routes/sessions.py

# === Standard Bibliotek Imports ===
import logging
import uuid
import json # Added for Redis data
from datetime import datetime, timezone, timedelta # Added timezone
import secrets # For generating secure random codes
import string # For character set for codes

# === Tredjeparts Bibliotek Imports ===
import redis # Added for direct Redis client usage
from flask import (Blueprint, request, jsonify, session, redirect,
                   render_template, url_for, flash)
from flask_login import login_required, current_user
from sqlalchemy import desc # Ensure desc is imported

# === Lokale Applikationsimports ===
from ..config import Config
from ..extensions import socketio, csrf, redis_client, db # <-- Added redis_client and db
from ..models import GameSession, SportEvent, User, SportOutcome, BetHistory # <-- Added models
from ..utils import get_common_context, award_badge # <-- Import award_badge

# Logger & Blueprint
logger = logging.getLogger(__name__) # Renere navn
sessions_bp = Blueprint("sessions", __name__) # url_prefix sættes i __init__.py

# --- Redis Key Prefixes ---
SESSION_KEY_PREFIX = "session:"
SESSION_PLAYERS_KEY_PREFIX = "session_players:"
SESSION_PLAYER_DETAILS_KEY_PREFIX = "session_player_details:"
USER_SESSIONS_KEY_PREFIX = "user_sessions:" # Optional: For faster active session lookup

# Default session expiry time (e.g., 24 hours)
DEFAULT_SESSION_TTL = timedelta(hours=24)

# --- Helper to decode Redis results ---
def decode_redis(val):
    """Decodes bytes from Redis, returning original value if not bytes."""
    return val.decode('utf-8') if isinstance(val, bytes) else val

# --- Routes ---

@sessions_bp.route("/create_session", methods=["POST"])
@login_required
def create_session(): # Route is synchronous
    """Creates a new session."""
    creator = current_user.id
    logger.info(f"Create session attempt by user: {creator}")

    try:
        data = request.get_json()
        if not data: return jsonify({"error": "Invalid JSON request"}), 400

        game_mode = data.get("game_mode", "yesno")
        session_id = str(uuid.uuid4())
        admin_code = str(uuid.uuid4())[:6]
        alphabet = string.ascii_uppercase + string.digits
        invite_code = ''.join(secrets.choice(alphabet) for i in range(8))
        invite_code_key = f"invite_code:{invite_code}"

        created_at_dt = datetime.now(timezone.utc)
        created_at_iso = created_at_dt.isoformat()

        # --- Session Settings ---
        is_private = data.get("is_private", False)
        session_password = data.get("session_password") if is_private else None
        try:
            max_players = int(data.get("max_players", 0))
        except (ValueError, TypeError):
            max_players = 0

        outcomes = []
        session_name = ""
        linked_event_id = None

        # --- Game Mode Specific Logic (DB queries remain sync) ---
        if game_mode == "live_sport":
            event_id = data.get("event_id")
            if not event_id:
                return jsonify({"error": "Event ID mangler for live_sport session"}), 400
            event_db = SportEvent.query.get(event_id) # DB query is sync
            if not event_db:
                return jsonify({"error": f"Sportsbegivenhed med ID '{event_id}' ikke fundet."}), 404

            linked_event_id = event_id
            session_name = data.get("session_name") or f"{event_db.home_team} vs {event_db.away_team}"
            h2h_outcomes_db = [o for o in event_db.outcomes if o.market_key == 'h2h']
            if not h2h_outcomes_db:
                 return jsonify({"error": f"Ingen H2H odds fundet for event '{event_id}' i databasen."}), 400

            bookmaker_key_used = h2h_outcomes_db[0].bookmaker
            for outcome_db in h2h_outcomes_db:
                 if outcome_db.bookmaker == bookmaker_key_used:
                     outcomes.append({
                         "name": outcome_db.name, "odds": outcome_db.price, "pot": 0.0,
                         "outcome_id": outcome_db.id
                     })
            if len(outcomes) < 2:
                 logger.warning(f"Found event {event_id} but insufficient H2H outcomes from bookmaker {bookmaker_key_used}.")
                 return jsonify({"error": f"Utilstrækkelige H2H odds fundet for event '{event_id}'."}), 400

        elif game_mode in ["yesno", "fictional_sport"]:
            outcomes_in = data.get("outcomes", [])
            session_name_in = data.get("session_name", "").strip()
            for o in outcomes_in:
                 name = o.get("name")
                 odds_str = o.get("odds")
                 if not name or odds_str is None: return jsonify({"error": "Ugyldigt outcome-format (mangler navn eller odds)"}), 400
                 try: odds_val = float(odds_str)
                 except (ValueError, TypeError): return jsonify({"error": "Ugyldigt odds-format (skal være tal)"}), 400
                 if odds_val < 1.01: return jsonify({"error": f"Odds for '{name}' skal være mindst 1.01"}), 400
                 outcomes.append({"name": name, "odds": odds_val, "pot": 0.0 })
            if not outcomes: return jsonify({"error": "Der skal være mindst ét udfald"}), 400
            session_name = session_name_in or f"Session {session_id[:6]}"

        elif game_mode == "live_sport_coupon":
            selections_in = data.get("selections", [])
            session_name_in = data.get("session_name", "").strip()
            if not selections_in or not isinstance(selections_in, list) or len(selections_in) == 0:
                return jsonify({"error": "Kuponen skal indeholde mindst ét valg."}), 400

            logger.info(f"Processing live_sport_coupon with {len(selections_in)} selections.")
            processed_selections_for_redis = []
            for sel_idx, sel in enumerate(selections_in):
                event_id = sel.get("eventId")
                outcome_name = sel.get("outcomeName")
                odds_val = sel.get("odds")
                match_name = sel.get("matchName", "Ukendt kamp")
                if not all([event_id, outcome_name, odds_val]):
                    logger.warning(f"Invalid selection at index {sel_idx} in coupon: {sel}")
                    return jsonify({"error": f"Ugyldigt valg #{sel_idx + 1} i kuponen (manglende data)."}), 400
                try:
                    odds_float = float(odds_val)
                    if odds_float < 1.01: return jsonify({"error": f"Odds for '{outcome_name}' i valg #{sel_idx + 1} skal være mindst 1.01"}), 400
                except (ValueError, TypeError):
                    logger.warning(f"Invalid odds format for selection {sel_idx} in coupon: {sel}")
                    return jsonify({"error": f"Ugyldigt odds-format for valg #{sel_idx + 1}."}), 400
                # TODO: Re-verify odds against DB here in production
                processed_selections_for_redis.append({
                    "eventId": event_id, "matchName": match_name, "outcomeName": outcome_name,
                    "odds": odds_float, "status": "pending"
                })
            outcomes = processed_selections_for_redis
            session_name = session_name_in or f"Kupon Session ({len(outcomes)} valg)"
            linked_event_id = None

        else:
            return jsonify({"error": f"Ukendt game_mode: {game_mode}"}), 400

        # --- Store in Redis ---
        session_key = f"{SESSION_KEY_PREFIX}{session_id}"
        session_players_key = f"{SESSION_PLAYERS_KEY_PREFIX}{session_id}"
        user_sessions_key = f"{USER_SESSIONS_KEY_PREFIX}{creator}"

        session_data = {
            "session_id": session_id, "creator": creator, "admin_code": admin_code,
            "game_mode": game_mode, "session_name": session_name,
            "outcomes": json.dumps(outcomes), "bets": json.dumps([]),
            "created_at": created_at_iso, "status": "open",
            "invite_code": invite_code, "is_private": json.dumps(is_private),
            "session_password": session_password if session_password else "",
            "max_players": str(max_players)
        }
        if game_mode == "live_sport_coupon":
            session_data["is_coupon"] = json.dumps(True)

        try:
            # Use a pipeline for atomicity (sync client)
            pipe = redis_client.pipeline()
            pipe.hset(session_key, mapping=session_data)
            pipe.sadd(session_players_key, str(creator))
            pipe.sadd(user_sessions_key, session_id)
            pipe.set(invite_code_key, session_id)

            ttl_seconds = int(DEFAULT_SESSION_TTL.total_seconds())
            pipe.expire(session_key, ttl_seconds)
            pipe.expire(session_players_key, ttl_seconds)
            pipe.expire(user_sessions_key, ttl_seconds)
            pipe.expire(invite_code_key, ttl_seconds)

            pipe.execute() # Sync execution

            # --- Create GameSession record in SQL Database (Sync operation) ---
            try:
                new_db_session = GameSession(
                    id=session_id, name=session_name, creator_id=creator,
                    game_mode=game_mode, status="open", created_at=created_at_dt,
                    event_id=linked_event_id,
                    coupon_details=(outcomes if game_mode == "live_sport_coupon" else None)
                )
                db.session.add(new_db_session)
                db.session.commit()
                logger.info(f"Session '{session_id}' ('{session_name}') also created in SQL DB by user ID '{creator}'. Linked Event ID: {linked_event_id}")
            except Exception as db_err:
                 db.session.rollback()
                 logger.exception(f"DB error creating GameSession record for {session_id}: {db_err}. Redis data might persist.")
                 return jsonify({"error": "Databasefejl ved oprettelse af session (SQL)."}), 500

            # --- Award Badges (Sync DB operations) ---
            if game_mode == "live_sport_coupon":
                try:
                    coupon_session_count = GameSession.query.filter_by(creator_id=creator, game_mode='live_sport_coupon').count()
                    if coupon_session_count == 1: award_badge(creator, 'Kupon Bygger')
                except Exception as badge_err: logger.error(f"Error checking/awarding 'coupon_creator' badge for user {creator}: {badge_err}")
            try:
                total_sessions_created = GameSession.query.filter_by(creator_id=creator).count()
                if total_sessions_created == 5: award_badge(creator, 'Spilmester')
            except Exception as badge_err: logger.error(f"Error checking/awarding 'session_starter_5' badge for user {creator}: {badge_err}")
            # --- End Badge Checks ---

            logger.info(f"Session '{session_id}' ('{session_name}') created in Redis by '{creator}'. Added to {user_sessions_key}. TTL: {ttl_seconds}s")

        except redis.RedisError as e:
            logger.exception(f"Redis error creating session {session_id} for {creator}: {e}")
            return jsonify({"error": "Databasefejl ved oprettelse af session (Redis)."}), 500
        except Exception as e:
            logger.exception(f"Unexpected error creating session {session_id} for {creator}: {e}")
            return jsonify({"error": "Intern serverfejl ved oprettelse af session"}), 500

        return jsonify({
            "session_id": session_id, "session_name": session_name, "admin_code": admin_code,
            "invite_code": invite_code, "game_mode": game_mode, "outcomes": outcomes,
            "success": True
        }), 201

    except Exception as e:
        logger.exception(f"Error in create_session by {current_user.id if current_user.is_authenticated else 'anonymous'}: {e}")
        return jsonify({"error": "Intern serverfejl ved oprettelse af session"}), 500


@sessions_bp.route("/join_session", methods=["POST"])
@login_required
def join_session_route(): # Route is synchronous
    """Adds the current user to an existing session."""
    player_id = current_user.id # Use integer ID
    player_id_str = str(player_id) # Use string for Redis keys/members
    logger.info(f"Join session attempt by user: {player_id}")

    data = None
    try:
        data = request.get_json() or {}
        if not data: return jsonify({"error": "Invalid JSON request"}), 400
        session_id = data.get("session_id", "").strip()
        if not session_id: return jsonify({"error": "Session ID mangler"}), 400

        player_balance = current_user.balance
        player_avatar = current_user.avatar_url

        session_key = f"{SESSION_KEY_PREFIX}{session_id}"
        session_players_key = f"{SESSION_PLAYERS_KEY_PREFIX}{session_id}"
        user_sessions_key = f"{USER_SESSIONS_KEY_PREFIX}{player_id_str}"

        try:
            # Check if session exists and get relevant details (sync client)
            session_details_bytes = redis_client.hmget( # type: ignore[misc]
                session_key,
                ["status", "is_private", "session_password", "max_players"] # Use list
            )
            if not session_details_bytes or session_details_bytes[0] is None: # type: ignore[misc]
                return jsonify({"error": "Session ikke fundet"}), 404

            # Values are already strings (or None) due to decode_responses=True on redis_client
            session_status = session_details_bytes[0] # type: ignore[misc]
            is_private_str = session_details_bytes[1] # type: ignore[misc]
            stored_password = session_details_bytes[2] # type: ignore[misc]
            max_players_str = session_details_bytes[3] # type: ignore[misc]

            if session_status != "open":
                 return jsonify({"error": "Sessionen er lukket for nye deltagere."}), 403

            # --- Check Max Players ---
            try: max_players = int(max_players_str) if max_players_str else 0
            except ValueError: max_players = 0

            if max_players > 0:
                current_player_count = redis_client.scard(session_players_key) # Sync call
                # Ensure comparison is valid (scard returns int)
                if isinstance(current_player_count, int) and current_player_count >= max_players:
                    logger.warning(f"Join denied for {player_id} to session {session_id}: Max players ({max_players}) reached.")
                    return jsonify({"error": f"Sessionen er fuld (max {max_players} spillere)."}), 403
                elif not isinstance(current_player_count, int):
                     logger.error(f"Redis scard returned non-integer for {session_players_key}: {current_player_count}")

            # --- Check Privacy/Password ---
            try: is_private = json.loads(is_private_str) if is_private_str else False
            except json.JSONDecodeError: is_private = False

            if is_private:
                provided_password = data.get("session_password")
                if not provided_password:
                    logger.warning(f"Join denied for {player_id} to private session {session_id}: No password provided.")
                    return jsonify({"error": "Kodeord mangler for at deltage i denne private session."}), 401
                if not stored_password or provided_password != stored_password:
                    logger.warning(f"Join denied for {player_id} to private session {session_id}: Incorrect password provided.")
                    return jsonify({"error": "Forkert kodeord angivet."}), 401
                logger.info(f"Password verified for user {player_id} joining private session {session_id}.")

            # Check if player is already in the set
            is_member = redis_client.sismember(session_players_key, player_id_str) # Sync call
            if is_member:
                logger.info(f"User '{player_id}' already in session '{session_id}'.")
                return jsonify({"message": "Allerede tilsluttet sessionen"}), 200

            # Add player to session set AND user's session list
            pipe = redis_client.pipeline()
            pipe.sadd(session_players_key, player_id_str)
            pipe.sadd(user_sessions_key, session_id) # type: ignore[misc]
            ttl_seconds = int(DEFAULT_SESSION_TTL.total_seconds())
            pipe.expire(user_sessions_key, ttl_seconds)
            pipe.execute() # Sync execution

            logger.info(f"User '{player_id}' successfully joined session '{session_id}' in Redis. Added to {user_sessions_key}.")

            # --- Award 'active_participant' badge ---
            try:
                session_count_for_user = redis_client.scard(user_sessions_key) # Sync call
                if isinstance(session_count_for_user, int) and session_count_for_user == 5:
                     award_badge(player_id, 'Aktiv Deltager')
            except Exception as badge_err: logger.error(f"Error checking/awarding 'active_participant' badge for user {player_id}: {badge_err}")
            # --- End badge check ---

        except redis.RedisError as e:
            logger.exception(f"Redis error joining session {session_id} for {player_id}: {e}")
            return jsonify({"error": "Databasefejl ved tilslutning til session"}), 500
        except Exception as e:
            logger.exception(f"Unexpected error joining session {session_id} for {player_id}: {e}")
            return jsonify({"error": "Intern serverfejl ved tilslutning til session"}), 500

        # Emit via socketio? (Consider if needed)
        return jsonify({"message": "Tilsluttet sessionen", "balance": player_balance})

    except Exception as e:
        session_id_err = data.get('session_id', 'N/A') if isinstance(data, dict) else 'N/A'
        user_id_err = current_user.id if current_user.is_authenticated else 'anonymous'
        logger.exception(f"Fejl i join_session_route for user {user_id_err}, session {session_id_err}: {e}")
        return jsonify({"error": "Intern serverfejl ved tilslutning til session"}), 500


@sessions_bp.route("/active_sessions", methods=["GET", "POST"])
@login_required
def active_sessions_route(): # Reverted to synchronous def
    """
    GET: Shows HTML page with active sessions (where the user is a participant).
    POST: Returns JSON list of active sessions (where the user is a participant).
    """
    current_user_id = current_user.id
    current_user_id_str = str(current_user_id)
    logger.info(f"Active sessions requested by user {current_user_id} (Method: {request.method})")

    try:
        active_list = []
        user_sessions_key = f"{USER_SESSIONS_KEY_PREFIX}{current_user_id_str}"

        # --- Fetch session IDs from the user's specific set ---
        # redis_client.smembers returns Set[str] because decode_responses=True
        session_ids: set[str] = redis_client.smembers(user_sessions_key) # type: ignore[assignment]
        logger.debug(f"Found {len(session_ids)} session IDs in set {user_sessions_key} for user {current_user_id}")

        if session_ids: # Now session_ids is correctly typed as Set[str]
            pipe = redis_client.pipeline()
            # Iteration over session_ids (Set[str]) is fine
            session_keys = [f"{SESSION_KEY_PREFIX}{sid}" for sid in session_ids]
            player_keys = [f"{SESSION_PLAYERS_KEY_PREFIX}{sid}" for sid in session_ids]

            for i, session_key in enumerate(session_keys):
                pipe.hmget(session_key, ["session_id", "session_name", "creator", "game_mode", "created_at", "status"])
                pipe.scard(player_keys[i])

            results = pipe.execute() # Synchronous call

            chunk_size = 2
            session_ids_list = list(session_ids) # list(Set[str]) is fine
            for i in range(0, len(results), chunk_size):
                session_details_values = results[i] # Expected List[Optional[str]]
                player_count = results[i+1]         # Expected int

                # Values from hmget are already strings (or None) due to decode_responses=True
                if session_details_values and isinstance(session_details_values, list) and len(session_details_values) >= 6 and session_details_values[0] is not None:
                    sdata = {
                        "session_id": session_details_values[0],
                        "session_name": session_details_values[1] or session_details_values[0],
                        "creator": session_details_values[2],
                        "game_mode": session_details_values[3],
                        "created_at": session_details_values[4],
                        "status": session_details_values[5] or "unknown",
                        "players_count": player_count if isinstance(player_count, int) else 0
                    }
                    active_list.append(sdata)
                else:
                    expired_session_id_index = i // chunk_size
                    if expired_session_id_index < len(session_ids_list):
                         expired_session_id = session_ids_list[expired_session_id_index]
                         logger.warning(f"Session details for {expired_session_id} (from user set {user_sessions_key}) not found or incomplete in Redis, likely expired. Details: {session_details_values}")
                         # redis_client.srem(user_sessions_key, expired_session_id) # Optional: remove expired link

        active_list.sort(key=lambda x: x.get('created_at', '0') or '0', reverse=True)

        if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html or request.method == "POST":
            return jsonify({"active_sessions": active_list})
        else:
            context = get_common_context()
            context["active_page"] = "active_sessions"
            context["sessions_list"] = active_list
            return render_template("active_sessions.html", **context)

    except Exception as e:
        logger.exception(f"Fejl i active_sessions_route for user {current_user_id}: {e}")
        if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html or request.method == "POST":
            return jsonify({"error": "Intern serverfejl"}), 500
        else:
            return render_template("errors/500.html"), 500


@sessions_bp.route("/details/<session_id>")
@login_required
def session_detail_page(session_id): # Route is synchronous
    """ Shows the detail page for a specific session. """
    logger.info(f"Session details requested for {session_id} by user {current_user.id}")

    try:
        session_key = f"{SESSION_KEY_PREFIX}{session_id}"
        session_players_key = f"{SESSION_PLAYERS_KEY_PREFIX}{session_id}"

        # Fetch session data and player list from Redis (sync client)
        pipe = redis_client.pipeline()
        pipe.hgetall(session_key)
        pipe.smembers(session_players_key)
        results = pipe.execute() # Sync execution

        session_data_raw = results[0] # Dict of bytes:bytes
        player_ids_bytes = results[1] # Set of bytes

        if not session_data_raw:
            flash(f"Session med ID '{session_id}' blev ikke fundet.", "warning")
            return redirect(url_for('.active_sessions_route'))

        # Decode player IDs
        player_ids_decoded = {pid for pid in player_ids_bytes} # Removed .decode('utf-8') as Redis client decodes responses

        # Check if the current user is in the player set
        if str(current_user.id) not in player_ids_decoded:
             flash(f"Du er ikke deltager i session '{session_id}'.", "warning")
             return redirect(url_for('.active_sessions_route'))

        # Process session data
        session_data_processed = {}
        is_coupon = False

        for k_bytes, v_bytes in session_data_raw.items():
            k = decode_redis(k_bytes)
            v = decode_redis(v_bytes)
            if k in ["is_coupon", "is_private"]:
                try: session_data_processed[k] = json.loads(v) if v else False
                except json.JSONDecodeError: session_data_processed[k] = False
            elif k in ["outcomes", "bets"]:
                try: session_data_processed[k] = json.loads(v) if v else []
                except json.JSONDecodeError: session_data_processed[k] = []
            else:
                 session_data_processed[k] = v

        is_coupon = session_data_processed.get("is_coupon", False)
        if 'game_mode' not in session_data_processed: session_data_processed['game_mode'] = 'unknown'
        if 'status' not in session_data_processed: session_data_processed['status'] = 'unknown'
        if 'outcomes' not in session_data_processed: session_data_processed['outcomes'] = []
        if 'bets' not in session_data_processed: session_data_processed['bets'] = []


        # Fetch player details (Sync DB operation)
        players_details = {}
        if player_ids_decoded:
            try:
                player_int_ids = [int(pid) for pid in player_ids_decoded]
                player_users = User.query.filter(User.id.in_(player_int_ids)).all()
                for user in player_users:
                    players_details[str(user.id)] = {
                        "username": user.username, "avatar_url": user.avatar_url, "balance": user.balance
                    }
            except ValueError:
                 logger.error(f"Could not convert player IDs to integers for session {session_id}. IDs: {player_ids_decoded}")
                 players_details = {pid: {"username": f"User {pid}"} for pid in player_ids_decoded}
            except Exception as db_err:
                 logger.exception(f"Error fetching player details from DB for session {session_id}: {db_err}")
                 players_details = {pid: {"username": f"User {pid}"} for pid in player_ids_decoded}


        context = get_common_context()
        context["active_page"] = "session_detail"

        # Hide admin_code if not creator
        try: creator_id_int = int(session_data_processed.get("creator", -1))
        except (ValueError, TypeError): creator_id_int = -1
        is_creator = (current_user.id == creator_id_int)

        if not is_creator:
            session_data_processed['admin_code'] = '*** SKJULT ***'

        context['session_data'] = session_data_processed
        context['session_id'] = session_id
        context['is_creator'] = is_creator
        context['is_coupon'] = is_coupon
        context['players_details'] = players_details

        return render_template("session_detail.html", **context)

    except Exception as e:
        logger.exception(f"Fejl i session_detail_page for session {session_id} by user {current_user.id}: {e}")
        return render_template("errors/500.html"), 500


@sessions_bp.route("/join/invite/<code>", methods=["GET"])
@login_required
def join_session_via_invite_code(code): # Route is synchronous
    """Handles joining a session via an invite code."""
    user_id = current_user.id # Integer ID
    user_id_str = str(user_id) # String for Redis
    logger.info(f"User '{user_id_str}' attempting to join session via invite code: {code}")

    invite_code_key = f"invite_code:{code}"
    session_id_bytes = redis_client.get(invite_code_key) # Sync call

    if not session_id_bytes:
        flash("Ugyldig eller udløbet invite kode.", "warning")
        return redirect(url_for('main.index'))

    session_id = session_id_bytes # Already a string or None
    session_key = f"{SESSION_KEY_PREFIX}{session_id}"
    session_players_key = f"{SESSION_PLAYERS_KEY_PREFIX}{session_id}"
    user_sessions_key = f"{USER_SESSIONS_KEY_PREFIX}{user_id_str}"

    try:
        # Check session status directly from Redis
        session_status_bytes = redis_client.hget(session_key, "status") # Sync call
        session_status = session_status_bytes if session_status_bytes else None

        if not session_status or session_status != "open":
            flash("Denne session er ikke længere åben for deltagelse.", "warning")
            return redirect(url_for('.active_sessions_route'))

        # Check if user is already in the session
        is_member = redis_client.sismember(session_players_key, user_id_str) # Sync call
        if is_member:
            flash("Du er allerede deltager i denne session.", "info")
        else:
            # --- Check Max Players before adding ---
            max_players_bytes = redis_client.hget(session_key, "max_players") # Sync call
            max_players_str = max_players_bytes # type: ignore[assignment]
            try: max_players = int(max_players_str) if max_players_str else 0 # type: ignore[arg-type]
            except ValueError: max_players = 0

            if max_players > 0:
                current_player_count = redis_client.scard(session_players_key) # Sync call
                # Ensure comparison is valid
                if isinstance(current_player_count, int) and current_player_count >= max_players:
                    logger.warning(f"Join via invite denied for {user_id_str} to session {session_id}: Max players ({max_players}) reached.")
                    flash(f"Sessionen er fuld (max {max_players} spillere).", "warning")
                    return redirect(url_for('sessions.active_sessions_route'))

            # --- If not full, add user ---
            pipe = redis_client.pipeline()
            pipe.sadd(session_players_key, user_id_str)
            pipe.sadd(user_sessions_key, session_id) # type: ignore[arg-type]
            ttl_seconds = int(DEFAULT_SESSION_TTL.total_seconds())
            pipe.expire(user_sessions_key, ttl_seconds)
            pipe.execute() # Sync execution

            flash("Du er nu tilmeldt sessionen!", "success")
            logger.info(f"User '{user_id_str}' successfully joined session '{session_id}' via invite code '{code}'.")

            # Emit an event to notify other clients in the room. (Sync DB query ok here)
            user_obj = User.query.get(user_id)
            if user_obj:
                try: avatar_url = user_obj.avatar_url
                except Exception: avatar_url = f"/static/{user_obj.avatar or Config.DEFAULT_AVATAR}"

                user_details_for_emit = {
                    "username": user_obj.username, "avatar_url": avatar_url, "balance": user_obj.balance
                }
                socketio.emit('user_joined',
                              {'user': user_details_for_emit, 'room': f"session_{session_id}"},
                              room=f"session_{session_id}", # type: ignore[call-arg]
                              include_self=False)
            else:
                logger.error(f"Could not find user object for ID {user_id} after joining session via invite.")

        # Redirect to the session detail page after attempting join
        return redirect(url_for('sessions.session_detail_page', session_id=session_id))

    except redis.RedisError as e:
        logger.exception(f"Redis error processing invite code {code} for user {user_id_str}: {e}")
        flash("Der opstod en databasefejl. Prøv venligst igen.", "danger")
    except Exception as e:
        logger.exception(f"Unexpected error processing invite code {code} for user {user_id_str}: {e}")
        flash("Der skete en uventet fejl. Prøv venligst igen.", "danger")

    # Fallback redirect in case of errors
    return redirect(url_for('main.index'))
# End of join_session_via_invite_code function
