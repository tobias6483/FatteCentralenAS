# app/routes/api_sports.py

import logging
from flask import Blueprint, jsonify, request
from sqlalchemy import cast, Date as SQLDate # For date casting
from datetime import datetime, timedelta, timezone

from ..models import League, SportEvent, SportOutcome, SportCategory # Added SportOutcome, SportCategory
from ..extensions import db # If direct db session usage is needed

log = logging.getLogger(__name__)
sports_api_bp = Blueprint("sports_api", __name__, url_prefix="/api/v1/sports")

@sports_api_bp.route("", methods=["GET"])
def get_sports_list():
    """
    Returns a list of available sports.
    """
    try:
        # Query active sports, ordered by group then title
        # Query active leagues, ordered by sport_category.name then league.name
        # We need to join with SportCategory to order by its name
        leagues = League.query.join(SportCategory).filter(League.active == True).order_by(SportCategory.name, League.name).all()
        
        sports_data = []
        for league in leagues:
            sports_data.append({
                "key": league.slug, # Corresponds to the old 'key', used by external APIs
                "title": league.name,
                "group": league.sport_category.name if league.sport_category else "Unknown",
                "active": league.active
                # Add more fields if needed
            })
            
        return jsonify(sports_data), 200
        
    except Exception as e:
        log.exception(f"Error fetching sports list: {e}")
        return jsonify({"error": "Intern serverfejl ved hentning af sportsgrene."}), 500


@sports_api_bp.route("/<string:sport_key>/matches", methods=["GET"])
def get_sport_matches(sport_key: str):
    """
    Returns a list of matches for a given sport_key.
    Optional query parameters:
    - status: "upcoming", "live", "finished"
    - date: "YYYY-MM-DD"
    """
    try:
        # Find the league by its slug (which corresponds to the old sport_key)
        league = League.query.filter_by(slug=sport_key).first()
        if not league:
            return jsonify({"error": "Liga/Sportsgren ikke fundet."}), 404

        # Filter SportEvent by league_id
        query = SportEvent.query.filter_by(league_id=league.id)

        # Filter by date
        date_str = request.args.get("date")
        if date_str:
            try:
                filter_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                # Filter events where commence_time is on the filter_date (UTC)
                # We need to compare the date part of commence_time (which is UTC)
                # with the provided date.
                # One way is to filter for commence_time >= date_start_utc AND commence_time < date_end_utc
                
                # Create timezone-aware datetime objects for the start and end of the filter_date in UTC
                date_start_utc = datetime(filter_date.year, filter_date.month, filter_date.day, 0, 0, 0, tzinfo=timezone.utc)
                date_end_utc = date_start_utc + timedelta(days=1)
                
                query = query.filter(SportEvent.commence_time >= date_start_utc, SportEvent.commence_time < date_end_utc) # type: ignore[operator]
                log.debug(f"Filtering matches for sport '{sport_key}' on date: {date_str} (UTC range: {date_start_utc} to {date_end_utc})")
            except ValueError:
                return jsonify({"error": "Ugyldigt datoformat. Brug YYYY-MM-DD."}), 400

        # Filter by status (derived from commence_time)
        status = request.args.get("status")
        now_utc = datetime.now(timezone.utc)
        # Approximate duration of a match for "live" and "finished" status
        # This could be made configurable or even sport-specific in the future
        APPROX_MATCH_DURATION_HOURS = 3
        
        if status:
            if status == "upcoming":
                query = query.filter(SportEvent.commence_time > now_utc) # type: ignore[operator]
            elif status == "live":
                # Match started but not yet "finished" by our approximation
                live_start_threshold = now_utc - timedelta(hours=APPROX_MATCH_DURATION_HOURS)
                query = query.filter(SportEvent.commence_time <= now_utc, SportEvent.commence_time > live_start_threshold) # type: ignore[operator]
            elif status == "finished":
                finished_threshold = now_utc - timedelta(hours=APPROX_MATCH_DURATION_HOURS)
                query = query.filter(SportEvent.commence_time <= finished_threshold) # type: ignore[operator]
            else:
                return jsonify({"error": "Ugyldig status. Tilladte værdier: upcoming, live, finished."}), 400
            log.debug(f"Filtering matches for sport '{sport_key}' by status: {status}")

        matches = query.order_by(SportEvent.commence_time).all() # type: ignore[arg-type]

        matches_data = []
        for match in matches:
            # Determine status for each match if not already filtered by a specific status
            # This is for display purposes if no status filter was applied or to be more precise
            current_match_status = "unknown"
            if match.commence_time > now_utc:
                current_match_status = "upcoming"
            elif match.commence_time <= now_utc and match.commence_time > (now_utc - timedelta(hours=APPROX_MATCH_DURATION_HOURS)):
                current_match_status = "live" # Approximation
            elif match.commence_time <= (now_utc - timedelta(hours=APPROX_MATCH_DURATION_HOURS)):
                current_match_status = "finished" # Approximation

            matches_data.append({
                "id": match.id,
                "league_slug": match.league.slug if match.league else None, # Changed from sport_key
                "commence_time": match.commence_time.isoformat() if match.commence_time else None,
                "home_team": match.home_team_display_name, # Use display name
                "away_team": match.away_team_display_name, # Use display name
                "last_update_api": match.last_api_data_fetch.isoformat() if match.last_api_data_fetch else None, # Corrected attribute
                "derived_status": current_match_status # Add the derived status
                # Add scores here if/when the model supports them
            })
        
        return jsonify(matches_data), 200

    except Exception as e:
        log.exception(f"Error fetching matches for sport {sport_key}: {e}")
        return jsonify({"error": "Intern serverfejl ved hentning af kampe."}), 500


@sports_api_bp.route("/matches/<string:match_id>", methods=["GET"])
def get_match_details(match_id: str):
    """
    Returns details for a specific match, including available outcomes.
    """
    try:
        match = SportEvent.query.get(match_id)
        if not match:
            return jsonify({"error": "Kamp ikke fundet."}), 404

        # Determine derived status for the match
        now_utc = datetime.now(timezone.utc)
        APPROX_MATCH_DURATION_HOURS = 3 # Consistent with the list endpoint
        derived_status = "unknown"
        if match.commence_time > now_utc:
            derived_status = "upcoming"
        elif match.commence_time <= now_utc and match.commence_time > (now_utc - timedelta(hours=APPROX_MATCH_DURATION_HOURS)):
            derived_status = "live"
        elif match.commence_time <= (now_utc - timedelta(hours=APPROX_MATCH_DURATION_HOURS)):
            derived_status = "finished"

        outcomes_data = []
        # SportEvent.outcomes is a dynamic relationship, so .all() executes the query
        for outcome in match.outcomes.all(): # type: ignore
            outcomes_data.append({
                "id": outcome.id,
                "bookmaker": outcome.bookmaker,
                "market_key": outcome.market_key,
                "name": outcome.name,
                "price": outcome.price,
                "point": outcome.point,
                "last_update_api": outcome.last_update_api.isoformat() if outcome.last_update_api else None,
            })

        match_data = {
            "id": match.id,
            "league_slug": match.league.slug if match.league else None, # Changed from sport_key
            "commence_time": match.commence_time.isoformat() if match.commence_time else None,
            "home_team": match.home_team_display_name, # Use display name
            "away_team": match.away_team_display_name, # Use display name
            "last_update_api": match.last_api_data_fetch.isoformat() if match.last_api_data_fetch else None, # Corrected attribute
            "derived_status": derived_status,
            "outcomes": outcomes_data
        }
        
        return jsonify(match_data), 200

    except Exception as e:
        log.exception(f"Error fetching details for match {match_id}: {e}")
        return jsonify({"error": "Intern serverfejl ved hentning af kampdetaljer."}), 500