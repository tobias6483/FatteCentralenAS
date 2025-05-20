# app/sockets.py
import json  # Added for Redis data
import logging
from datetime import datetime, timezone  # Added timezone
from typing import (  # Added cast and other types
    Any,
    Dict,
    List,
    Optional,
    Set,
    Union,
    cast,
)

import firebase_admin  # Added for Firebase auth
import redis  # Added for RedisError
from firebase_admin import auth as firebase_auth  # Added for Firebase auth
from flask import current_app, request, url_for
from flask_login import current_user  # To get authenticated user
from flask_socketio import disconnect, emit, join_room, leave_room

# Lokal import fra app pakken
from .config import Config

# from .data_access import load_players, save_players # Removed
from .extensions import (  # Added redis_client, db, and ensure socketio is from here
    db,
    redis_client,
    socketio,
)
from .models import (  # Added User, BetHistory, GameSession models
    BetHistory,
    GameSession,
    User,
)
from .routes.sessions import (  # Import key prefixes
    SESSION_KEY_PREFIX,
    SESSION_PLAYERS_KEY_PREFIX,
)
from .utils import award_badge  # Added award_badge utility

# Logger opsætning
logger = logging.getLogger(__name__)
# logging.basicConfig(level=logging.INFO) # BasicConfig might be handled in __init__

# --- Hjælpefunktioner (Simplified for now) ---


def get_player_details_for_session(
    session_id: str, player_usernames: Set[str]
) -> dict:  # Changed type hint to Set[str]
    """
    Fetches basic details (username, avatar_url, balance) for players in a session.
    Avatar and balance are fetched from the User model (database).
    """
    player_details = {}
    if not player_usernames:
        return player_details

    # Query the database for all listed players at once for efficiency
    users_from_db = User.query.filter(User.username.in_(list(player_usernames))).all()
    users_map = {user.username: user for user in users_from_db}

    for username in player_usernames:
        user_obj = users_map.get(username)
        if user_obj:
            try:
                avatar_url = url_for(
                    "static",
                    filename=user_obj.avatar_url or Config.DEFAULT_AVATAR,
                    _external=False,
                )
            except RuntimeError:  # Outside app context
                avatar_url = f"/static/{user_obj.avatar_url or Config.DEFAULT_AVATAR}"

            player_details[username] = {
                "username": user_obj.username,
                "avatar_url": avatar_url,
                "balance": user_obj.balance,  # Current balance from DB
            }
        else:
            logger.warning(
                f"User '{username}' in session '{session_id}' player set, but not found in DB."
            )
            # Fallback if user not in DB (should ideally not happen)
            try:
                default_avatar_url = url_for(
                    "static", filename=Config.DEFAULT_AVATAR, _external=False
                )
            except RuntimeError:
                default_avatar_url = f"/static/{Config.DEFAULT_AVATAR}"
            player_details[username] = {
                "username": username,
                "avatar_url": default_avatar_url,
                "balance": 0,  # Or some other default
            }
    return player_details


# --- Socket.IO Event Handlers ---

# Ensure socketio instance is available if this file is imported directly for handler registration
# However, typical Flask pattern is to register handlers on the app's socketio instance.
# For this refactor, we assume `socketio` is correctly imported from `app.extensions`.

# --- Socket.IO Event Handlers ---
# Note: The `register_socketio_handlers` function might be deprecated if handlers
# are directly attached to the `socketio` instance from `extensions`.
# For now, keeping the structure but handlers will use the imported `socketio` instance.


@socketio.on("connect")
def on_connect():
    sid = request.sid  # type: ignore[attr-defined]
    auth_token = request.args.get("token")  # Assuming token is passed as a query param
    decoded_token = None  # Initialize to ensure it's always bound

    if not auth_token:
        logger.warning(
            f"Socket.IO connection attempt (SID: {sid}) without auth token. Disconnecting."
        )
        emit("auth_error", {"msg": "Authentication token required."}, to=sid)
        disconnect(sid)
        return

    try:
        decoded_token = firebase_auth.verify_id_token(auth_token, check_revoked=True)
        firebase_uid = decoded_token.get("uid")
        logger.info(
            f"Socket.IO Client connected and Firebase token verified: SID='{sid}', Firebase UID='{firebase_uid}'"
        )

        # TODO: Associate firebase_uid with the session/current_user if needed for subsequent events.
        # For now, Flask's current_user (if authenticated via session) is separate.
        # We could potentially load/set a user context based on firebase_uid here.
        # For example: flask_g.firebase_user = decoded_token (similar to the HTTP decorator)
        # However, flask_g might not persist reliably across different socket events for the same SID.
        # A common pattern is to store this mapping (sid -> firebase_uid) in Redis or a global dict if needed.

        user_display = (
            current_user.id
            if current_user.is_authenticated
            else f"FirebaseUser:{firebase_uid[:8]}..."
        )
        logger.info(
            f"Client connected: SID='{sid}', User='{user_display}' (Firebase UID: {firebase_uid})"
        )
        emit("status", {"msg": "Connected and authenticated successfully."}, to=sid)

    except firebase_auth.RevokedIdTokenError:
        logger.warning(
            f"Socket.IO connection attempt (SID: {sid}) with revoked Firebase token. UID: {decoded_token.get('uid') if decoded_token else 'unknown'}. Disconnecting."
        )
        emit(
            "auth_error",
            {"msg": "Token has been revoked. Please re-authenticate."},
            to=sid,
        )
        disconnect(sid)
    except firebase_auth.UserDisabledError:
        logger.warning(
            f"Socket.IO connection attempt (SID: {sid}) for disabled Firebase user. UID: {decoded_token.get('uid') if decoded_token else 'unknown'}. Disconnecting."
        )
        emit("auth_error", {"msg": "User account has been disabled."}, to=sid)
        disconnect(sid)
    except firebase_auth.InvalidIdTokenError as e:
        logger.warning(
            f"Socket.IO connection attempt (SID: {sid}) with invalid Firebase ID token: {e}. Disconnecting."
        )
        emit("auth_error", {"msg": f"Invalid authentication token."}, to=sid)
        disconnect(sid)
    except Exception as e:
        logger.error(
            f"Socket.IO connection error (SID: {sid}) during Firebase token verification: {e}. Disconnecting."
        )
        emit("auth_error", {"msg": "Authentication error."}, to=sid)
        disconnect(sid)


@socketio.on("disconnect")
def on_disconnect():
    sid = request.sid  # type: ignore[attr-defined]
    user_display = current_user.id if current_user.is_authenticated else "Anonymous"
    logger.info(f"Client disconnected: SID='{sid}', User='{user_display}'")
    # TODO: Implement robust cleanup if user disconnects without explicit leave_room.
    # This might involve iterating through sessions the user was part of (if tracked)
    # and emitting 'user_left' to those rooms.


@socketio.on("join_room")
def on_join_room(data):  # Reverted to def
    sid = request.sid  # type: ignore[attr-defined]
    if not current_user.is_authenticated:
        logger.warning(
            f"Unauthenticated user (SID: {sid}) attempted to join room. Denying."
        )
        emit(
            "server_error", {"msg": "Authentication required to join sessions."}, to=sid
        )
        return

    username = current_user.id
    try:
        room_name_from_client = data.get(
            "room"
        )  # Expected format: "session_ACTUAL_SESSION_ID"
        if (
            not room_name_from_client
            or not isinstance(room_name_from_client, str)
            or not room_name_from_client.startswith(
                SESSION_KEY_PREFIX.replace(":", "_")
            )
        ):
            logger.warning(
                f"Join room failed (invalid room format '{room_name_from_client}') by {username} ({sid})"
            )
            emit("server_error", {"msg": "Invalid or missing room specified."}, to=sid)
            return

        session_id = room_name_from_client.split("_", 1)[1]
        actual_room_name = f"{SESSION_KEY_PREFIX.replace(':', '_')}{session_id}"  # Consistent room naming

        logger.info(
            f"User '{username}' ({sid}) attempting to join room: {actual_room_name} (Session ID: {session_id})"
        )

        session_key = f"{SESSION_KEY_PREFIX}{session_id}"
        session_players_key = f"{SESSION_PLAYERS_KEY_PREFIX}{session_id}"

        # Check if session exists in Redis
        if not redis_client.exists(session_key):  # type: ignore
            logger.warning(
                f"Session '{session_id}' not found in Redis for join request by {username}."
            )
            emit(
                "server_error",
                {"msg": f"Session '{session_id}' does not exist."},
                to=sid,
            )
            return

        join_room(actual_room_name)  # Use the consistent room name
        emit("status", {"msg": f"Successfully joined {actual_room_name}."}, to=sid)

        # Fetch current session state from Redis
        pipe = redis_client.pipeline()
        pipe.hgetall(session_key)
        pipe.smembers(session_players_key)  # Get all player usernames in the session
        # Cast the entire result of pipe.execute() if Pylance has issues with individual elements
        raw_pipe_results = cast(List[Union[Dict[bytes, bytes], Set[bytes]]], pipe.execute())  # type: ignore

        session_data_raw = cast(Dict[bytes, bytes], raw_pipe_results[0])
        player_usernames_in_session_bytes = cast(Set[bytes], raw_pipe_results[1])

        player_usernames_in_session: Set[str] = {
            uname.decode("utf-8") for uname in player_usernames_in_session_bytes
        }

        if not session_data_raw:
            logger.error(
                f"Session {session_id} existed but hgetall returned empty. Race condition or error?"
            )
            emit("server_error", {"msg": "Error fetching session details."}, to=sid)
            return

        # Deserialize outcomes and bets
        outcomes = json.loads(session_data_raw.get(b"outcomes", b"[]").decode("utf-8"))
        bets = json.loads(session_data_raw.get(b"bets", b"[]").decode("utf-8"))
        session_name = session_data_raw.get(b"session_name", b"Unnamed Session").decode(
            "utf-8"
        )
        game_mode = session_data_raw.get(b"game_mode", b"unknown").decode("utf-8")

        all_player_details = get_player_details_for_session(
            session_id, player_usernames_in_session  # type: ignore[arg-type]
        )

        # Send current state to the NEWLY JOINED user
        initial_state = {
            "players": all_player_details,
            "outcomes": outcomes,
            "bets": bets,
            "session_name": session_name,
            "game_mode": game_mode,
            "session_id": session_id,  # Send session_id for client-side reference
        }
        emit("session_update", initial_state, to=sid)
        logger.info(
            f"Sent initial state of session {session_id} to new user {username} ({sid})"
        )

        # Inform ALL OTHER users in the room about the new user
        new_user_detail = all_player_details.get(username)
        if new_user_detail:
            emit(
                "user_joined",
                {"user": new_user_detail, "room": actual_room_name},
                to=actual_room_name,
                include_self=False,
            )
            logger.info(
                f"Notified room {actual_room_name} that user {username} joined."
            )
        else:
            logger.warning(
                f"User {username} joined room {actual_room_name} but their details were not found in all_player_details."
            )

    except redis.RedisError as re:
        logger.exception(f"Redis error in join_room for SID {sid}, data {data}: {re}")
        emit("server_error", {"msg": "Database error processing your request."}, to=sid)
    except Exception as e:
        logger.exception(f"Error in join_room handler for SID {sid}, data {data}: {e}")
        emit(
            "server_error", {"msg": f"Server error during join room: {str(e)}"}, to=sid
        )


@socketio.on("place_bet")
def on_place_bet(data):  # Reverted to def
    sid = request.sid  # type: ignore[attr-defined]
    if not current_user.is_authenticated:
        logger.warning(
            f"Unauthenticated user (SID: {sid}) attempted to place bet. Denying."
        )
        # Emit error directly to the specific client (SID)
        # For ACK-based handlers, we should return the error in the ACK.
        # If not using ACK, then emit is fine. Assuming ACK for place_bet.
        return {"success": False, "error": "Authentication required to place bets."}

    username = current_user.id  # Using user ID now
    try:
        session_id = data.get("session_id", "").strip()
        stake_raw = data.get("stake")
        is_coupon = data.get("is_coupon_bet", False)  # Check the flag from JS

        if not session_id:
            raise ValueError("Session ID missing")
        if stake_raw is None:
            raise ValueError("Stake missing")

        stake_val = float(stake_raw)
        if stake_val <= 0:
            raise ValueError("Stake must be positive")

        session_key = f"{SESSION_KEY_PREFIX}{session_id}"
        session_players_key = f"{SESSION_PLAYERS_KEY_PREFIX}{session_id}"

        # --- Validate Session and Player ---
        # Explicitly cast the result of hgetall
        session_data_raw = cast(
            Dict[bytes, bytes], redis_client.hgetall(session_key)
        )  # Assuming sync
        if not session_data_raw:
            raise ValueError(f"Session '{session_id}' not found")

        # Helper to decode bytes from Redis if necessary
        def decode_redis(val):
            return val.decode("utf-8") if isinstance(val, bytes) else val

        if decode_redis(session_data_raw.get(b"status", b"closed")) != "open":  # type: ignore[attr-defined] # Already present, but ensure it's correct
            logger.warning(f"Bet attempt on closed session: {session_id} by {username}")
            return {"success": False, "error": "Sessionen er lukket for bets."}

        if not redis_client.sismember(session_players_key, username):  # Assuming sync
            if not redis_client.sismember(
                session_players_key, str(username)
            ):  # Assuming sync
                raise ValueError(
                    f"User '{username}' is not participating in session '{session_id}'"
                )

        # --- Fetch Player from DB and Check Balance ---
        user_obj = User.query.filter_by(id=username).first()
        if not user_obj:
            raise ValueError(f"User '{username}' not found in database")
        if user_obj.balance < stake_val:
            return {
                "success": False,
                "error": f"Insufficient balance ({user_obj.balance:.2f} DKK) for stake ({stake_val:.2f} DKK)",
            }

        # --- Process Bet based on type (is_coupon flag from client) ---
        if is_coupon:
            # --- COUPON BET LOGIC ---
            logger.info(
                f"Processing COUPON bet for session {session_id} by {user_obj.username}, stake: {stake_val}, sid='{sid}'"
            )

            redis_is_coupon_flag_raw = session_data_raw.get(b"is_coupon")  # type: ignore[attr-defined] # Add ignore for .get
            redis_is_coupon = False
            if redis_is_coupon_flag_raw:
                try:
                    redis_is_coupon = json.loads(decode_redis(redis_is_coupon_flag_raw))
                except json.JSONDecodeError:
                    pass

            if not redis_is_coupon:
                logger.error(
                    f"Bet received with is_coupon_bet=true, but session {session_id} is NOT marked as coupon in Redis."
                )
                raise ValueError("Intern serverfejl (session type mismatch).")

            selections_json_raw = session_data_raw.get(b"outcomes")  # type: ignore[attr-defined] # Add ignore for .get
            if not selections_json_raw:
                raise ValueError("Coupon selections not found in Redis.")
            selections = json.loads(decode_redis(selections_json_raw))
            if not isinstance(selections, list) or not selections:
                raise ValueError("Coupon selections data is invalid or empty.")

            total_coupon_odds = 1.0
            for sel in selections:
                total_coupon_odds *= float(sel.get("odds", 1.0))
            potential_payout = stake_val * total_coupon_odds

            bet_time = datetime.now(timezone.utc)
            # Re-adding type ignore for constructor arguments
            new_bet_record = BetHistory(  # type: ignore[call-arg]
                user_id=user_obj.id,
                session_id=session_id,
                match_name=decode_redis(session_data_raw.get(b"session_name", b"Kupon Session")),  # type: ignore[attr-defined] # Add ignore for .get
                outcome_name="Kupon Væddemål",
                stake=stake_val,
                payout=potential_payout,
                result="pending",
                status="open",
                timestamp=bet_time,
            )
            db.session.add(new_bet_record)

            user_obj.balance -= stake_val
            user_obj.total_staked = (user_obj.total_staked or 0.0) + stake_val
            user_obj.last_seen = bet_time
            db.session.commit()  # Commit the bet and user balance update
            # --- Award Badges (First Bet, High Roller, Centurion) ---
            try:
                # Check count *after* commit
                bet_count = BetHistory.query.filter_by(user_id=user_obj.id).count()
                # First Bet
                if bet_count == 1:
                    award_badge(user_obj.id, "Første Bet")
                # Centurion Bets
                if bet_count == 100:
                    award_badge(user_obj.id, "Centurion")
                # High Roller
                if stake_val > 100:  # Check stake value
                    award_badge(user_obj.id, "Storspiller")
            except Exception as badge_err:
                logger.error(
                    f"Error checking/awarding badges (first_bet/high_roller/centurion) for user {user_obj.id} after coupon bet: {badge_err}"
                )
            # --- End badge checks ---
            logger.info(
                f"DB: User {user_obj.username} balance updated to {user_obj.balance:.2f} and BetHistory for COUPON created."
            )

            # --- Award 'first_bet' badge ---
            try:
                # Check count *after* commit
                bet_count = BetHistory.query.filter_by(user_id=user_obj.id).count()
                if bet_count == 1:
                    award_badge(
                        user_obj.id, "Første Bet"
                    )  # Use the exact name from seeding
            except Exception as badge_err:
                logger.error(
                    f"Error checking/awarding 'first_bet' badge for user {user_obj.id}: {badge_err}"
                )
            # --- End badge check ---

            bets_json_raw = session_data_raw.get(b"bets")  # type: ignore[attr-defined] # Add ignore for .get
            current_bets_list = (
                json.loads(decode_redis(bets_json_raw)) if bets_json_raw else []
            )
            bet_entry_redis = {
                "user": user_obj.username,
                "stake": stake_val,
                "total_odds": total_coupon_odds,
                "potential_payout": potential_payout,
                "timestamp": bet_time.isoformat(),
                "is_coupon_bet": True,
            }
            current_bets_list.append(bet_entry_redis)
            redis_client.hset(
                session_key, "bets", json.dumps(current_bets_list)
            )  # Assuming sync
            logger.info(f"Redis: Updated bets list for COUPON session {session_id}")

        else:  # --- SINGLE OUTCOME BET LOGIC ---
            outcome_name_from_data = data.get("outcome")
            if not outcome_name_from_data:
                raise ValueError("Outcome missing for single bet")

            logger.info(
                f"Processing SINGLE bet for session {session_id} by {user_obj.username} on '{outcome_name_from_data}', stake: {stake_val}, sid='{sid}'"
            )

            outcomes_json_raw = session_data_raw.get(b"outcomes")  # type: ignore[attr-defined] # Add ignore for .get
            if not outcomes_json_raw:
                raise ValueError("Session outcomes not found in Redis for single bet.")
            outcomes = json.loads(decode_redis(outcomes_json_raw))
            if not isinstance(outcomes, list):
                raise ValueError("Outcomes data is not a list for single bet.")

            chosen_outcome_obj = None
            # chosen_outcome_index = None  # Keep track of index if needed for Redis update
            for i, o_dict in enumerate(outcomes):
                if (
                    isinstance(o_dict, dict)
                    and o_dict.get("name") == outcome_name_from_data
                ):
                    chosen_outcome_obj = o_dict
                    # chosen_outcome_index = i
                    break

            if chosen_outcome_obj is None:
                raise ValueError(
                    f"Invalid outcome '{outcome_name_from_data}' for single bet in session {session_id}"
                )

            actual_outcome_name = chosen_outcome_obj.get("name", "Unnamed Outcome")
            chosen_outcome_obj["pot"] = chosen_outcome_obj.get("pot", 0.0) + stake_val

            bet_time = datetime.now(timezone.utc)
            # Re-adding type ignore for constructor arguments
            new_bet_record = BetHistory(  # type: ignore[call-arg]
                user_id=user_obj.id,
                session_id=session_id,
                match_name=decode_redis(session_data_raw.get(b"session_name", b"Unknown Session")),  # type: ignore[attr-defined] # Add ignore for .get
                outcome_name=actual_outcome_name,
                stake=stake_val,
                payout=None,
                result="pending",
                status="open",
                timestamp=bet_time,
            )
            db.session.add(new_bet_record)

            user_obj.balance -= stake_val
            user_obj.total_staked = (user_obj.total_staked or 0.0) + stake_val
            user_obj.last_seen = bet_time
            db.session.commit()  # Commit the bet and user balance update

            # --- Award Badges (First Bet, High Roller, Centurion) ---
            try:
                # Check count *after* commit
                bet_count = BetHistory.query.filter_by(user_id=user_obj.id).count()
                # First Bet
                if bet_count == 1:
                    award_badge(user_obj.id, "Første Bet")
                # Centurion Bets
                if bet_count == 100:
                    award_badge(user_obj.id, "Centurion")
                # High Roller
                if stake_val > 100:  # Check stake value
                    award_badge(user_obj.id, "Storspiller")
            except Exception as badge_err:
                logger.error(
                    f"Error checking/awarding badges (first_bet/high_roller/centurion) for user {user_obj.id} after single bet: {badge_err}"
                )
            # --- End badge checks ---

            logger.info(
                f"DB: User {user_obj.username} balance updated to {user_obj.balance:.2f} and BetHistory for SINGLE bet created."
            )

            bets_json_raw = session_data_raw.get(b"bets")  # type: ignore[attr-defined] # Add ignore for .get
            current_bets_list = (
                json.loads(decode_redis(bets_json_raw)) if bets_json_raw else []
            )
            bet_entry_redis = {
                "user": user_obj.username,
                "outcome_name": actual_outcome_name,  # Store name
                "stake": stake_val,
                "timestamp": bet_time.isoformat(),
                "is_coupon_bet": False,
            }
            current_bets_list.append(bet_entry_redis)

            pipe = redis_client.pipeline()
            pipe.hset(session_key, "outcomes", json.dumps(outcomes))
            pipe.hset(session_key, "bets", json.dumps(current_bets_list))
            pipe.execute()  # Assuming sync pipeline execute
            logger.info(
                f"Redis: Updated bets and outcomes for SINGLE bet session {session_id}"
            )

        # --- Common Post-Bet Actions (Emit updates, Send Ack) ---
        # Cast the result of smembers directly
        player_usernames_in_session_bytes = cast(
            Set[bytes], redis_client.smembers(session_players_key)
        )  # Sync call, should return Set[bytes]

        player_usernames_in_session_set: Set[str] = {
            uname_bytes.decode("utf-8")
            for uname_bytes in player_usernames_in_session_bytes
        }

        all_player_details_updated = get_player_details_for_session(
            session_id, player_usernames_in_session_set  # type: ignore[arg-type]
        )

        final_outcomes_json_raw = redis_client.hget(
            session_key, "outcomes"
        )  # Assuming sync
        final_bets_json_raw = redis_client.hget(session_key, "bets")  # Assuming sync

        emit_data = {
            "session_id": session_id,
            "outcomes": json.loads(decode_redis(final_outcomes_json_raw)) if final_outcomes_json_raw else [],  # type: ignore[arg-type]
            "bets": json.loads(decode_redis(final_bets_json_raw)) if final_bets_json_raw else [],  # type: ignore[arg-type]
            "players": all_player_details_updated,
            "is_coupon": is_coupon,
        }
        socketio.emit("session_update", emit_data, to=f"session_{session_id}")  # type: ignore[call-arg]
        logger.debug(
            f"Emitted 'session_update' to room session_{session_id} after bet by {user_obj.username} (Coupon: {is_coupon})"
        )

        return {
            "success": True,
            "message": "Bet placeret!",
            "new_balance": user_obj.balance,
        }

    except ValueError as ve:
        logger.warning(
            f"Place bet validation error for user {current_user.id if current_user.is_authenticated else 'UNKNOWN'}, data {data} from SID {sid}: {ve}"
        )
        db.session.rollback()
        return {"success": False, "error": str(ve)}
    except redis.RedisError as re:
        logger.exception(
            f"Redis error in place_bet for user {current_user.id if current_user.is_authenticated else 'UNKNOWN'}, SID {sid}: {re}"
        )
        db.session.rollback()
        return {"success": False, "error": "Databasefejl under behandling af bet."}
    except Exception as e:
        logger.exception(
            f"Error in place_bet for user {current_user.id if current_user.is_authenticated else 'UNKNOWN'}, data {data} from SID {sid}: {e}"
        )
        db.session.rollback()
        return {"success": False, "error": f"Serverfejl: {str(e)}"}


@socketio.on("finish_bet")
def on_finish_bet(data):
    sid = request.sid  # type: ignore[attr-defined]
    # Ensure current_user is authenticated and has Admin role
    if not current_user.is_authenticated or not getattr(
        current_user, "has_role", lambda role: False
    )("Admin"):
        logger.warning(
            f"Unauthorized attempt to finish bet by {current_user.id if current_user.is_authenticated else 'anonymous'} (SID: {sid})."
        )
        emit("server_error", {"msg": "Administrator privileges required."}, to=sid)
        return

    admin_user_id = current_user.id  # Use current_user.id for logging

    session_id = data.get("session_id")
    winning_outcome_name = data.get("winning_outcome")  # For single outcome bets
    # For coupon bets, winning_outcome might be a dict/list of results or not needed if auto-calculated

    if not session_id:
        logger.error(
            f"finish_bet called without session_id by admin {admin_user_id}"
        )  # Changed requesting_user to admin_user_id
        emit("server_error", {"msg": "Session ID mangler."}, to=sid)
        return

    logger.info(
        f"Admin {admin_user_id} is attempting to finish session {session_id} with winning outcome: {winning_outcome_name}"  # Changed requesting_user to admin_user_id
    )
    session_key = f"{SESSION_KEY_PREFIX}{session_id}"

    try:
        keys_to_fetch = [
            "session_creator",  # 0
            "session_admin_code",  # 1
            "outcomes",  # 2
            "bets",  # 3
            "game_mode",  # 4
            "status",  # 5
            "is_coupon",  # 6
        ]
        # Correctly pass keys to hmget using *args
        session_data_raw_list = cast(List[Optional[bytes]], redis_client.hmget(session_key, *keys_to_fetch))  # type: ignore

        if (
            not session_data_raw_list or not session_data_raw_list[0]
        ):  # Check if creator exists
            logger.error(
                f"Session {session_id} not found or essential data missing in Redis when trying to finish bet."
            )
            emit("server_error", {"msg": "Session ikke fundet eller korrupt."}, to=sid)
            return

        # Ensure to handle None for optional bytes before decoding
        session_creator_bytes = session_data_raw_list[0]
        session_admin_code_bytes = session_data_raw_list[1]
        outcomes_json_bytes = session_data_raw_list[2]
        current_bets_json_bytes = session_data_raw_list[3]
        game_mode_bytes = session_data_raw_list[4]
        session_status_bytes = session_data_raw_list[5]
        is_coupon_json_bytes = session_data_raw_list[6]

        if session_status_bytes and session_status_bytes.decode() == "closed":
            logger.info(f"Session {session_id} is already closed.")
            emit(
                "session_already_closed",
                {"msg": "Denne session er allerede afsluttet."},
                to=sid,
            )
            return

        # --- Validate Session and Admin Code ---
        session_creator = (
            session_creator_bytes.decode() if session_creator_bytes else None
        )
        session_admin_code = (
            session_admin_code_bytes.decode() if session_admin_code_bytes else None
        )

        # Admin code check (or if user is creator)
        if current_user.id != session_creator and (
            not session_admin_code or data.get("admin_code") != session_admin_code
        ):
            # Allow if current_user is an admin (e.g. current_user.is_admin property)
            if not getattr(current_user, "is_admin", False):
                raise ValueError("Incorrect admin code or not session creator")

        if not outcomes_json_bytes:
            raise ValueError("Session outcomes not found in Redis.")
        outcomes = json.loads(
            outcomes_json_bytes.decode() if outcomes_json_bytes else "[]"
        )
        current_bets_list = json.loads(
            current_bets_json_bytes.decode() if current_bets_json_bytes else "[]"
        )

        # --- Determine Winner ---
        winner_name = "Unknown Winner"
        winner_odds = 1.0
        winner_index = -1  # Default to -1 for draw, will be updated
        if len(outcomes) == 2 and all(
            isinstance(outcome, dict) and "name" in outcome and "odds" in outcome
            for outcome in outcomes
        ):
            # Assuming a 2-outcome scenario (like sports betting)
            outcome_1, outcome_2 = outcomes
            odds_1 = float(outcome_1.get("odds", 1.0))
            odds_2 = float(outcome_2.get("odds", 1.0))

            if odds_1 <= 0 and odds_2 <= 0:
                raise ValueError(
                    "Invalid odds for both outcomes, cannot determine winner."
                )

            # Favor the outcome with higher odds as the winner
            if odds_1 > odds_2:
                winner_index = 0
                winner_name = outcome_1.get("name", "Unknown Outcome 1")
                winner_odds = odds_1
            else:
                winner_index = 1
                winner_name = outcome_2.get("name", "Unknown Outcome 2")
                winner_odds = odds_2
        elif winner_index == -1:  # Still -1 means no valid winner determined
            logger.warning(
                f"Winner index not set, defaulting to -1 (draw) for session {session_id}."
            )
            winner_index = -1  # Explicitly set to -1 for draw

        # --- Process Bets and Update DB ---
        payouts_summary = []
        losses_summary = []
        bettor_usernames = {bet["user"] for bet in current_bets_list}
        net_gain = 0.0  # Initialize net_gain
        payout_amount = 0.0  # Initialize payout_amount

        # Fetch all involved User objects from DB in one query
        bettor_users_db = User.query.filter(
            User.username.in_(list(bettor_usernames))
        ).all()
        bettor_users_map = {user.username: user for user in bettor_users_db}

        for bet in current_bets_list:
            user_id = bet.get("user")
            stake = float(bet.get("stake", 0.0))
            bet_outcome_index = int(bet.get("outcome_index"))

            player_db_obj = bettor_users_map.get(user_id)
            if not player_db_obj:
                logger.error(
                    f"User '{user_id}' from bet not found in DB during finish_bet! Skipping."
                )
                continue

            if bet_outcome_index == winner_index:  # Winner
                payout_amount = stake * winner_odds
                player_db_obj.balance += payout_amount
                player_db_obj.wins = (player_db_obj.wins or 0) + 1
                net_gain = payout_amount - stake
            # --- Award 'first_win' badge ---
            if bet_outcome_index == winner_index:  # Only for the winning bettor
                try:
                    # Check if this is the player's first win overall
                    win_count = BetHistory.query.filter_by(
                        user_id=player_db_obj.id, result="won"
                    ).count()
                    if (
                        win_count == 1
                    ):  # The current win is now committed, so count should be 1 if it's the first
                        award_badge(player_db_obj.id, "Første Gevinst")
                except Exception as badge_err:
                    logger.error(
                        f"Error checking/awarding 'first_win' badge for user {player_db_obj.id}: {badge_err}"
                    )
            # --- End badge check ---
            # --- Award 'first_win' badge ---
            # Check *after* commit if this was the user's first win overall
            if bet_outcome_index == winner_index:  # Only check for winners
                try:
                    # Count how many bets this user has won *before* this one
                    # We check for count == 1 because the current win is now committed
                    win_count = BetHistory.query.filter_by(
                        user_id=player_db_obj.id, result="won"
                    ).count()
                    if win_count == 1:
                        award_badge(
                            player_db_obj.id, "Første Gevinst"
                        )  # Use exact name
                except Exception as badge_err:
                    logger.error(
                        f"Error checking/awarding 'first_win' badge for user {player_db_obj.id}: {badge_err}"
                    )
                # --- End badge check ---
                player_db_obj.total_won = (player_db_obj.total_won or 0.0) + net_gain
                player_db_obj.largest_win = max(
                    player_db_obj.largest_win or 0.0, net_gain
                )
                payouts_summary.append(
                    {
                        "user": user_id,
                        "payout": payout_amount,
                        "stake": stake,
                        "net_gain": net_gain,
                    }
                )
            else:  # Loser
                player_db_obj.losses = (player_db_obj.losses or 0) + 1
                player_db_obj.total_lost = (player_db_obj.total_lost or 0.0) + stake
                player_db_obj.largest_loss = max(
                    player_db_obj.largest_loss or 0.0, stake
                )
                losses_summary.append({"user": user_id, "lost": stake})
            player_db_obj.last_activity = datetime.utcnow()

        db.session.commit()  # Commit all DB changes
        logger.info(
            f"DB: Player balances and stats updated for session {session_id} finish."
        )

        # --- Update Redis: Reset Pots, Clear Bets ---
        for o in outcomes:
            o["pot"] = 0.0  # Reset pots

        pipe = redis_client.pipeline()
        pipe.hset(session_key, "outcomes", json.dumps(outcomes))
        pipe.hset(session_key, "bets", json.dumps([]))  # Clear bets for next round
        # Optionally, change session status: pipe.hset(session_key, "status", "closed_round")
        pipe.execute()

        # --- Prepare and Emit Result ---
        session_players_key = f"{SESSION_PLAYERS_KEY_PREFIX}{session_id}"
        # Cast the result of smembers directly
        player_usernames_in_session_bytes = cast(
            Set[bytes], redis_client.smembers(session_players_key)
        )
        player_usernames_in_session_set: Set[str] = {
            uname.decode("utf-8") for uname in player_usernames_in_session_bytes
        }
        all_player_details_updated = get_player_details_for_session(
            session_id, player_usernames_in_session_set  # type: ignore[arg-type]
        )

        payload = {
            "winner_index": winner_index,
            "winner_name": winner_name,
            "winner_odds": winner_odds,
            "payouts": payouts_summary,
            "losers": losses_summary,
            "players": all_player_details_updated,
            "outcomes": outcomes,
            "bets": [],
        }
        actual_room_name = f"{SESSION_KEY_PREFIX.replace(':', '_')}{session_id}"
        emit("bet_finished", payload, to=actual_room_name)
        logger.info(
            f"Bet finished event emitted to {actual_room_name}. Winner: '{winner_name}'."
        )

    except ValueError as ve:
        logger.error(
            f"Finish bet validation error for admin {admin_user_id}, data {data} from SID {sid}: {ve}"  # Changed requesting_user to admin_user_id
        )
        emit("server_error", {"msg": f"Valideringsfejl: {str(ve)}"}, to=sid)
    except redis.RedisError as re:
        logger.exception(
            f"Redis error in on_finish_bet for admin {admin_user_id}, SID {sid}: {re}"
        )  # Changed requesting_user to admin_user_id
        emit(
            "server_error", {"msg": "Database error ved afslutning af session."}, to=sid
        )
    except Exception as e:
        logger.exception(
            f"General error in on_finish_bet for admin {admin_user_id}, data {data} from SID {sid}: {e}"
        )  # Changed requesting_user to admin_user_id
        emit("server_error", {"msg": f"Serverfejl: {str(e)}"}, to=sid)


@socketio.on("settle_coupon_leg")
def on_settle_coupon_leg(data):  # Reverted to def
    """
    Handles manually settling a single leg of a coupon session.
    Expected data: { session_id: str, event_id: str, winning_outcome_name: str }
    Typically triggered by an admin or session creator.
    """
    sid = request.sid  # type: ignore[attr-defined]
    if not current_user.is_authenticated:
        logger.warning(
            f"Unauthenticated user (SID: {sid}) attempted to settle coupon leg. Denying."
        )
        return {"success": False, "error": "Authentication required."}  # Use ACK

    # Use current_user.id which should be an integer
    requesting_user_id = current_user.id
    try:
        session_id = data.get("session_id", "").strip()
        event_id_to_settle = data.get("event_id")
        # Name of the outcome that won for this specific event leg
        winning_outcome_name = data.get("winning_outcome_name")

        if not session_id:
            raise ValueError("Session ID missing")
        if not event_id_to_settle:
            raise ValueError("Event ID missing")
        # Ensure a winning outcome is provided
        if winning_outcome_name is None:
            raise ValueError("Winning outcome name missing")

        logger.info(
            f"Settle coupon leg received: session='{session_id}', event='{event_id_to_settle}', winner='{winning_outcome_name}', by_user='{requesting_user_id}', sid='{sid}'"
        )

        session_key = f"{SESSION_KEY_PREFIX}{session_id}"
        session_players_key = (
            f"{SESSION_PLAYERS_KEY_PREFIX}{session_id}"  # Define player key
        )

        # --- Validate Session, Permissions, and Type ---
        session_data_raw = redis_client.hgetall(session_key)  # Assuming sync
        if not session_data_raw:
            raise ValueError(f"Session '{session_id}' not found")

        # Helper to decode bytes from Redis, returning original value if not bytes
        def decode_redis(val):
            return val.decode("utf-8") if isinstance(val, bytes) else val

        # Fetch necessary fields, decoding bytes
        session_creator_id_raw = session_data_raw.get(b"creator")  # type: ignore[attr-defined] # Add ignore for .get
        is_coupon_raw = session_data_raw.get(b"is_coupon")  # type: ignore[attr-defined] # Add ignore for .get
        selections_json_raw = session_data_raw.get(b"outcomes")  # type: ignore[attr-defined] # Add ignore for .get
        bets_json_raw = session_data_raw.get(b"bets")  # type: ignore[attr-defined] # Add ignore for .get # Needed for final settlement

        if not session_creator_id_raw:
            raise ValueError("Session creator ID missing in Redis data.")
        # Ensure creator ID is compared correctly (int vs int)
        try:
            # Creator ID from Redis might be bytes, decode first
            session_creator_id = int(decode_redis(session_creator_id_raw))
        except (ValueError, TypeError):
            raise ValueError("Invalid creator ID format in Redis data.")

        is_coupon = False
        if is_coupon_raw:
            try:
                is_coupon = json.loads(decode_redis(is_coupon_raw))
            except json.JSONDecodeError:
                pass

        if not is_coupon:
            raise ValueError(f"Session '{session_id}' is not a coupon session.")

        # Permission Check: Allow session creator or admin
        is_admin = getattr(current_user, "is_admin", False)
        # Ensure comparison is int vs int
        if requesting_user_id != session_creator_id and not is_admin:
            raise ValueError("Permission denied to settle legs for this session.")

        # --- Update Leg Status in Redis ---
        if not selections_json_raw:
            raise ValueError("Coupon selections not found in Redis.")
        selections = json.loads(decode_redis(selections_json_raw))
        if not isinstance(selections, list):
            raise ValueError("Coupon selections data is invalid.")

        leg_updated = False
        leg_found = False
        all_legs_settled = (
            True  # Assume true initially, set to false if any pending found
        )
        overall_coupon_result = "won"  # Assume won initially

        for leg in selections:
            # Ensure leg is a dictionary before accessing keys
            if not isinstance(leg, dict):
                continue

            if leg.get("eventId") == event_id_to_settle:
                leg_found = True
                if leg.get("status") == "pending":  # Only update pending legs
                    selected_outcome = leg.get("outcomeName")
                    if selected_outcome == winning_outcome_name:
                        leg["status"] = "won"
                    else:
                        leg["status"] = "lost"
                    leg_updated = True
                    logger.info(
                        f"Updated leg status for event {event_id_to_settle} in coupon {session_id} to '{leg['status']}'"
                    )
                else:
                    logger.warning(
                        f"Attempted to re-settle already settled leg for event {event_id_to_settle} in coupon {session_id}. Current status: {leg.get('status')}"
                    )
                    return {
                        "success": False,
                        "error": "Denne del af kuponen er allerede afgjort.",
                    }
                # Break after finding and processing the specific leg
                break

        if not leg_found:
            logger.warning(
                f"Event ID {event_id_to_settle} not found in coupon {session_id} selections."
            )
            return {
                "success": False,
                "error": "Det angivne event findes ikke i denne kupon.",
            }

        # If we updated a leg, check the overall status
        if leg_updated:
            for leg_check in selections:  # Need to iterate again to check all statuses
                # Ensure leg_check is a dictionary
                if not isinstance(leg_check, dict):
                    continue
                current_leg_status = leg_check.get("status", "pending")
                if current_leg_status == "pending":
                    all_legs_settled = False
                    break
                elif current_leg_status == "lost":
                    overall_coupon_result = "lost"
                    # Don't break here for 'lost', still need to check if others are pending
        else:
            # Leg was found but already settled, re-evaluate all_legs_settled
            all_legs_settled = True
            overall_coupon_result = "won"
            for leg_check in selections:
                if not isinstance(leg_check, dict):
                    continue
                current_status = leg_check.get("status", "pending")
                if current_status == "pending":
                    all_legs_settled = False
                    break
                elif current_status == "lost":
                    overall_coupon_result = "lost"
                    # Don't break here, still need to check if others are pending

        # Save updated selections back to Redis
        redis_client.hset(
            session_key, "outcomes", json.dumps(selections)
        )  # Assuming sync

        # --- If all legs are settled, process final results ---
        final_message = f"Status for valg på event {event_id_to_settle} er opdateret."
        if all_legs_settled:
            logger.info(
                f"All legs settled for coupon {session_id}. Overall result: {overall_coupon_result}"
            )

            try:
                # 1. Update GameSession status in Redis & SQL
                redis_client.hset(session_key, "status", "resolved")  # Assuming sync
                db_session = GameSession.query.get(session_id)
                if db_session:
                    db_session.status = "resolved"
                    db_session.resolved_at = datetime.now(timezone.utc)
                else:
                    logger.error(
                        f"Could not find GameSession {session_id} in DB for final settlement."
                    )

                # 2. Fetch coupon bets from BetHistory
                # Ensure outcome_name matches exactly what was stored for coupon bets
                coupon_bets_db = BetHistory.query.filter_by(
                    session_id=session_id,
                    outcome_name="Kupon Væddemål",
                    result="pending",
                ).all()

                # 3. Fetch involved users
                bettor_user_ids = {bet.user_id for bet in coupon_bets_db}
                # Ensure users are fetched correctly by ID
                bettor_users_map = {
                    user.id: user
                    for user in User.query.filter(
                        User.id.in_(list(bettor_user_ids))
                    ).all()
                }

                payouts_summary = []
                losses_summary = []
                net_gain = 0.0  # Initialize net_gain here as well for coupon settlement

                for bet in coupon_bets_db:
                    user_obj = bettor_users_map.get(bet.user_id)
                    if not user_obj:
                        logger.error(
                            f"User ID {bet.user_id} from BetHistory {bet.id} not found in DB during coupon settlement."
                        )
                        continue

                    bet.result = overall_coupon_result
                    bet.status = "afgjort"

                    if overall_coupon_result == "won":
                        # Payout was stored during bet placement
                        final_payout = bet.payout or 0.0
                        user_obj.balance += final_payout
                        user_obj.wins = (user_obj.wins or 0) + 1
                        net_gain = final_payout - bet.stake
                        user_obj.total_won = (user_obj.total_won or 0.0) + net_gain
                        user_obj.largest_win = max(
                            user_obj.largest_win or 0.0, net_gain
                        )
                        payouts_summary.append(
                            {
                                "user": user_obj.username,
                                "payout": final_payout,
                                "stake": bet.stake,
                                "net_gain": net_gain,
                            }
                        )
                    else:  # Lost
                        user_obj.losses = (user_obj.losses or 0) + 1
                        user_obj.total_lost = (user_obj.total_lost or 0.0) + bet.stake
                        user_obj.largest_loss = max(
                            user_obj.largest_loss or 0.0, bet.stake
                        )
                        losses_summary.append(
                            {"user": user_obj.username, "lost": bet.stake}
                        )
                    # --- Award 'first_win' badge to all winning users on this coupon ---
                    if overall_coupon_result == "won":
                        for (
                            bet_record
                        ) in (
                            coupon_bets_db
                        ):  # Iterate through the bets that were part of this winning coupon
                            winning_user_obj = bettor_users_map.get(bet_record.user_id)
                            if winning_user_obj:
                                try:
                                    # Check if this is the user's first win overall
                                    win_count = BetHistory.query.filter_by(
                                        user_id=winning_user_obj.id, result="won"
                                    ).count()
                                    if (
                                        win_count == 1
                                    ):  # The current win is now committed
                                        award_badge(
                                            winning_user_obj.id, "Første Gevinst"
                                        )
                                    # Check for Big Win (Net gain > 200)
                                    if net_gain > 200:  # type: ignore[possibly-unbound]
                                        award_badge(
                                            winning_user_obj.id, "Kassen Ringer"
                                        )
                                except Exception as badge_err:
                                    logger.error(
                                        f"Error checking/awarding 'first_win' badge for user {winning_user_obj.id} after coupon win: {badge_err}"
                                    )
                        # --- End badge check ---
                        # --- Award 'first_win' badge to all winning users on this coupon ---
                        if overall_coupon_result == "won":
                            for (
                                bet_record
                            ) in (
                                coupon_bets_db
                            ):  # Iterate through the bets that were part of this winning coupon
                                winning_user_obj = bettor_users_map.get(
                                    bet_record.user_id
                                )
                                if winning_user_obj:
                                    try:
                                        # Check if this is the user's first win overall
                                        win_count = BetHistory.query.filter_by(
                                            user_id=winning_user_obj.id, result="won"
                                        ).count()
                                        if (
                                            win_count == 1
                                        ):  # The current win is now committed
                                            award_badge(
                                                winning_user_obj.id, "Første Gevinst"
                                            )
                                    except Exception as badge_err:
                                        logger.error(
                                            f"Error checking/awarding 'first_win' badge for user {winning_user_obj.id} after coupon win: {badge_err}"
                                        )
                        # --- End badge check ---

                    # Update last_seen timestamp
                    user_obj.last_seen = datetime.now(timezone.utc)

                # 4. Commit DB changes
                db.session.commit()
                logger.info(
                    f"DB: Final settlement processed for coupon {session_id}. Result: {overall_coupon_result}"
                )

                # 5. Emit a specific "coupon_settled" event
                settle_payload = {
                    "session_id": session_id,
                    "overall_result": overall_coupon_result,
                    "payouts": payouts_summary,
                    "losses": losses_summary,
                    "final_selections": selections,
                }
                socketio.emit("coupon_settled", settle_payload, to=f"session_{session_id}")  # type: ignore[call-arg]
                logger.info(f"Emitted 'coupon_settled' for session {session_id}")
                final_message = f"Kupon {session_id} er fuldt afgjort som: {overall_coupon_result.upper()}!"

            except Exception as final_settle_ex:
                logger.exception(
                    f"CRITICAL ERROR during final settlement of coupon {session_id}: {final_settle_ex}"
                )
                db.session.rollback()
                socketio.emit(
                    "server_error",
                    {
                        "msg": f"Kritisk fejl under endelig afgørelse af kupon {session_id}."
                    },
                    to=f"session_{session_id}",
                )
                return {
                    "success": False,
                    "error": "Kritisk fejl under endelig afgørelse.",
                }

        # --- Emit session update regardless (to show updated leg status) ---
        # Cast the result of smembers directly
        player_usernames_in_session_bytes = cast(
            Set[bytes], redis_client.smembers(session_players_key)
        )  # Assuming sync
        player_usernames_in_session: Set[str] = {
            uname.decode("utf-8") for uname in player_usernames_in_session_bytes
        }
        all_player_details_updated = get_player_details_for_session(
            session_id, player_usernames_in_session  # type: ignore[arg-type]
        )
        final_bets_json_raw = redis_client.hget(session_key, "bets")  # Assuming sync
        final_status_raw = redis_client.hget(
            session_key, "status"
        )  # Assuming sync, Get potentially updated status

        emit_data = {
            "session_id": session_id,
            "outcomes": selections,
            "bets": json.loads(decode_redis(final_bets_json_raw)) if final_bets_json_raw else [],  # type: ignore[arg-type]
            "players": all_player_details_updated,
            "is_coupon": True,
            "status": decode_redis(final_status_raw or b"unknown"),
        }
        socketio.emit("session_update", emit_data, to=f"session_{session_id}")  # type: ignore[call-arg]
        logger.debug(
            f"Emitted 'session_update' after settling leg for coupon {session_id}"
        )

        return {"success": True, "message": final_message}

    except ValueError as ve:
        logger.warning(
            f"Settle coupon leg validation error for user {requesting_user_id}, data {data} from SID {sid}: {ve}"
        )
        db.session.rollback()
        return {"success": False, "error": str(ve)}
    except redis.RedisError as re:
        logger.exception(
            f"Redis error in settle_coupon_leg for user {requesting_user_id}, SID {sid}: {re}"
        )
        db.session.rollback()
        return {"success": False, "error": "Databasefejl under behandling."}
    except Exception as e:
        logger.exception(
            f"Error in settle_coupon_leg for user {requesting_user_id}, data {data} from SID {sid}: {e}"
        )
        db.session.rollback()
        return {"success": False, "error": f"Serverfejl: {str(e)}"}


@socketio.on("send_session_message")
def on_send_session_message(data):
    """Handles a user sending a message within a session chat."""
    sid = request.sid  # type: ignore[attr-defined]
    if not current_user.is_authenticated:
        logger.warning(
            f"Unauthenticated user (SID: {sid}) attempted to send session message. Denying."
        )
        # Optionally, send an error back via ACK if the client expects it
        # return {"success": False, "error": "Authentication required."}
        return  # Or just ignore

    username = current_user.username  # Use username for display
    user_id_str = str(current_user.id)  # For checking room membership

    try:
        session_id = data.get("session_id", "").strip()
        message_text = data.get("message_text", "").strip()

        if not session_id:
            logger.warning(
                f"User {username} (SID: {sid}) sent message without session_id."
            )
            return
        if not message_text:
            logger.debug(
                f"User {username} (SID: {sid}) sent empty message to session {session_id}."
            )
            return  # Ignore empty messages

        # Verify user is part of the session room (important for security)
        actual_room_name = (
            f"session_{session_id}"  # Assuming this is how rooms are named
        )

        # Check if the SID is in the room. Flask-SocketIO manages this.
        # A stricter check could involve Redis:
        # session_players_key = f"{SESSION_PLAYERS_KEY_PREFIX}{session_id}"
        # if not redis_client.sismember(session_players_key, user_id_str):
        #     logger.warning(f"User {username} (SID: {sid}) tried to send message to session {session_id} they are not part of.")
        #     return

        # Sanitize message_text (basic escape for now)
        from html import escape

        sanitized_message = escape(message_text)

        # Max message length
        MAX_MSG_LENGTH = 500
        if len(sanitized_message) > MAX_MSG_LENGTH:
            sanitized_message = sanitized_message[:MAX_MSG_LENGTH] + "..."
            logger.info(
                f"User {username} message to session {session_id} truncated to {MAX_MSG_LENGTH} chars."
            )

        # Construct message object
        avatar_url = current_user.avatar_url  # Accessing the property

        # Fetch user's badges to include icons
        user_badges = current_user.badges.limit(
            5
        ).all()  # Limit for performance/display
        badge_icons = (
            [badge.icon for badge in user_badges if badge.icon] if user_badges else []
        )

        message_payload = {
            "username": username,
            "user_id": user_id_str,  # Send user_id for potential client-side highlighting
            "avatar_url": avatar_url,
            "text": sanitized_message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "badges": badge_icons,  # Add badge icons to payload
        }

        # Emit to the specific session room
        socketio.emit("new_session_message", message_payload, to=actual_room_name)  # type: ignore[call-arg]
        logger.info(
            f"User {username} sent message to session {session_id}: '{sanitized_message[:50]}...'"
        )

    except Exception as e:
        logger.exception(
            f"Error in on_send_session_message for user {username}, data {data}, SID {sid}: {e}"
        )
        # Optionally emit an error to the sender if critical
        # emit("server_error", {"msg": "Fejl ved afsendelse af besked."}, to=sid)


@socketio.on("leave_room")
def on_leave_room(data):  # Reverted to def
    sid = request.sid  # type: ignore[attr-defined]
    if not current_user.is_authenticated:
        logger.warning(
            f"Unauthenticated user (SID: {sid}) attempted to leave room. Ignoring."
        )
        # No emit needed as they shouldn't have been able to join a session room
        return


# --- Live Score Subscription Handler ---
@socketio.on("subscribe_to_live_scores")
def handle_subscribe_to_live_scores(data):
    """Handles client request to subscribe to score updates for specific events."""
    sid = request.sid  # type: ignore[attr-defined]
    if not current_user.is_authenticated:
        logger.warning(
            f"Unauthenticated user (SID: {sid}) attempted to subscribe to live scores."
        )
        # Optionally emit an error back if client expects an ACK or status
        # return {"success": False, "error": "Authentication required"}
        return

    event_ids = data.get("event_ids")
    if not isinstance(event_ids, list):
        logger.warning(
            f"Invalid event_ids format received from {current_user.id} (SID: {sid}): {event_ids}"
        )
        return

    subscribed_rooms = []
    for event_id in event_ids:
        if (
            isinstance(event_id, str) and event_id
        ):  # Basic validation, assuming event_id is the matchId
            room_name = f"match_{event_id}"  # Changed room name for consistency
            try:
                join_room(room_name)
                subscribed_rooms.append(room_name)
            except Exception as e_join:
                logger.error(
                    f"Error joining room '{room_name}' for SID {sid}: {e_join}"
                )

    if subscribed_rooms:
        logger.info(
            f"User {current_user.id} (SID: {sid}) subscribed to live score rooms: {subscribed_rooms}"
        )
        # Optionally send a success confirmation to the client
        # emit('subscription_ack', {'status': 'success', 'subscribed_to': subscribed_rooms}, to=sid)
    else:
        logger.info(
            f"User {current_user.id} (SID: {sid}) sent subscription request but no valid match_ids provided or processed."
        )

    # TODO: Add logic in on_disconnect to leave these match_{matchId} rooms.
    # This might involve tracking which SIDs are in which rooms, or iterating through
    # potential rooms if the list of active events is manageable.
    username = current_user.id
    try:
        room_name_from_client = data.get("room")
        if (
            not room_name_from_client
            or not isinstance(room_name_from_client, str)
            or not room_name_from_client.startswith(
                SESSION_KEY_PREFIX.replace(":", "_")
            )
        ):
            logger.warning(
                f"Leave room failed (invalid room format '{room_name_from_client}') by {username} ({sid})"
            )
            # No emit needed if room format is wrong, client might not be in a valid room.
            return

        session_id = room_name_from_client.split("_", 1)[1]
        actual_room_name = f"{SESSION_KEY_PREFIX.replace(':', '_')}{session_id}"  # Consistent room naming
        session_players_key = f"{SESSION_PLAYERS_KEY_PREFIX}{session_id}"

        logger.info(
            f"User '{username}' ({sid}) attempting to leave room: {actual_room_name}"
        )
        leave_room(actual_room_name)  # SocketIO's leave_room
        emit(
            "status", {"msg": f"Successfully left {actual_room_name}."}, to=sid
        )  # To the user leaving

        # Remove player from Redis set for the session
        removed_count = redis_client.srem(
            session_players_key, username
        )  # Assuming sync
        if removed_count > 0:  # type: ignore[operator]
            logger.info(
                f"Redis: Removed '{username}' from player set for session '{session_id}'."
            )

            # Fetch updated list of players in session
            # Cast the result of smembers directly
            remaining_player_usernames_bytes = cast(
                Set[bytes], redis_client.smembers(session_players_key)
            )
            remaining_player_usernames: Set[str] = {
                uname.decode("utf-8") for uname in remaining_player_usernames_bytes
            }
            remaining_player_details = get_player_details_for_session(
                session_id, remaining_player_usernames  # type: ignore[arg-type]
            )

            # Inform OTHERS in the room
            emit("user_left", {"username": username, "room": actual_room_name}, to=actual_room_name)  # type: ignore[call-arg]
            # Send updated player list to remaining players
            emit("session_update", {"players": remaining_player_details}, to=actual_room_name)  # type: ignore[call-arg]
            logger.info(
                f"Notified room {actual_room_name} that {username} left and sent updated player list."
            )
        else:
            logger.warning(
                f"User '{username}' tried to leave session '{session_id}' but was not found in its Redis player set."
            )

    except redis.RedisError as re:
        logger.exception(
            f"Redis error in leave_room for user {username}, SID {sid}: {re}"
        )
        emit(
            "server_error", {"msg": "Database error processing your request."}, to=sid
        )  # Generic for user
    except Exception as e:
        logger.exception(
            f"Error in leave_room for user {username}, data {data} from SID {sid}: {e}"
        )
        emit("server_error", {"msg": f"Server error leaving room: {str(e)}"}, to=sid)


# It's generally better to attach handlers directly to the socketio instance in __init__.py
# or when the app is created, rather than passing socketio instance around.
# However, if this file is imported and `register_socketio_handlers(socketio_instance)` is called,
# the above handlers will be registered on that instance.
# For this refactor, the @socketio.on decorators assume `socketio` is the instance from `app.extensions`.
logger.info("Socket.IO event handlers defined in app.sockets.")
