# app/extensions.py
import redis  # <-- ADD THIS IMPORT
from flask_apscheduler import APScheduler  # <<< TILFØJET
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager  # Added for JWT support
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import CSRFProtect

# import flask_whooshalchemy as wa # <<< REMOVED due to incompatibility

db = SQLAlchemy()
migrate = Migrate()
# whoosh_searcher will be initialized in create_app after db is initialized
# whoosh_searcher = wa.WhooshAlchemy() # Initialiseres i create_app
login_manager = LoginManager()
csrf = CSRFProtect()
limiter = Limiter(
    key_func=get_remote_address, default_limits=["200 per day", "50 per hour"]
)
bcrypt = Bcrypt()
socketio = SocketIO()
scheduler = APScheduler()  # <<< TILFØJET scheduler instance
jwt = JWTManager()  # Added for JWT support

# Initialize Redis client
# It will be configured with the app context in create_app
redis_client: redis.Redis = redis.Redis()
