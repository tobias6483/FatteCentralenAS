from dotenv import load_dotenv
from dotenv import load_dotenv
# config.py
import os
import secrets
import logging
from datetime import timedelta
from typing import Set, Optional, Dict, Any, List, Tuple, Union # Tilføjet Union

# === Importer load_dotenv HELT FØRST ===
load_dotenv = None  # Initialize to None
_dotenv_loaded = False
try:
    from dotenv import load_dotenv as _imported_load_dotenv # Use an alias
    load_dotenv = _imported_load_dotenv # Assign to the module-level variable
    _dotenv_loaded = True
except ImportError:
    # load_dotenv remains None, _dotenv_loaded remains False
    print("ADVARSEL: dotenv pakken mangler. Kør 'pip install python-dotenv' for at indlæse .env filer.")

# === Opsæt Logger (Først) ===
# Konfigureres simpelt her, kan justeres yderligere i __init__.py
log_level_env = os.environ.get('LOG_LEVEL', 'INFO').upper()
log_level = getattr(logging, log_level_env, logging.INFO)
log_format = '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
logging.basicConfig(level=log_level, format=log_format, datefmt='%Y-%m-%d %H:%M:%S')
log = logging.getLogger(__name__) # Få logger for config modulet

# === Indlæs .env Fil (hvis dotenv er tilgængelig) ===
# Gøres før Config klasse definitionen for at variablerne er sat
_basedir_for_env = os.path.abspath(os.path.dirname(__file__))
_project_root_for_env = os.path.normpath(os.path.join(_basedir_for_env, '..'))
dotenv_path = os.path.join(_project_root_for_env, '.env')

if _dotenv_loaded and load_dotenv: # Check both _dotenv_loaded and that load_dotenv is truthy
    if os.path.exists(dotenv_path):
        loaded = load_dotenv(dotenv_path) # Now load_dotenv is guaranteed to be a function
        if loaded:
            log.info(f"--- Indlæst miljøvariabler fra: {dotenv_path}")
        else:
            log.warning(f"--- Forsøgte at indlæse .env fra {dotenv_path}, men den kan være tom eller fejlbehæftet.")
    else:
        log.info(f"--- .env fil ikke fundet ved: {dotenv_path}. Bruger OS miljøvariabler eller defaults.")
elif _dotenv_loaded and not load_dotenv: # This case should ideally not be reached
    log.error("--- Kritisk fejl: _dotenv_loaded er True, men load_dotenv funktionen er ikke tilgængelig. Tjek dotenv installation/import.")
else: # This covers the case where _dotenv_loaded is False
    log.info("--- Springer .env indlæsning over fordi 'dotenv' pakken ikke er installeret.")


# === Projektstier Beregning ===
# Mere robust detektion af projektrod
try:
    PROJECT_ROOT: str = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    if not all(os.path.isdir(os.path.join(PROJECT_ROOT, d)) for d in ['app', 'instance', 'static', 'templates']):
        log.warning(f"Autodetected PROJECT_ROOT '{PROJECT_ROOT}' ser muligvis forkert ud - mangler kerne-mapper ('app', 'instance', 'static', 'templates').")

    INSTANCE_FOLDER_PATH: str = os.path.join(PROJECT_ROOT, "instance")
    STATIC_FOLDER_PATH: str = os.path.join(PROJECT_ROOT, "static") # Forventes udenfor 'app'
    AVATAR_FOLDER_PATH: str = os.path.join(STATIC_FOLDER_PATH, "avatars")
    TEMPLATE_FOLDER_PATH: str = os.path.join(PROJECT_ROOT, "templates") # Forventes udenfor 'app'

    # Opret nødvendige mapper hvis de mangler
    os.makedirs(INSTANCE_FOLDER_PATH, exist_ok=True)
    os.makedirs(AVATAR_FOLDER_PATH, exist_ok=True)
    log.info(f"Projektstier bestemt. Rod: {PROJECT_ROOT}, Instans: {INSTANCE_FOLDER_PATH}")

except Exception as path_err:
    log.critical("KRITISK FEJL ved bestemmelse af projektstier!", exc_info=True)
    PROJECT_ROOT, INSTANCE_FOLDER_PATH, STATIC_FOLDER_PATH, AVATAR_FOLDER_PATH, TEMPLATE_FOLDER_PATH = "", "", "", "", ""
# -----------------------------------------------------------------------------

class Config:
    """Base Configuration Class with Type Hints"""

    # === Core App Settings ===
    APP_NAME: str = os.environ.get("APP_NAME", "FatteCentralen")
    # Prioritize FLASK_DEBUG, then FLASK_ENV for setting DEBUG mode
    _flask_debug_env: Optional[str] = os.environ.get("FLASK_DEBUG")
    _flask_env: str = os.environ.get("FLASK_ENV", "production").lower()

    if _flask_debug_env is not None:
        DEBUG: bool = _flask_debug_env.lower() in ['true', '1', 'yes', 'on']
    else:
        DEBUG: bool = (_flask_env == 'development')
    _flask_testing_env: str = os.environ.get("FLASK_TESTING", "False")
    TESTING: bool = _flask_testing_env.lower() in ['true', '1', 'yes', 'on']

    # === Security ===
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "")
    if not SECRET_KEY:
        log.warning("SIKKERHED ADVARSEL: SECRET_KEY er ikke sat i miljøvariabler! Genererer midlertidig nøgle (IKKE EGNET TIL PRODUKTION). Sæt den i .env filen.")
        SECRET_KEY = secrets.token_hex(24) # Stærkere default nøgle
    WTF_CSRF_ENABLED: bool = True
    WTF_CSRF_TIME_LIMIT: Optional[int] = None # Slå tidsgrænse fra for CSRF tokens (anbefales)
    WTF_CSRF_HEADERS: List[str] = ['X-CSRFToken', 'X-CSRF-Token']

    # === Session Management ===
    try:
        _session_days: int = int(os.environ.get("SESSION_LIFETIME_DAYS", "7"))
    except (ValueError, TypeError):
        _session_days = 7
        log.warning(f"Ugyldig SESSION_LIFETIME_DAYS env variabel. Bruger default: {_session_days} dage.")
    PERMANENT_SESSION_LIFETIME: timedelta = timedelta(days=max(1, _session_days))
    # Sikkerhedsindstillinger for session cookie
    SESSION_COOKIE_SECURE: bool = os.environ.get("SESSION_COOKIE_SECURE", "False").lower() in ['true', '1', 'yes']
    SESSION_COOKIE_HTTPONLY: bool = True # Altid True for sikkerhed
    SESSION_COOKIE_SAMESITE: str = 'Lax' # Revert to Lax, proxy should handle same-origin appearance
    SESSION_COOKIE_DOMAIN: Optional[str] = 'localhost' # Explicitly set for localhost development
    if not SESSION_COOKIE_SECURE and not DEBUG and not TESTING:
        log.warning("SIKKERHED ADVARSEL: SESSION_COOKIE_SECURE er False i et ikke-debug/test miljø. HTTPS er PÅKRÆVET!")

    # === Database (SQLAlchemy for Forum etc.) ===
    _db_default_path: str = os.path.join(INSTANCE_FOLDER_PATH, "fattecentralen.db")
    _db_uri_env: str = os.environ.get('DATABASE_URL', f'sqlite:///{_db_default_path}')
    # Auto-fix Heroku/Render postgres URI
    if _db_uri_env.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI: str = _db_uri_env.replace("postgres://", "postgresql://", 1)
        log.info("Postgres DB URI auto-korrigeret til 'postgresql://'")
    else:
        SQLALCHEMY_DATABASE_URI: str = _db_uri_env
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ENGINE_OPTIONS: Dict[str, Any] = {
        "pool_pre_ping": True, # Tjekker forbindelser før brug
        "pool_recycle": 280, # Fornyer forbindelser efter 280s (lidt under typisk timeout)
    }
    _sql_echo_env: str = os.environ.get("SQLALCHEMY_ECHO", "False")
    SQLALCHEMY_ECHO: bool = DEBUG and (_sql_echo_env.lower() in ['true', '1', 'yes', 'on'])

    # === Redis Configuration ===
    REDIS_URL: str = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

    # === Forum Specific Settings ===
    try: THREADS_PER_PAGE: int = max(1, int(os.environ.get("THREADS_PER_PAGE", "15")))
    except ValueError: THREADS_PER_PAGE = 15; log.warning("Ugyldig THREADS_PER_PAGE env var, bruger default 15.")
    try: POSTS_PER_PAGE: int = max(1, int(os.environ.get("POSTS_PER_PAGE", "10")))
    except ValueError: POSTS_PER_PAGE = 10; log.warning("Ugyldig POSTS_PER_PAGE env var, bruger default 10.")

    # === Uploads (Avatars) ===
    # Absolutte stier
    STATIC_FOLDER: str = STATIC_FOLDER_PATH
    AVATAR_UPLOAD_FOLDER: str = AVATAR_FOLDER_PATH
    # Relativ sti til URL-generering (fra static/)
    AVATAR_UPLOAD_SUBDIR: str = 'avatars'
    DEFAULT_AVATAR: str = os.path.join(AVATAR_UPLOAD_SUBDIR, "default_avatar.png") # -> avatars/default_avatar.png

    # *** MAX AVATAR STØRRELSE DEFINERET HER ***
    try:
        MAX_AVATAR_SIZE_MB: int = max(1, int(os.environ.get("MAX_AVATAR_MB", "2"))) # Default 2MB
    except ValueError:
        MAX_AVATAR_SIZE_MB = 2
        log.warning(f"Ugyldig MAX_AVATAR_MB env variabel, bruger default {MAX_AVATAR_SIZE_MB} MB.")
    # --------------------------------------------

    # Flask's MAX_CONTENT_LENGTH (i bytes) skal være lidt større end avatar grænsen
    MAX_CONTENT_LENGTH: int = (MAX_AVATAR_SIZE_MB + 1) * 1024 * 1024 # +1MB buffer

    # Tilladte filtyper til avatars
    ALLOWED_AVATAR_EXTENSIONS: Set[str] = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    # === Admin Credentials ===
    ADMIN_USERNAME: str = os.environ.get("ADMIN_USERNAME", "")
    ADMIN_PASSWORD: str = os.environ.get("ADMIN_PASSWORD", "")
    if not ADMIN_USERNAME or not ADMIN_PASSWORD:
        log.warning("SIKKERHED: Admin credentials (ADMIN_USERNAME, ADMIN_PASSWORD) er ikke sat i miljøet. Admin login vil fejle.")
    elif ADMIN_PASSWORD == "change_this_password": # Tjekker for usikker standard
        log.critical("SIKKERHED KRITISK: Standard 'change_this_password' fundet for ADMIN_PASSWORD. SKIFT DEN OMGÅENDE i .env!")

    # === Data Filstier (Absolutte stier bruges af data_access) ===
    PLAYER_FILE_PATH: str = os.path.join(INSTANCE_FOLDER_PATH, "players.json")
    INVITE_CODES_FILE_PATH: str = os.path.join(INSTANCE_FOLDER_PATH, "invite_codes.json")
    SYSTEM_SETTINGS_FILE_PATH: str = os.path.join(INSTANCE_FOLDER_PATH, "system_settings.json") # <<< TILFØJET
    AUDIT_LOG_FILE_PATH: str = os.path.join(INSTANCE_FOLDER_PATH, "audit_log.json") # <<< TILFØJET FOR AUDIT LOGS
    WHOOSH_BASE: str = os.path.join(INSTANCE_FOLDER_PATH, "whoosh_index") # <<< TILFØJET FOR SEARCH INDEX
    # SESSIONS_FILE_PATH: Optional[str] = os.path.join(INSTANCE_FOLDER_PATH, "sessions.json") # Undlad hvis ikke brugt

    # === Core Game / App Settings ===
    try: INITIAL_BALANCE: float = float(os.environ.get("INITIAL_BALANCE", "1000.0"))
    except ValueError: INITIAL_BALANCE = 1000.0; log.warning("Ugyldig INITIAL_BALANCE env var, bruger default 1000.0.")
    try: MIN_PASSWORD_LENGTH: int = max(8, int(os.environ.get("MIN_PASSWORD_LENGTH", "8")))
    except ValueError: MIN_PASSWORD_LENGTH = 8; log.warning("Ugyldig MIN_PASSWORD_LENGTH env var, bruger default 8.")
    try: MAX_ABOUT_ME_LENGTH: int = max(10, int(os.environ.get("MAX_ABOUT_ME_LENGTH", "500")))
    except ValueError: MAX_ABOUT_ME_LENGTH = 500; log.warning("Ugyldig MAX_ABOUT_ME_LENGTH env var, bruger default 500.")

    # === External APIs ===
    SPORTS_API_KEY: Optional[str] = os.environ.get("SPORTS_API_KEY") # Kan være None
    SPORTS_API_BASE_URL: str = os.environ.get('SPORTS_API_BASE_URL', 'https://api.the-odds-api.com/v4')
    try: EXTERNAL_API_TIMEOUT: int = max(1, int(os.environ.get("EXTERNAL_API_TIMEOUT", "10"))) # Sekunder
    except ValueError: EXTERNAL_API_TIMEOUT = 10; log.warning("Ugyldig EXTERNAL_API_TIMEOUT env var, bruger default 10s.")
    if not SPORTS_API_KEY and not (DEBUG or TESTING):
        log.warning("External SPORTS_API_KEY er ikke sat! Sports relaterede funktioner virker muligvis ikke.")

    # === Two-Factor Authentication (2FA) ===
    HASH_BACKUP_CODES: bool = os.environ.get("HASH_BACKUP_CODES", "True").lower() == 'true'
    try: NUM_BACKUP_CODES: int = max(5, int(os.environ.get("NUM_BACKUP_CODES", "10")))
    except ValueError: NUM_BACKUP_CODES = 10; log.warning("Ugyldig NUM_BACKUP_CODES env var, bruger default 10.")
    try: LOW_BACKUP_CODE_THRESHOLD: int = max(1, int(os.environ.get("LOW_BACKUP_CODE_THRESHOLD", "3")))
    except ValueError: LOW_BACKUP_CODE_THRESHOLD = 3; log.warning("Ugyldig LOW_BACKUP_CODE_THRESHOLD env var, bruger default 3.")
    # Bruger APP_NAME som standard issuer navn for OTP URIs
    OTP_ISSUER_NAME: str = os.environ.get("OTP_ISSUER_NAME", APP_NAME)

    # === Rate Limiting (Placeholder - kun hvis Flask-Limiter bruges aktivt) ===
    # RATELIMIT_ENABLED: bool = os.environ.get("RATELIMIT_ENABLED", "False").lower() == 'true'
    # RATELIMIT_STORAGE_URL: str = os.environ.get("RATELIMIT_STORAGE_URL", "memory://")
    # RATELIMIT_STRATEGY: str = "fixed-window"
    # RATELIMIT_HEADERS_ENABLED: bool = True
    # RATELIMIT_DEFAULT: str = os.environ.get("RATELIMIT_DEFAULT", "200 per day;50 per hour;10 per minute")
    # RATELIMIT_LOGIN: str = "10 per 5 minute" # Specifik limit for login

    # === Vedligeholdelsestilstand ===
    _maintenance_env: str = os.environ.get("MAINTENANCE_MODE", "False")
    MAINTENANCE_MODE: bool = _maintenance_env.lower() in ['true', '1', 'yes', 'on']
    MAINTENANCE_MESSAGE: str = os.environ.get("MAINTENANCE_MESSAGE", "Siden er midlertidigt nede for planlagt vedligehold.")
    # Behandler kommaseparerede IPs fra env var, fjerner whitespace
    MAINTENANCE_ALLOW_IPS: List[str] = [ip.strip() for ip in os.environ.get("MAINTENANCE_ALLOW_IPS", "").split(',') if ip.strip()]


# -----------------------------------------------------------------------------
#                      Log Konfig Værdier (Til __init__.py)
# -----------------------------------------------------------------------------
def log_config_values():
    """ Logger vigtige (ikke-sensitive) konfigurationsværdier. """
    # Gør det nemt at slå denne logging til/fra via env
    if os.environ.get("LOG_CONFIG_ON_STARTUP", "true").lower() != 'true':
        return

    conf = Config
    log.info("=" * 80)
    log.info("--- App Configuration Summary ---")
    log.info(f"Project Root:           {PROJECT_ROOT}")
    log.info(f"Instance Folder:        {INSTANCE_FOLDER_PATH}")
    log.info(f"Static Folder:          {STATIC_FOLDER_PATH}")
    log.info(f"Avatar Upload Folder:   {AVATAR_FOLDER_PATH}")
    log.info(f"Debug Mode:             {conf.DEBUG}")
    log.info(f"Testing Mode:           {conf.TESTING}")
    log.info(f"Maintenance Mode:       {conf.MAINTENANCE_MODE} (Allowed IPs: {conf.MAINTENANCE_ALLOW_IPS or 'None'})")

    # DB info (sikker visning)
    db_uri = str(getattr(conf, 'SQLALCHEMY_DATABASE_URI', ''))
    db_type = db_uri.split('://', 1)[0] if '://' in db_uri else 'N/A'
    db_display = f"{db_type}://..." if '@' in db_uri or db_type.startswith('postgresql') else db_uri
    log.info(f"Database Type:          {db_type}")
    log.info(f"Database URI:           {db_display}")
    log.info(f"SQLAlchemy Echo:        {getattr(conf, 'SQLALCHEMY_ECHO', 'N/A')}")

    # Session info
    log.info(f"Session Lifetime:       {getattr(conf, 'PERMANENT_SESSION_LIFETIME', 'Default')}")
    log.info(f"Session Secure Cookie:  {conf.SESSION_COOKIE_SECURE}")

    # File Paths
    log.info(f"Player File Path:       ...{conf.PLAYER_FILE_PATH[-50:]}") # Vis kun en del af stien
    log.info(f"Invite Codes Path:      ...{conf.INVITE_CODES_FILE_PATH[-50:]}")
    log.info(f"System Settings Path:   ...{conf.SYSTEM_SETTINGS_FILE_PATH[-50:]}") # <<< TILFØJET
    log.info(f"Audit Log File Path:    ...{conf.AUDIT_LOG_FILE_PATH[-50:]}") # <<< TILFØJET FOR AUDIT LOGS

    # Key settings
    log.info(f"Min Password Length:    {conf.MIN_PASSWORD_LENGTH}")
    log.info(f"Hash Backup Codes:      {conf.HASH_BACKUP_CODES}")
    log.info(f"Avatar Max Size (MB):   {conf.MAX_AVATAR_SIZE_MB}")
    log.info(f"Max Request Size (MB):  {conf.MAX_CONTENT_LENGTH / (1024*1024):.1f}")
    log.info(f"Sports API Key Set:     {'Yes' if conf.SPORTS_API_KEY else 'NO!'}")
    log.info("=" * 80)

# -----------------------------------------------------------------------------

# Kør .gitignore check her for tidlig advarsel
try:
    gitignore_path = os.path.join(PROJECT_ROOT, '.gitignore')
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            patterns_to_check = ['instance/', 'instance/*', '*.db', '*.sqlite', '*.sqlite3', '.env']
            ignored = any(pattern in line.strip().lstrip('/') for line in lines for pattern in patterns_to_check)
            if not ignored:
                log.warning("SECURITY WARNING: Sensitive files/folders (instance/, .env, *.db) do NOT appear to be ignored in .gitignore. Add them!")
    else:
        log.info(".gitignore file not found at project root. Recommended to create one.")
except Exception as gitignore_err:
    log.warning(f"Could not read or parse .gitignore file: {gitignore_err}")

# -----------------------------------------------------------------------------
# Sørg for at `log_config_values()` kaldes fra `create_app` i `__init__.py`
# lige efter `app.config.from_object(Config)`

# Husk at kalde log_config_values() fra din app factory (__init__.py) hvis du vil have printet ved opstart
# f.eks. lige efter app.config.from_object(Config)

# Valgfrit: Man kan have nedarvede klasser til forskellige miljøer
# class DevelopmentConfig(Config):
#     DEBUG = True
#     SQLALCHEMY_ECHO = True
#     # Andre dev specifikke ting...

# class TestingConfig(Config):
#     TESTING = True
#     SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:' # Brug in-memory db til tests
#     WTF_CSRF_ENABLED = False # Deaktiver CSRF i tests
#     # Andre test specifikke ting...

# class ProductionConfig(Config):
#     DEBUG = False
#     TESTING = False
#     # Sørg for SECRET_KEY, DATABASE_URL etc. er sat i miljøet!
