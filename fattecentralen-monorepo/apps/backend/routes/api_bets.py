# app/routes/api_bets.py

import logging
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import desc  # Import desc for ordering

from ..extensions import db
from ..models import BetHistory, SportEvent, SportOutcome, User

log = logging.getLogger(__name__)
bets_api_bp = Blueprint("bets_api", __name__, url_prefix="/api/v1/bets")

# Configuration (could be moved to app config)
MAX_BETTING_INTO_LIVE_MINUTES = (
    5  # Allow betting up to 5 minutes after official start time
)


@bets_api_bp.route("/place", methods=["POST"])
@jwt_required()
def place_bet():
    """
    Places a bet on a specific match outcome.
    Requires JWT authentication.
    Payload:
    {
        "match_id": "string_event_id",
        "outcome_id": integer_outcome_id,
        "stake": float_amount
    }
    """
    current_user_identity = (
        get_jwt_identity()
    )  # This is the user's ID (or username, depending on JWT setup)

    # Assuming JWT identity is the user's username, fetch the user object
    # If it's user.id, adjust accordingly. For now, assuming it's user.id as per User model.
    try:
        user_id = int(current_user_identity)
        user = User.query.get(user_id)
    except ValueError:
        log.error(f"Invalid user_id format in JWT: {current_user_identity}")
        return jsonify({"error": "Ugyldigt bruger ID format i token."}), 401  # Or 400

    if not user:
        log.warning(f"User not found for JWT identity: {current_user_identity}")
        return jsonify({"error": "Bruger ikke fundet."}), 401  # Or 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Manglende JSON payload."}), 400

    match_id = data.get("match_id")
    outcome_id = data.get("outcome_id")
    stake_str = data.get("stake")

    if not all([match_id, outcome_id, stake_str]):
        return (
            jsonify(
                {"error": "Manglende felter: match_id, outcome_id, stake er påkrævet."}
            ),
            400,
        )

    try:
        stake = float(stake_str)
        if stake <= 0:
            return jsonify({"error": "Indsats skal være et positivt beløb."}), 400
    except ValueError:
        return jsonify({"error": "Ugyldigt format for indsats. Skal være et tal."}), 400

    # Fetch SportEvent (match) and SportOutcome
    match = SportEvent.query.get(match_id)
    if not match:
        return jsonify({"error": "Kamp ikke fundet."}), 404

    outcome = SportOutcome.query.filter_by(id=outcome_id, event_id=match_id).first()
    if not outcome:
        return jsonify({"error": "Valgt udfald ikke fundet for denne kamp."}), 404

    # --- Business Logic Checks ---
    # 1. Check if match is still open for betting
    now_utc = datetime.now(timezone.utc)
    betting_deadline = match.commence_time + timedelta(
        minutes=MAX_BETTING_INTO_LIVE_MINUTES
    )

    if now_utc > betting_deadline:
        log.warning(
            f"Bet attempt on match {match_id} after betting deadline. Now: {now_utc}, Deadline: {betting_deadline}"
        )
        return (
            jsonify(
                {
                    "error": "Spil er lukket for denne kamp (kampen er startet eller afsluttet)."
                }
            ),
            403,
        )

    # 2. Check user balance
    if user.balance < stake:
        log.warning(
            f"User {user.id} insufficient balance. Has: {user.balance}, Needs: {stake}"
        )
        return jsonify({"error": "Utilstrækkelig saldo."}), 403

    # --- Perform Bet Placement ---
    try:
        # Deduct stake from user balance
        user.balance -= stake

        # Create BetHistory record
        match_name_display = (
            f"{match.home_team} vs {match.away_team}"
            if match.home_team and match.away_team
            else f"Event ID: {match.id}"
        )

        new_bet = BetHistory(
            user_id=user.id,
            session_id=match.id,  # Using match_id as session_id for this context
            match_name=match_name_display,
            outcome_name=outcome.name,  # e.g., "Team A to win", "Over 2.5"
            stake=stake,
            payout=0.0,  # Will be calculated upon resolution
            result="pending",
            status="open",
            timestamp=now_utc,
        )
        # Note: BetHistory model has an explicit __init__
        # Ensure all required fields are passed or have defaults.

        db.session.add(user)  # Add user to session to save balance change
        db.session.add(new_bet)
        db.session.commit()

        log.info(
            f"User {user.id} placed bet {new_bet.id} (stake: {stake}) on outcome {outcome.id} for match {match.id}"
        )

        return (
            jsonify(
                {
                    "message": "Spil placeret succesfuldt!",
                    "bet_id": new_bet.id,
                    "new_balance": user.balance,
                    "match_details": {
                        "match_id": match.id,
                        "home_team": match.home_team,
                        "away_team": match.away_team,
                        "commence_time": match.commence_time.isoformat(),
                    },
                    "outcome_details": {
                        "outcome_id": outcome.id,
                        "name": outcome.name,
                        "price": outcome.price,
                    },
                    "stake_placed": stake,
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        log.exception(f"Error placing bet for user {user.id} on match {match_id}: {e}")
        return jsonify({"error": "Intern serverfejl under placering af spil."}), 500


@bets_api_bp.route("/history", methods=["GET"])
@jwt_required()
def get_bet_history():
    """
    Retrieves the authenticated user's betting history.
    Supports pagination via query parameters: 'page' (default 1) and 'per_page' (default 10).
    """
    current_user_identity = get_jwt_identity()
    try:
        user_id = int(current_user_identity)
        user = User.query.get(user_id)
    except ValueError:
        log.error(
            f"Invalid user_id format in JWT for bet history: {current_user_identity}"
        )
        return jsonify({"error": "Ugyldigt bruger ID format i token."}), 401

    if not user:
        log.warning(
            f"User not found for JWT identity for bet history: {current_user_identity}"
        )
        return jsonify({"error": "Bruger ikke fundet."}), 401

    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)

        if page < 1:
            page = 1
        if per_page < 1:
            per_page = 1
        if per_page > 100:
            per_page = 100  # Max per page

        # Query BetHistory for the user, ordered by timestamp descending
        # BetHistory.user relationship is defined by backref in User.bet_history_entries
        # So we can query directly on BetHistory model

        user_bets_query = BetHistory.query.filter_by(user_id=user.id).order_by(desc(BetHistory.timestamp))  # type: ignore[arg-type] # Use imported desc()

        paginated_bets = user_bets_query.paginate(
            page=page, per_page=per_page, error_out=False
        )

        bets_data = []
        for bet in paginated_bets.items:
            bets_data.append(
                {
                    "id": bet.id,
                    "session_id": bet.session_id,  # This is the match_id
                    "match_name": bet.match_name,
                    "outcome_name": bet.outcome_name,
                    "stake": bet.stake,
                    "payout": bet.payout,
                    "result": bet.result,  # "pending", "won", "lost", "cancelled"
                    "status": bet.status,  # "open", "afgjort" (settled)
                    "timestamp": bet.timestamp.isoformat() if bet.timestamp else None,
                }
            )

        return (
            jsonify(
                {
                    "bets": bets_data,
                    "total_bets": paginated_bets.total,
                    "current_page": paginated_bets.page,
                    "per_page": paginated_bets.per_page,
                    "total_pages": paginated_bets.pages,
                    "has_next": paginated_bets.has_next,
                    "has_prev": paginated_bets.has_prev,
                }
            ),
            200,
        )

    except Exception as e:
        log.exception(f"Error fetching bet history for user {user.id}: {e}")
        return (
            jsonify({"error": "Intern serverfejl ved hentning af spilhistorik."}),
            500,
        )
