# app/forms.py

# === Standard Library Imports ===
import logging
import re
from typing import Any, Optional as TypingOptional, Dict, Union, Tuple

# === Tredjeparts Bibliotek Imports ===
from flask import current_app # Stadig potentielt nyttig, selvom Config foretrækkes
from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileSize
from wtforms import (
    StringField, TextAreaField, SubmitField, PasswordField, BooleanField, HiddenField,
    DecimalField, SelectField
)
from wtforms.validators import (
    DataRequired, Email, EqualTo, Optional as WTFormsOptionalValidator,
    ValidationError, Regexp, Length, NumberRange, InputRequired
)
from flask_login import current_user

# === Lokale Applikationsimports ===
# Konfiguration først, da den ofte definerer adfærd
from .config import Config

# Modeller (kun til type hinting, ingen funktionalitet afhænger direkte her)
try:
    from .models import User
except ImportError:
    User = None # App kører videre, forms kan defineres

# Håndter potentielfejl ved import af data_access kritisk
DATA_ACCESS_AVAILABLE = False
log = logging.getLogger(__name__) # Grundlæggende logger

try:
    from .data_access import user_exists, email_exists, check_invite_code_validity
    DATA_ACCESS_AVAILABLE = True
    log.info("data_access functions imported successfully into forms.")
except ImportError as e:
    # Log fejlen kraftigt, da vital validering vil fejle
    log.exception("CRITICAL FORMS ERROR: Failed to import from app.data_access. Validation dependent on it will fail or be skipped!")
    # Definer *absolut nødvendige* dummy-funktioner for at undgå NameError crashes.
    # De skal logge fejl og returnere 'neutralt' (typisk "validering OK").
    def user_exists(username: str) -> bool:
        log.error("SKIPPING user_exists check: data_access module unavailable.")
        return False # Antag brugernavn er ledigt for at undgå blokering

    def email_exists(email: str) -> bool:
        log.error("SKIPPING email_exists check: data_access module unavailable.")
        return False # Antag email er ledig for at undgå blokering

    def check_invite_code_validity(code: str) -> Tuple[bool, str, TypingOptional[Dict]]:
        log.error("SKIPPING check_invite_code_validity check: data_access module unavailable.")
        # Returnerer 'valid' for at undgå blokering af registrering, men med klar besked.
        return True, "Invite check skipped due to system error.", None

# Utils (antaget mindre kritisk end data_access for *form definition*)
try:
    from .utils import is_safe_url
except ImportError:
    log.warning("Could not import 'is_safe_url' from utils.")
    def is_safe_url(target: str) -> bool: # Dummy fallback - Changed 'url' to 'target'
        log.error("SKIPPING is_safe_url check: utils unavailable.")
        return False # Vær forsigtig som standard


# ==============================
#   GENERELLE KONSTANTER / HELPERS
# ==============================

# Brug Config direkte for klarhed og centralisering
PASSWORD_MIN_LENGTH = getattr(Config, 'MIN_PASSWORD_LENGTH', 8)
USERNAME_MIN_LENGTH = getattr(Config, 'MIN_USERNAME_LENGTH', 3)
USERNAME_MAX_LENGTH = getattr(Config, 'MAX_USERNAME_LENGTH', 25)
ABOUT_ME_MAX_LENGTH = getattr(Config, 'MAX_ABOUT_ME_LENGTH', 500)
EMAIL_MAX_LENGTH = getattr(Config, 'MAX_EMAIL_LENGTH', 120)
FORUM_TITLE_MIN_LENGTH = getattr(Config, 'FORUM_TITLE_MIN_LENGTH', 5)
FORUM_TITLE_MAX_LENGTH = getattr(Config, 'FORUM_TITLE_MAX_LENGTH', 120)
FORUM_POST_MIN_LENGTH = getattr(Config, 'FORUM_POST_MIN_LENGTH', 10) # Gælder for tråd start
FORUM_REPLY_MIN_LENGTH = getattr(Config, 'FORUM_REPLY_MIN_LENGTH', 3) # Kortere for svar
FORUM_POST_MAX_LENGTH = getattr(Config, 'FORUM_POST_MAX_LENGTH', 20000)
FORUM_REPLY_MAX_LENGTH = getattr(Config, 'FORUM_REPLY_MAX_LENGTH', 10000)

MAX_AVATAR_SIZE_MB_CONFIG = getattr(Config, 'MAX_AVATAR_SIZE_MB', 2) # Hent fra Config med fallback
try:
    MAX_AVATAR_BYTES = int(MAX_AVATAR_SIZE_MB_CONFIG * 1024 * 1024)
except (ValueError, TypeError):
    log.warning(f"Invalid MAX_AVATAR_SIZE_MB value ('{MAX_AVATAR_SIZE_MB_CONFIG}'). Using default 2MB.")
    MAX_AVATAR_BYTES = 2 * 1024 * 1024

# RegEx Patterns (beholdt som globale for nem reference)
PASSWORD_REGEX_PATTERN = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#^~=\-+|]).+$'
PASSWORD_REGEX_MESSAGE = 'Skal indeholde mindst ét lille bogstav, ét stort bogstav, ét tal og ét specialtegn (@$!%*?&_#^~=-+|).'
USERNAME_REGEX_PATTERN = r'^[A-Za-z0-9_]+$' # Kun bogstaver, tal, underscore
USERNAME_REGEX_MESSAGE = 'Må kun indeholde bogstaver (a-z, A-Z), tal (0-9) og underscore (_).'

ALLOWED_AVATAR_EXTENSIONS = ('png', 'jpg', 'jpeg', 'gif', 'webp')
ALLOWED_AVATAR_EXTENSIONS_STR = ', '.join(f'.{ext}' for ext in ALLOWED_AVATAR_EXTENSIONS)

# Helper til render_kw for Bootstrap classes
def form_control_render_kw(**kwargs) -> Dict[str, Any]:
    attrs = {"class": "form-control"}
    attrs.update(kwargs)
    return attrs

def form_textarea_render_kw(rows: int, **kwargs) -> Dict[str, Any]:
    attrs = {"class": "form-control", "rows": str(rows)} # Rows skal være streng
    attrs.update(kwargs)
    return attrs

def form_select_render_kw(**kwargs) -> Dict[str, Any]:
    attrs = {"class": "form-select"} # Brug form-select for select elementer i Bootstrap 5+
    attrs.update(kwargs)
    return attrs

# ==============================
#   CUSTOM WTFORMS VALIDATORS
# ==============================

class InviteCodeValid:
    """WTForms validator: Checks if invite code is valid and unused via data_access."""
    def __init__(self, message: TypingOptional[str] = None):
        self.message = message

    def __call__(self, form: FlaskForm, field: StringField):
        if not DATA_ACCESS_AVAILABLE:
            log.warning(f"Skipping invite code validation for '{field.name}': data_access unavailable.")
            # Dummy funktion har allerede logget en ERROR og returneret True, så ingen ValidationError her.
            return
        if field.data:
            try:
                is_valid, msg_from_check, _ = check_invite_code_validity(field.data)
                if not is_valid:
                    # Brug den specifikke besked fra check-funktionen hvis den findes, ellers fallback
                    error_msg = self.message or msg_from_check or 'Ugyldig eller allerede brugt invite kode.'
                    raise ValidationError(error_msg)
            except Exception as e:
                # Undgå at vise interne fejl til brugeren
                log.exception(f"Exception during check_invite_code_validity for code '{field.data}': {e}")
                raise ValidationError("Systemfejl ved validering af invite kode. Kontakt support hvis problemet vedvarer.")
        # Implicit: Hvis field.data er tomt, lader vi DataRequired håndtere det.

class UniqueEmail:
    """WTForms validator: Checks if email is unique, ignoring current user's email."""
    def __init__(self, message: TypingOptional[str] = None):
        self.message = message or 'E-mailadressen er allerede registreret til en anden konto.'

    def __call__(self, form: FlaskForm, field: StringField):
        if not DATA_ACCESS_AVAILABLE:
            log.warning(f"Skipping unique email validation for '{field.name}': data_access unavailable.")
            # Dummy funktion har returneret False, så ingen ValidationError her.
            return

        if field.data:
            email_to_check = field.data.lower() # Sammenlign altid lowercase

            # Tjek om current_user er logget ind og har en email
            user_is_logged_in = current_user and hasattr(current_user, 'is_authenticated') and current_user.is_authenticated
            current_user_email_lower = None
            if user_is_logged_in and hasattr(current_user, 'email'):
                 current_user_email_lower = getattr(current_user, 'email', '').lower()

            # Hvis emailen matcher den nuværende brugers email, er det OK (vi redigerer egen profil)
            if user_is_logged_in and email_to_check == current_user_email_lower:
                return

            # Ellers, tjek om emailen eksisterer i systemet (for *andre* brugere)
            try:
                if email_exists(email_to_check):
                    raise ValidationError(self.message)
            except Exception as e:
                log.exception(f"Exception during email_exists check for email '{field.data}': {e}")
                raise ValidationError("Systemfejl ved validering af e-mail. Kontakt support.")

class UniqueUsername:
    """WTForms validator: Checks if username is unique."""
    def __init__(self, message: TypingOptional[str] = None):
        self.message = message or 'Brugernavnet er allerede taget.'

    def __call__(self, form: FlaskForm, field: StringField):
        if not DATA_ACCESS_AVAILABLE:
            log.warning(f"Skipping unique username validation for '{field.name}': data_access unavailable.")
            # Dummy funktion returnerer False, så ingen ValidationError her.
            return

        if field.data:
            # Normalt bør brugernavne behandles case-sensitivt eller case-insensitivt konsistent.
            # data_access.user_exists skal håndtere dette. Her sender vi bare data videre.
            try:
                if user_exists(field.data):
                    raise ValidationError(self.message)
            except Exception as e:
                log.exception(f"Exception during user_exists check for username '{field.data}': {e}")
                raise ValidationError("Systemfejl ved validering af brugernavn. Kontakt support.")

class AdminUniqueEmail:
    """
    WTForms validator til admin: Checks if email er unik,
    ignorerer emailen for den specifikke bruger der redigeres (via original_email).
    """
    def __init__(self, message: TypingOptional[str] = None):
        self.message = message or 'E-mailadressen er allerede registreret til en anden konto.'

    def __call__(self, form: FlaskForm, field: StringField):
        if not DATA_ACCESS_AVAILABLE:
            log.warning(f"Skipping admin unique email validation for '{field.name}': data_access unavailable.")
            return

        if field.data and hasattr(form, 'original_email'):
            # Add assertion to help Pylance understand the attribute exists
            assert hasattr(form, 'original_email'), "Form must have 'original_email' attribute for AdminUniqueEmail validator"
            new_email_lower = field.data.lower()
            # Use getattr to satisfy Pylance, hasattr already confirmed existence
            original_email_field = getattr(form, 'original_email')
            original_email_lower = (original_email_field.data or '').lower() # Håndter hvis original ikke er sat

            # Hvis den nye email er den samme som den oprindelige, er det OK
            if new_email_lower == original_email_lower:
                return

            # Tjek om den *nye* email eksisterer for NOGEN bruger
            try:
                if email_exists(new_email_lower):
                    raise ValidationError(self.message)
            except Exception as e:
                log.exception(f"Exception during email_exists check (admin) for email '{field.data}': {e}")
                raise ValidationError("Systemfejl ved validering af e-mail (admin). Kontakt support.")
        elif not hasattr(form, 'original_email'):
             log.error("AdminUniqueEmail validator called on form without 'original_email' field.")


# ==============================
#      AUTH FORMS
# ==============================
class LoginForm(FlaskForm):
    """Standard Login Form."""
    username = StringField('Brugernavn',
        validators=[DataRequired("Brugernavn skal udfyldes.")],
        render_kw=form_control_render_kw(autocomplete="username", required=True)
    )
    password = PasswordField('Adgangskode',
        validators=[DataRequired("Adgangskode skal udfyldes.")],
        render_kw=form_control_render_kw(autocomplete="current-password", required=True)
    )
    remember_me = BooleanField('Husk mig')
    # Removed commented-out next_page field again
    submit = SubmitField('Log Ind')

class RegistrationForm(FlaskForm):
    """Standard Registration Form."""
    username = StringField('Ønsket Brugernavn',
        validators=[
            DataRequired("Brugernavn skal udfyldes."),
            Length(min=USERNAME_MIN_LENGTH, max=USERNAME_MAX_LENGTH,
                   message=f"Skal være mellem {USERNAME_MIN_LENGTH} og {USERNAME_MAX_LENGTH} tegn."),
            Regexp(USERNAME_REGEX_PATTERN, message=USERNAME_REGEX_MESSAGE),
            UniqueUsername() # Bruger den nye custom validator
        ],
        render_kw=form_control_render_kw(
            placeholder=f"Min {USERNAME_MIN_LENGTH} tegn (a-z, 0-9, _)", required=True, autocomplete="username")
    )
    password = PasswordField('Adgangskode',
        validators=[
            DataRequired("Adgangskode skal udfyldes."),
            Length(min=PASSWORD_MIN_LENGTH, message=f"Mindst {PASSWORD_MIN_LENGTH} tegn."),
            Regexp(PASSWORD_REGEX_PATTERN, message=PASSWORD_REGEX_MESSAGE)
        ],
        render_kw=form_control_render_kw(
            placeholder="Vælg en stærk adgangskode", required=True, autocomplete="new-password")
    )
    confirm_password = PasswordField('Bekræft Adgangskode',
        validators=[
            DataRequired(message="Bekræftelse af adgangskode mangler."),
            EqualTo('password', message='Adgangskoderne stemmer ikke overens.')
        ],
        render_kw=form_control_render_kw(
            placeholder="Gentag adgangskoden", required=True, autocomplete="new-password")
    )
    invite_code = StringField('Invite Kode',
        validators=[
            DataRequired("Invite kode er påkrævet for registrering."),
            InviteCodeValid() # Bruger den robuste custom validator
        ],
        render_kw=form_control_render_kw(
            placeholder="Indtast din invite kode", required=True, autocomplete="off")
    )
    submit = SubmitField('Opret Bruger')

class RequestPasswordResetForm(FlaskForm):
    """Form to request password reset link."""
    email = StringField('E-mailadresse',
        validators=[
            DataRequired(message="E-mailadresse skal udfyldes."),
            Email("Ugyldigt e-mail format."),
            Length(max=EMAIL_MAX_LENGTH)
            ],
        render_kw=form_control_render_kw(
            placeholder="Din kontos e-mailadresse", required=True, autocomplete="email")
    )
    submit = SubmitField('Send Nulstillingslink')

    # Server-side validation: Check if email exists
    def validate_email(self, email):
        if DATA_ACCESS_AVAILABLE:
            try:
                if not email_exists(email.data):
                    raise ValidationError('Der findes ingen konto med denne e-mailadresse.')
            except Exception as e:
                log.exception(f"Exception during email_exists check (pw reset request) for email '{email.data}': {e}")
                raise ValidationError("Systemfejl ved tjek af e-mail. Kontakt support.")
        else:
            # Cannot validate existence if data_access is down
            log.warning("Skipping email existence check for password reset request: data_access unavailable.")

class ResetPasswordForm(FlaskForm):
    """Form to reset password using a token."""
    password = PasswordField('Ny Adgangskode',
        validators=[
            DataRequired("Ny adgangskode skal udfyldes."),
            Length(min=PASSWORD_MIN_LENGTH, message=f"Mindst {PASSWORD_MIN_LENGTH} tegn."),
            Regexp(PASSWORD_REGEX_PATTERN, message=PASSWORD_REGEX_MESSAGE)
        ],
        render_kw=form_control_render_kw(required=True, autocomplete="new-password")
    )
    confirm_password = PasswordField('Bekræft Ny Adgangskode',
        validators=[
            DataRequired(message="Bekræftelse mangler."),
            EqualTo('password', message='De nye adgangskoder stemmer ikke overens.')
        ],
        render_kw=form_control_render_kw(required=True, autocomplete="new-password")
    )
    submit = SubmitField('Nulstil Adgangskode')


# ==============================
#      KONTO INDSTILLINGER FORMS
# ==============================
class UpdateAccountForm(FlaskForm):
    """Form for updating user's own account settings (e.g., email, about_me)."""
    email = StringField('E-mailadresse',
        validators=[
            DataRequired("E-mailadresse skal udfyldes."),
            Email("Ugyldigt e-mail format."),
            Length(max=EMAIL_MAX_LENGTH, message=f"Max {EMAIL_MAX_LENGTH} tegn."),
            UniqueEmail() # Bruger custom validator, der ignorerer egen email
        ],
        render_kw=form_control_render_kw(autocomplete="email", required=True)
    )
    about_me = TextAreaField('Om Mig',
        validators=[
            WTFormsOptionalValidator(), # Gør feltet valgfrit
            Length(max=ABOUT_ME_MAX_LENGTH, message=f"Max {ABOUT_ME_MAX_LENGTH} tegn.")
        ],
        render_kw=form_textarea_render_kw(rows=5, placeholder="Fortæl lidt om dig selv...")
    )

    # Privacy Settings
    privacy_profile_public = BooleanField('Gør min profil offentlig',
        default=True,
        render_kw={'class': 'form-check-input'}
    )
    privacy_show_activity = BooleanField('Vis min seneste aktivitet på min profil',
        default=True,
        render_kw={'class': 'form-check-input'}
    )
    privacy_show_bet_history = BooleanField('Vis min spilhistorik på min profil',
        default=True,
        render_kw={'class': 'form-check-input'}
    )
    privacy_show_online_status = BooleanField('Vis min online status til andre brugere',
        default=True,
        render_kw={'class': 'form-check-input'}
    )

    submit = SubmitField('Gem Ændringer')

class ChangePasswordForm(FlaskForm):
    """Form for the user to change their own password."""
    current_password = PasswordField('Nuværende Adgangskode',
        validators=[DataRequired("Indtast din nuværende adgangskode.")],
        render_kw=form_control_render_kw(required=True, autocomplete="current-password")
    )
    new_password = PasswordField('Ny Adgangskode',
        validators=[
            DataRequired("Indtast den nye adgangskode."),
            Length(min=PASSWORD_MIN_LENGTH, message=f"Mindst {PASSWORD_MIN_LENGTH} tegn."),
            Regexp(PASSWORD_REGEX_PATTERN, message=PASSWORD_REGEX_MESSAGE)
            # Sikrer ny adgangskode er forskellig fra nuværende: Gøres bedst i route/handler
            # med adgang til at tjekke den hashede current_password.
        ],
        render_kw=form_control_render_kw(required=True, autocomplete="new-password")
    )
    confirm_new_password = PasswordField('Bekræft Ny Adgangskode',
        validators=[
            DataRequired("Bekræft den nye adgangskode."),
            EqualTo('new_password', message='De nye adgangskoder stemmer ikke overens.')
        ],
        render_kw=form_control_render_kw(required=True, autocomplete="new-password")
    )
    submit = SubmitField('Skift Adgangskode')
    # BEMÆRK: Verifikation af 'current_password' skal ske i view-funktionen (route handleren),
    # da det kræver sammenligning mod den hashede adgangskode i databasen/filen.

class AvatarUploadForm(FlaskForm):
    """Form specifically for validating avatar uploads (often used via AJAX)."""
    avatar = FileField('Vælg nyt avatar billede',
        validators=[
            # FileRequired() kan bruges hvis en fil *skal* uploades. Typisk valgfrit.
            FileAllowed(ALLOWED_AVATAR_EXTENSIONS,
                        message=f'Ugyldig filtype. Tilladte typer: {ALLOWED_AVATAR_EXTENSIONS_STR}'),
            FileSize(max_size=MAX_AVATAR_BYTES,
                     message=f"Filen må højst fylde {MAX_AVATAR_SIZE_MB_CONFIG} MB.")
            # WTFormsOptionalValidator() er normalt ikke nødvendig for FileField - den er tom hvis ingen fil vælges.
        ])
    # Ingen Submit knap, da den ofte håndteres af JavaScript/AJAX


# ==============================
#      FORUM FORMS
# ==============================
class ForumReplyForm(FlaskForm):
    """Form for posting a reply in a forum thread."""
    body = TextAreaField('Dit Svar',
        validators=[
            DataRequired("Svar må ikke være tomt."),
            Length(min=FORUM_REPLY_MIN_LENGTH, max=FORUM_REPLY_MAX_LENGTH,
                   message=f"Svar skal være mellem {FORUM_REPLY_MIN_LENGTH} og {FORUM_REPLY_MAX_LENGTH} tegn.")
            ],
        render_kw=form_textarea_render_kw(rows=6, placeholder="Skriv dit svar her...", required=True)
    )
    submit = SubmitField('Send Svar')

class ForumEditPostForm(FlaskForm):
    """Form for editing an existing forum post or reply."""
    body = TextAreaField('Rediger Indlæg/Svar',
        validators=[
            DataRequired("Indhold må ikke være tomt."),
            Length(min=FORUM_REPLY_MIN_LENGTH, max=FORUM_POST_MAX_LENGTH, # Tillad op til max post længde ved redigering
                   message=f"Skal være mellem {FORUM_REPLY_MIN_LENGTH} og {FORUM_POST_MAX_LENGTH} tegn.")
            ],
        render_kw=form_textarea_render_kw(rows=12, placeholder="Rediger dit indlæg...", required=True)
    )
    submit = SubmitField('Gem Ændringer')

class ForumNewThreadForm(FlaskForm):
    """Form for creating a new forum thread."""
    # category_id skal populeres dynamisk i view-funktionen
    category_id = SelectField('Kategori',
        coerce=int, # Konverter valgt værdi til integer
        validators=[DataRequired("Du skal vælge en kategori.")],
        render_kw=form_select_render_kw(required=True)
    )
    title = StringField('Trådens Titel',
        validators=[
            DataRequired("Titel må ikke være tom."),
            Length(min=FORUM_TITLE_MIN_LENGTH, max=FORUM_TITLE_MAX_LENGTH,
                   message=f"Titel skal være mellem {FORUM_TITLE_MIN_LENGTH} og {FORUM_TITLE_MAX_LENGTH} tegn.")
            ],
        render_kw=form_control_render_kw(placeholder="Giv tråden en klar og beskrivende titel", required=True)
    )
    body = TextAreaField('Første Indlæg',
        validators=[
            DataRequired("Første indlæg må ikke være tomt."),
            Length(min=FORUM_POST_MIN_LENGTH, max=FORUM_POST_MAX_LENGTH,
                   message=f"Indlæg skal være mellem {FORUM_POST_MIN_LENGTH} og {FORUM_POST_MAX_LENGTH} tegn.")
            ],
        render_kw=form_textarea_render_kw(rows=10, placeholder="Skriv det første indlæg i tråden...", required=True)
    )
    submit = SubmitField('Opret Ny Tråd')


# ==============================
#      ADMIN FORMS
# ==============================
class AdminEditUserForm(FlaskForm):
    """Form for administrators to edit user details."""
    # Skjult felt til at holde den oprindelige email for validering
    original_email = HiddenField()

    email = StringField('E-mailadresse',
        validators=[
            DataRequired("E-mailadresse skal udfyldes."),
            Email("Ugyldigt e-mail format."),
            Length(max=EMAIL_MAX_LENGTH, message=f"Max {EMAIL_MAX_LENGTH} tegn."),
            AdminUniqueEmail() # Bruger den specielle admin validator
        ],
        render_kw=form_control_render_kw(required=True, autocomplete="off") # Slå autocomplete fra for admin felter
    )
    role = SelectField('Rolle',
        choices=[('user', 'Bruger'), ('admin', 'Administrator')],
        validators=[DataRequired("Vælg en rolle for brugeren.")],
        render_kw=form_select_render_kw() # Brug form-select her
    )
    is_active = BooleanField('Konto er aktiv', default=True) # Sæt default til aktiv

    about_me = TextAreaField('Om Mig (Admin)',
        validators=[
            WTFormsOptionalValidator(), # Admin kan redigere/fjerne dette
            Length(max=ABOUT_ME_MAX_LENGTH, message=f"Max {ABOUT_ME_MAX_LENGTH} tegn.")
            ],
        render_kw=form_textarea_render_kw(rows=3, placeholder="Administrator kan opdatere beskrivelsen...")
    )
    # Read-only felt til at vise status - skal sættes manuelt fra view
    twofa_enabled_display = StringField('2FA Status',
                                         render_kw={'readonly': True, "class": "form-control-plaintext text-muted"})

    # Balance håndteres via separat API endpoint (jvf. changelog), ikke direkte i denne form.

    submit = SubmitField('Gem Brugerændringer')

# Example Admin Balance Update Form (could be simple for AJAX)
class AdminUpdateBalanceForm(FlaskForm):
    """Simple form for admin updating balance (likely used via AJAX)."""
    balance = DecimalField('Ny Saldo',
        validators=[InputRequired("Saldo skal angives."), NumberRange(min=0, message="Saldo kan ikke være negativ.")],
        places=2, # Tillad 2 decimaler
        render_kw=form_control_render_kw(type="number", step="0.01") # Brug HTML5 number input
        )
    # Submit knap er unødvendig hvis det er AJAX kald


# ==============================
#      SEARCH FORM
# ==============================
class SearchForm(FlaskForm):
     """Minimal form for site search (often submitted via GET)."""
     query = StringField('Søgeterm',
                         validators=[DataRequired(message="Indtast hvad du vil søge efter.")],
                         render_kw=form_control_render_kw(placeholder="Søg på siden..."))
    # Submit knap er ofte i HTML template, ikke nødvendigvis i form definition her


# ==============================
#      PRIVATE MESSAGE FORM
# ==============================
class PrivateMessageForm(FlaskForm):
   """Form for sending a private message."""
   recipient_username = StringField('Til (Brugernavn)',
       validators=[
           DataRequired("Modtager skal angives."),
           Length(min=USERNAME_MIN_LENGTH, max=USERNAME_MAX_LENGTH)
       ],
       render_kw=form_control_render_kw(placeholder="Indtast modtagerens brugernavn", required=True)
   )
   subject = StringField('Emne',
       validators=[
           DataRequired("Emne må ikke være tomt."),
           Length(min=3, max=250, message="Emne skal være mellem 3 og 250 tegn.")
       ],
       render_kw=form_control_render_kw(placeholder="Indtast emne for beskeden", required=True)
   )
   body = TextAreaField('Besked',
       validators=[
           DataRequired("Besked må ikke være tom."),
           Length(min=1, max=FORUM_POST_MAX_LENGTH) # Reuse forum post max length for now
       ],
       render_kw=form_textarea_render_kw(rows=8, placeholder="Skriv din private besked her...", required=True)
   )
   submit = SubmitField('Send Besked')

   def validate_recipient_username(self, recipient_username: StringField):
       """Checks if the recipient username exists."""
       if not DATA_ACCESS_AVAILABLE:
           log.warning(f"Skipping recipient username validation for '{recipient_username.data}': data_access unavailable.")
           return
       if recipient_username.data:
           try:
               if not user_exists(recipient_username.data):
                   raise ValidationError(f"Brugeren '{recipient_username.data}' blev ikke fundet.")
               if current_user.is_authenticated and recipient_username.data.lower() == current_user.username.lower():
                   raise ValidationError("Du kan ikke sende en privat besked til dig selv.")
           except Exception as e:
               log.exception(f"Exception during user_exists check for recipient '{recipient_username.data}': {e}")
               raise ValidationError("Systemfejl ved validering af modtager. Kontakt support.")


# === EOF: app/forms.py ===
