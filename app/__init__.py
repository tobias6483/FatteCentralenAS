# app/__init__.py

# === Standard Library Imports ===
import logging
from logging.handlers import RotatingFileHandler
import locale
import os
import sys # Bruges i render_error_page
from datetime import timedelta, datetime, date, timezone
from typing import Any, Optional, Dict, List

# app/__init__.py
import logging
from logging.handlers import RotatingFileHandler
import os
# ... andre imports ...
from flask import Flask, session, request, redirect, url_for, g, flash, render_template, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix # Import ProxyFix
from flask_login import LoginManager, current_user
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO
from flask_wtf.csrf import CSRFProtect, CSRFError

# === Konfigurer Logging HELT FØRST ===
# Definer log før den bruges andre steder (f.eks. ved import fejl)
# Basis konfiguration, kan overskrives senere
log_level = logging.INFO # Default level før config læses
log_format = '%(asctime)s %(levelname)s %(name)s : %(message)s [in %(pathname)s:%(lineno)d]'
logging.basicConfig(level=log_level, format=log_format)
log = logging.getLogger(__name__) # Få root logger for init fasen

# === Importer Config Før Alt Andet ===
try:
    # Antager config.py ligger i samme mappe ('app')
    # Og at config.py definerer INSTANCE_FOLDER_PATH globalt
    from .config import Config, INSTANCE_FOLDER_PATH, PROJECT_ROOT, log_config_values
    log.info("Successfully imported Config class and INSTANCE_FOLDER_PATH.")
except ImportError as e:
    log.critical(f"CRITICAL FAILURE: Cannot import Config from .config: {e}. Check config.py existence and syntax.")
    # Gør det klart at appen ikke kan starte
    print(f"FATAL: Failed to import configuration from app/config.py - {e}", file=sys.stderr)
    sys.exit(1) # Stop programmet hvis config mangler
except Exception as e:
     log.critical(f"CRITICAL FAILURE during config import: {e}", exc_info=True)
     print(f"FATAL: Unexpected error during configuration import - {e}", file=sys.stderr)
     sys.exit(1)


# === Third Party Imports ===
from flask_cors import CORS # Import CORS
try:
    from flask import Flask, render_template, request, session, g, jsonify, url_for, send_from_directory
    from flask_login import LoginManager, current_user
    from jinja2 import FileSystemLoader, TemplateNotFound, ChoiceLoader # ChoiceLoader hvis du har flere template dirs
    from werkzeug.exceptions import HTTPException, NotFound, Forbidden, BadRequest, Unauthorized, MethodNotAllowed, InternalServerError
    from sqlalchemy import select, func, desc, update as sql_update # Eller `from sqlalchemy.sql import select` afhængig af din opsætning
except ImportError as e:
    log.critical(f"CRITICAL FAILURE: Missing essential Flask or related libraries: {e}")
    print(f"FATAL: Essential Python packages (Flask, Jinja2, Werkzeug) are missing. Install requirements.txt. Error: {e}", file=sys.stderr)
    sys.exit(1)
import redis # For Redis client

# =============================================
#              HELPER FUNKTIONER
# =============================================

# --- Jinja Filtre ---
def _register_jinja_filters(app: Flask):
    """Register custom Jinja2 filters."""
    log.debug("Registering custom Jinja filters...")
    try:
        from .utils import _parse_datetime_string # Importer hjælpefunktion
    except ImportError:
        log.error("Cannot import _parse_datetime_string from utils. Datetime filter will be basic.")
        # Definer dummy funktion hvis utils mangler
        def _parse_datetime_string(val): return None

    @app.template_filter('currency')
    def format_currency_filter(value: Any) -> str:
        try:
            val = float(value)
            # Brug 'da_DK.UTF-8' eksplicit for konsistens, hvis locale fejler brug simpel format
            try:
                current_locale = locale.getlocale(locale.LC_MONETARY)
                # log.debug(f"Current monetary locale for currency: {current_locale}") # Lidt støjende
                # Nogle systemer returnerer (None, None) hvis ikke sat
                if not all(current_locale):
                     locale.setlocale(locale.LC_MONETARY, 'da_DK.UTF-8') # Prøv at sætte den igen? Risky.

                return locale.currency(val, grouping=True, symbol='kr.') # Eksplicit symbol
            except locale.Error:
                log.warning(f"Locale 'da_DK.UTF-8' likely not installed or supported. Using simple f-string format for currency '{value}'.")
                return f"{val:,.2f} kr." # Fallback format
        except (ValueError, TypeError) as e:
            log.warning(f"Invalid value for currency filter: '{value}'. Error: {e}")
            return str(value) # Returner original hvis den ikke kan konverteres
        except Exception: # Fang alle andre uventede fejl
             log.exception(f"Unexpected error in currency filter for value '{value}'")
             return str(value)

    @app.template_filter('dt')
    def format_datetime_filter(value: Any, format: Optional[str] = None, relative: bool = False) -> str:
    #                                    ^^^^^^^ RETTET HER: 'fmt' -> 'format'
        """Formats a datetime object or an ISO string. Supports relative time."""
        dt_obj = None
        if isinstance(value, datetime): dt_obj = value
        elif isinstance(value, str): dt_obj = _parse_datetime_string(value) # Antager denne er tilgængelig

        if not dt_obj: return str(value) # Returner original hvis den ikke kan parses

        # Relativ tid (f.eks. "for 2 timer siden")
        if relative:
            # from datetime import datetime, timezone
            try:
                # Sørg for 'arrow' er installeret: pip install arrow
                from arrow import get as arrow_get # Importeres kun når nødvendig
                now = datetime.now(timezone.utc) # Brug aware 'now' for korrekt sammenligning
                # Sørg for dt_obj er aware UTC til sammenligning
                if dt_obj.tzinfo is None: # Hvis dt_obj er naiv (antaget UTC)
                    dt_obj_aware = dt_obj.replace(tzinfo=timezone.utc)
                else: # Hvis dt_obj allerede er aware, konverter til UTC
                    dt_obj_aware = dt_obj.astimezone(timezone.utc)

                # 'da_dk' for dansk output
                return arrow_get(dt_obj_aware).humanize(now, locale='da_dk')
            except ImportError:
                 log.warning("Package 'arrow' not installed (run 'pip install arrow'). Cannot generate relative time.")
            except Exception as e: # Mere specifik fejlbesked
                 log.exception(f"Error generating relative time for value '{value}': {e}")
            # Fald igennem til standard formatering hvis relativ fejler eller arrow mangler

        # Standard formatering
        default_format = '%d. %b %Y, %H:%M' # Din oprindelige default
        target_fmt = default_format # Start med default

        try:
            # Brug det nye parameternavn 'format' til at vælge format string
            # Sammenligner mod det specificerede 'format' argument fra template
            if format == 'shortdate':
                target_fmt = '%d/%m-%Y'
            elif format == 'dateonly': # Tilføj flere genveje hvis du vil
                target_fmt = '%d. %b %Y'
            elif format == 'timeonly':
                 target_fmt = '%H:%M'
            elif format == 'long':
                 target_fmt = '%A d. %B %Y, %H:%M:%S'
            elif format: # Hvis 'format' er sat, men ikke er en af de kendte, antag det er en valid strftime streng
                 target_fmt = format # Brug den streng direkte
            # Hvis 'format' var None (eller tom), beholdes default_format

            # Endelig formatering
            return dt_obj.strftime(target_fmt)
        except ValueError:
             log.warning(f"Invalid strftime format string '{target_fmt}' provided/derived for 'dt' filter (input format='{format}').")
             return str(value) # Fallback ved ugyldigt format
        except Exception as e:
             log.exception(f"Unexpected error during datetime formatting (format='{format}'): {e}")
             return str(value) # Generel fallback

    # ----- SLUT PÅ RETTET DATETIME FILTER -----

    log.info("Custom Jinja filters registered.")


# --- Context Processors ---
def _register_context_processors(app: Flask):
    """Register context processors for templates."""
    log.debug("Registering Jinja context processors...")
    try:
        from .utils import get_common_context # Importer helper
    except ImportError:
        log.error("Could not import get_common_context from utils! Template context may be incomplete.")
        def get_common_context(): return {}

    @app.context_processor
    def inject_common_context():
        """Injects common data into all templates."""
        try:
             common_data = get_common_context() # Kald helper
             common_data['config'] = {'APP_NAME': app.config.get('APP_NAME')} # Gør APP_NAME tilgængelig
             return common_data
        except Exception as e:
             log.exception(f"CRITICAL ERROR in context processor get_common_context: {e}")
             return {} # Returner tom dict for at undgå total crash

    log.info("Jinja context processors registered.")


# --- Error Handlers ---
def _render_error_page(error):
    """Internal helper to render standard error pages safely."""
    from flask import current_app
    error_code = getattr(error, 'code', 500) # Få status kode fra exception
    error_description = getattr(error, 'description', str(error))
    is_severe = error_code >= 500 and not isinstance(error, HTTPException)

    # Log fejlen
    try: path = request.path
    except RuntimeError: path = 'N/A (outside request)'
    log_func = log.exception if is_severe else log.error
    log_func(f"HTTP Error {error_code} [{error.__class__.__name__}] on path '{path}': {error_description}")

    # Forsøg DB rollback ved fejl
    try:
        from .extensions import db
        if db.session.is_active:
             db.session.rollback(); log.info("DB session rolled back due to error.")
    except Exception: pass # Ignorer fejl under rollback

    # Prøv at rendere pæn fejlside, med fallback
    try:
        template_list = [f"errors/{error_code}.html", "errors/generic.html"]
        # Kun send exception info hvis DEBUG
        exc_info_for_template = sys.exc_info() if current_app.debug else None
        return render_template(template_list,
                               error_code=error_code, error_description=error_description,
                               title=f"Fejl {error_code}",
                               exc_info=exc_info_for_template), error_code
    except Exception: # Fejl under rendering af fejlside
        log.exception(f"CRITICAL: FAILED TO RENDER ERROR PAGE for code {error_code}!")
        # Simpel HTML fallback
        return f"<h1>Fejl {error_code}</h1><p>{error_description}. Kunne ikke vise standard fejlside.</p>", error_code


def _register_error_handlers(app: Flask):
    """Registers error handlers for common HTTP errors and general exceptions."""
    log.debug("Registering custom error handlers...")
    for code in [400, 401, 403, 404, 405, 410, 500, 501, 502, 503]:
         app.register_error_handler(code, _render_error_page)

    # Specifik handler for rate limit (429) for evt. JSON respons
    @app.errorhandler(429)
    def handle_rate_limit_exceeded(error):
         if request and request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
              return jsonify(error=getattr(error, 'description', 'Rate limit exceeded')), 429
         # Ellers brug standard fejlside
         return _render_error_page(error)

    # General exception handler (for ting der ikke er HTTPExceptions)
    @app.errorhandler(Exception)
    def handle_general_exception(error):
        # Brug standard fejlside med status 500 for uventede fejl
        # _render_error_page vil logge med 'exception' niveau her
        setattr(error, 'code', 500) # Sæt kode til 500
        return _render_error_page(error)

    log.info("Custom error handlers registered.")


# --- Log Registered Routes ---
def _log_routes(app: Flask):
    """Logs all registered routes."""
    if app.config.get('DEBUG') or app.config.get('LOG_ROUTES_ON_STARTUP', True):
        log.debug("-" * 70 + " REGISTERED URL ROUTES " + "-" * 70)
        output = []
        rules = sorted(app.url_map.iter_rules(), key=lambda r: (r.endpoint, str(r)))
        for rule in rules:
            if rule.endpoint == 'static': continue # Ignorer standard static
            methods = ', '.join(sorted(rule.methods - {"HEAD", "OPTIONS"}))
            output.append(f"  {rule.endpoint:30s} {methods:20s} {rule}")
        log.debug("\n".join(output))
        log.debug("-" * (140 + len(" REGISTERED URL ROUTES ")))


# =============================================
#              APP FACTORY FUNCTION
# =============================================
def create_app(config_object=Config):
    """
    Application factory: Creates and configures the Flask application.
    """
    log.info(f"--- Initializing Flask app: {config_object.APP_NAME} ---")
    log.info(f"--- Using config: {config_object.__name__} ---")

    app = Flask(__name__,
                instance_path=INSTANCE_FOLDER_PATH, # Defineret globalt efter import
                instance_relative_config=True,
                static_folder='../static',      # Peger korrekt ud af /app
                static_url_path='/static',
                template_folder='../templates')    # Standard templates mappe (relativt til app/)
    log.debug(f"Flask app instantiated. Instance path: {app.instance_path}")
    log.debug(f"Relative template folder set to: {app.template_folder}")
    log.debug(f"Static folder target: {app.static_folder} mapped to URL: {app.static_url_path}")

    # --- Overstyr Jinja Loader (valgfrit, men ofte nyttigt) ---
    # Vi forventer at 'templates' er i projektroden, søster til 'app'
    # explicit_template_path = os.path.join(PROJECT_ROOT, 'templates')
    # if os.path.isdir(explicit_template_path):
    #     log.info(f"Overriding Jinja loader to use explicit path: {explicit_template_path}")
    #     app.jinja_loader = FileSystemLoader(explicit_template_path)
    # else:
    #     log.warning(f"Explicit template path '{explicit_template_path}' not found. Using Flask default loader.")
    # Eller behold den eksisterende fra tidligere kodestykke, den virker.

    # --- Load Configuration ---
    app.config.from_object(config_object)
    log.info(f"Initial configuration loaded for app: {app.name} from {config_object.__name__}")

    # Apply ProxyFix to handle headers from Next.js proxy
    # x_for=1 means trust one hop for X-Forwarded-For
    # x_proto=1 means trust one hop for X-Forwarded-Proto
    # x_host=1 means trust one hop for X-Forwarded-Host
    # x_prefix=1 means trust one hop for X-Forwarded-Prefix
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
    log.info("ProxyFix middleware applied to Flask app.")

    # Force DEBUG to True if FLASK_ENV is development, overriding any .env or default Config.DEBUG
    if os.environ.get('FLASK_ENV') == 'development':
        app.config['DEBUG'] = True
        log.info(f"FLASK_ENV is 'development'. Forcing app.config['DEBUG'] to True.")
    
    # Now log config values after potential override
    try: log_config_values() # This will now reflect the forced DEBUG value if FLASK_ENV was development
    except Exception as log_conf_err: log.exception("Error logging config values.", exc_info=log_conf_err)

    # --- Set Logger Level Based on the potentially overridden app.config['DEBUG'] ---
    log.debug(f"Final app.config['DEBUG'] value: {app.config.get('DEBUG')}")
    if app.config.get('DEBUG'):
        app.logger.setLevel(logging.DEBUG)
        if not app.logger.handlers:
             handler = logging.StreamHandler(sys.stderr)
             handler.setFormatter(logging.Formatter(log_format))
             app.logger.addHandler(handler)
        log.info("DEBUG mode is True. Flask app logger level set to DEBUG.")
    else:
        app.logger.setLevel(logging.INFO)
        log.info(f"DEBUG mode is False. Flask app logger level set to INFO (Current handlers: {app.logger.handlers}).")
    # ---------------------------------


    app.jinja_env.globals.update(
        max=max,
        min=min,
        # Tilføj evt. andre nyttige built-ins som len, str, int, float, zip etc. hvis nødvendigt
        len=len
    )
    log.debug("Added 'max', 'min', 'len' functions to Jinja globals.")


    # --- Set Locale ---
    try: locale.setlocale(locale.LC_ALL, app.config.get('APP_LOCALE', 'en_US.UTF-8'))
    except Exception: log.warning("Could not set application locale. Formatting might be US-English.")


    # --- Initialize Extensions ---
    log.debug("Initializing Flask extensions...")
    try:
        # Importer dine extensions her
        from .extensions import db, migrate, login_manager, csrf, limiter, bcrypt, socketio, scheduler, redis_client, jwt # <-- Added jwt
        # import flask_whooshalchemy as wa # <<< REMOVED WhooshAlchemy import
        db.init_app(app)
        # wa.whoosh_index(app) # <<< REMOVED WhooshAlchemy initialisering
        migrate.init_app(app, db)
        csrf.init_app(app)
        app.config['WTF_CSRF_HEADERS'] = ['X-CSRFToken', 'X-CSRF-Token'] # Standard headers
        # limiter.init_app(app) # Aktiver limiter hvis/når klar
        bcrypt.init_app(app)
        socketio.init_app(app,
                          manage_session=False, # Typisk False med Flask-Login
                          cors_allowed_origins=app.config.get('CORS_ALLOWED_ORIGINS', '*'),
                          async_mode=app.config.get('SOCKETIO_ASYNC_MODE'),
                          logger=app.config.get('SOCKETIO_LOGGER', app.debug),
                          engineio_logger=app.config.get('SOCKETIO_ENGINEIO_LOGGER', app.debug))
        login_manager.init_app(app)
        # Sæt login view og beskeder
        #login_manager.login_view = app.config.get('LOGIN_VIEW', 'auth.login_route') # Match dit auth blueprint
        #login_manager.login_view = app.config.get('LOGIN_VIEW', 'auth.login_user_route') # <--- RETTET TIL DET RIGTIGE ENDPOINT NAVN
        login_manager.login_view = app.config.get('LOGIN_VIEW', 'auth.login_route') # <--- RETTET HER
        login_manager.login_message = "Log venligst ind for at se denne side."
        login_manager.login_message_category = "info"
        login_manager.session_protection = "basic" # Changed from "strong" for proxy compatibility
        
        # Initialize JWTManager
        app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "your-super-secret-jwt-key-please-change") # Add a strong secret key
        app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1) # Example: access tokens expire in 1 hour
        app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30) # Example: refresh tokens expire in 30 days
        jwt.init_app(app)
        log.info("Flask-JWT-Extended initialized.")

        # Initialize APScheduler
        if not scheduler.running:
            scheduler.init_app(app)
            scheduler.start()
            log.info("APScheduler initialized and started.")
        else:
            log.info("APScheduler already running.")

        log.info("Core Flask extensions initialized (DB, Migrate, CSRF, Bcrypt, SocketIO, LoginManager, APScheduler).")
        # log.info("Limiter NOT initialized.") # Fjern/ret hvis limiter aktiveres

        # Initialize CORS
        CORS(app, origins=["http://localhost:3000"], supports_credentials=True, expose_headers=["Content-Type", "X-CSRFToken"])
        log.info(f"Flask-CORS initialized. Allowed origins: ['http://localhost:3000'], supports_credentials: True")

    except ImportError as e: raise RuntimeError(f"Failed to import extensions: {e}") from e
    except Exception as e: raise RuntimeError(f"Failed during extension initialization: {e}") from e

    # --- Configure Redis Client ---
    log.debug("Configuring Redis client...")
    try:
        redis_url = app.config.get('REDIS_URL')
        if redis_url:
            # Configure the existing redis_client instance from extensions
            redis_client.connection_pool = redis.BlockingConnectionPool.from_url(
                redis_url, decode_responses=True, # Decode responses to strings
                timeout=app.config.get('REDIS_TIMEOUT', 5) # Optional timeout
            )
            # Test connection
            redis_client.ping()
            log.info(f"Redis client configured and connected to: {redis_url}")
        else:
            log.warning("REDIS_URL not found in config. Redis client not configured.")
    except ImportError:
        log.error("Redis library not found ('pip install redis'). Redis client cannot be configured.")
    except Exception as e:
        log.exception(f"Failed to configure or connect Redis client: {e}")
        # Depending on requirements, you might want to raise an error here if Redis is critical

    # --- Import og Opsætning for Login Manager User Loader ---
    log.debug("Setting up LoginManager user_loader...")
    try:
        # Import the SQLAlchemy User model directly
        from .models import User as DBUser  # Alias to avoid confusion if UserWrapperForLogin was used elsewhere
        log.debug("Successfully imported DBUser model for user_loader.")

        @login_manager.user_loader
        def load_user(user_id_str: str) -> Optional[DBUser]:
            """Loads a user from the database given their ID (primary key)."""
            log.debug(f"user_loader called for user_id_str: '{user_id_str}'")
            if not user_id_str:
                return None
            try:
                # Flask-Login passes user_id as a string.
                # Assuming your User model's primary key 'id' is an integer.
                user_pk = int(user_id_str)
            except ValueError:
                log.warning(f"user_loader: Could not convert user_id_str '{user_id_str}' to int.")
                return None

            # Query the database for the user by primary key
            user = DBUser.query.get(user_pk)

            if user:
                log.debug(f"user_loader: User '{user.username}' (ID: {user.id}) found in DB.")
                return user
            else:
                log.debug(f"user_loader: No user found in DB for ID: {user_pk}.")
                return None

    except ImportError as e:
        log.critical(f"FATAL ERROR importing User model for user_loader: {e}")
        raise RuntimeError("Failed to set up user loader dependencies (DBUser model).") from e
    except Exception as e_load: # Catch other potential errors during setup or query
        log.exception(f"Unexpected error in user_loader setup or execution: {e_load}")
        # Depending on severity, you might want to raise an error or return None from load_user
        # For now, if setup fails, it will raise RuntimeError. If query fails, load_user returns None.
        return None # Fallback for load_user if an unexpected error occurs during its execution


    # --- Apply Session Lifetime (Efter config og app er klar) ---
    try: app.permanent_session_lifetime = app.config['PERMANENT_SESSION_LIFETIME']
    except KeyError: log.warning("PERMANENT_SESSION_LIFETIME not found in config, using Flask default.");
    except Exception as e: log.exception(f"Error applying session lifetime: {e}")
    log.info(f"Session lifetime set to: {app.permanent_session_lifetime}")


    # --- Create Instance & Upload Folders (Bør være overflødig pga. global tjek) ---
    # Sikrer bare de eksisterer igen
    try:
        os.makedirs(app.instance_path, exist_ok=True)
        avatar_folder = app.config.get("AVATAR_UPLOAD_FOLDER")
        if avatar_folder: os.makedirs(avatar_folder, exist_ok=True)
    except OSError as e: log.error(f"Error ensuring app folders exist: {e}")


    # --- Registrer Jinja Helpers ---
    _register_jinja_filters(app)
    _register_context_processors(app)


    # --- Registrer Blueprints (Dynamisk Import) ---
    log.debug("Registering application blueprints...")
    try:
        # Importer blueprints fra .routes subpakken
        from .routes import main, auth, sessions, stocks, admin, forum, messages # Tilføj messages
        blueprints = [
            (main.main_bp, None),          # Ingen prefix for main
            (auth.auth_bp, '/auth'),
            (sessions.sessions_bp, '/sessions'),
            (stocks.stocks_bp, '/stocks'),
            (admin.admin_bp, '/admin'),
            (forum.forum_bp, '/forum'),    # Forum blueprint med prefix
            (messages.messages_bp, '/messages'), # Registrer messages blueprint
        ]
        for bp, prefix in blueprints:
             app.register_blueprint(bp, url_prefix=prefix)
             log.debug(f"Registered blueprint '{bp.name}' with prefix '{prefix or '(root)'}'.")
        log.info("Application blueprints registered.")
    except ImportError as e: raise RuntimeError(f"Failed importing blueprints: {e}") from e
    except Exception as e: raise RuntimeError(f"Error registering blueprints: {e}") from e


    # --- Registrer Socket.IO Event Handlers (via import) ---
    try: from . import sockets; log.info("Socket.IO handlers registered.")
    except ImportError: log.warning("app/sockets.py not found, skipping handler registration.")
    except Exception as e: log.error(f"Error registering Socket.IO handlers: {e}", exc_info=True)


    # --- Registrer Request Hooks & Error Handlers ---
    log.debug("Registering request hooks and error handlers...")

    @app.before_request
    def before_request_tasks():
        """Kører før hver request."""
        session.permanent = True # Sikrer session levetid respekteres
        g.request_start_time = datetime.utcnow() # Simpel timing
        # --- Genaktiveret CSRF Protect ---
        # Gælder ALLE endpoints der ikke eksplicit undtages med @csrf.exempt
        if request.endpoint and request.endpoint != 'static':
             log.debug(f"Executing CSRF protect for endpoint: {request.endpoint}")
             try:
                 csrf.protect()
             except Exception as e: # Kan f.eks. være 'BadRequest' hvis token mangler/er forkert
                  log.warning(f"CSRF validation failed for {request.endpoint}: {e}", exc_info=True)
                  # Flask-WTF bør selv raise den korrekte HTTP Exception
                  raise # Lad Flask håndtere fejlen

        # Update last_seen for authenticated users
        if current_user.is_authenticated:
            try:
                # Get the underlying DBUser object from current_user proxy
                # Assuming current_user directly proxies the DBUser object loaded by user_loader
                user_obj = current_user._get_current_object() # Access underlying object
                if user_obj and hasattr(user_obj, 'last_seen'):
                    # Update last_seen timestamp
                    user_obj.last_seen = datetime.now(timezone.utc)
                    # Commit the change - consider performance implications
                    # Doing this on every request might be heavy.
                    # Alternative: Commit less frequently or use a background task.
                    # For simplicity now, commit directly.
                    db.session.commit()
                    # log.debug(f"Updated last_seen for user {user_obj.id}") # Optional: Can be noisy
            except AttributeError:
                 log.warning(f"Could not get underlying DBUser object from current_user proxy to update last_seen.")
            except Exception as e:
                 log.error(f"Error updating last_seen for user {getattr(current_user, 'id', 'UNKNOWN')}: {e}")
                 db.session.rollback() # Rollback on error


    @app.after_request
    def after_request_tasks(response):
        """Kører efter hver request."""
        # Log request tid
        if hasattr(g, 'request_start_time'):
            delta_ms = (datetime.utcnow() - g.request_start_time).total_seconds() * 1000
            log.debug(f"Request [{request.endpoint}] processed in {delta_ms:.2f} ms")

        # Standard logging (du har allerede denne, behold den bedste)
        log_user = getattr(current_user, 'id', 'Anonymous') if current_user else 'NoUser'
        log.info(f'{request.remote_addr} - {log_user} "{request.method} {request.path} {request.environ.get("SERVER_PROTOCOL")}" {response.status_code} {response.content_length or "-"}')

        # Sikkerheds headers (eksempler)
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        # response.headers['Content-Security-Policy'] = "default-src 'self'" # Meget restriktiv - tilpas!
        return response

    _register_error_handlers(app) # Registrer globale fejlhåndteringer
    log.info("Request hooks and error handlers registered.")


    # --- Tjek/opret database og modeller ved første request (eller CLI kommando) ---
    @app.cli.command('init-db')
    def init_db_command():
        """Opretter databasetabellerne hvis de ikke findes."""
        # -----> TILFØJ IMPORT HER INDE <-----
        from sqlalchemy import select
        # -----------------------------------
        log.info("CLI: 'init-db' command executing...")
        try:
             with app.app_context():
                  log.debug("Importing models for init-db...")
                  from . import models # Importer modeller inden i context
                  log.info("Initializing database tables...")
                  db.create_all()
                  log.info("Database tables created (if they didn't exist).")

                  # Tilføj default forum kategori
                  log.debug("Checking/creating default forum category...")
                  # Nu bør 'select' være defineret her
                  cat_exists = db.session.scalar(
                      select(models.ForumCategory).filter_by(slug='generel-diskussion')
                  )
                  if not cat_exists:
                        # Sørg for at have adgang til ForumCategory her
                        general_cat = models.ForumCategory(name='Generel Diskussion', description='Standard kategori')
                        # Slug genereres automatisk af model nu
                        db.session.add(general_cat)
                        db.session.commit()
                        log.info("Created default 'Generel Diskussion' category.")
                  else:
                      log.info("Default category 'Generel Diskussion' already exists.")

        except Exception as e:
             log.exception("CLI: Failed to initialize database!")
             # Skriv også til stderr for synlighed i CLI
             print(f"\nERROR initializing DB: {e}\n", file=sys.stderr)
             # Det er nok bedst ikke at raise herfra, men lade kommandoen fejle

    @app.cli.command('index')
    def index_command():
        """Builds or rebuilds the Whoosh search index."""
        log.info("CLI: 'index' command executing...")
        try:
            with app.app_context():
                from .search import rebuild_index
                count = rebuild_index()
                print(f"Successfully indexed {count} forum posts.")
        except Exception as e:
            log.exception("CLI: Failed to build search index!")
            print(f"\nERROR building search index: {e}\n", file=sys.stderr)


    # @app.cli.command('reindex') # <<< REMOVED Flask-WhooshAlchemy reindex command
    # def reindex_command():
    #     """Rebuilds the Whoosh search index for specified models."""
    #     log.info("CLI: 'reindex' command executing...")
    #     try:
    #         with app.app_context():
    #             log.debug("Importing models for reindex...")
    #             from .models import ForumPost # Import models that need indexing
    #             import flask_whooshalchemy as wa
    #             log.info("Rebuilding index for ForumPost...")
    #             # This clears and rebuilds the index for the ForumPost model
    #             wa.reindex_model(app, ForumPost)
    #             log.info("ForumPost index rebuild complete.")
    #             # Add other models here if needed: wa.reindex_model(app, YourOtherModel)
    #     except Exception as e:
    #         log.exception("CLI: Failed to reindex models!")
    #         print(f"\nERROR reindexing models: {e}\n", file=sys.stderr)


    # Alternativt (kun hvis db.create_all() ved opstart er OK - IKKE ANBEFALET MED MIGRATIONS)
    # with app.app_context():
    #     db.create_all()

    # --- Log ruter ---
    _log_routes(app)


    log.info(f"--- Flask application '{app.name}' initialization complete. ---")
    return app

# === EOF: app/__init__.py ===
