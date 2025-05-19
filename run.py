# run.py

# =======================================================
# --- START: Indlæs miljøvariabler fra .env fil ---
# =======================================================
from dotenv import load_dotenv
import os
import sys # Added for sys.exit
import logging

# Sæt log-niveau tidligt for at fange beskeder
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# Find stien til .env filen
basedir = os.path.abspath(os.path.dirname(__file__))
dotenv_path = os.path.join(basedir, '.env')

if os.path.exists(dotenv_path):
    log.info(f"--- Loading environment variables from: {dotenv_path}")
    load_dotenv(dotenv_path=dotenv_path, verbose=True)
else:
    log.warning(f"--- NOTE: .env file not found at expected location ({dotenv_path}). Using system environment variables only.")

# =====================================================
# --- SLUT: Indlæs miljøvariabler fra .env fil ---
# =====================================================


# --- NU importerer og starter vi appen ---
# Importer først *efter* load_dotenv er kørt
try:
    # --- CORRECTED IMPORTS ---
    # Assuming 'apps' is a package (has __init__.py) and 'backend' is a module within 'apps'
    # that contains create_app and socketio (or they are accessible via apps.backend)
    from apps.backend import create_app
    from apps.backend.extensions import socketio
    # -------------------
    log.info("--- Successfully imported create_app from 'apps.backend' and socketio from 'apps.backend.extensions' ---")
except ImportError as e:
    log.critical(f"--- CRITICAL ERROR: Failed importing core components. Error: {e} ---", exc_info=True)
    # Afslut hvis basis import fejler
    import sys
    sys.exit("Failed to import application components. Exiting.")
except Exception as e:
    # Fanger andre uventede fejl under import
    log.critical(f"--- CRITICAL UNEXPECTED ERROR during imports. Error: {e} ---", exc_info=True)
    import sys
    sys.exit("Unexpected error during component import. Exiting.")


# Opret app instans
try:
    app = create_app()
    log.info("--- Flask app instance created ---")
except Exception as e:
    # Fanger fejl inde fra create_app
    log.critical(f"--- CRITICAL ERROR during create_app(): {e} ---", exc_info=True)
    import sys
    sys.exit("Failed during application creation. Exiting.")

# --- CLI Commands ---
@app.cli.command('update-sports')
def update_sports_command():
    """Fetches latest sports catalog from API and updates the database."""
    log.info("CLI: Running 'update-sports' command...")
    # Need app context to access config and db
    with app.app_context():
        try:
            from apps.backend.utils import update_sports_catalog_from_api
            success = update_sports_catalog_from_api()
            if success:
                log.info("CLI: Sports catalog update finished successfully.")
            else:
                log.error("CLI: Sports catalog update failed.")
                sys.exit(1) # Exit with error code if update fails
        except ImportError:
            log.exception("CLI: Failed to import update_sports_catalog_from_api from app.utils.")
            sys.exit(1)
        except Exception as e:
            log.exception(f"CLI: An unexpected error occurred during update-sports: {e}")
            sys.exit(1)

@app.cli.command('update-events')
def update_events_command():
    """Fetches latest sports events and outcomes from API and updates the database."""
    log.info("CLI: Running 'update-events' command...")
    with app.app_context():
        try:
            from apps.backend.utils import update_sport_events
            success = update_sport_events()
            if success:
                log.info("CLI: Sports events update finished successfully.")
            else:
                log.error("CLI: Sports events update failed or had API errors.")
                sys.exit(1) # Exit with error code if update fails
        except ImportError:
            log.exception("CLI: Failed to import update_sport_events from app.utils.")
            sys.exit(1)
        except Exception as e:
            log.exception(f"CLI: An unexpected error occurred during update-events: {e}")
            sys.exit(1)

# Start server
if __name__ == "__main__":
    flask_env = os.environ.get('FLASK_ENV', 'production').lower()
    
    # Determine debug and reloader status directly from FLASK_ENV for socketio.run
    run_in_debug_mode = (flask_env == 'development')
    use_reloader_flag = run_in_debug_mode

    # Set app.debug based on FLASK_ENV as well, for other parts of Flask that might check it
    if run_in_debug_mode:
        app.debug = True
        log.info("FLASK_ENV is 'development', app.debug explicitly set to True.")
    else:
        app.debug = False
        log.info(f"FLASK_ENV is '{flask_env}', app.debug explicitly set to False.")

    log.info(f"--- Starting Flask-SocketIO development server (FLASK_ENV: {flask_env}, SocketIO Debug: {run_in_debug_mode}, Reloader: {use_reloader_flag}) ---")
    
    try:
        host = app.config.get("FLASK_RUN_HOST", "0.0.0.0")
        port = int(app.config.get("FLASK_RUN_PORT", 5000)) # Changed default to 5000

        socketio.run(
            app,
            debug=run_in_debug_mode, 
            host=host,
            port=port,
            use_reloader=use_reloader_flag,
            allow_unsafe_werkzeug=True # Necessary for reloader with newer Werkzeug
        )
    except Exception as e:
        log.exception(f"--- ERROR starting Flask-SocketIO server: {e} ---")
    finally:
        log.info("--- Flask-SocketIO server stopped ---")
