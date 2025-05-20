"""
Implementation of the new_user_notification event and data structure.
This function can be imported and used in relevant routes when a new user registers.
"""

import json
import logging
from datetime import datetime, timezone

from flask_socketio import SocketIO

logger = logging.getLogger(__name__)


def broadcast_new_user_notification(socketio: SocketIO, data: dict) -> bool:
    """
    Broadcast a notification about a new user to relevant users.

    This event can be used for various purposes:
    - Notifying admins about new user registrations
    - Notifying friends when a user joins
    - Sending welcome messages to new users

    Args:
        socketio: The Flask-SocketIO instance
        data (dict): The notification data including:
            - user_id: ID of the new/target user
            - username: Username of the new/target user
            - event_type: Type of event (e.g., 'registration', 'friend_joined')
            - timestamp: UTC timestamp for the event
            - message: Human-readable message about the event
            - avatar_url: URL to the user's avatar (optional)
            - metadata: Additional context-specific data (optional)

    Returns:
        bool: True if the notification was successfully broadcasted, False otherwise

    Example:
        ```python
        from app.notifications import broadcast_new_user_notification
        from app.extensions import socketio

        # When a new user registers
        user_data = {
            'user_id': new_user.id,
            'username': new_user.username,
            'event_type': 'registration',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'message': f'New user {new_user.username} has registered!',
            'avatar_url': new_user.avatar_url,
            'metadata': {
                'registration_source': 'web',
                'user_email': new_user.email
            }
        }
        broadcast_new_user_notification(socketio, user_data)
        ```
    """
    if not data or not isinstance(data, dict) or "user_id" not in data:
        logger.error(f"Invalid data for new_user_notification broadcast: {data}")
        return False

    user_id = data.get("user_id")

    # The recipient of this notification depends on the event_type
    event_type = data.get("event_type")

    if event_type == "registration":
        # For registrations, notify admin room
        room = "admin_notifications"
        logger.info(
            f"Broadcasting new user registration notification for {user_id} to admin room"
        )
        socketio.emit("new_user_notification", data, room=room)

    elif event_type == "welcome":
        # Send directly to the new user
        room = f"user_{user_id}"
        logger.info(f"Sending welcome notification to new user {user_id}")
        socketio.emit("new_user_notification", data, room=room)

    elif event_type == "friend_joined":
        # Notify the user's friends
        # This would require some logic to determine who should be notified
        # For simplicity, just logging for now
        logger.info(f"Would notify friends about user {user_id} joining")
        # Implementation would involve iterating through a list of friends
        # and broadcasting to each relevant user room

    else:
        logger.warning(f"Unknown event_type '{event_type}' for new_user_notification")
        return False

    return True
