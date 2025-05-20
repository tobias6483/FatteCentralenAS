from flask import Blueprint, g, jsonify, request

from ..extensions import db
from ..models import User
from ..utils import firebase_token_required

user_profile_api_bp = Blueprint(
    "user_profile_api_bp", __name__, url_prefix="/api/v1/users/me"
)


@user_profile_api_bp.route("/profile", methods=["GET"])
@firebase_token_required
def get_user_profile():
    """
    Retrieves the profile of the currently authenticated user.
    """
    firebase_uid = g.firebase_user["uid"]
    user = User.query.filter_by(firebase_uid=firebase_uid).first()

    if not user:
        return jsonify({"error": "User profile not found"}), 404

    # Assuming User model has these attributes directly or via relationships/properties
    # and that settings/privacy_settings are stored as JSON or handled by model properties.
    # The PROJECT_PLAN.md defines the expected structure.
    profile_data = {
        "uid": user.uid,  # Assuming 'uid' is the internal DB user ID
        "firebase_uid": user.firebase_uid,
        "username": user.username,
        "email": user.email,
        "role": (
            user.role.name if user.role else "user"
        ),  # Assuming role is an enum or object
        "balance": float(user.balance) if user.balance is not None else 0.0,
        "registration_date": (
            user.registration_date.isoformat() if user.registration_date else None
        ),
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "avatar_url": user.avatar_url,
        "about_me": user.about_me,
        "level": user.level,
        "xp": user.xp,
        "post_count": user.post_count,
        "settings": {
            "theme": user.settings.get("theme", "dark") if user.settings else "dark",
            "notifications_enabled": (
                user.settings.get("notifications_enabled", True)
                if user.settings
                else True
            ),
        },
        "privacy_settings": {
            "profile_public": (
                user.privacy_settings.get("profile_public", True)
                if user.privacy_settings
                else True
            ),
            "show_activity": (
                user.privacy_settings.get("show_activity", False)
                if user.privacy_settings
                else False
            ),
            "show_bet_history": (
                user.privacy_settings.get("show_bet_history", True)
                if user.privacy_settings
                else True
            ),
            "show_online_status": (
                user.privacy_settings.get("show_online_status", True)
                if user.privacy_settings
                else True
            ),
        },
    }
    return jsonify(profile_data), 200


@user_profile_api_bp.route("/profile", methods=["PUT"])
@firebase_token_required
def update_user_profile():
    """
    Updates the profile of the currently authenticated user.
    """
    firebase_uid = g.firebase_user["uid"]
    user = User.query.filter_by(firebase_uid=firebase_uid).first()

    if not user:
        return jsonify({"error": "User profile not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    # Update 'about_me'
    if "about_me" in data:
        user.about_me = data["about_me"]

    # Update 'settings'
    if "settings" in data and isinstance(data["settings"], dict):
        if user.settings is None:  # Assuming settings can be None
            user.settings = {}
        for key, value in data["settings"].items():
            if key in ["theme", "notifications_enabled"]:  # Only allow specific keys
                user.settings[key] = value

    # Update 'privacy_settings'
    if "privacy_settings" in data and isinstance(data["privacy_settings"], dict):
        if user.privacy_settings is None:  # Assuming privacy_settings can be None
            user.privacy_settings = {}
        for key, value in data["privacy_settings"].items():
            # Allow specific keys as per PROJECT_PLAN.md
            if key in [
                "profile_public",
                "show_activity",
                "show_bet_history",
                "show_online_status",
            ]:
                user.privacy_settings[key] = value

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update profile", "details": str(e)}), 500

    # Return the updated profile, similar to GET
    profile_data = {
        "uid": user.uid,
        "firebase_uid": user.firebase_uid,
        "username": user.username,
        "email": user.email,
        "role": user.role.name if user.role else "user",
        "balance": float(user.balance) if user.balance is not None else 0.0,
        "registration_date": (
            user.registration_date.isoformat() if user.registration_date else None
        ),
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "avatar_url": user.avatar_url,
        "about_me": user.about_me,
        "level": user.level,
        "xp": user.xp,
        "post_count": user.post_count,
        "settings": {
            "theme": user.settings.get("theme", "dark") if user.settings else "dark",
            "notifications_enabled": (
                user.settings.get("notifications_enabled", True)
                if user.settings
                else True
            ),
        },
        "privacy_settings": {
            "profile_public": (
                user.privacy_settings.get("profile_public", True)
                if user.privacy_settings
                else True
            ),
            "show_activity": (
                user.privacy_settings.get("show_activity", False)
                if user.privacy_settings
                else False
            ),
            "show_bet_history": (
                user.privacy_settings.get("show_bet_history", True)
                if user.privacy_settings
                else True
            ),
            "show_online_status": (
                user.privacy_settings.get("show_online_status", True)
                if user.privacy_settings
                else True
            ),
        },
        "message": "Profile updated successfully.",
    }
    return jsonify(profile_data), 200
