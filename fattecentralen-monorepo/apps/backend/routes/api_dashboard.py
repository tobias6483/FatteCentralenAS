# app/routes/api_dashboard.py

from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from apps.backend.models import User, BetHistory, ForumPost, ForumThread, GameSession # Add other models as needed
from apps.backend.extensions import db
from sqlalchemy import desc, func, cast, Date # Explicitly import desc
from datetime import datetime, timedelta, timezone

api_dashboard_bp = Blueprint('api_dashboard_bp', __name__, url_prefix='/api/v2/dashboard')

def format_datetime_relative(dt_object):
    """
    Helper to format datetime into a relative string like the old system.
    This is a simplified version. Consider using a library like `humanize`
    or the existing `dt` filter logic if it was more complex.
    """
    if not dt_object:
        return "Ukendt"
    
    # Ensure dt_object is offset-aware (assume UTC if naive)
    if dt_object.tzinfo is None or dt_object.tzinfo.utcoffset(dt_object) is None:
        dt_object = dt_object.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    diff = now - dt_object

    if diff.days > 7:
        return dt_object.strftime('%d %b %Y')
    elif diff.days > 0:
        return f"{diff.days} dag{'e' if diff.days > 1 else ''} siden"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} time{'r' if hours > 1 else ''} siden"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minut{'ter' if minutes > 1 else ''} siden"
    else:
        return "Lige nu"

@api_dashboard_bp.route('/main', methods=['GET'])
@login_required
def get_main_dashboard_data():
    """
    Provides a consolidated JSON response for the main dashboard view.
    """
    user = current_user

    # 1. User Stats
    user_stats = {
        "username": user.username,
        "email": user.email,
        "balance": user.balance,
        "wins": user.wins,
        "losses": user.losses,
        "avatar_url": user.avatar_url, # Assuming User.avatar_url property exists and works
        "rank": user.rank,
        "last_login_iso": user.last_login.isoformat() if user.last_login else None,
        "last_login_relative": format_datetime_relative(user.last_login) if user.last_login else "Aldrig",
        "total_staked": user.total_staked,
        "total_won": user.total_won,
        "total_lost": user.total_lost,
        "largest_win": user.largest_win,
        "largest_loss": user.largest_loss,
        "net_profit_loss": (user.total_won or 0) - (user.total_lost or 0) # Simple calculation
    }

    # 2. Balance Chart Data (Last 7 days - placeholder logic)
    # This needs more sophisticated logic, perhaps daily snapshots or cumulative sum of transactions.
    # For now, let's return dummy data or a simplified version.
    # A proper implementation would query BetHistory or a dedicated balance log.
    balance_chart_labels = []
    balance_chart_data = []
    today = datetime.now(timezone.utc).date()
    for i in range(6, -1, -1): # Last 7 days including today
        day = today - timedelta(days=i)
        balance_chart_labels.append(day.strftime('%Y-%m-%d'))
        # Placeholder: Fetch actual balance for this day.
        # This is a simplified example; real calculation would be needed.
        # We could try to get the balance at the end of that day.
        # For simplicity, let's use current balance for all days for now.
        # A more accurate approach would be to sum transactions up to that day.
        balance_chart_data.append(user.balance) # Replace with actual historical balance

    balance_chart = {
        "labels": balance_chart_labels,
        "data": balance_chart_data
    }

    # 3. Recent Activity (e.g., last 5 bet history entries)
    recent_activities_query = BetHistory.query.filter_by(user_id=user.id)\
                                          .order_by(desc(cast(BetHistory.timestamp, db.Column)))\
                                          .limit(5).all()
    recent_activities = []
    for activity in recent_activities_query:
        description = f"Spil: {activity.match_name or 'Ukendt'} - {activity.outcome_name or 'Ukendt'}"
        if activity.result == 'won':
            description += f" (Vundet: {activity.payout})"
            icon = "bi-trophy-fill"
            icon_color = "text-success"
        elif activity.result == 'lost':
            description += f" (Tabt: {activity.stake})"
            icon = "bi-emoji-frown-fill"
            icon_color = "text-danger"
        elif activity.status == 'open' or activity.result == 'pending':
            description += f" (Indsats: {activity.stake})"
            icon = "bi-hourglass-split"
            icon_color = "text-warning"
        else: # cancelled, etc.
            description += f" (Status: {activity.result or activity.status})"
            icon = "bi-info-circle-fill"
            icon_color = "text-secondary"

        recent_activities.append({
            "id": activity.id,
            "description": description,
            "amount": activity.payout if activity.result == 'won' else activity.stake,
            "type": activity.result if activity.result in ['won', 'lost'] else 'stake', # Simplified type
            "timestamp": activity.timestamp.isoformat(),
            "timestamp_relative": format_datetime_relative(activity.timestamp),
            "icon": icon,
            "iconColor": icon_color, # e.g. "text-success", "text-danger"
        })

    # 4. Latest Forum Posts (last 3)
    latest_posts_query = db.session.query(
            ForumPost.id.label("post_id"),
            ForumPost.body,
            ForumPost.created_at,
            ForumPost.author_username,
            ForumThread.id.label("thread_id"),
            ForumThread.title.label("thread_title"),
            User.avatar.label("author_avatar_filename") # Get avatar filename
        ).\
        join(ForumThread, ForumPost.thread_id == ForumThread.id).\
        outerjoin(User, ForumPost.author_username == User.username).\
        order_by(desc(cast(ForumPost.created_at, db.Column))).limit(3).all()

    latest_forum_posts = []
    for post in latest_posts_query:
        # Construct avatar_url. This assumes User.avatar_url logic can be adapted or called.
        # For simplicity, we'll just pass the filename and let frontend construct if needed,
        # or ideally, the User model should provide a static method or the instance method is accessible.
        # Let's try to get the user object to use its avatar_url property.
        author_user = User.query.filter_by(username=post.author_username).first()
        avatar_url = author_user.avatar_url if author_user else None # Use the property

        latest_forum_posts.append({
            "post_id": post.post_id,
            "thread_id": post.thread_id,
            "thread_title": post.thread_title,
            "author_username": post.author_username,
            "author_avatar_url": avatar_url,
            "created_at_iso": post.created_at.isoformat(),
            "created_at_relative": format_datetime_relative(post.created_at),
            # "link": url_for('forum_bp.view_thread', thread_id=post.thread_id, _anchor=f"post-{post.post_id}") # url_for needs app context
        })

    # 5. Open Sessions & Invites (last 4)
    # This is a simplified query. You might want to combine actual invites if you have a separate model.
    open_sessions_query = GameSession.query.filter_by(status='open')\
                                       .order_by(desc(cast(GameSession.created_at, db.Column)))\
                                       .limit(4).all()
    open_sessions_invites = []
    for session in open_sessions_query:
        open_sessions_invites.append({
            "id": session.id,
            "type": "session", # Differentiate if you add invites
            "title": session.name,
            "details": f"Mode: {session.game_mode}, Oprettet af: {session.creator.username if session.creator else 'Ukendt'}",
            "status": session.status,
            "icon": "bi-controller", # Example icon
            "iconColor": "text-info"
        })

    return jsonify({
        "user_stats": user_stats,
        "balance_chart": balance_chart,
        "recent_activities": recent_activities,
        "latest_forum_posts": latest_forum_posts,
        "open_sessions_invites": open_sessions_invites
    })