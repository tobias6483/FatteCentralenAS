from .config import Config
from .config import Config
# app/data_access.py

# === Standard Bibliotek Imports ===
import json
import logging
import os
import shutil
import threading
from threading import RLock
from typing import Dict, Any, Optional, Set, List, Tuple, Union # <<< Union tilføjet

# === Lokale Applikationsimports ===
# Forsøg at importere Config og definer en fejl klasse
class DataIOException(IOError):
    """Custom exception for data access errors."""
    pass

Config = None # Initialize Config to None
try:
    from .config import Config as ImportedConfig # Use an alias
    Config = ImportedConfig # Assign to the module-level Config
    # Definer stierne globalt i modulet for nem adgang
    PLAYER_FILE_PATH = Config.PLAYER_FILE_PATH
    INVITE_CODES_FILE_PATH = Config.INVITE_CODES_FILE_PATH
    SYSTEM_SETTINGS_FILE_PATH = Config.SYSTEM_SETTINGS_FILE_PATH
    AUDIT_LOG_FILE_PATH = Config.AUDIT_LOG_FILE_PATH # <<< TILFØJET for audit logs
    # SESSIONS_FILE_PATH = Config.SESSIONS_FILE_PATH # Undlad at definere hvis sessions filen skal væk
except ImportError:
    # Config remains None if import fails
    logging.critical("FATAL: Kan ikke importere Config fra .config. Data adgangsfunktioner kan ikke bestemme filstier!")
    # Definer stierne med placeholders, så koden ikke crasher ved definition, men vil fejle ved brug
    PLAYER_FILE_PATH = "/path/to/instance/players.json_ERROR"
    INVITE_CODES_FILE_PATH = "/path/to/instance/invite_codes.json_ERROR"
    SYSTEM_SETTINGS_FILE_PATH = "/path/to/instance/system_settings.json_ERROR"
    AUDIT_LOG_FILE_PATH = "/path/to/instance/audit_log.json_ERROR" # <<< TILFØJET placeholder
    # SESSIONS_FILE_PATH = "/path/to/instance/sessions.json_ERROR"

# Konfigurer logger for dette modul
log = logging.getLogger(__name__) # Omdøbt fra 'logger' for at undgå navnekonflikt med logging modul

# === Låse til Fil Adgang ===
# En lås per fil der kan skrives til samtidigt fra flere tråde/requests
players_file_lock = RLock()
invite_codes_lock = RLock()
system_settings_lock = RLock()
audit_log_lock = RLock() # <<< TILFØJET for audit logs
# <<< TILFØJET for invite koder
# sessions_file_lock = threading.Lock() # Nødvendig hvis SESSIONS_FILE_PATH bruges


# ======================================================
# === Generiske Hjælpefunktioner (Load/Save JSON) ===
# ======================================================

def _load_json_file(file_path: str, default_value: Any = None) -> Any:
    """
    Internal helper: Loads data from JSON file safely. Handles missing/empty/corrupt files.

    Args:
        file_path: Absolute path to the JSON file.
        default_value: Value to return on any error or if file invalid. Defaults to None.

    Returns:
        The loaded data (typically dict or list), or default_value on error.
    """
    log.debug(f"_load_json_file: Attempting to load from: {file_path}")
    # Brug den specificerede default_value direkte hvis angivet
    resolved_default = default_value if default_value is not None else {}

    if not file_path or "_ERROR" in file_path: # Tjek for tom/ugyldig sti
        log.error(f"_load_json_file: Invalid or unconfigured file path: '{file_path}'. Returning default ({type(resolved_default).__name__}).")
        return resolved_default

    try:
        # Opret mappen hvis den mangler (vigtigt!)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        if not os.path.exists(file_path):
            log.warning(f"File not found: {file_path}. Returning default data ({type(resolved_default).__name__}).")
            return resolved_default
        # Undersøg filstørrelse - returner default hvis tom
        if os.path.getsize(file_path) == 0:
            log.warning(f"File is empty: {file_path}. Returning default data ({type(resolved_default).__name__}).")
            # Hvis default_value er [] eller {} er det okay, ellers log en warning om potentiel type mismatch
            if resolved_default not in ({}, []):
                log.warning(f"Returning potentially unexpected default type ({type(resolved_default).__name__}) for empty file.")
            return resolved_default

        # Læs og parse JSON
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        log.debug(f"Successfully loaded and decoded JSON from {file_path}.")
        return data # Returner den faktiske data (kan være dict, list etc.)

    except json.JSONDecodeError as json_err:
        log.exception(f"JSONDecodeError reading {file_path}. File is likely corrupt. Error: {json_err}. Returning default ({type(resolved_default).__name__}).")
        # TODO: Overvej automatisk backup gendannelse her? Se _save_json_file
        return resolved_default
    except (IOError, OSError) as io_err:
        log.exception(f"IO/OS Error reading {file_path}: {io_err}. Returning default ({type(resolved_default).__name__}).")
        # Overvej om dette stadig skal raise - hvis ja, bør det nok fanges højere oppe
        # raise DataIOException(f"Could not read data file: {file_path}") from io_err
        return resolved_default
    except Exception as e:
        log.exception(f"Unexpected error loading JSON from {file_path}: {e}. Returning default ({type(resolved_default).__name__}).")
        return resolved_default


def _save_json_file(file_path: str, data: Any, is_list: bool = False) -> bool:
    """
    Internal helper: Saves data (dict or list) to JSON atomically with backup.

    Args:
        file_path: Absolute path to save the file.
        data: The data (dict or list) to save.
        is_list: Set to True if the expected root type is a list (for invite codes).

    Returns:
        True if successful, False otherwise. Raises DataIOException on critical save/backup failures.
    """
    if not file_path or "_ERROR" in file_path:
        log.error(f"_save_json_file: Invalid or unconfigured file path: '{file_path}'. Save aborted.")
        return False
    # Tjek at data er den forventede type (dict eller list)
    expected_type = list if is_list else dict
    if not isinstance(data, expected_type):
         # Giver en lidt mere informativ fejl
         log.error(f"_save_json_file: Invalid data type for {file_path}. "
                   f"Expected {'list' if is_list else 'dict'}, "
                   f"got {type(data).__name__}. Save aborted.")
         return False

    # Definer stier
    base_dir = os.path.dirname(file_path)
    backup_file = file_path + ".bak"
    temp_file_path = file_path + ".tmp" # Unik temp fil
    log.debug(f"_save_json_file: Starting atomic save to: {file_path}")

    # --- Backup og Skrivning ---
    try:
        # Opret mappe hvis den mangler
        os.makedirs(base_dir, exist_ok=True)

        # 1. Backup: Flyt eksisterende fil til .bak FØR skrivning af temp
        if os.path.exists(file_path):
            try:
                shutil.move(file_path, backup_file)
                log.debug(f"Created backup by moving existing file to: {backup_file}")
            except Exception as move_err:
                 # Følgende er lidt aggressivt, men sikrest: Hvis backup move fejler, stop
                 log.critical(f"CRITICAL: Failed to MOVE existing {file_path} to backup ({backup_file}). Aborting save to prevent potential data loss during replace. Error: {move_err}")
                 # Gendannelse ikke mulig her, da vi ikke har nået at skrive ny data
                 # Re-raise for at signalere fejlen tydeligt
                 raise DataIOException(f"Failed to create mandatory backup for {file_path}. Aborting save.") from move_err


        # 2. Skriv data til en NY midlertidig fil
        try:
            with open(temp_file_path, 'w', encoding='utf-8') as f:
                # --- Justeret json.dump kald ---
                # Sorter kun keys hvis det ER en dictionary (ikke en liste)
                json.dump(data, f, indent=4, ensure_ascii=False, sort_keys=not is_list)
            log.debug(f"Data written to temporary file: {temp_file_path}")
        except (TypeError, IOError, OSError) as write_err:
            log.exception(f"Error writing data to temporary file {temp_file_path}: {write_err}")
            # Fjern temp fil, den er potentielt korrupt
            if os.path.exists(temp_file_path):
                 try: os.remove(temp_file_path)
                 except OSError: log.warning(f"Could not remove partially written temp file {temp_file_path} during write error handling.")
            # Raise for at gå til ydre except (recovery)
            raise DataIOException(f"Failed writing to temp file for {file_path}") from write_err

        # 3. Atomisk Erstatning: Erstat den (nu ikke-eksisterende eller backup'ede) fil med den nye temp fil
        try:
            os.replace(temp_file_path, file_path) # Atomisk på de fleste systemer
            log.info(f"Successfully saved data to {file_path} via atomic replace.")
        except OSError as replace_err:
             log.exception(f"CRITICAL SAVE FAILURE: os.replace() failed moving {temp_file_path} to {file_path}: {replace_err}")
             # Temp filen er intakt, men kunne ikke flyttes.
             # Raise for at gå til ydre except (recovery)
             raise DataIOException(f"Atomic replace failed for {file_path}") from replace_err

        # 4. Oprydning: Slet den gamle backup fil (.bak) nu hvor save lykkedes
        #    Den *skal* eksistere hvis step 1 blev udført og filen eksisterede oprindeligt
        if os.path.exists(backup_file):
            try:
                os.remove(backup_file)
                log.debug(f"Successfully removed backup file: {backup_file}")
            except OSError as rm_err:
                # Ikke kritisk for data-integritet, men log det
                log.warning(f"Could not remove old backup file {backup_file} after successful save: {rm_err}")
        # Hvis backup_file ikke findes, var original filen ny/ikke eksisterende
        # else:
        #    log.debug(f"No backup file ({backup_file}) to remove (original file likely didn't exist).")

        return True # Save var en succes

    except Exception as save_err: # Fanger fejl fra steps 1, 2, 3 (inkl. DataIOException)
        log.exception(f"Save operation failed overall for {file_path}. Initiating recovery. Error: {save_err}")

        # --- GENDANNELSE FRA BACKUP ---
        recovery_success = False
        try:
            # Prioriter at få den gamle fil tilbage hvis backup findes
            if os.path.exists(backup_file):
                # Tjek om den _nye_ (misligholdte) fil blev oprettet
                if os.path.exists(file_path):
                     try:
                         os.remove(file_path)
                         log.debug(f"Removed potentially corrupt target file {file_path} before recovery.")
                     except OSError as rem_err:
                          log.error(f"Failed to remove target file {file_path} during recovery. Trying move anyway... Error: {rem_err}")

                shutil.move(backup_file, file_path)
                log.warning(f"RECOVERY: Successfully restored {file_path} from backup file {backup_file}.")
                recovery_success = True
            else:
                # Hvis der IKKE findes en backup, er den originale fil måske væk.
                # Den _misligholdte_ temp-fil blev måske ikke replaced (fejl i os.replace).
                # Eller filen eksisterede ikke før (så ingen backup).
                log.critical(f"RECOVERY WARNING: Backup file {backup_file} not found. "
                              f"Cannot restore previous state for {file_path}. Target file state depends on where error occurred.")
                # Man KUNNE overveje at slette file_path hvis den findes, men det fjerner evt. en semi-god version.

        except Exception as recovery_err:
            log.critical(f"CRITICAL: Exception during recovery process for {file_path}. Data state UNKNOWN! Error: {recovery_err}")

        finally:
            # Forsøg altid at rydde op i temp filen hvis den stadig eksisterer
            if os.path.exists(temp_file_path):
                 try: os.remove(temp_file_path)
                 except OSError: log.warning(f"Could not remove temp file {temp_file_path} during final recovery cleanup.")

        # Returner False uanset hvad, da den oprindelige save fejlede.
        # Overvej at raise DataIOException igen for at signalere en fatal save fejl?
        # if isinstance(save_err, DataIOException): raise save_err
        return False


# ======================================================
# === Specifikke Data Adgangs Funktioner ===
# ======================================================

# --- Player Data (med Lås) ---
# ... load_players() og save_players() uændret ...
def load_players() -> Dict[str, Any]:
    """Loads the players data using a thread lock."""
    log.debug(f"Acquiring lock for load_players: {PLAYER_FILE_PATH}")
    with players_file_lock:
        log.debug("Lock acquired for load_players.")
        try:
            # Læs data - forventer en dictionary
            data = _load_json_file(PLAYER_FILE_PATH, default_value={})
            if not isinstance(data, dict):
                 log.error(f"load_players: Data loaded from {PLAYER_FILE_PATH} was not a dict! Type: {type(data)}. Returning empty dict.")
                 return {}
            log.debug(f"load_players successfully loaded {len(data)} player entries.") # Removed Releasing lock log here
            return data
        except Exception as e:
             # Undgå at fejl i låst sektion bryder alt
             log.exception("Unexpected error within locked load_players block.")
             return {} # Returner tom dict ved intern fejl
    # log.debug("Lock released for load_players.") # Frigives automatisk

def save_players(players_data: Dict[str, Any]) -> bool:
    """Saves the players data dictionary using a thread lock."""
    if not isinstance(players_data, dict):
        log.error(f"save_players received non-dict data type: {type(players_data)}. Aborting save.")
        return False
    log.debug(f"Acquiring lock for save_players: {PLAYER_FILE_PATH} ({len(players_data)} players)")
    with players_file_lock:
        log.debug("Lock acquired for save_players.")
        try:
            # Gem data - forventer dictionary
            success = _save_json_file(PLAYER_FILE_PATH, players_data, is_list=False)
            log.debug(f"save_players finished (Success: {success}).")
            return success
        except Exception as e:
            log.exception("Unexpected error within locked save_players block.")
            return False
    # log.debug("Lock released for save_players.") # Frigives automatisk


# ... save_avatar_path() uændret ...
def save_avatar_path(user_id_case_sensitive: str, new_avatar_path: str) -> bool:
    """
    Updates the 'avatar' field for a user thread-safely (read-modify-write).
    Assumes user_id_case_sensitive is the correct dictionary key.
    """
    if not user_id_case_sensitive or not new_avatar_path:
         log.warning("save_avatar_path called with empty user_id or path. Aborting.")
         return False

    user_key = user_id_case_sensitive
    data_changed = False
    log.debug(f"Acquiring lock: save_avatar_path for user key '{user_key}'")
    with players_file_lock:
        log.debug("Lock acquired: save_avatar_path.")
        try:
            players = _load_json_file(PLAYER_FILE_PATH, default_value={})
            if not isinstance(players, dict):
                 log.error("save_avatar_path: Failed to load players data as dict. Aborting.")
                 return False

            user_data = players.get(user_key)

            if isinstance(user_data, dict):
                if user_data.get('avatar') != new_avatar_path:
                    user_data['avatar'] = new_avatar_path
                    data_changed = True
                    log.info(f"Avatar path for user key '{user_key}' updated in memory to '{new_avatar_path}'.")
                else:
                    log.debug(f"Avatar path for user key '{user_key}' is already correct. No change.")
            else:
                 log.warning(f"save_avatar_path: User key '{user_key}' not found or data invalid in players file.")
                 # Ikke en fatal fejl for funktionen, bare for den specifikke bruger
                 return False # Returnerer False da handlingen ikke blev udført for den bruger

            if data_changed:
                 success = _save_json_file(PLAYER_FILE_PATH, players, is_list=False)
                 log.info(f"save_avatar_path finished saving (Success: {success}).")
                 return success
            else:
                 log.info(f"save_avatar_path: No data change needed for user '{user_key}'.")
                 return True # Ingen ændring nødvendig, men operationen var "succesfuld"

        except Exception as e:
             log.exception(f"Unexpected error in locked save_avatar_path for user '{user_key}'.")
             return False
    # log.debug("Lock released for save_avatar_path.")


# --- Invite Codes (OPDATERET med Lås og Objekt Liste) ---
def load_invite_codes() -> List[Dict[str, Any]]: # <<< Ændret returtype
    """
    Loads the list of invite code objects thread-safely.
    Returns an empty list on error or if the file format is incorrect.
    """
    log.debug(f"Acquiring lock for load_invite_codes: {INVITE_CODES_FILE_PATH}")
    with invite_codes_lock: # <<< Bruger lås
        log.debug("Lock acquired for load_invite_codes.")
        try:
            # Forventer en LISTE af objekter direkte, default til tom liste ved fejl/tom fil
            data = _load_json_file(INVITE_CODES_FILE_PATH, default_value=[]) # <<< Ny default

            # --- Grundig validering ---
            if not isinstance(data, list):
                log.error(f"Invite codes data in {INVITE_CODES_FILE_PATH} is not a list. Type: {type(data)}. Returning empty list.")
                return []

            # Valider hvert element for at sikre, det er en dict (simpelt check)
            valid_codes = []
            invalid_items_found = False
            for idx, item in enumerate(data):
                if isinstance(item, dict):
                    # Yderligere tjek: Kræver mindst en 'code' nøgle?
                    if 'code' in item:
                        valid_codes.append(item)
                    else:
                        log.warning(f"load_invite_codes: Item at index {idx} in {INVITE_CODES_FILE_PATH} is a dict but missing 'code' key. Skipping item: {item}")
                        invalid_items_found = True
                else:
                    log.warning(f"load_invite_codes: Item at index {idx} in {INVITE_CODES_FILE_PATH} is not a dictionary. Skipping item: {item}")
                    invalid_items_found = True

            if invalid_items_found:
                 log.warning("load_invite_codes finished, but some items were skipped due to format issues.")
            else:
                 log.debug(f"load_invite_codes successfully loaded and validated {len(valid_codes)} invite code objects.")

            return valid_codes # Returner kun de gyldige dicts
        except DataIOException as e: # Specifikt fange IO fejl fra _load_json_file hvis den raised
             log.error(f"Failed to load invite codes due to data access error: {e}")
             return []
        except Exception as e:
            log.exception(f"Unexpected error within locked load_invite_codes block: {e}")
            return []
    # log.debug("Lock released for load_invite_codes.") # Gøres automatisk


def save_invite_codes(codes_list: List[Dict[str, Any]]) -> bool: # <<< Ændret parametertype og navn
    """
    Saves the list of invite code objects to JSON thread-safely.
    Ensures the input is a list of dictionaries before saving.
    """
    # --- Grundig type og indholdsvalidering ---
    if not isinstance(codes_list, list):
        log.error(f"save_invite_codes: Input data must be a list, got {type(codes_list)}. Aborting save.")
        return False
    # Tjek at alle elementer er dictionaries og indeholder en 'code'
    for idx, item in enumerate(codes_list):
        if not isinstance(item, dict):
            log.error(f"save_invite_codes: Item at index {idx} is not a dictionary. Aborting save. Item: {item}")
            return False
        if 'code' not in item:
             log.error(f"save_invite_codes: Item at index {idx} is missing the required 'code' key. Aborting save. Item: {item}")
             return False
    # --- Slut validering ---

    log.debug(f"Acquiring lock for save_invite_codes: {INVITE_CODES_FILE_PATH} ({len(codes_list)} codes)")
    with invite_codes_lock: # <<< Bruger lås
        log.debug("Lock acquired for save_invite_codes.")
        try:
            # Kald _save_json_file direkte med listen og is_list=True
            success = _save_json_file(INVITE_CODES_FILE_PATH, codes_list, is_list=True) # <<< Gemmer liste direkte
            log.debug(f"save_invite_codes finished (Success: {success}).")
            return success
        except Exception as e:
             # Låst blok, log exception
             log.exception("Unexpected error within locked save_invite_codes block.")
             return False
    # log.debug("Lock released for save_invite_codes.") # Gøres automatisk


# --- Valideringsfunktioner ---

# <<< GAMMEL funktion validate_invite_code_from_file er FJERNES/ erstattet af check_invite_code_validity >>>
# def validate_invite_code_from_file(code: str) -> Tuple[bool, str]: ...

def check_invite_code_validity(code: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Checks if an invite code exists and is marked as unused. Reads data thread-safely.

    Returns:
        Tuple (bool: is_valid_and_unused, str: message, Optional[Dict]: the code object if found, else None)
    """
    if not code:
        return False, "Invite kode må ikke være tom.", None
    try:
        # Læser filen HVER GANG via den låste funktion
        invite_code_objects = load_invite_codes() # Denne håndterer låsning internt

        found_code_obj = None
        for code_obj in invite_code_objects:
            # Sikrere adgang med .get()
            if code_obj.get('code') == code:
                found_code_obj = code_obj
                break # Stop søgning når koden er fundet

        if found_code_obj:
            if not found_code_obj.get('used', False): # Default til False hvis 'used' mangler? Sikrest er True. Default til False her.
                log.debug(f"Invite code '{code}' found and is valid/unused.")
                return True, "Invite kode er gyldig og ubrugt.", found_code_obj
            else:
                # Kode fundet, men er brugt
                used_by = found_code_obj.get('used_by') or 'ukendt bruger'
                used_at = found_code_obj.get('used_at') or 'ukendt tidspunkt'
                log.warning(f"Invite code '{code}' found but is already used (by {used_by} at {used_at}).")
                # Inkluder tidspunkt/bruger i meddelelse for klarhed
                usage_info = f" (brugt af {used_by}"
                if used_at != 'ukendt tidspunkt':
                    # Forsøg pænere dato format hvis muligt, ellers brug strengen
                    try:
                        # Antag at used_at er gemt i ISO format
                        from datetime import datetime
                        dt_obj = datetime.fromisoformat(used_at.replace('Z', '+00:00'))
                        usage_info += f" den {dt_obj.strftime('%d-%m-%Y %H:%M')}"
                    except (ValueError, TypeError):
                         usage_info += f" på tidspunkt '{used_at}'" # Fallback
                usage_info += ")"
                return False, f"Invite koden er allerede brugt{usage_info}.", found_code_obj
        else:
            # Kode blev ikke fundet i listen
            log.info(f"Invite code '{code}' not found in the list.")
            return False, "Invite koden blev ikke fundet eller er ugyldig.", None

    except Exception as e:
        log.exception(f"Error during invite code validation for '{code}': {e}")
        return False, "Fejl under validering af invite kode. Se server logs.", None


# ... user_exists() og email_exists() uændret ...
def user_exists(username: str) -> bool:
    """Checks if a username exists (case-insensitive key lookup). Uses lock."""
    if not username: return False
    lookup_key = username.lower()
    log.debug(f"Checking existence for username '{username}' (key: '{lookup_key}')")
    try:
        players = load_players() # Bruger den låste load funktion
        # Konverter hentede keys til lowercase for case-insensitive sammenligning
        # Bemærk: Dette looper over alle keys HVER gang - mindre effektivt end direkte lookup
        # Hvis keys ALTID gemmes som lowercase, kan dette optimeres.
        # For nu holder vi det case-insensitive på læsningstidspunktet
        return lookup_key in [key.lower() for key in players.keys()]
    except Exception as e:
        log.exception(f"Error during user_exists check for '{username}': {e}")
        return False # Sikrest at antage bruger ikke findes ved fejl

def email_exists(email: str) -> bool:
    """Checks if an email exists (case-insensitive). Uses lock."""
    if not email: return False
    lookup_email = email.lower()
    log.debug(f"Checking existence for email '{email}'")
    try:
        players = load_players() # Bruger den låste load funktion
        for user_data in players.values():
            if isinstance(user_data, dict) and user_data.get('email', '').lower() == lookup_email:
                return True
        return False
    except Exception as e:
        log.exception(f"Error during email_exists check for '{email}': {e}")
        return False


# ==============================================
# --- System Settings Data (med Lås) ---
# ==============================================

DEFAULT_SYSTEM_SETTINGS = {
    "sports_api_key": "",
    "max_players_per_session": 50,
    "min_bet_amount": 1.00,
    "max_bet_amount": 1000.00,
    "registration_enabled": True,
    "welcome_message_new_users": "Velkommen til platformen!",
    "session_timeout_minutes": 120, # Eksempel: 2 timer
    "maintenance_mode": False, # Spejler det der er i app.config, men kan persisteres her
    "maintenance_message": "",  # Spejler det der er i app.config
    # Password Complexity Rules
    "password_min_length": 8,
    "password_require_uppercase": True,
    "password_require_lowercase": True,
    "password_require_number": True,
    "password_require_symbol": False
}

def load_system_settings() -> Dict[str, Any]:
    """Loads the system settings data using a thread lock."""
    log.debug(f"Acquiring lock for load_system_settings: {SYSTEM_SETTINGS_FILE_PATH}")
    with system_settings_lock:
        log.debug("Lock acquired for load_system_settings.")
        try:
            # Læs data - forventer en dictionary, brug DEFAULT_SYSTEM_SETTINGS hvis filen er tom/ny
            data = _load_json_file(SYSTEM_SETTINGS_FILE_PATH, default_value=DEFAULT_SYSTEM_SETTINGS.copy())
            if not isinstance(data, dict):
                 log.error(f"load_system_settings: Data loaded from {SYSTEM_SETTINGS_FILE_PATH} was not a dict! Type: {type(data)}. Returning default settings.")
                 return DEFAULT_SYSTEM_SETTINGS.copy() # Returner en kopi af defaults

            # Sikr at alle default nøgler er til stede i den loadede data
            # Dette håndterer tilfælde hvor nye settings er tilføjet til defaults
            # men endnu ikke findes i den gemte fil.
            loaded_settings = DEFAULT_SYSTEM_SETTINGS.copy()
            loaded_settings.update(data) # Overskriv defaults med hvad der er loadet

            log.debug(f"load_system_settings successfully loaded {len(loaded_settings)} settings entries.")
            return loaded_settings
        except Exception as e:
             log.exception("Unexpected error within locked load_system_settings block.")
             return DEFAULT_SYSTEM_SETTINGS.copy() # Returner en kopi af defaults ved fejl

def save_system_settings(settings_data: Dict[str, Any]) -> bool:
    """Saves the system settings data dictionary using a thread lock."""
    if not isinstance(settings_data, dict):
        log.error(f"save_system_settings received non-dict data type: {type(settings_data)}. Aborting save.")
        return False
    log.debug(f"Acquiring lock for save_system_settings: {SYSTEM_SETTINGS_FILE_PATH}")
    with system_settings_lock:
        log.debug("Lock acquired for save_system_settings.")
        try:
            # Gem data - forventer dictionary
            success = _save_json_file(SYSTEM_SETTINGS_FILE_PATH, settings_data, is_list=False)
            log.debug(f"save_system_settings finished (Success: {success}).")
            return success
        except Exception as e:
            log.exception("Unexpected error within locked save_system_settings block.")
            return False

# ==============================================
# --- Audit Log Data (med Lås) ---
# ==============================================
MAX_AUDIT_LOG_ENTRIES = 1000 # Konfigurerbar grænse for antal log entries

def add_audit_log(action: str, admin_user: str, target_resource: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
    """
    Adds a new entry to the audit log.
    Entries are stored as a list of dictionaries, newest first.
    """
    if not AUDIT_LOG_FILE_PATH or "_ERROR" in AUDIT_LOG_FILE_PATH:
        log.error("add_audit_log: AUDIT_LOG_FILE_PATH is not configured. Audit log not saved.")
        return

    from datetime import datetime, timezone # Importer her for at undgå cirkulær import ved modul load
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(timespec='seconds'),
        "action": action,
        "admin_user": admin_user,
        "target_resource": target_resource,
        "details": details or {}
    }
    log.debug(f"Acquiring lock for add_audit_log: {AUDIT_LOG_FILE_PATH}")
    with audit_log_lock:
        log.debug("Lock acquired for add_audit_log.")
        try:
            # Load existing logs, default to an empty list
            audit_logs = _load_json_file(AUDIT_LOG_FILE_PATH, default_value=[])
            if not isinstance(audit_logs, list):
                log.error(f"Audit log data in {AUDIT_LOG_FILE_PATH} is not a list. Resetting to empty list. Type: {type(audit_logs)}")
                audit_logs = []

            # Prepend new entry to keep newest first
            audit_logs.insert(0, log_entry)

            # Trim the log if it exceeds the maximum number of entries
            if len(audit_logs) > MAX_AUDIT_LOG_ENTRIES:
                audit_logs = audit_logs[:MAX_AUDIT_LOG_ENTRIES]
                log.info(f"Audit log trimmed to the latest {MAX_AUDIT_LOG_ENTRIES} entries.")

            if _save_json_file(AUDIT_LOG_FILE_PATH, audit_logs, is_list=True):
                log.info(f"Audit log entry added: Action='{action}', Admin='{admin_user}', Target='{target_resource or 'N/A'}'")
            else:
                log.error(f"Failed to save audit log entry to {AUDIT_LOG_FILE_PATH}.")
        except Exception as e:
            log.exception("Unexpected error within locked add_audit_log block.")

def load_audit_logs(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Loads audit log entries. Returns newest entries first.
    """
    if not AUDIT_LOG_FILE_PATH or "_ERROR" in AUDIT_LOG_FILE_PATH:
        log.error("load_audit_logs: AUDIT_LOG_FILE_PATH is not configured. Cannot load audit logs.")
        return []

    log.debug(f"Acquiring lock for load_audit_logs: {AUDIT_LOG_FILE_PATH}")
    with audit_log_lock:
        log.debug("Lock acquired for load_audit_logs.")
        try:
            audit_logs = _load_json_file(AUDIT_LOG_FILE_PATH, default_value=[])
            if not isinstance(audit_logs, list):
                log.error(f"Audit log data in {AUDIT_LOG_FILE_PATH} is not a list. Returning empty list. Type: {type(audit_logs)}")
                return []

            # Logs are already stored newest first due to insert(0) in add_audit_log
            if limit is not None and limit > 0:
                return audit_logs[:limit]
            return audit_logs
        except Exception as e:
            log.exception("Unexpected error within locked load_audit_logs block.")
            return []

# ==============================================
# --- Sessions Data (UNDGÅ AT BRUGE DENNE!) ---
# ==============================================
# ... load_sessions() og save_sessions() uændret ...
def load_sessions() -> Dict[str, Any]:
    """ADVARSEL: Læser session data fra fil. Brug en rigtig session backend!"""
    sessions_file_path = None
    if Config is not None: # Check if Config was successfully imported
        sessions_file_path = getattr(Config, 'SESSIONS_FILE_PATH', None) # Hent fra Config
    
    if not sessions_file_path:
        log.error("SESSIONS_FILE_PATH er ikke konfigureret. Kan ikke loade file sessions.")
        return {}
    log.critical(f"=== BRUGER FIL-BASEREDE SESSIONS ({sessions_file_path}) - IKKE EGNET TIL PRODUKTION! ===")
    # Overvej at tilføje sessions_file_lock herom, hvis det *skal* bruges midlertidigt
    # with sessions_file_lock:
    data = _load_json_file(sessions_file_path, default_value={})
    if not isinstance(data, dict):
        log.error(f"Loaded sessions data from {sessions_file_path} was not a dict!")
        return {}
    return data

def save_sessions(sessions_data: Dict[str, Any]) -> bool:
    """ADVARSEL: Gemmer session data til fil. Brug en rigtig session backend!"""
    sessions_file_path = None
    if Config is not None: # Check if Config was successfully imported
        sessions_file_path = getattr(Config, 'SESSIONS_FILE_PATH', None)

    if not sessions_file_path:
        log.error("SESSIONS_FILE_PATH er ikke konfigureret. Kan ikke gemme file sessions.")
        return False
    if not isinstance(sessions_data, dict):
         log.error(f"save_sessions: Invalid data type {type(sessions_data)}. Expected dict.")
         return False
    log.critical(f"=== GEMMER TIL FIL-BASEREDE SESSIONS ({sessions_file_path}) - IKKE EGNET TIL PRODUKTION! ===")
    # Overvej at tilføje sessions_file_lock herom, hvis det *skal* bruges midlertidigt
    # with sessions_file_lock:
    return _save_json_file(sessions_file_path, sessions_data, is_list=False)

# === EOF: app/data_access.py ===
