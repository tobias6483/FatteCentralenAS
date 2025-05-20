# app/routes/api_sports.py

import logging
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import Date as SQLDate  # For date casting
from sqlalchemy import cast

from ..extensions import db  # If direct db session usage is needed
from ..models import (  # Added SportOutcome, SportCategory
    League,
    SportCategory,
    SportEvent,
    SportOutcome,
)

log = logging.getLogger(__name__)
sports_api_bp = Blueprint("sports_api", __name__, url_prefix="/api/v1/sports")
matches_api_bp = Blueprint("matches_api", __name__, url_prefix="/api/v1/matches")


@sports_api_bp.route("", methods=["GET"])
def get_sports_list():
    """
    Returns a list of available sport categories, each with their leagues.
    Matches the designed API structure.
    """
    try:
        sport_categories = SportCategory.query.order_by(SportCategory.name).all()

        response_data = []
        for category in sport_categories:
            leagues_data = []
            # Assuming 'leagues' is the relationship name in SportCategory model
            # and it's configured for lazy='dynamic' or similar to allow further filtering/ordering
            active_leagues = category.leagues.filter(League.active).order_by(League.name).all()  # type: ignore

            for league in active_leagues:
                leagues_data.append(
                    {
                        "id": league.id,
                        "name": league.name,
                        "slug": league.slug,
                        "country": league.country,
                        "logo_url": league.logo_url,
                    }
                )

            response_data.append(
                {
                    "id": category.id,
                    "name": category.name,
                    "slug": category.slug,
                    "icon": category.icon,
                    "leagues": leagues_data,
                }
            )

        return jsonify(response_data), 200

    except Exception as e:
        log.exception(f"Error fetching structured sports list: {e}")
        return (
            jsonify(
                {"error": "Intern serverfejl ved hentning af sportsgrene og ligaer."}
            ),
            500,
        )


@sports_api_bp.route(
    "/<string:league_slug>/matches", methods=["GET"]
)  # Renamed sport_key to league_slug for clarity
def get_league_matches(league_slug: str):  # Renamed sport_key to league_slug
    """
    Returns a list of matches for a given league_slug.
    Optional query parameters:
    - status: "upcoming", "live", "finished", "scheduled", "postponed", "cancelled" (uses SportEvent.status)
    - date: "YYYY-MM-DD" (filters by SportEvent.commence_time)
    """
    try:
        league = League.query.filter_by(slug=league_slug).first()
        if not league:
            return jsonify({"error": "Liga ikke fundet."}), 404

        query = SportEvent.query.filter_by(league_id=league.id)

        date_str = request.args.get("date")
        if date_str:
            try:
                filter_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                date_start_utc = datetime(
                    filter_date.year,
                    filter_date.month,
                    filter_date.day,
                    0,
                    0,
                    0,
                    tzinfo=timezone.utc,
                )
                date_end_utc = date_start_utc + timedelta(days=1)
                query = query.filter(SportEvent.commence_time >= date_start_utc, SportEvent.commence_time < date_end_utc)  # type: ignore[operator]
                log.debug(
                    f"Filtering matches for league '{league_slug}' on date: {date_str}"
                )
            except ValueError:
                return jsonify({"error": "Ugyldigt datoformat. Brug YYYY-MM-DD."}), 400

        status_param = request.args.get("status")
        if status_param:
            # Filter directly on the SportEvent.status field
            valid_statuses = [
                "scheduled",
                "live",
                "finished",
                "postponed",
                "cancelled",
                "upcoming",
            ]  # "upcoming" can be derived or a specific status
            if status_param.lower() in valid_statuses:
                if status_param.lower() == "upcoming":
                    query = query.filter(SportEvent.commence_time > datetime.now(timezone.utc))  # type: ignore[operator]
                else:
                    query = query.filter(SportEvent.status == status_param.lower())  # type: ignore[operator]
            else:
                return (
                    jsonify(
                        {
                            "error": f"Ugyldig status. Tilladte værdier: {', '.join(valid_statuses)}."
                        }
                    ),
                    400,
                )
            log.debug(
                f"Filtering matches for league '{league_slug}' by status: {status_param}"
            )

        matches = query.order_by(SportEvent.commence_time).all()  # type: ignore[arg-type]

        response_data = []
        for match in matches:
            home_team_data = None
            if match.home_team_obj:
                home_team_data = {
                    "id": match.home_team_obj.id,
                    "name": match.home_team_obj.name,
                    "short_name": match.home_team_obj.short_name,
                    "slug": match.home_team_obj.slug,
                    "logo_url": match.home_team_obj.logo_url,
                }
            elif match.home_team_name_raw:  # Fallback if team object not linked
                home_team_data = {"name": match.home_team_name_raw}

            away_team_data = None
            if match.away_team_obj:
                away_team_data = {
                    "id": match.away_team_obj.id,
                    "name": match.away_team_obj.name,
                    "short_name": match.away_team_obj.short_name,
                    "slug": match.away_team_obj.slug,
                    "logo_url": match.away_team_obj.logo_url,
                }
            elif match.away_team_name_raw:  # Fallback
                away_team_data = {"name": match.away_team_name_raw}

            scores_data = {
                "home": match.home_score,
                "away": match.away_score,
                "period1_home": match.home_score_period1,
                "period1_away": match.away_score_period1,
                "period2_home": match.home_score_period2,
                "period2_away": match.away_score_period2,
                "overtime_home": match.home_score_overtime,
                "overtime_away": match.away_score_overtime,
                "penalties_home": match.home_score_penalties,
                "penalties_away": match.away_score_penalties,
            }

            league_data = {  # Provide context of the league these matches belong to
                "id": league.id,
                "name": league.name,
                "slug": league.slug,
            }

            response_data.append(
                {
                    "id": match.id,
                    "commence_time": (
                        match.commence_time.isoformat() if match.commence_time else None
                    ),
                    "status": match.status,  # Use the direct status from the model
                    "minute": match.minute,
                    "period": match.period,
                    "home_team": home_team_data,
                    "away_team": away_team_data,
                    "scores": scores_data,
                    "league": league_data,
                }
            )

        return jsonify(response_data), 200

    except Exception as e:
        log.exception(f"Error fetching matches for league {league_slug}: {e}")
        return jsonify({"error": "Intern serverfejl ved hentning af kampe."}), 500


# Endpoint for specific match details, now under its own blueprint


@matches_api_bp.route("/<string:match_id>", methods=["GET"])
def get_match_details(match_id: str):
    """
    Returns detailed information for a specific sport event (match),
    including available outcomes, statistics, timeline, etc.
    """
    try:
        match = SportEvent.query.get(match_id)
        if not match:
            return jsonify({"error": "Kamp ikke fundet."}), 404

        home_team_data = None
        if match.home_team_obj:
            home_team_data = {
                "id": match.home_team_obj.id,
                "name": match.home_team_obj.name,
                "short_name": match.home_team_obj.short_name,
                "slug": match.home_team_obj.slug,
                "logo_url": match.home_team_obj.logo_url,
            }
        elif match.home_team_name_raw:
            home_team_data = {"name": match.home_team_name_raw}

        away_team_data = None
        if match.away_team_obj:
            away_team_data = {
                "id": match.away_team_obj.id,
                "name": match.away_team_obj.name,
                "short_name": match.away_team_obj.short_name,
                "slug": match.away_team_obj.slug,
                "logo_url": match.away_team_obj.logo_url,
            }
        elif match.away_team_name_raw:
            away_team_data = {"name": match.away_team_name_raw}

        scores_data = {
            "home": match.home_score,
            "away": match.away_score,
            "period1_home": match.home_score_period1,
            "period1_away": match.away_score_period1,
            "period2_home": match.home_score_period2,
            "period2_away": match.away_score_period2,
            "overtime_home": match.home_score_overtime,
            "overtime_away": match.away_score_overtime,
            "penalties_home": match.home_score_penalties,
            "penalties_away": match.away_score_penalties,
        }

        league_data = None
        if match.league:
            league_data = {
                "id": match.league.id,
                "name": match.league.name,
                "slug": match.league.slug,
                "country": match.league.country,
                "logo_url": match.league.logo_url,
            }

        sport_category_data = None
        if match.league and match.league.sport_category:
            sport_category_data = {
                "id": match.league.sport_category.id,
                "name": match.league.sport_category.name,
                "slug": match.league.sport_category.slug,
            }

        # Group outcomes by bookmaker and then by market_key
        outcomes_by_bookmaker = {}
        for outcome in match.outcomes.all():  # type: ignore
            bookmaker_entry = outcomes_by_bookmaker.setdefault(outcome.bookmaker, {})
            market_entry = bookmaker_entry.setdefault(
                outcome.market_key,
                {
                    "market_name": outcome.market_key.replace(
                        "_", " "
                    ).title(),  # Basic market name generation
                    "selections": [],
                    "last_update_api": None,  # Will be updated with the latest outcome update for this market
                },
            )
            market_entry["selections"].append(
                {"name": outcome.name, "price": outcome.price, "point": outcome.point}
            )
            if outcome.last_update_api:
                current_latest = market_entry["last_update_api"]
                if (
                    not current_latest
                    or outcome.last_update_api
                    > datetime.fromisoformat(current_latest.replace("Z", "+00:00"))
                ):
                    market_entry["last_update_api"] = (
                        outcome.last_update_api.isoformat()
                        if outcome.last_update_api
                        else None
                    )

        # Transform the grouped outcomes into the desired list format
        final_outcomes_data = []
        for bookmaker, markets in outcomes_by_bookmaker.items():
            for market_key, market_details in markets.items():
                final_outcomes_data.append(
                    {
                        "bookmaker": bookmaker,
                        "market_key": market_key,
                        "market_name": market_details["market_name"],
                        "selections": market_details["selections"],
                        "last_update_api": market_details["last_update_api"],
                    }
                )

        event_data = {
            "id": match.id,
            "commence_time": (
                match.commence_time.isoformat() if match.commence_time else None
            ),
            "status": match.status,  # Direct from model
            "minute": match.minute,
            "period": match.period,
            "home_team": home_team_data,
            "away_team": away_team_data,
            "scores": scores_data,
            "league": league_data,
            "sport_category": sport_category_data,
            "venue_info": match.venue_info,  # Assumes JSON serializable
            "statistics": match.statistics,  # Assumes JSON serializable
            "timeline_events": match.timeline_events,  # Assumes JSON serializable
            "lineups": match.lineups,  # Assumes JSON serializable
            "outcomes": final_outcomes_data,
            "last_api_update": (
                match.last_api_update.isoformat() if match.last_api_update else None
            ),  # SportEvent.last_api_update
        }

        return jsonify(event_data), 200

    except Exception as e:
        log.exception(f"Error fetching details for match {match_id}: {e}")
        return (
            jsonify({"error": "Intern serverfejl ved hentning af kampdetaljer."}),
            500,
        )
