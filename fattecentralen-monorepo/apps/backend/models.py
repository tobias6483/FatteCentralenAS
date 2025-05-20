# app/models.py

# === Standard Bibliotek Imports ===
import html  # Til fallback escaping
import logging
import re
import uuid  # Added for User.uid default
from datetime import (  # Brug timezone-aware datetime, ADD timedelta
    datetime,
    timedelta,
    timezone,
)
from typing import Any, Dict, List, Optional

import bleach  # Til HTML sanering

# === Tredjeparts Bibliotek Imports ===
# Removed: from flask import url_for, current_app - Will be imported locally
from flask_login import UserMixin  # Bruges af User klassen (non-DB)
from markdown import markdown  # Til Markdown konvertering
from slugify import slugify  # Til slugs for kategorier
from sqlalchemy import (  # Added Table for association_table, ADDED desc
    Table,
    desc,
    func,
)
from sqlalchemy.orm import validates  # Kan bruges til simple valideringer

# === Lokale Applikationsimports ===
# Korrekt import af db objektet
from .extensions import db

# Logger
log = logging.getLogger(__name__)

# Association table for User and Badge (Many-to-Many)
user_badge_association = Table(
    "user_badge_association",
    db.Model.metadata,
    db.Column("user_id", db.Integer, db.ForeignKey("user.id"), primary_key=True),
    db.Column("badge_id", db.Integer, db.ForeignKey("badge.id"), primary_key=True),
    db.Column(
        "awarded_at",
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    ),
)


# ==========================================================
#       Ny SQLAlchemy User Model
# ==========================================================
class User(db.Model, UserMixin):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    uid = db.Column(
        db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4())
    )
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    firebase_uid = db.Column(
        db.String(128), unique=True, nullable=True, index=True
    )  # For Firebase integration
    password_hash = db.Column(
        db.String(128), nullable=True
    )  # Nullable if using Firebase auth primarily
    role = db.Column(db.String(20), default="user", nullable=False)
    # Renamed to avoid conflict with UserMixin.is_active property
    _is_active_db = db.Column(
        db.Boolean, default=True, nullable=False, name="is_active"
    )

    balance = db.Column(db.Float, default=0.0, nullable=False)
    registration_date = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_login = db.Column(db.DateTime(timezone=True), nullable=True)
    last_seen = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=True,
    )  # Track user activity
    rank = db.Column(db.String(50), nullable=True)
    invited_by = db.Column(db.String(80), nullable=True)
    avatar = db.Column(db.String(255), nullable=True)  # Path to avatar file

    about_me = db.Column(db.Text, nullable=True)
    about_me_last_updated = db.Column(db.DateTime(timezone=True), nullable=True)

    twofa_enabled = db.Column(db.Boolean, default=False, nullable=False)
    twofa_secret = db.Column(db.String(32), nullable=True)
    backup_codes = db.Column(
        db.Text, nullable=True
    )  # Store as JSON string or comma-separated

    wins = db.Column(db.Integer, default=0, nullable=False)
    losses = db.Column(db.Integer, default=0, nullable=False)
    total_staked = db.Column(db.Float, default=0.0, nullable=False)
    total_won = db.Column(db.Float, default=0.0, nullable=False)
    total_lost = db.Column(db.Float, default=0.0, nullable=False)
    largest_win = db.Column(db.Float, default=0.0, nullable=True)
    largest_loss = db.Column(db.Float, default=0.0, nullable=True)

    level = db.Column(db.Integer, default=1, nullable=False)
    xp = db.Column(db.Integer, default=0, nullable=False)
    xp_next_level = db.Column(
        db.Integer, default=100, nullable=False
    )  # Example starting value

    # For Aktiedyst - using JSON type if available, otherwise Text
    portfolio = db.Column(db.JSON, nullable=True, default=lambda: {})
    stock_transactions = db.Column(db.JSON, nullable=True, default=lambda: [])
    watchlist = db.Column(db.JSON, nullable=True, default=lambda: [])
    dividends = db.Column(db.JSON, nullable=True, default=lambda: [])

    # User-specific settings, e.g., stock_balance if different from main balance
    settings = db.Column(db.JSON, nullable=True, default=lambda: {})

    # Privacy Settings
    privacy_profile_public = db.Column(db.Boolean, default=True, nullable=False)
    privacy_show_activity = db.Column(db.Boolean, default=True, nullable=False)
    privacy_show_bet_history = db.Column(db.Boolean, default=True, nullable=False)
    privacy_show_online_status = db.Column(db.Boolean, default=True, nullable=False)
    # Add more granular privacy settings here as needed, e.g., for balance, level, etc.

    # Explicit __init__ to allow keyword argument instantiation
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    # Relationships
    badges = db.relationship(
        "Badge",
        secondary=user_badge_association,
        back_populates="users",
        lazy="dynamic",
    )
    bet_history_entries = db.relationship(
        "BetHistory", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )

    # Flask-Login integration
    @property
    def is_active(self):
        """Required by Flask-Login. Returns the value of the database column."""
        return self._is_active_db

    @property
    def is_admin(self):
        return self.role == "admin"

    @property
    def avatar_url(self):
        # Import locally to avoid circular dependencies
        from flask import current_app, url_for

        avatar_filename = self.avatar  # Use the direct attribute from the DB model
        default_avatar_path = current_app.config.get(
            "DEFAULT_AVATAR", "static/avatars/default_avatar.png"
        )  # Ensure full path for fallback
        # Ensure default_avatar_path is relative to static if not already
        if default_avatar_path.startswith("static/"):
            default_avatar_path = default_avatar_path[len("static/") :]

        final_filename_for_url_for = default_avatar_path  # Start with default

        if avatar_filename and isinstance(avatar_filename, str):
            # The 'avatar' field in the DB model should store the filename directly,
            # or a path relative to the AVATAR_UPLOAD_FOLDER.
            # Let's assume it's just the filename.
            avatar_upload_subdir = current_app.config.get(
                "AVATAR_UPLOAD_SUBDIR", "avatars"
            )
            # Construct path relative to 'static' folder for url_for
            user_avatar_path_for_url_for = (
                f"{avatar_upload_subdir}/{avatar_filename}".replace("\\", "/")
            )

            final_filename_for_url_for = user_avatar_path_for_url_for

        try:
            # _external=False is default, but good to be explicit for clarity
            return url_for(
                "static", filename=final_filename_for_url_for, _external=False
            )
        except RuntimeError:
            # This can happen if url_for is called outside of an active app context
            log.error(
                f"Could not generate avatar URL for '{final_filename_for_url_for}' (RuntimeError: likely no app context). User: {self.username}"
            )
            # Fallback to a manually constructed path if url_for fails
            return f"/static/{default_avatar_path}"
        except Exception as e:
            log.exception(
                f"Unexpected error generating avatar URL for user '{self.username}' (file: {final_filename_for_url_for}): {e}"
            )
            return f"/static/{default_avatar_path}"

    @property
    def post_count(self) -> int:
        """Calculates the user's forum post count via a DB query."""
        try:
            # Query the ForumPost table directly
            count = (
                db.session.query(func.count(ForumPost.id))
                .filter(ForumPost.author_username == self.username)
                .scalar()
            )
            return count or 0
        except Exception as e:
            log.error(f"Error counting forum posts for user {self.username}: {e}")
            return 0

    # For Flask-Login, id is typically the primary key
    # def get_id(self):
    #     return str(self.id) # UserMixin expects string ID

    @property
    def is_online(self) -> bool:
        """Checks if the user was last seen within the configured threshold (e.g., 5 minutes)."""
        if not self.last_seen:
            return False  # Never seen

        # Ensure last_seen is timezone-aware (should be if stored correctly)
        last_seen_aware = self.last_seen
        if last_seen_aware.tzinfo is None:
            # If somehow stored as naive, assume UTC (or handle based on your app's timezone logic)
            last_seen_aware = last_seen_aware.replace(tzinfo=timezone.utc)
            log.warning(f"User {self.id} last_seen timestamp was naive. Assuming UTC.")

        # Get current time (aware)
        now_aware = datetime.now(timezone.utc)

        # Import current_app locally
        from flask import current_app

        # Define the threshold (e.g., 5 minutes) - could be moved to config
        threshold_minutes = current_app.config.get("USER_ONLINE_THRESHOLD_MINUTES", 5)
        threshold = timedelta(minutes=threshold_minutes)

        return (now_aware - last_seen_aware) < threshold

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"


class Badge(db.Model):
    __tablename__ = "badge"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(100), nullable=True)
    color = db.Column(
        db.String(50), nullable=True
    )  # e.g., 'danger', 'info', or hex code

    users = db.relationship(
        "User",
        secondary=user_badge_association,
        back_populates="badges",
        lazy="dynamic",
    )

    def __repr__(self):
        return f"<Badge(id={self.id}, name='{self.name}')>"


class BetHistory(db.Model):
    __tablename__ = "bet_history"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False, index=True
    )

    session_id = db.Column(
        db.String(36), nullable=True, index=True
    )  # Link to Redis session ID
    match_name = db.Column(db.String(255), nullable=True)
    outcome_name = db.Column(db.String(255), nullable=True)
    stake = db.Column(db.Float, nullable=False)
    payout = db.Column(db.Float, nullable=True, default=0.0)
    result = db.Column(
        db.String(50), nullable=True
    )  # e.g., "won", "lost", "pending", "cancelled"
    status = db.Column(db.String(50), nullable=True)  # e.g., "afgjort", "open"
    timestamp = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # user relationship is defined by backref in User.bet_history_entries

    # Explicit __init__ to help type checkers
    def __init__(
        self,
        user_id: int,
        stake: float,
        session_id: Optional[str] = None,
        match_name: Optional[str] = None,
        outcome_name: Optional[str] = None,
        payout: Optional[float] = 0.0,
        result: Optional[str] = "pending",
        status: Optional[str] = "open",
        timestamp_val: Optional[datetime] = None,
        **kwargs,
    ):  # Renamed timestamp to timestamp_val
        super().__init__(**kwargs)  # Pass extra kwargs to parent constructor if needed
        self.user_id = user_id
        self.session_id = session_id
        self.match_name = match_name
        self.outcome_name = outcome_name
        self.stake = stake
        self.payout = payout
        self.result = result
        self.status = status
        # If timestamp_val is provided, use it; otherwise, the DB default will apply on flush.
        if timestamp_val is not None:
            self.timestamp = timestamp_val
        # If not provided, self.timestamp remains unassigned here, letting DB default work.

    def __repr__(self):
        return f"<BetHistory(id={self.id}, user_id={self.user_id}, match='{self.match_name}', stake={self.stake})>"


class InviteCode(db.Model):
    __tablename__ = "invite_code"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(
        db.String(36), unique=True, nullable=False, index=True
    )  # e.g., UUID

    created_by_username = db.Column(
        db.String(80), db.ForeignKey("user.username"), nullable=True
    )  # Optional: link to creator
    creator = db.relationship(
        "User",
        backref=db.backref("created_invite_codes", lazy="dynamic"),
        foreign_keys=[created_by_username],
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at = db.Column(db.DateTime(timezone=True), nullable=True)

    max_uses = db.Column(db.Integer, default=1, nullable=False)
    uses_count = db.Column(db.Integer, default=0, nullable=False)

    is_active = db.Column(
        db.Boolean, default=True, nullable=False
    )  # Can be manually deactivated

    # Track who used it and when (for single-use codes, this is simple)
    # For multi-use, this might need a separate table if detailed tracking per use is needed.
    used_by_username = db.Column(
        db.String(80), db.ForeignKey("user.username"), nullable=True
    )
    user_who_used = db.relationship(
        "User",
        backref=db.backref("used_invite_code", uselist=False),
        foreign_keys=[used_by_username],
    )
    used_at = db.Column(db.DateTime(timezone=True), nullable=True)

    notes = db.Column(db.Text, nullable=True)  # For admin notes about the code

    @property
    def is_valid(self) -> bool:
        """Checks if the code is currently valid for use."""
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < datetime.now(timezone.utc):
            return False
        if self.uses_count >= self.max_uses:
            return False
        return True

    def __repr__(self):
        return f"<InviteCode(id={self.id}, code='{self.code}', uses={self.uses_count}/{self.max_uses}, active={self.is_active})>"


# ==========================================================
#       SQLAlchemy Model for Password Reset Requests
# ==========================================================
class PasswordResetRequest(db.Model):
    __tablename__ = "password_reset_request"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False, index=True
    )

    # The unique token sent to the user (or given by admin)
    token = db.Column(db.String(128), unique=True, nullable=False, index=True)

    requested_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)

    # Status: 'pending', 'used', 'expired', 'admin_reset'
    status = db.Column(db.String(50), default="pending", nullable=False, index=True)

    # Optional: Track which admin generated/handled this request
    handled_by_admin_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    handled_at = db.Column(db.DateTime(timezone=True), nullable=True)

    user = db.relationship(
        "User",
        foreign_keys=[user_id],
        backref=db.backref("password_reset_requests", lazy="dynamic"),
    )
    admin_handler = db.relationship("User", foreign_keys=[handled_by_admin_id])

    def __init__(self, user_id: int, token: str, expires_in_hours: int = 24):
        self.user_id = user_id
        self.token = token
        self.expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_in_hours)

    @property
    def is_valid(self) -> bool:
        """Checks if the reset request token is currently valid (pending and not expired)."""
        if self.status != "pending":
            return False

        expires_aware = self.expires_at
        # Ensure expires_at is timezone-aware (assume UTC if naive)
        if expires_aware and (
            expires_aware.tzinfo is None
            or expires_aware.tzinfo.utcoffset(expires_aware) is None
        ):
            log.warning(
                f"PasswordResetRequest {self.id} expires_at was offset-naive. Assuming UTC."
            )
            expires_aware = expires_aware.replace(tzinfo=timezone.utc)

        # If expires_aware is still None after potential assignment, it's invalid
        if not expires_aware:
            return False

        now_aware = datetime.now(timezone.utc)
        return expires_aware > now_aware

    def __repr__(self):
        return f"<PasswordResetRequest(id={self.id}, user_id={self.user_id}, status='{self.status}', expires='{self.expires_at.strftime('%Y-%m-%d %H:%M') if self.expires_at else 'N/A'}')>"


# ==========================================================
#         SQLAlchemy Modeller for Forum
# ==========================================================


# --- DEFINITION AF ForumPost FLYTTET HERTIL ---
class ForumPost(db.Model):
    """Represents a single post within a forum thread."""

    __tablename__ = "forum_post"
    # __searchable__ = ['body', 'author_username'] # REMOVED - WhooshAlchemy integration removed

    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.Text, nullable=False)
    body_html = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        index=True,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relation til Tråd (defineres EFTER ForumThread) - Vi bruger string ref her
    thread_id = db.Column(
        db.Integer, db.ForeignKey("forum_thread.id"), nullable=False, index=True
    )
    thread = db.relationship(
        "ForumThread", back_populates="posts", foreign_keys=[thread_id]
    )  # Angiv FK eksplicit

    # Forfatter (kun username gemmes)
    author_username = db.Column(db.String(80), nullable=False, index=True)

    # Felter til redigeringshistorik (valgfrit)
    last_edited_by = db.Column(db.String(80), nullable=True)
    last_edited_at = db.Column(db.DateTime(timezone=True), nullable=True)

    @staticmethod
    def _handle_body_set(target, value, oldvalue, initiator):
        if not value or value == oldvalue:
            return
        log.debug(f"Generating HTML for post {getattr(target, 'id', 'NEW')}")
        allowed_tags = {
            "p",
            "br",
            "strong",
            "b",
            "em",
            "i",
            "u",
            "strike",
            "sub",
            "sup",
            "ul",
            "ol",
            "li",
            "a",
            "blockquote",
            "code",
            "pre",
            "h3",
            "h4",
            "h5",
            "h6",
        }
        allowed_attrs = {
            "a": ["href", "title", "rel"],
            "*": ["class"],
        }
        allowed_protocols = {"http", "https", "mailto"}
        try:
            md_html = markdown(
                value, output_format="html", extensions=["fenced_code", "nl2br"]
            )  # Use 'html'
            cleaned_html = bleach.clean(
                md_html,
                tags=allowed_tags,
                attributes=allowed_attrs,
                protocols=allowed_protocols,
                strip=True,
                strip_comments=True,
            )
            target.body_html = bleach.linkify(cleaned_html, parse_email=True)
            log.debug(
                f"Successfully generated sanitized HTML for post {getattr(target, 'id', 'NEW')}"
            )
        except Exception:
            log.exception(
                f"CRITICAL: Error during Markdown/Bleach processing for Post ID {getattr(target, 'id', 'NEW')}. Falling back."
            )
            escaped_body = html.escape(value)
            target.body_html = (
                f"<p><b>Fejl under formatering:</b></p><pre>{escaped_body}</pre>"
            )

    # Explicit __init__ to allow keyword argument instantiation
    def __init__(self, **kwargs):  # type: ignore[no-untyped-def]
        super().__init__(**kwargs)

    def __repr__(self):
        return f"<ForumPost(id={self.id}, author='{self.author_username}', thread_id={self.thread_id})>"


# Registrer event listener for `body` feltet på ForumPost (flyttet op med klassen)
db.event.listen(ForumPost.body, "set", ForumPost._handle_body_set, retval=False)
# ------------------------------------------------


class ForumCategory(db.Model):
    """Represents a category in the forum."""

    __tablename__ = "forum_category"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True, index=True)
    slug = db.Column(db.String(120), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(50), nullable=True, default="bi-folder")
    sort_order = db.Column(db.Integer, default=0)

    # Relation til tråde - Bruger strengen 'ForumThread' da den defineres senere
    threads = db.relationship(
        "ForumThread",
        back_populates="category",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    # Corrected type hints for optional parameters
    def __init__(
        self,
        name: str,
        description: Optional[str] = None,
        icon: Optional[str] = None,
        sort_order: int = 0,
    ):
        self.name = name
        self.description = description
        self.icon = icon or "bi-folder"
        self.sort_order = sort_order
        self.generate_slug()
        # Slug genereres via event listener

    @property
    def thread_count(self) -> int:
        try:
            return self.threads.count()
        except Exception as e:
            log.error(f"Error counting threads for category {self.id}: {e}")
            return 0

    @property
    def post_count(self) -> int:
        try:
            count = (
                db.session.query(db.func.count(ForumPost.id))
                .join(ForumThread, ForumPost.thread_id == ForumThread.id)
                .filter(ForumThread.category_id == self.id)
                .scalar()
            )
            return count or 0
        except Exception as e:
            log.error(f"Error counting posts for category {self.id}: {e}")
            return 0

    @property
    def last_activity_thread(self) -> Optional["ForumThread"]:
        try:
            # Use imported desc function
            # Ignore potential Pylance false positive on dynamic relationship query
            return self.threads.order_by(desc(ForumThread.updated_at)).first()  # type: ignore[no-any-return]
        except Exception as e:
            log.error(
                f"Error fetching last activity thread for category {self.id}: {e}"
            )
            return None

    def generate_slug(self):
        if self.name:
            base_slug = slugify(self.name)
            self.slug = base_slug
            n = 1
            # Combine filter conditions with & (reverted)
            while (
                ForumCategory.query.filter(
                    (ForumCategory.id != self.id) & (ForumCategory.slug == self.slug)
                ).count()
                > 0
            ):
                self.slug = f"{base_slug}-{n}"
                n += 1
            log.debug(f"Generated slug '{self.slug}' for category '{self.name}'")

    def __repr__(self):
        return f"<ForumCategory(id={self.id}, name='{self.name}', slug='{self.slug}')>"


# @staticmethod
# def _listen_for_name_change(target, value, oldvalue, initiator):
#     if value and value != oldvalue:
#         target.generate_slug()

# db.event.listen(ForumCategory.name, 'set', ForumCategory._listen_for_name_change)


class ForumThread(db.Model):
    __tablename__ = "forum_thread"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        index=True,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        index=True,
        default=lambda: datetime.now(timezone.utc),
    )  # Bruges af event listener
    is_sticky = db.Column(db.Boolean, default=False, index=True)
    is_locked = db.Column(db.Boolean, default=False)
    view_count = db.Column(
        db.Integer, default=0
    )  # Denne opdateres sandsynligvis i din view-funktion

    # --- TILFØJ DENNE LINJE ---
    post_count = db.Column(
        db.Integer, default=0, nullable=False, index=True
    )  # Kolonne til at gemme antal posts
    # --------------------------

    category_id = db.Column(
        db.Integer, db.ForeignKey("forum_category.id"), nullable=False, index=True
    )
    category = db.relationship("ForumCategory", back_populates="threads")

    author_username = db.Column(db.String(80), nullable=False, index=True)

    posts = db.relationship(
        "ForumPost",
        foreign_keys=[ForumPost.thread_id],
        back_populates="thread",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="ForumPost.created_at",
    )

    first_post_id = db.Column(
        db.Integer,
        db.ForeignKey("forum_post.id", use_alter=True, name="fk_thread_first_post"),
        nullable=True,
    )  # Bruges af event listener
    last_post_id = db.Column(
        db.Integer,
        db.ForeignKey("forum_post.id", use_alter=True, name="fk_thread_last_post"),
        nullable=True,
    )  # Bruges af event listener

    first_post = db.relationship(
        "ForumPost", foreign_keys=[first_post_id], post_update=True
    )
    last_post = db.relationship(
        "ForumPost", foreign_keys=[last_post_id], post_update=True
    )

    # FJERN ELLER OMDØB DENNE PROPERTY (for at undgå navnekonflikt)
    # Enten slet den helt (da du nu har en DB kolonne)
    # Eller omdøb den, hvis du *også* vil have en on-the-fly beregning tilgængelig:
    @property
    def calculated_post_count(self) -> int:  # Omdøbt fra post_count
        """Beregner post count on-the-fly (bruger muligvis DB query)."""
        try:
            return self.posts.count()
        except Exception as e:
            log.error(f"Error calculating posts for thread {self.id}: {e}")
            return (
                0  # Eller måske return self.post_count (den gemte værdi) som fallback?
            )

    def __repr__(self):
        return f"<ForumThread(id={self.id}, title='{self.title[:30]}...', category='{self.category.name if self.category else 'N/A'}')>"


# ==========================================================
#     SQLAlchemy Event Listeners for Thread Updates
# ==========================================================


@db.event.listens_for(ForumPost, "after_insert")
@db.event.listens_for(ForumPost, "after_delete")
def _update_thread_stats_on_post_change(mapper, connection, target):
    """Opdaterer thread stats (first/last post ID, post count) når posts ændres."""
    thread_id = None
    post_id = None
    try:
        if isinstance(target, ForumPost):
            thread_id = target.thread_id
            post_id = target.id

        if not thread_id:
            log.warning(
                f"Could not get thread_id from target in _update_thread_stats event (Target ID: {post_id}, Type: {type(target)})"
            )
            return

        log.debug(
            f"--- Event Triggered: Post ID {post_id} changed in Thread ID {thread_id} ---"
        )

        # --- BRUG db.select (tilgængelig via db extension) ---
        result = connection.execute(
            db.select(  # <--- Rettet tilbage til db.select()
                func.min(ForumPost.id),
                func.max(ForumPost.id),
                func.max(ForumPost.created_at),
                func.count(ForumPost.id),
            ).where(ForumPost.thread_id == thread_id)
        ).first()

        # Pak resultatet ud
        first_id, last_id, last_time, post_count_actual = (
            result if result else (None, None, None, 0)
        )
        # ----------------------------------------------------------------

        # Find trådens egen oprettelsestid
        thread_created_result = connection.execute(
            db.select(ForumThread.created_at).where(
                ForumThread.id == thread_id
            )  # <--- Også her db.select()
        ).scalar_one_or_none()
        thread_created = (
            thread_created_result
            if thread_created_result
            else datetime.now(timezone.utc)
        )

        # Brug seneste post-tid, eller trådens oprettelsestid
        update_time = last_time if last_time is not None else thread_created

        # --- DETALJERET LOGGING (BEHOLD DENNE) ---
        log.debug(
            "***** INSIDE _update_thread_stats_on_post_change for thread {} *****".format(
                thread_id
            )
        )
        log.debug(f"  Triggered by Post ID: {post_id}")
        log.debug(
            f"  Attempting to update with (Values from connection query using db.select):"
        )  # Opdateret log tekst
        log.debug(f"    -> first_post_id = {first_id} (Type: {type(first_id)})")
        log.debug(f"    -> last_post_id = {last_id} (Type: {type(last_id)})")
        log.debug(
            f"    -> post_count_actual = {post_count_actual} (Type: {type(post_count_actual)})"
        )  # <= TJEK VÆRDIEN HER!
        log.debug(f"    -> update_time = {update_time} (Type: {type(update_time)})")
        log.debug(f"***** END PRE-UPDATE CHECK for thread {thread_id} *****")
        # --- SLUT DETALJERET LOGGING ---

        # --- UDFØR UPDATE MED CONNECTION ---
        connection.execute(
            db.update(ForumThread)
            .where(ForumThread.id == thread_id)
            .values(
                first_post_id=first_id,
                last_post_id=last_id,
                updated_at=update_time,
                post_count=post_count_actual,  # Vigtigste linje!
            )
            .execution_options(synchronize_session=False)
        )
        log.info(
            f"Executed update for thread stats (ThreadID: {thread_id}). Target Count was {post_count_actual}."
        )

    except Exception:
        log.exception(
            f"Error updating thread stats from ForumPost event for thread_id={thread_id} triggered by post_id={post_id}"
        )


# ==========================================================
#         SQLAlchemy Model for Private Messages
# ==========================================================
class PrivateMessage(db.Model):
    __tablename__ = "private_message"

    id = db.Column(db.Integer, primary_key=True)

    sender_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False, index=True
    )
    recipient_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False, index=True
    )

    subject = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)  # Raw Markdown
    body_html = db.Column(db.Text, nullable=True)  # Sanitized HTML

    timestamp = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    is_read = db.Column(
        db.Boolean, default=False, nullable=False, index=True
    )  # Read by recipient (Added index)

    # Threading support
    # Points to the ID of the first message in the thread. NULL if this IS the first message.
    thread_id = db.Column(
        db.Integer,
        db.ForeignKey("private_message.id", name="fk_pm_thread_id"),
        nullable=True,
        index=True,
    )
    # Relationship to easily get all replies to this message (if it's the start of a thread)
    replies = db.relationship(
        "PrivateMessage",
        backref=db.backref("parent_message", remote_side=[id]),
        lazy="dynamic",
        foreign_keys="PrivateMessage.thread_id",
    )

    # Soft delete flags
    sender_deleted = db.Column(db.Boolean, default=False, nullable=False)
    recipient_deleted = db.Column(db.Boolean, default=False, nullable=False)

    # Relationships to User model
    sender = db.relationship(
        "User",
        foreign_keys=[sender_id],
        backref=db.backref("sent_messages", lazy="dynamic"),
    )
    recipient = db.relationship(
        "User",
        foreign_keys=[recipient_id],
        backref=db.backref("received_messages", lazy="dynamic"),
    )

    # Explicit constructor to help type checkers - Added thread_id
    def __init__(
        self,
        sender_id: int,
        recipient_id: int,
        subject: str,
        body: str,
        thread_id: Optional[int] = None,
        **kwargs,
    ):
        super().__init__(**kwargs)  # Pass extra kwargs to parent constructor if needed
        self.sender_id = sender_id
        self.recipient_id = recipient_id
        self.subject = subject
        self.body = body  # The event listener will handle body_html
        self.thread_id = (
            thread_id  # Set the thread ID (will be None for the first message)
        )

    @staticmethod
    def _handle_pm_body_set(target, value, oldvalue, initiator):
        """Sanitizes and converts Markdown to HTML for PM body."""
        if not value or value == oldvalue:
            return
        log.debug(f"Generating HTML for PM {getattr(target, 'id', 'NEW')}")
        # Use similar sanitization as ForumPost, maybe slightly more restrictive?
        allowed_tags = {
            "p",
            "br",
            "strong",
            "b",
            "em",
            "i",
            "u",
            "strike",
            "sub",
            "sup",
            "ul",
            "ol",
            "li",
            "a",
            "blockquote",
            "code",
            "pre",
        }
        allowed_attrs = {
            "a": ["href", "title", "rel"],
            "*": ["class"],
        }
        allowed_protocols = {"http", "https", "mailto"}
        try:
            md_html = markdown(
                value, output_format="html", extensions=["fenced_code", "nl2br"]
            )  # Use 'html'
            cleaned_html = bleach.clean(
                md_html,
                tags=allowed_tags,
                attributes=allowed_attrs,
                protocols=allowed_protocols,
                strip=True,
                strip_comments=True,
            )
            target.body_html = bleach.linkify(cleaned_html, parse_email=True)
            log.debug(
                f"Successfully generated sanitized HTML for PM {getattr(target, 'id', 'NEW')}"
            )
        except Exception:
            log.exception(
                f"CRITICAL: Error during Markdown/Bleach processing for PM ID {getattr(target, 'id', 'NEW')}. Falling back."
            )
            escaped_body = html.escape(value)
            target.body_html = (
                f"<p><b>Fejl under formatering:</b></p><pre>{escaped_body}</pre>"
            )

    def __repr__(self):
        return f"<PrivateMessage(id={self.id}, from={self.sender_id}, to={self.recipient_id}, subject='{self.subject[:30]}...')>"


# Register event listener for PM body
db.event.listen(
    PrivateMessage.body, "set", PrivateMessage._handle_pm_body_set, retval=False
)


# ==========================================================
#         SQLAlchemy Model for Notifications
# ==========================================================
class Notification(db.Model):
    __tablename__ = "notification"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False, index=True
    )  # The user receiving the notification
    message = db.Column(db.Text, nullable=False)  # The notification text
    link = db.Column(
        db.String(512), nullable=True
    )  # Optional URL the notification links to
    icon = db.Column(
        db.String(100), nullable=True
    )  # Optional icon class (e.g., 'bi-trophy-fill')
    category = db.Column(
        db.String(50), nullable=True, index=True
    )  # e.g., 'badge', 'message', 'session', 'system'
    is_read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    user = db.relationship(
        "User",
        backref=db.backref(
            "notifications", lazy="dynamic", order_by="Notification.created_at.desc()"
        ),
    )

    # Explicit __init__
    def __init__(
        self,
        user_id: int,
        message: str,
        link: Optional[str] = None,
        icon: Optional[str] = None,
        category: Optional[str] = None,
        is_read: bool = False,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.user_id = user_id
        self.message = message
        self.link = link
        self.icon = icon
        self.category = category
        self.is_read = is_read
        # created_at has a default

    def __repr__(self):
        read_status = "Read" if self.is_read else "Unread"
        return f"<Notification(id={self.id}, user_id={self.user_id}, category='{self.category}', status='{read_status}')>"


# --- Slut på models.py ---

# --- Potentielle metoder (ikke kun properties) ---
# def update_balance(self, amount):
#     # Logik for at opdatere balance - KRÆVER SAVE TIL FIL!
#     # IKKE anbefalet at have save logik i modellen selv.
#     pass

# def has_permission(self, permission_name):
#     # Mere avanceret rettighedstjek hvis nødvendigt
#     pass

# Flask-Login vil selv provide is_authenticated=True når objektet returneres af load_user
# og is_anonymous=False

# --- RETTELSE: 'load_user' import fra __init__.py, IKKE globalt fra app ---
# 'load_user' funktionen er nu defineret inde i create_app (i __init__.py)
# og registreres på login_manager. Den skal normalt IKKE importeres eller
# kaldes direkte fra modellerne. Modellerne (som ForumPost.author)
# bør bruge login_manager til at hente user objektet HVIS det overhovedet er nødvendigt.
# Alternativt: Gem kun author ID/username, og lad view/template hente brugeren.
# --- SÅ DENNE LINJE FJERNES NORMALTVIS ---
# from . import load_user  <--- FJERN DENNE LINJE

# --- Importer din JSON-baserede User-klasse HER for at undgå cirkulær import med __init__.py ---
# Da din User-klasse defineres I DENNE FIL, behøver du ikke importere den.


# Undgå unødvendig write hvis trådens tid allerede er nyere (kan ske ved race conditions)
# Gør updated_at opmærksom på timezone hvis du bruger det, ellers virker simpel sammenligning
# Brug postens tidspunkt som det nye 'updated_at' for tråden
# Da dette kører *efter* den primære commit er færdig (pga 'after_insert'/'after_update'),
# skal vi eksplicit lave en ny transaktion for at gemme trådens ændring.
# Brug en 'nested' transaction eller en separat session, eller marker thread
# som dirty i den originale session FØR den committes.
# Simpleste løsning her er nok at lave en separat commit, men det er ikke atomart.
# ----> Alternativ: Overvej at opdatere trådens updated_at direkte i view funktionen FØR commit <----
# Denne metode *kan* kræve en separat commit hvis sessionen lukkes før den kan flush.
# Hvis din session forbliver åben, er det nok:
# db.session.add(thread)

# Forsigtig tilgang: Direkte update statement for at være sikker

# ==========================================================
#         SQLAlchemy Models for Sports Structure
# ==========================================================


class SportCategory(db.Model):
    __tablename__ = "sport_category"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(100), nullable=True)  # e.g., 'fas fa-futbol'

    leagues = db.relationship(
        "League",
        back_populates="sport_category",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def __init__(
        self, name: str, description: Optional[str] = None, icon: Optional[str] = None
    ):
        self.name = name
        self.description = description
        self.icon = icon
        self.generate_slug()

    def generate_slug(self):
        if self.name:
            base_slug = slugify(self.name)
            self.slug = base_slug
            n = 1
            # Ensure slug is unique
            while (
                SportCategory.query.filter(
                    (SportCategory.id != self.id) & (SportCategory.slug == self.slug)
                ).count()
                > 0
            ):
                self.slug = f"{base_slug}-{n}"
                n += 1
            log.debug(f"Generated slug '{self.slug}' for SportCategory '{self.name}'")

    def __repr__(self):
        return f"<SportCategory(id={self.id}, name='{self.name}', slug='{self.slug}')>"


@db.event.listens_for(SportCategory.name, "set")
def sport_category_name_set_listener(target, value, oldvalue, initiator):
    if (
        value != oldvalue and target.name
    ):  # Check if name is set to avoid issues during init
        target.generate_slug()


class League(db.Model):
    __tablename__ = "league"
    id = db.Column(
        db.Integer, primary_key=True
    )  # Changed from string key to integer PK
    name = db.Column(db.String(150), nullable=False, index=True)
    slug = db.Column(db.String(170), unique=True, nullable=False, index=True)
    logo_url = db.Column(db.String(512), nullable=True)
    country = db.Column(
        db.String(100), nullable=True
    )  # e.g., 'England', 'International'

    sport_category_id = db.Column(
        db.Integer, db.ForeignKey("sport_category.id"), nullable=False, index=True
    )
    sport_category = db.relationship("SportCategory", back_populates="leagues")

    active = db.Column(db.Boolean, default=True, nullable=False)
    last_api_check = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )  # When was this league last checked/updated from an API

    events = db.relationship(
        "SportEvent",
        back_populates="league",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def __init__(
        self,
        name: str,
        sport_category_id: int,
        country: Optional[str] = None,
        logo_url: Optional[str] = None,
        active: bool = True,
    ):
        self.name = name
        self.sport_category_id = sport_category_id
        self.country = country
        self.logo_url = logo_url
        self.active = active
        self.generate_slug()

    def generate_slug(self):
        if self.name:
            base_slug = slugify(self.name)
            self.slug = base_slug
            n = 1
            while (
                League.query.filter(
                    (League.id != self.id) & (League.slug == self.slug)
                ).count()
                > 0
            ):
                self.slug = f"{base_slug}-{n}"
                n += 1
            log.debug(f"Generated slug '{self.slug}' for League '{self.name}'")

    def __repr__(self):
        return f"<League(id={self.id}, name='{self.name}', sport_category_id={self.sport_category_id})>"


@db.event.listens_for(League.name, "set")
def league_name_set_listener(target, value, oldvalue, initiator):
    if value != oldvalue and target.name:
        target.generate_slug()


class Team(db.Model):
    __tablename__ = "team"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False, index=True)
    short_name = db.Column(db.String(50), nullable=True)
    slug = db.Column(db.String(170), unique=True, nullable=False, index=True)
    logo_url = db.Column(db.String(512), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    # Add other relevant fields like city, venue, founded_year, etc. if needed

    # Relationships for events where this team is home or away
    home_events = db.relationship(
        "SportEvent",
        foreign_keys="SportEvent.home_team_id",
        back_populates="home_team_obj",
        lazy="dynamic",
    )
    away_events = db.relationship(
        "SportEvent",
        foreign_keys="SportEvent.away_team_id",
        back_populates="away_team_obj",
        lazy="dynamic",
    )

    def __init__(
        self,
        name: str,
        short_name: Optional[str] = None,
        logo_url: Optional[str] = None,
        country: Optional[str] = None,
    ):
        self.name = name
        self.short_name = short_name
        self.logo_url = logo_url
        self.country = country
        self.generate_slug()

    def generate_slug(self):
        if self.name:
            base_slug = slugify(self.name)
            self.slug = base_slug
            n = 1
            while (
                Team.query.filter(
                    (Team.id != self.id) & (Team.slug == self.slug)
                ).count()
                > 0
            ):
                self.slug = f"{base_slug}-{n}"
                n += 1
            log.debug(f"Generated slug '{self.slug}' for Team '{self.name}'")

    def __repr__(self):
        return f"<Team(id={self.id}, name='{self.name}')>"


@db.event.listens_for(Team.name, "set")
def team_name_set_listener(target, value, oldvalue, initiator):
    if value != oldvalue and target.name:
        target.generate_slug()


class SportEvent(db.Model):
    __tablename__ = "sport_event"
    id = db.Column(
        db.String(255), primary_key=True
    )  # Event ID from external API (e.g., "sportradar:match:12345")

    league_id = db.Column(
        db.Integer, db.ForeignKey("league.id"), nullable=False, index=True
    )
    league = db.relationship("League", back_populates="events")

    commence_time = db.Column(db.DateTime(timezone=True), nullable=False, index=True)

    home_team_id = db.Column(
        db.Integer, db.ForeignKey("team.id"), nullable=True, index=True
    )  # Nullable if team not in DB yet
    home_team_obj = db.relationship(
        "Team", foreign_keys=[home_team_id], back_populates="home_events"
    )

    away_team_id = db.Column(
        db.Integer, db.ForeignKey("team.id"), nullable=True, index=True
    )  # Nullable if team not in DB yet
    away_team_obj = db.relationship(
        "Team", foreign_keys=[away_team_id], back_populates="away_events"
    )

    # Fallback string names if team objects are not (yet) linked
    home_team_name_raw = db.Column(db.String(150), nullable=True)
    away_team_name_raw = db.Column(db.String(150), nullable=True)

    status = db.Column(
        db.String(50), nullable=True, index=True
    )  # e.g., "scheduled", "live", "finished", "postponed", "cancelled"
    minute = db.Column(db.Integer, nullable=True)  # Current minute of the game
    period = db.Column(
        db.String(50), nullable=True
    )  # e.g., "1H", "2H", "OT", "P", "FT" (Full Time), "HT" (Half Time)

    # Scores
    home_score = db.Column(db.Integer, nullable=True)
    away_score = db.Column(db.Integer, nullable=True)
    home_score_period1 = db.Column(db.Integer, nullable=True)
    away_score_period1 = db.Column(db.Integer, nullable=True)
    home_score_period2 = db.Column(db.Integer, nullable=True)
    away_score_period2 = db.Column(db.Integer, nullable=True)
    home_score_overtime = db.Column(db.Integer, nullable=True)
    away_score_overtime = db.Column(db.Integer, nullable=True)
    home_score_penalties = db.Column(db.Integer, nullable=True)
    away_score_penalties = db.Column(db.Integer, nullable=True)

    # JSON fields for detailed data
    venue_info = db.Column(
        db.JSON, nullable=True
    )  # { "name": "Stadium Name", "city": "City", "country": "Country" }
    statistics = db.Column(
        db.JSON, nullable=True
    )  # { "home_possession": 60, "away_shots": 10, ... }
    timeline_events = db.Column(
        db.JSON, nullable=True
    )  # List of events: [{ "minute": 10, "type": "goal", "player": "X", "team": "home" }, ...]
    lineups = db.Column(
        db.JSON, nullable=True
    )  # { "home": [{ "name": "Player A", "number": 10, "position": "FWD" }], "away": [...] }

    last_api_update = db.Column(
        db.DateTime(timezone=True), nullable=True
    )  # When was data last fetched from API for this event?

    outcomes = db.relationship(
        "SportOutcome",
        back_populates="event",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    game_sessions = db.relationship(
        "GameSession", back_populates="event", lazy="dynamic"
    )  # Relationship to GameSession

    def __init__(
        self,
        id: str,
        league_id: int,
        commence_time: datetime,
        home_team_id: Optional[int] = None,
        away_team_id: Optional[int] = None,
        home_team_name_raw: Optional[str] = None,
        away_team_name_raw: Optional[str] = None,
        status: Optional[str] = "scheduled",
        **kwargs,
    ):
        self.id = id
        self.league_id = league_id
        self.commence_time = commence_time
        self.home_team_id = home_team_id
        self.away_team_id = away_team_id
        self.home_team_name_raw = home_team_name_raw
        self.away_team_name_raw = away_team_name_raw
        self.status = status
        # Initialize other fields as needed, or they will default to None/values from db.Column
        for key, value in kwargs.items():
            setattr(self, key, value)

    @property
    def home_team_display_name(self) -> Optional[str]:
        return (
            self.home_team_obj.name if self.home_team_obj else self.home_team_name_raw
        )

    @property
    def away_team_display_name(self) -> Optional[str]:
        return (
            self.away_team_obj.name if self.away_team_obj else self.away_team_name_raw
        )

    def __repr__(self):
        home = self.home_team_display_name or "N/A"
        away = self.away_team_display_name or "N/A"
        return f"<SportEvent(id={self.id}, league_id='{self.league_id}', home='{home}', away='{away}', status='{self.status}')>"


# ==========================================================
#         SQLAlchemy Models for Game Sessions & Sports (Continued)
# ==========================================================


class GameSession(db.Model):
    __tablename__ = "game_session"
    id = db.Column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )  # Use UUID from Redis as PK
    name = db.Column(db.String(200), nullable=False)
    creator_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False, index=True
    )
    game_mode = db.Column(
        db.String(50), nullable=False
    )  # e.g., 'yesno', 'fictional_sport', 'live_sport_coupon'
    status = db.Column(
        db.String(50), default="open", nullable=False, index=True
    )  # open, locked, resolved, cancelled
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    resolved_at = db.Column(db.DateTime(timezone=True), nullable=True)
    # Link to a real sport event if applicable
    event_id = db.Column(
        db.String(255), db.ForeignKey("sport_event.id"), nullable=True, index=True
    )
    # For coupon type sessions, store the selections as JSON
    coupon_details = db.Column(
        db.JSON, nullable=True
    )  # Using generic JSON, or db.JSONB for PostgreSQL

    creator = db.relationship(
        "User", backref=db.backref("created_sessions", lazy="dynamic")
    )
    event = db.relationship(
        "SportEvent", back_populates="game_sessions"
    )  # Updated back_populates

    # Bets placed in this session (could be useful for querying)
    # Note: BetHistory already has session_id, so this relationship might be optional
    # bets = db.relationship('BetHistory', backref='game_session', lazy='dynamic', foreign_keys='BetHistory.session_id')

    # Explicit __init__
    def __init__(
        self,
        id: str,
        name: str,
        creator_id: int,
        game_mode: str,
        status: str = "open",
        created_at_val: Optional[
            datetime
        ] = None,  # Renamed created_at to created_at_val
        resolved_at: Optional[datetime] = None,
        event_id: Optional[str] = None,
        coupon_details: Optional[Any] = None,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.id = id
        self.name = name
        self.creator_id = creator_id
        self.game_mode = game_mode
        self.status = status
        if created_at_val is not None:  # If created_at_val is provided, use it
            self.created_at = created_at_val
        # If not provided, self.created_at remains unassigned here, letting DB default work.
        self.resolved_at = resolved_at
        self.event_id = event_id
        self.coupon_details = coupon_details

    def __repr__(self):
        return (
            f"<GameSession(id={self.id}, name='{self.name}', status='{self.status}')>"
        )


# Sport model is now League. SportEvent is enhanced. SportOutcome remains.


class SportOutcome(db.Model):
    __tablename__ = "sport_outcome"
    id = db.Column(db.Integer, primary_key=True)  # Auto-incrementing PK
    event_id = db.Column(
        db.String(255), db.ForeignKey("sport_event.id"), nullable=False, index=True
    )
    bookmaker = db.Column(
        db.String(100), nullable=False
    )  # Which bookmaker provided the odds
    market_key = db.Column(db.String(100), nullable=False)  # e.g., 'h2h', 'totals'
    name = db.Column(
        db.String(100), nullable=False
    )  # e.g., Home team name, Away team name, Over, Under
    price = db.Column(db.Float, nullable=False)  # The odds
    point = db.Column(db.Float, nullable=True)  # For spread or total markets
    last_update_api = db.Column(
        db.DateTime(timezone=True), nullable=True
    )  # When were odds last fetched?

    event = db.relationship("SportEvent", back_populates="outcomes")

    # Optional: Link back to BetHistory if needed, though BetHistory links to session which links to event
    # bets_on_this_outcome = db.relationship('BetHistory', backref='sport_outcome', lazy='dynamic') # Requires adding sport_outcome_id to BetHistory

    # Explicit __init__
    def __init__(
        self,
        event_id: str,
        bookmaker: str,
        market_key: str,
        name: str,
        price: float,
        point: Optional[float] = None,
        last_update_api: Optional[datetime] = None,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.event_id = event_id
        self.bookmaker = bookmaker
        self.market_key = market_key
        self.name = name
        self.price = price
        self.point = point
        self.last_update_api = last_update_api

    def __repr__(self):
        return f"<SportOutcome(event_id={self.event_id}, name='{self.name}', price={self.price})>"


# ==========================================================
#         SQLAlchemy Model for Failed Login Attempts
# ==========================================================
class FailedLoginAttempt(db.Model):
    # Ensure 4-space indentation for the following lines
    __tablename__ = "failed_login_attempt"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    ip_address = db.Column(db.String(100), nullable=True)  # Store IP address
    username_attempt = db.Column(
        db.String(100), nullable=True, index=True
    )  # Username they tried to log in with
    user_agent = db.Column(db.String(255), nullable=True)  # Browser/client info

    def __init__(
        self,
        ip_address: Optional[str] = None,
        username_attempt: Optional[str] = None,
        user_agent: Optional[str] = None,
        timestamp: Optional[datetime] = None,
        **kwargs,
    ):
        super().__init__(**kwargs)  # Call parent constructor for any SQLAlchemy magic
        self.ip_address = ip_address
        self.username_attempt = username_attempt
        self.user_agent = user_agent
        if timestamp:  # Allow passing timestamp, otherwise DB default will be used
            self.timestamp = timestamp
        # id will be auto-generated by the database
        # self.timestamp will use its default if not provided and not passed

    def __repr__(self):
        return f"<FailedLoginAttempt(id={self.id}, username='{self.username_attempt}', ip='{self.ip_address}', time='{self.timestamp.isoformat() if self.timestamp else 'N/A'}')>"
