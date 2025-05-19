# app/tasks.py
import logging
import time
from datetime import datetime, timedelta, timezone

import requests # For actual API calls
from flask import current_app # If running within Flask app context for config

# Assuming your extensions and models are accessible like this
# You might need to adjust imports based on your project structure if this is run
# completely outside the Flask app context by a separate scheduler process.
try:
    from .extensions import socketio, db
    from .models import SportEvent, League # Added League
except ImportError:
    # This fallback might be needed if the script is run directly by some schedulers
    # without the full Flask app context being immediately available.
    # However, for Flask-APScheduler, running within app_context is typical.
    from extensions import socketio, db
    from models import SportEvent, League # Added League


logger = logging.getLogger(__name__)

# Dummy score fetcher - replace with actual API call logic
def fetch_score_from_external_api(sport_key, event_id):
    # In a real scenario, this would call The Odds API or similar
    # For testing, we can call our own dummy endpoint if the app is running
    try:
        # This assumes your Flask app is running and accessible at this URL
        # You might need to adjust the base URL depending on your setup
        api_url = f"http://127.0.0.1:5000/api/live_score/{sport_key}/{event_id}" # Adjust port if needed
        response = requests.get(api_url, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Dummy API call failed for {sport_key}/{event_id}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in dummy score fetch for {sport_key}/{event_id}: {e}")
        return None


def periodically_check_and_emit_scores():
    """
    This function would be run periodically by a scheduler.
    It fetches scores for events that clients are subscribed to and emits updates.
    """
    # This task needs to run within an application context to access `current_app`, `db`, etc.
    # If using Flask-APScheduler, it usually handles this.
    # If using an external scheduler, you might need to create an app context manually.
    
    # Check if current_app is available (might not be if run by a simple external scheduler without app context)
    if not current_app:
        logger.error("Cannot run periodically_check_and_emit_scores: Flask current_app is not available.")
        # Depending on your scheduler, you might need to create an app instance and context here.
        # from app import create_app
        # app = create_app()
        # with app.app_context():
        #    _execute_score_check()
        return

    with current_app.app_context():
        _execute_score_check()

def _execute_score_check():
    """The actual logic for checking and emitting scores, to be run within an app context."""
    logger.info("Background task: Checking for live score updates...")
    
    # Fetch events that are potentially live (e.g., started recently, not marked 'ended')
    # This query needs to be adjusted if your SportEvent model has a 'status' field.
    # For now, it fetches events that started in the last 4 hours.
    try:
        potentially_live_events = SportEvent.query.filter(
            SportEvent.commence_time <= datetime.now(timezone.utc), # type: ignore[arg-type]
            SportEvent.commence_time >= datetime.now(timezone.utc) - timedelta(hours=4) # type: ignore[arg-type]
            # TODO: Add a filter for SportEvent.status != 'ended' if you implement such a field
        ).all()

        if not potentially_live_events:
            logger.info("Background task: No potentially live events found to check.")
            return

        for event in potentially_live_events:
            room_name = f"event_score_{event.id}"
            
            # More robust check for active subscriptions:
            # This is a simplified check. For multiple Socket.IO server instances,
            # you'd typically use a message queue (e.g., Redis pub/sub) for inter-process communication
            # or query a shared store where you track active rooms and SIDs.
            # For a single Flask-SocketIO server instance, this can give an indication.
            # Note: socketio.server.rooms may not be fully reliable for "are there any clients in this room?"
            # across all setups, especially with multiple workers.
            # A truly robust solution often involves clients re-subscribing on reconnect
            # and the server perhaps periodically cleaning up "dead" rooms if no heartbeats.
            
            # For now, we'll proceed if the event is potentially live.
            # The client-side handles not finding the score cell if the event is no longer displayed.

            if not event.league:
                logger.warning(f"Event {event.id} is missing league information. Skipping score check.")
                continue
            logger.debug(f"Checking score for event {event.id} (League: {event.league.slug})")
            score_data = fetch_score_from_external_api(event.league.slug, event.id)

            if score_data:
                logger.info(f"Score data fetched for {event.id}: {score_data}. Emitting to room {room_name}")
                payload = {
                    'event_id': event.id,
                    'league_slug': event.league.slug, # Changed from sport_key
                    'score': score_data.get('score'),
                    'status': score_data.get('status'),
                    'minute': score_data.get('minute'),
                    'completed': score_data.get('completed', False)
                }
                socketio.emit('live_score_update', payload, room=room_name) # type: ignore[call-arg]
            else:
                logger.debug(f"No score update or error for event {event.id}.")
        
        logger.info("Background task: Finished checking scores.")

    except Exception as e:
        logger.exception(f"Critical error during _execute_score_check: {e}")


# Example of how you might schedule this with Flask-APScheduler
# (in your app's __init__.py or a dedicated tasks setup file):
#
# from flask_apscheduler import APScheduler
# from .tasks import periodically_check_and_emit_scores
#
# scheduler = APScheduler()
#
# def init_scheduler(app):
#     if not scheduler.running:
#         scheduler.init_app(app)
#         scheduler.add_job(
#             id='live_score_updater_job',
#             func=periodically_check_and_emit_scores,
#             trigger='interval',
#             seconds=30, # Adjust interval as needed
#             replace_existing=True
#         )
#         scheduler.start()
#         logger.info("APScheduler started for live score updates.")
#
# In create_app() in __init__.py:
#   from . import tasks
#   tasks.init_scheduler(app)