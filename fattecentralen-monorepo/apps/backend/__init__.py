import logging
from logging.handlers import RotatingFileHandler
import os
from flask import Flask, redirect, url_for, request, g, render_template, jsonify
from flask_login import LoginManager, current_user
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect, CSRFError, generate_csrf
from flask_babel import Babel, format_datetime as babel_format_datetime, format_currency as babel_format_currency, get_locale
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import credentials

from .config import Config, INSTANCE_FOLDER_PATH
from .extensions import db, socketio, jwt, migrate # Ensure jwt and migrate are imported
from .models import User, PasswordResetRequest, Notification # Removed JsonUserWrapper
# from .utils import load_user_from_json_file

# Logger setup
def setup_logging(app):
    if not app.debug and not app.testing:
        if not os.path.exists('logs'): os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.ERROR)
        console_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s: %(message)s'))
        app.logger.addHandler(console_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('App startup')
    elif app.debug:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        console_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
        app.logger.handlers = []
        app.logger.addHandler(console_handler)
        app.logger.setLevel(logging.DEBUG)
        app.logger.info("App startup in DEBUG mode")

# Flask-Login setup
login_manager = LoginManager()
login_manager.login_view = 'auth.login_route'  # type: ignore
login_manager.login_message = "Du skal logge ind for at tilgå denne side."
login_manager.login_message_category = "warning"
login_manager.session_protection = "strong"

# Flask-Babel setup
babel = Babel()

def get_locale_selector():
    user_lang = getattr(g, 'user_lang', None)
    if user_lang and user_lang in Config.LANGUAGES: return user_lang
    if current_user.is_authenticated:
        user_profile_lang = getattr(current_user, 'language_preference', None)
        if user_profile_lang and user_profile_lang in Config.LANGUAGES: return user_profile_lang
    return request.accept_languages.best_match(Config.LANGUAGES)

def format_datetime_filter(value, format='medium', relative=False, include_time=True):
    if value is None: return ""
    if not isinstance(value, datetime):
        try: value = datetime.fromisoformat(str(value))
        except (ValueError, TypeError): return str(value)
    if value.tzinfo is None or value.tzinfo.utcoffset(value) is None: value = value.replace(tzinfo=timezone.utc)
    now_utc = datetime.now(timezone.utc)
    if relative:
        diff = now_utc - value
        if diff.total_seconds() < 5: return "Lige nu"
        if diff.total_seconds() < 60: return f"{int(diff.total_seconds())} sek. siden"
        if diff.total_seconds() < 3600: return f"{int(diff.total_seconds() / 60)} min. siden"
        if diff.total_seconds() < 86400: return f"{int(diff.total_seconds() / 3600)} tim. siden"
        if diff.days < 2: return "I går"
        if diff.days < 7: return f"{diff.days} dage siden"
    locale_str = get_locale_selector()
    if format == 'medium': fmt = "dd. MMM yyyy" + (", HH:mm" if include_time else "")
    elif format == 'full': fmt = "EEEE, d. MMMM yyyy" + (" 'kl.' HH:mm:ss zzzz" if include_time else "")
    elif format == 'short': fmt = "dd/MM/yy" + (", HH:mm" if include_time else "")
    else: fmt = format
    return babel_format_datetime(value, format=fmt)

def format_currency_filter(value, currency_code=None):
    if value is None: return ""
    try: return babel_format_currency(float(value), 'DKK')
    except (ValueError, TypeError): return str(value)

@login_manager.user_loader
def load_user(user_id_str: str):
    try:
        user = User.query.get(int(user_id_str))
        if user: return user
    except (ValueError, Exception): pass
    # Fallback for JSON user (if load_user_from_json_file is defined and imported)
    # from .utils import load_user_from_json_file 
    # json_user_data = load_user_from_json_file(user_id_str)
    # if json_user_data: return JsonUserWrapper(user_id_str, json_user_data)
    return None

def create_app(config_class=Config):
    app = Flask(__name__, instance_path=INSTANCE_FOLDER_PATH, static_folder=config_class.STATIC_FOLDER)
    app.config.from_object(config_class)
    if app.config.get('PROXY_FIX_ENABLED', False):
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1, x_prefix=1)
    db.init_app(app)
    login_manager.init_app(app)
    babel.init_app(app, locale_selector=get_locale_selector)
    socketio.init_app(app, cors_allowed_origins=app.config.get('CORS_ALLOWED_ORIGINS', '*'))
    CSRFProtect(app)
    CORS(app, resources={
        r"/api/*": {"origins": app.config.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')},
        r"/auth/*": {"origins": app.config.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')}
    }, supports_credentials=True)
    # migrations_dir = os.path.abspath(os.path.join(app.root_path, '..', '..', 'migrations'))
    # Corrected path assuming app.root_path is /Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt/fattecentralen-monorepo/apps/backend
    # and migrations is at /Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt/migrations
    migrations_dir = os.path.normpath(os.path.join(app.root_path, '..', '..', '..', 'migrations'))
    migrate.init_app(app, db, directory=migrations_dir)
    jwt.init_app(app) # Initialize JWTManager
    setup_logging(app)

    # Callback for loading a user from a JWT.
    # Flask-JWT-Extended will call this function whenever a protected endpoint
    # is accessed, and it will pass in the decoded JWT claims.
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]  # "sub" is the default identity claim
        return User.query.get(identity)

    # Initialize Firebase Admin SDK
    # GOOGLE_APPLICATION_CREDENTIALS environment variable should be set (e.g., in .env)
    # and loaded by config.py for this to work automatically.
    try:
        if not firebase_admin._apps: # Check if default app already initialized
            # The GOOGLE_APPLICATION_CREDENTIALS env var is automatically used by initialize_app()
            # if no explicit credential object is passed.
            firebase_admin.initialize_app()
            app.logger.info("Firebase Admin SDK initialized successfully.")
        else:
            app.logger.info("Firebase Admin SDK already initialized.")
    except Exception as e:
        app.logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        # Depending on how critical Firebase is at startup, you might want to raise the error
        # or handle it more gracefully. For now, just log it.

    app.jinja_env.filters['dt'] = format_datetime_filter
    app.jinja_env.filters['currency'] = format_currency_filter
    # Add Python's built-in max function to Jinja environment
    app.jinja_env.globals['max'] = max

    from .routes.main import main_bp
    from .routes.auth import auth_bp as auth_json_bp
    from .routes.admin import admin_bp
    from .routes.forum import forum_bp, forum_api_bp
    from .routes.api_user_profile import user_profile_api_bp
    from .routes.stocks import stocks_bp as aktiedyst_bp
    # from .routes.api_general import api_general_bp # File missing
    # from .routes.api_forum import api_forum_bp # File missing
    # from .routes.stocks import stocks_bp as api_aktiedyst_bp # This is likely old or for HTML views
    from .routes.api_aktiedyst import aktiedyst_api_bp as new_aktiedyst_v1_api_bp # New V1 API
    # from .routes.api_user import api_user_bp # File missing
    # from .routes.api_admin import api_admin_bp # File missing
    from .routes.api_sports import sports_api_bp as api_sports_bp, matches_api_bp # Use alias
    from .routes.api_dashboard import api_dashboard_bp
    # Potentially from .routes.api_bets import api_bets_bp (if defined in api_bets.py)
    from .routes.messages import messages_bp # Potentially from .routes.messages import messages_bp (if defined in messages.py)
    from .routes.sessions import sessions_bp # Potentially from .routes.sessions import sessions_bp (if defined in sessions.py)


    app.register_blueprint(main_bp)
    app.register_blueprint(auth_json_bp, url_prefix='/auth')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(forum_bp, url_prefix='/forum')
    # app.register_blueprint(user_profile_bp, url_prefix='/profile')
    app.register_blueprint(aktiedyst_bp, url_prefix='/aktiedyst')
    # app.register_blueprint(api_general_bp)
    # app.register_blueprint(api_forum_bp)
    # app.register_blueprint(api_aktiedyst_bp, name='api_stocks') # Commenting out old/conflicting registration
    app.register_blueprint(new_aktiedyst_v1_api_bp) # New V1 API, prefix is in the blueprint
    # app.register_blueprint(api_user_bp)
    # app.register_blueprint(api_admin_bp)
    app.register_blueprint(api_sports_bp) # This blueprint already has /api/v1/sports prefix
    app.register_blueprint(matches_api_bp) # This blueprint already has /api/v1/matches prefix
    app.register_blueprint(api_dashboard_bp)
    app.register_blueprint(messages_bp, url_prefix='/messages')
    app.register_blueprint(sessions_bp, url_prefix='/sessions')
    app.register_blueprint(forum_api_bp) # New V1 Forum API, prefix is in the blueprint
    app.register_blueprint(user_profile_api_bp) # New User Profile API, prefix is in the blueprint

    @app.context_processor
    def inject_csrf_token_global(): return dict(csrf_token_value=generate_csrf())

    @app.errorhandler(CSRFError)
    def handle_csrf_error(e):
        app.logger.warning(f"CSRF Error: {e.description}. Path: {request.path}")
        if request.blueprint and request.blueprint.startswith('api_'):
            return jsonify(error="CSRF token missing or invalid", message=e.description), 400
        return render_template('errors/csrf_error.html', reason=e.description), 400
    
    @app.before_request
    def before_request_tasks():
        g.user = current_user if current_user.is_authenticated else None
        g.user_lang = get_locale_selector()
        if current_user.is_authenticated and isinstance(current_user, User):
            made_aware_in_this_request = False # Flag to see if we modified it
            if current_user.last_seen is None:
                # Initialize to a timezone-aware min datetime if None
                current_user.last_seen = datetime.min.replace(tzinfo=timezone.utc)
                made_aware_in_this_request = True
                app.logger.info(f"User {current_user.id} last_seen was None, initialized to aware UTC min.")
            elif current_user.last_seen.tzinfo is None or current_user.last_seen.tzinfo.utcoffset(current_user.last_seen) is None:
                # If naive, make it timezone-aware (UTC) directly on the object
                current_user.last_seen = current_user.last_seen.replace(tzinfo=timezone.utc)
                made_aware_in_this_request = True
                # Log this specific conversion, as it's correcting existing data
                app.logger.info(f"User {current_user.id} last_seen was naive, converted to aware UTC.")

            # current_user.last_seen is now guaranteed to be timezone-aware for the comparison.
            comparison_last_seen = current_user.last_seen

            if (datetime.now(timezone.utc) - comparison_last_seen).total_seconds() > app.config.get('USER_LAST_SEEN_UPDATE_INTERVAL_SECONDS', 60):
                current_user.last_seen = datetime.now(timezone.utc) # This is already aware
                try:
                    db.session.commit() # Commit the periodic update
                    # app.logger.debug(f"User {current_user.id} last_seen updated periodically.") # Optional: debug log
                except Exception as e:
                    db.session.rollback()
                    app.logger.error(f"Error updating last_seen for user {current_user.id} (periodic): {e}")
            elif made_aware_in_this_request:
                # If we only made it aware (either from None or from naive)
                # and didn't do the periodic update, commit this correction.
                try:
                    db.session.commit()
                    app.logger.info(f"User {current_user.id} last_seen (awareness correction) committed.")
                except Exception as e:
                    db.session.rollback()
                    app.logger.error(f"Error committing timezone-awareness update for last_seen for user {current_user.id}: {e}")
    return app
