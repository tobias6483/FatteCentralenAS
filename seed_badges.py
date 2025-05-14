from app import create_app, db
from app.models import Badge

# List of badges to create
# (key, name, description, icon, color)
badges_to_seed = [
    ('first_bet', 'Første Bet', 'Du placerede dit første bet!', 'bi-pencil-square', 'info'),
    ('first_win', 'Første Gevinst', 'Tillykke med din første vundne bet!', 'bi-trophy-fill', 'success'),
    ('coupon_creator', 'Kupon Bygger', 'Du har oprettet din første kupon-session!', 'bi-ticket-detailed-fill', 'primary'),
    # ('chatty_user', 'Snakkesalig', 'Du har sendt dine første 10 beskeder i en chat!', 'bi-chat-dots-fill', 'secondary'), # Deferred - requires message tracking
    ('high_roller', 'Storspiller', 'Du har placeret et bet over 100 DKK!', 'bi-gem', 'warning'),
    ('centurion_bets', 'Centurion', 'Du har placeret 100 bets!', 'bi-shield-check', 'danger'),
    ('active_participant', 'Aktiv Deltager', 'Du har joinet 5 sessions!', 'bi-people-fill', 'info'),
    ('forum_contributor_10', 'Forum Skribent', 'Du har skrevet 10 indlæg i forummet!', 'bi-chat-left-text-fill', 'primary'),
    ('big_win_200', 'Kassen Ringer', 'Du har vundet over 200 DKK på et enkelt bet!', 'bi-cash-stack', 'success'),
    ('session_starter_5', 'Spilmester', 'Du har oprettet 5 spilsessioner!', 'bi-joystick', 'info')
]

def seed_all_badges():
    app = create_app()
    with app.app_context():
        print("Seeding badges...")
        existing_badge_names = {b.name for b in Badge.query.all()}
        created_count = 0
        skipped_count = 0

        for key, name, description, icon, color in badges_to_seed:
            if name in existing_badge_names:
                print(f"Badge '{name}' already exists. Skipping.")
                skipped_count += 1
                continue

            try:
                new_badge = Badge(name=name, description=description, icon=icon, color=color)
                # The 'key' isn't a direct model field in Badge, 'name' is used as the unique identifier.
                # If you need a separate 'key' field, add it to the Badge model.
                db.session.add(new_badge)
                print(f"  Added badge: {name}")
                created_count += 1
            except Exception as e:
                print(f"  Error adding badge {name}: {e}")
                db.session.rollback()

        if created_count > 0:
            try:
                db.session.commit()
                print(f"Successfully committed {created_count} new badges.")
            except Exception as e:
                print(f"Error committing badges: {e}")
                db.session.rollback()
        
        print(f"Badge seeding complete. Created: {created_count}, Skipped: {skipped_count}.")

if __name__ == '__main__':
    seed_all_badges()