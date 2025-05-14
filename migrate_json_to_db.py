import json
import os
import logging
from datetime import datetime, timezone
import uuid # For generating fallback UIDs

# It's crucial that this script is run from the project root
# so that 'app' can be imported correctly.
# Ensure your Flask app and its components can be imported.
try:
    from app import create_app
    from app.extensions import db, bcrypt # Import db and bcrypt from extensions
    from app.models import User as DbUser, Badge, BetHistory  # The new SQLAlchemy User model + Badge & BetHistory
    from app.config import Config # To get player file path
except ImportError as e:
    print(f"Error importing Flask app components. Make sure this script is in the project root or adjust Python path.")
    print(f"Details: {e}")
    exit(1)

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def parse_datetime_from_json(dt_str):
    """
    Parses datetime strings from JSON, assuming they are ISO format and UTC.
    Returns a timezone-aware datetime object or None.
    """
    if not dt_str:
        return None
    try:
        # Handle 'Z' for UTC explicitly if present
        if dt_str.endswith('Z'):
            dt_str = dt_str[:-1] + '+00:00'
        dt_obj = datetime.fromisoformat(dt_str)
        # If naive, assume UTC
        if dt_obj.tzinfo is None:
            return dt_obj.replace(tzinfo=timezone.utc)
        return dt_obj.astimezone(timezone.utc) # Ensure it's UTC
    except ValueError:
        log.warning(f"Could not parse datetime string: {dt_str}")
        return None

def migrate_users():
    """Migrates users from players.json to the User table in the database."""
    app = create_app()  # Create a Flask app instance to work with context
    with app.app_context():
        player_file_path = Config.PLAYER_FILE_PATH
        log.info(f"Starting user migration from {player_file_path}...")

        if not os.path.exists(player_file_path):
            log.error(f"Player data file not found: {player_file_path}")
            return

        try:
            with open(player_file_path, 'r', encoding='utf-8') as f:
                players_data = json.load(f)
        except json.JSONDecodeError:
            log.error(f"Error decoding JSON from {player_file_path}")
            return
        except Exception as e:
            log.error(f"Error reading player file {player_file_path}: {e}")
            return

        if not isinstance(players_data, dict):
            log.error("Player data is not in the expected dictionary format.")
            return

        users_created = 0
        users_updated = 0
        users_skipped = 0

        for username_key, data in players_data.items():
            if not isinstance(data, dict):
                log.warning(f"Skipping invalid data entry for key: {username_key}")
                users_skipped += 1
                continue

            username = data.get('username', username_key).strip()
            
            # Handle email carefully, checking for None before stripping
            email_raw = data.get('email')
            if email_raw and isinstance(email_raw, str):
                email = email_raw.strip().lower()
            else: # If email is missing, null, or not a string, use fallback
                email = f"{username.lower()}@example.com"
                log.debug(f"Using fallback email for user '{username}': {email}")

            target_user = None
            is_new_user_flag = False

            # Check if user already exists by username
            existing_user = DbUser.query.filter_by(username=username).first()

            if existing_user:
                log.info(f"User '{username}' already exists. Will update related data.")
                target_user = existing_user
                # Optionally, update other fields on existing_user if needed from `data`
                # For example:
                # target_user.last_login = parse_datetime_from_json(data.get('last_login'))
                # target_user.balance = float(data.get('balance', target_user.balance))
                # etc. For now, we are focusing on adding missing badges/bet_history.
            else:
                # If user does not exist by username, check for email conflict before creating
                existing_user_by_email = DbUser.query.filter_by(email=email).first()
                if existing_user_by_email:
                    log.warning(f"Email '{email}' already exists for user '{existing_user_by_email.username}'. Skipping creation of new user '{username}'.")
                    users_skipped += 1
                    continue
                
                if not username or not email: # Should be caught by earlier username/email definition, but good check
                    log.warning(f"Skipping entry due to missing username or email. Original key: {username_key}, Data: {data}")
                    users_skipped +=1
                    continue

                password_hash_json = data.get('password_hash')
                if not password_hash_json:
                    log.warning(f"User '{username}' has no password_hash in JSON. Skipping creation.")
                    users_skipped += 1
                    continue
                
                password_hash_db = password_hash_json
                registration_date_str = data.get('registration_date')
                registration_date_dt = parse_datetime_from_json(registration_date_str) or datetime.now(timezone.utc)
                last_login_str = data.get('last_login')
                last_login_dt = parse_datetime_from_json(last_login_str)
                uid_json = data.get('uid')
                if isinstance(uid_json, int): uid_db = str(uid_json)
                elif isinstance(uid_json, str): uid_db = uid_json
                else: uid_db = str(uuid.uuid4())

                target_user = DbUser(
                    uid=uid_db,
                    username=username,
                    email=email,
                    password_hash=password_hash_db,
                    role=data.get('role', 'user'),
                    is_active=data.get('is_active', True),
                    balance=float(data.get('balance', 0.0)),
                    registration_date=registration_date_dt,
                    last_login=last_login_dt,
                    rank=data.get('rank'),
                    invited_by=data.get('invited_by'),
                    avatar=data.get('avatar'),
                    about_me=data.get('about_me'),
                    twofa_enabled=data.get('2fa_enabled', False),
                    twofa_secret=data.get('2fa_secret'),
                    backup_codes=json.dumps(data.get('backup_codes', [])) if data.get('backup_codes') else None,
                    wins=int(data.get('wins', 0)),
                    losses=int(data.get('losses', 0)),
                    total_staked=float(data.get('total_staked', 0.0)),
                    total_won=float(data.get('total_won', 0.0)),
                    total_lost=float(data.get('total_lost', 0.0)),
                    largest_win=float(data.get('largest_win', 0.0)) if data.get('largest_win') is not None else None,
                    largest_loss=float(data.get('largest_loss', 0.0)) if data.get('largest_loss') is not None else None,
                    level=int(data.get('level', 1)),
                    xp=int(data.get('xp', 0)),
                    xp_next_level=int(data.get('xp_next_level', 100)),
                    portfolio=data.get('portfolio', {}),
                    stock_transactions=data.get('stock_transactions', []),
                    watchlist=data.get('watchlist', []),
                    dividends=data.get('dividends', [])
                )
                db.session.add(target_user)
                is_new_user_flag = True

            if not target_user: # Should not happen if logic above is correct
                log.error(f"Failed to define a target user for {username}. Skipping.")
                users_skipped += 1
                continue

            # Process Badges for target_user
            json_badges = data.get('badges', [])
            if json_badges:
                for badge_data in json_badges:
                    badge_name = badge_data.get('name')
                    if not badge_name:
                        log.warning(f"Skipping badge with no name for user '{username}'. Data: {badge_data}")
                        continue

                    badge_obj = Badge.query.filter_by(name=badge_name).first()
                    if not badge_obj:
                        badge_obj = Badge(
                            name=badge_name,
                            description=badge_data.get('description'),
                            icon=badge_data.get('icon'),
                            color=badge_data.get('color')
                        )
                        db.session.add(badge_obj)
                        # Flush to get badge_obj.id if needed by association, though SQLAlchemy often handles it.
                        # db.session.flush()
                        log.debug(f"Created new badge: '{badge_name}'")
                    
                    if badge_obj not in target_user.badges:
                        target_user.badges.append(badge_obj)
                        log.debug(f"Associated badge '{badge_name}' with user '{username}'")

            # Process Bet History for target_user
            # Clear existing bet history for the user to avoid duplicates if script is re-run,
            # or implement more sophisticated upsert logic if bet history entries can be updated.
            # For simplicity, this example will clear and re-add.
            # WARNING: This deletes existing bet history for the user each time the script runs for that user.
            # If this is not desired, this part needs more complex logic (e.g., checking for existing bets by a unique key).
            
            # Let's assume for now we only add new ones and don't clear.
            # If you need to prevent duplicates, you'd query BetHistory for existing entries.
            # For example:
            # existing_bet = BetHistory.query.filter_by(user_id=target_user.id, match_name=bet_data.get('match_name'), timestamp=bet_timestamp_dt).first()
            # if existing_bet: continue

            json_bet_history = data.get('bet_history', [])
            if json_bet_history:
                for bet_data in json_bet_history:
                    bet_timestamp_str = bet_data.get('timestamp')
                    bet_timestamp_dt = parse_datetime_from_json(bet_timestamp_str) or datetime.now(timezone.utc)
                    
                    # Simple check to avoid duplicate bet entries based on user, match, and timestamp
                    # This assumes (user_id, match_name, timestamp) is a unique enough combination.
                    # Adjust if there's a better unique key for bets.
                    existing_bet_entry = BetHistory.query.filter_by(
                        user_id=target_user.id, # Query for existing user's ID
                        match_name=bet_data.get('match_name'),
                        timestamp=bet_timestamp_dt
                    ).first()

                    if existing_bet_entry:
                        log.debug(f"Bet history entry for match '{bet_data.get('match_name')}' at '{bet_timestamp_dt}' already exists for user '{username}'. Skipping.")
                        continue

                    bet_entry = BetHistory(
                        match_name=bet_data.get('match_name'),
                        outcome_name=bet_data.get('outcome_name'),
                        stake=float(bet_data.get('stake', 0.0)),
                        payout=float(bet_data.get('payout', 0.0)),
                        result=bet_data.get('result'),
                        status=bet_data.get('status'),
                        timestamp=bet_timestamp_dt,
                        user=target_user
                    )
                    db.session.add(bet_entry)
                    log.debug(f"Added bet history entry for match '{bet_data.get('match_name')}' for user '{username}'")

            if is_new_user_flag:
                users_created += 1
                log.info(f"Prepared new user '{username}' with badges and bet history for migration.")
            else:
                users_updated += 1 # User was existing, now updated
                log.info(f"Prepared existing user '{username}' for update with badges and bet history.")

        if users_created > 0 or users_updated > 0:
            try:
                db.session.commit()
                log.info(f"Successfully created {users_created} users and updated {users_updated} users in the database.")
            except Exception as e:
                db.session.rollback()
                log.exception(f"Error committing users to database: {e}")
        else:
            log.info("No new users were created or existing users updated.")
        
        if users_skipped > 0:
            log.info(f"Skipped {users_skipped} user entries.")

        log.info("User migration process finished.")

if __name__ == "__main__":
    migrate_users()