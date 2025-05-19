# app/routes/messages.py

from collections import defaultdict
from datetime import datetime, timezone, timedelta
import logging
from flask import (
    Blueprint, render_template, request, redirect, url_for, flash, current_app, jsonify # Added jsonify
)
from flask_login import login_required, current_user
from flask_sqlalchemy.pagination import Pagination # For manual pagination object creation
from sqlalchemy import or_, desc, and_
from sqlalchemy import func # Import func
from apps.backend.extensions import db
from apps.backend.models import User, PrivateMessage # Assuming User is your SQLAlchemy User model
from apps.backend.forms import PrivateMessageForm
from apps.backend.utils import get_common_context, create_notification # For consistent template context & notifications
 
log = logging.getLogger(__name__)
messages_bp = Blueprint('messages', __name__, url_prefix='/messages')

# Define SimplePagination class once, to be used by both inbox and sent_items
class SimplePagination:
    def __init__(self, items, page, per_page, total):
        self.items = items
        self.page = page
        self.per_page = per_page
        self.total = total
        # Calculate pagination properties
        self.pages = (total + per_page - 1) // per_page  # Ceiling division
        self.has_next = page < self.pages
        self.has_prev = page > 1
        self.next_num = page + 1 if self.has_next else None
        self.prev_num = page - 1 if self.has_prev else None
    
    def iter_pages(self, left_edge=2, left_current=2, right_current=5, right_edge=2):
        """Generate page numbers for pagination links."""
        last = 0
        for num in range(1, self.pages + 1):
            if (num <= left_edge or
                (num > self.page - left_current - 1 and num < self.page + right_current) or
                num > self.pages - right_edge):
                if last + 1 != num:
                    yield None
                yield num
                last = num

@messages_bp.route('/')
@login_required
def inbox():
    """Displays the user's message conversations (inbox view) using Python grouping."""
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('MESSAGES_PER_PAGE', 15)

    # Fetch all relevant messages for the user as recipient, ordered most recent first
    all_received_messages = PrivateMessage.query.filter(
        PrivateMessage.recipient_id == current_user.id,
        PrivateMessage.recipient_deleted == False
    ).order_by(desc(PrivateMessage.timestamp)).all()

    # Group messages by thread_id in Python
    threads = defaultdict(list)
    for msg in all_received_messages:
        # Use the message's own ID as the thread identifier if thread_id is None (it's the first message)
        thread_key = msg.thread_id if msg.thread_id is not None else msg.id
        threads[thread_key].append(msg)

    # Get the latest message from each thread (which will be the first one due to ordering)
    # and ensure the thread_key (which is the first message's ID if it's a new thread) is used for linking.
    latest_messages_in_threads = []
    for thread_key, thread_messages in threads.items():
        if thread_messages: # Ensure the list is not empty
            latest_message = thread_messages[0]
            # Store the effective thread_id (the ID of the first message in the conversation)
            # This is useful if the template needs to link to the conversation view.
            latest_message.effective_thread_id = thread_key
            latest_messages_in_threads.append(latest_message)
    
    # Sort these latest messages again by their actual timestamp to ensure correct order for pagination
    latest_messages_in_threads.sort(key=lambda m: m.timestamp, reverse=True)


    # Manual Pagination
    total_items = len(latest_messages_in_threads)
    start = (page - 1) * per_page
    end = start + per_page
    items_on_page = latest_messages_in_threads[start:end]

    if total_items > 0:
        pagination = SimplePagination(
            items=items_on_page,
            page=page,
            per_page=per_page,
            total=total_items
        )
    else:
        pagination = None # No items, so no pagination needed

    context = get_common_context()
    context.update({
        'title': 'Indbakke',
        'pagination': pagination,
        'conversations': items_on_page, # Ensure this uses the (potentially corrected) items_on_page
        'active_page': 'messages_inbox'
    })
    return render_template('messages/inbox.html', **context)

@messages_bp.route('/sent')
@login_required
def sent_items():
    """Displays message conversations initiated or replied to by the user (sent view) using Python grouping."""
    page = request.args.get('page', 1, type=int)
    per_page = current_app.config.get('MESSAGES_PER_PAGE', 15)

    all_sent_messages = PrivateMessage.query.filter(
        PrivateMessage.sender_id == current_user.id,
        PrivateMessage.sender_deleted == False
    ).order_by(desc(PrivateMessage.timestamp)).all()

    threads = defaultdict(list)
    for msg in all_sent_messages:
        thread_key = msg.thread_id if msg.thread_id is not None else msg.id
        threads[thread_key].append(msg)

    latest_messages_in_threads = []
    for thread_key, thread_messages in threads.items():
        if thread_messages:
            latest_message = thread_messages[0]
            latest_message.effective_thread_id = thread_key
            latest_messages_in_threads.append(latest_message)
            
    latest_messages_in_threads.sort(key=lambda m: m.timestamp, reverse=True)

    total_items = len(latest_messages_in_threads)
    start = (page - 1) * per_page
    end = start + per_page
    items_on_page = latest_messages_in_threads[start:end]

    # Create a custom pagination object (not using Flask-SQLAlchemy's Pagination class)
    if total_items > 0:
        # Create a simple object with the properties needed by the template
        class SimplePagination:
            def __init__(self, items, page, per_page, total):
                self.items = items
                self.page = page
                self.per_page = per_page
                self.total = total
                # Calculate pagination properties
                self.pages = (total + per_page - 1) // per_page  # Ceiling division
                self.has_next = page < self.pages
                self.has_prev = page > 1
                self.next_num = page + 1 if self.has_next else None
                self.prev_num = page - 1 if self.has_prev else None
            
            def iter_pages(self, left_edge=2, left_current=2, right_current=5, right_edge=2):
                """Generate page numbers for pagination links."""
                last = 0
                for num in range(1, self.pages + 1):
                    if (num <= left_edge or
                        (num > self.page - left_current - 1 and num < self.page + right_current) or
                        num > self.pages - right_edge):
                        if last + 1 != num:
                            yield None
                        yield num
                        last = num
        
        pagination = SimplePagination(
            items=items_on_page,
            page=page,
            per_page=per_page,
            total=total_items
        )
    else:
        pagination = None  # No items, so no pagination needed

    context = get_common_context()
    context.update({
        'title': 'Sendte Beskeder',
        'pagination': pagination,
        'conversations': items_on_page, # Ensure this uses the (potentially corrected) items_on_page
        'active_page': 'messages_sent'
    })
    return render_template('messages/sent.html', **context)


@messages_bp.route('/message/<int:message_id>') # Keep this route for direct links
@login_required
def view_message(message_id):
    """Displays a conversation thread based on a message ID."""
    initial_message = PrivateMessage.query.get_or_404(message_id)

    # Determine the thread ID (either the message's thread_id or its own id if it's the first)
    thread_id_to_find = initial_message.thread_id if initial_message.thread_id else initial_message.id

    # Fetch all messages in the thread
    conversation_messages = PrivateMessage.query.filter(
        or_(PrivateMessage.id == thread_id_to_find, PrivateMessage.thread_id == thread_id_to_find)
    ).order_by(PrivateMessage.timestamp.asc()).all() # Order chronologically

    # Check if the current user is part of this conversation at all
    is_participant = False
    for msg in conversation_messages:
        if msg.sender_id == current_user.id or msg.recipient_id == current_user.id:
            is_participant = True
            break # Found participation, no need to check further

    if not is_participant:
        flash("Du har ikke adgang til denne samtale.", "danger")
        return redirect(url_for('messages.inbox'))

    # Mark the specific message (and potentially others in the thread) as read
    # For now, just mark the one initially requested if recipient
    if initial_message.recipient_id == current_user.id and not initial_message.is_read:
        initial_message.is_read = True
        try:
            db.session.commit()
            log.info(f"Marked message {initial_message.id} as read for user {current_user.id}")
            # Optionally emit a socket event if needed for real-time updates elsewhere
        except Exception as e:
            db.session.rollback()
            log.error(f"Error marking message {initial_message.id} as read: {e}")
            flash("Fejl ved opdatering af beskedstatus.", "warning")

    # Determine the subject (usually from the first message)
    thread_subject = conversation_messages[0].subject if conversation_messages else "(Ingen emne)"

    context = get_common_context()
    context.update({
        'title': thread_subject,
        'conversation': conversation_messages, # Pass the whole list
        'initial_message_id': message_id, # Keep track of which message was clicked
        'active_page': 'messages_view'
    })
    return render_template('messages/view_message.html', **context)

@messages_bp.route('/compose', methods=['GET', 'POST'])
@messages_bp.route('/compose/<string:recipient_username>', methods=['GET', 'POST']) # Keep for direct compose link
@messages_bp.route('/reply/<int:reply_to_message_id>', methods=['GET', 'POST']) # Add route for replying
@login_required
def compose_message(recipient_username=None, reply_to_message_id=None):
    """Handles composing and sending new messages, including replies."""
    form = PrivateMessageForm()
    original_message = None
    is_reply = False

    if reply_to_message_id:
        original_message = PrivateMessage.query.get_or_404(reply_to_message_id)
        # Ensure current user can reply (was sender or recipient of original)
        if not (original_message.sender_id == current_user.id or original_message.recipient_id == current_user.id):
            flash("Du kan ikke svare på denne besked.", "danger")
            return redirect(url_for('messages.inbox'))
        is_reply = True

    if request.method == 'GET' and is_reply and original_message: # Ensure original_message exists
        # Pre-fill form for reply
        if original_message.sender: # Check if sender exists
            form.recipient_username.data = original_message.sender.username
        else:
             flash("Kunne ikke finde den oprindelige afsender.", "warning")

        original_subject = original_message.subject or ""
        if not original_subject.lower().startswith("re:"):
            form.subject.data = f"Re: {original_subject}"
        else:
            form.subject.data = original_subject

        # Optionally quote the original message body
        # Format timestamp using strftime or similar, as 'dt' is a Jinja filter
        formatted_timestamp = original_message.timestamp.strftime('%d. %b %Y, %H:%M') if original_message.timestamp else "Ukendt tidspunkt"
        sender_username = original_message.sender.username if original_message.sender else "Ukendt afsender"
        # Basic escaping for the quoted body to prevent HTML injection if body contains HTML-like chars
        escaped_original_body = (original_message.body or "").replace('&', '&').replace('<', '<').replace('>', '>')
        quoted_body = f"\n\n\n> Den {formatted_timestamp} skrev {sender_username}:\n> {escaped_original_body.replace('\n', '\n> ')}\n\n"
        form.body.data = quoted_body

    elif request.method == 'GET' and recipient_username:
        # Pre-fill for direct compose link
        form.recipient_username.data = recipient_username

    if form.validate_on_submit():
        recipient = User.query.filter(User.username.ilike(form.recipient_username.data)).first()
        if not recipient:
            flash(f"Bruger '{form.recipient_username.data}' blev ikke fundet.", "danger")
        elif recipient.id == current_user.id:
            flash("Du kan ikke sende en besked til dig selv.", "warning")
        else:
            thread_id_to_set = None
            if is_reply and original_message:
                # If original message has a thread_id, use it. Otherwise, use original message's ID.
                thread_id_to_set = original_message.thread_id if original_message.thread_id else original_message.id

            new_message = PrivateMessage(
                sender_id=current_user.id,
                recipient_id=recipient.id,
                subject=form.subject.data or "(Intet emne)", # Provide default subject
                body=form.body.data or "(Ingen besked)", # Provide default body
                thread_id=thread_id_to_set # Set the determined thread_id
            )
            try:
                db.session.add(new_message)
                db.session.flush() # Flush to get the new_message.id

                # If it's a brand new message (not a reply), set its thread_id to its own id
                if not is_reply:
                    new_message.thread_id = new_message.id
                    db.session.add(new_message) # Add again to mark for update

                db.session.commit()
                log.info(f"Message {new_message.id} (Thread: {new_message.thread_id}) sent from {current_user.id} to {recipient.id}")

                # --- Create Notification for Recipient ---
                try:
                    notification_msg = f"Du har modtaget en ny besked fra {current_user.username} med emnet: \"{new_message.subject}\""
                    message_link = url_for('messages.view_message', message_id=new_message.id, _external=False)
                    create_notification(
                        user_id=recipient.id,
                        message=notification_msg,
                        link=message_link,
                        icon='bi-envelope-fill', # Example icon
                        category='message'
                    )
                    log.info(f"Notification created for new message (ID: {new_message.id}) sent to user {recipient.id}")
                except Exception as notify_err:
                     log.error(f"Failed to create notification for new message (ID: {new_message.id}) to user {recipient.id}: {notify_err}")
                # --- End Notification ---

                flash("Besked sendt!", "success")
                return redirect(url_for('messages.sent_items'))
            except Exception as e:
                db.session.rollback()
                log.error(f"Error sending private message from {current_user.id} to {recipient.id}: {e}")
                flash("Fejl under afsendelse af besked.", "danger")
    
    context = get_common_context()
    context.update({
        'title': 'Skriv Ny Besked',
        'form': form,
        'active_page': 'messages_compose'
    })
    return render_template('messages/compose_message.html', **context)

@messages_bp.route('/delete/<int:message_id>', methods=['POST'])
@login_required
def delete_message(message_id):
    """Soft deletes a message for the current user."""
    message = PrivateMessage.query.get_or_404(message_id)
    action_taken = False

    if message.sender_id == current_user.id:
        message.sender_deleted = True
        action_taken = True
        flash("Besked slettet fra 'Sendt'.", "success")
    elif message.recipient_id == current_user.id:
        message.recipient_deleted = True
        action_taken = True
        flash("Besked slettet fra 'Indbakke'.", "success")
    else:
        flash("Du har ikke tilladelse til at slette denne besked.", "danger")
        return redirect(url_for('messages.inbox'))

    if action_taken:
        try:
            # Check if both sender and recipient have deleted the message
            if message.sender_deleted and message.recipient_deleted:
                log.info(f"Permanently deleting message ID {message.id} as both users soft-deleted.")
                db.session.delete(message)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            log.error(f"Error deleting message {message_id}: {e}")
            flash("Fejl under sletning af besked.", "danger")

    # Redirect to inbox or previous page if available
    return redirect(request.referrer or url_for('messages.inbox'))

@messages_bp.route('/api/search_recipients', methods=['GET'])
@login_required
def api_search_recipients():
    """API endpoint to search for users to message."""
    query = request.args.get('q', '').strip()
    limit = request.args.get('limit', 5, type=int)
    limit = max(1, min(limit, 10)) # Clamp limit

    if not query or len(query) < 2: # Require at least 2 characters to search
        return jsonify([])

    # Search for users whose username contains the query, case-insensitive
    # Exclude the current user from results
    users = User.query.filter(
        User.username.ilike(f"%{query}%"),
        User.id != current_user.id
    ).limit(limit).all()

    results = [
        {
            "id": user.id,
            "username": user.username,
            "avatar_url": user.avatar_url # Assuming User model has an avatar_url property
        }
        for user in users
    ]
    return jsonify(results)

@messages_bp.route('/api/contacts_status', methods=['GET'])
@login_required
def api_contacts_status():
    """
    API endpoint to get recent message contacts and potentially other online users.
    Returns a list of users with their username, avatar, and online status.
    """
    limit = request.args.get('limit', 10, type=int)
    limit = max(1, min(limit, 25)) # Clamp limit

    try:
        # Find recent unique user IDs the current user has interacted with via messages
        # Use getattr to explicitly fetch column attributes, which might aid type inference
        sent_to_ids = db.session.query(getattr(PrivateMessage, 'recipient_id'))\
            .filter(PrivateMessage.sender_id == current_user.id)\
            .distinct()

        received_from_ids = db.session.query(getattr(PrivateMessage, 'sender_id'))\
            .filter(PrivateMessage.recipient_id == current_user.id)\
            .distinct()

        # Combine unique IDs, excluding the current user
        contact_ids = {row[0] for row in sent_to_ids.union(received_from_ids).all() if row[0] != current_user.id}

        # Fetch User objects for these contacts
        # We might want to limit this further or prioritize based on recency if contact_ids is huge
        contact_users = User.query.filter(User.id.in_(list(contact_ids))).limit(limit).all() if contact_ids else []

        # Optionally, add other recently active users if the contact list is small
        # (This part can be refined based on performance and desired behavior)
        additional_users_needed = limit - len(contact_users)
        other_online_users = []
        if additional_users_needed > 0:
            # Example: Fetch recently seen users, excluding self and already included contacts
            exclude_ids = list(contact_ids) + [current_user.id]
            other_online_users = User.query.filter(
                User.id.notin_(exclude_ids),
                User.last_seen > datetime.now(timezone.utc) - timedelta(minutes=15) # Example: active in last 15 mins
            ).order_by(desc(User.last_seen)).limit(additional_users_needed).all()

        # Combine lists and remove duplicates (though unlikely with the exclusion logic)
        all_relevant_users = contact_users + other_online_users
        # Ensure uniqueness just in case
        unique_users_dict = {user.id: user for user in all_relevant_users}
        
        # Filter based on privacy settings before finalizing the list
        privacy_filtered_users = []
        for user_id, user_obj in unique_users_dict.items():
            # A user always sees their own status if they somehow appeared in this list (unlikely for this API)
            if user_obj.id == current_user.id:
                privacy_filtered_users.append(user_obj)
            # Check the target user's privacy setting for showing online status
            elif user_obj.privacy_show_online_status: # This field was added to the User model
                privacy_filtered_users.append(user_obj)
            else:
                log.debug(f"User {user_obj.id} has privacy_show_online_status=False. Not including in contacts status for user {current_user.id}.")

        final_user_list = privacy_filtered_users
        
        # Sort potentially by online status first, then username? Or keep API order?
        # For now, let's sort by username after fetching.
        final_user_list.sort(key=lambda u: u.username.lower())


        results = [
            {
                "id": user.id,
                "username": user.username,
                "avatar_url": user.avatar_url,
                # Determine is_online based on the model property,
                # but only include the user if their privacy settings allow it (already filtered)
                "is_online": user.is_online
            }
            # Limit the final list again just in case combining added more than 'limit'
            for user in final_user_list[:limit]
        ]
        return jsonify(results)

    except Exception as e:
        log.exception(f"Error fetching contacts status for user {current_user.id}: {e}")
        return jsonify({"error": "Server error fetching contacts"}), 500