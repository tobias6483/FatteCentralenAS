# app/routes/forum.py

# === Standard Bibliotek Imports ===
import logging
import os # Bruges i fetch_user_details fallback
from typing import Dict, Any, Set, List, Union, Optional, Callable # Ensure Optional and Callable are imported
import traceback # For detailed error logging
import datetime # Explicitly import datetime for type hints if needed

# === Tredjeparts Bibliotek Imports ===
from flask import (
    Blueprint, render_template, request, redirect, url_for, flash, abort, current_app, jsonify, g as flask_g
)
from flask_login import login_required, current_user
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload, selectinload, aliased
from sqlalchemy import select, func, desc, update as sql_update

# === Lokale Applikationsimports ===
from ..extensions import db
from ..models import User, ForumCategory, ForumThread, ForumPost # User is imported here
from ..search import add_post_to_index, remove_post_from_index, search_posts
from ..utils import firebase_token_required # Import the decorator

# Definer logger HELT I TOPPEN af modulet
log = logging.getLogger(__name__)

# --- Define dummy functions first, in case import fails ---
# Use Optional[Dict[str, Any]] for dummy return types
def _dummy_get_user_data_by_id(user_identifier: Optional[Union[str, int]]) -> Optional[Dict[str, Any]]:
    log.error(f"DUMMY get_user_data_by_id called for {user_identifier}")
    return None

def _dummy_get_user_data_batch(usernames: Union[List[str], Set[str]]) -> Dict[str, Optional[Dict[str, Any]]]:
    log.error("USING INEFFICIENT DUMMY get_user_data_batch! Performance will suffer.")
    users_dict: Dict[str, Optional[Dict[str, Any]]] = {}
    for name in set(usernames):
         try: pass
         except Exception: pass
    return users_dict

def _dummy_dt_filter_func(dt_obj, relative=False, default='N/A'):
    log.error("DUMMY dt_filter_func called.")
    if isinstance(dt_obj, datetime.datetime):
         try: pass
         except: pass
    return default

def _dummy_award_badge(user_id: int, badge_key: str) -> bool:
    log.error(f"DUMMY award_badge called for user {user_id}, badge {badge_key}.")
    return False

# --- Assign dummies initially ---
get_user_data_by_id_func: Callable = _dummy_get_user_data_by_id
get_user_data_batch_func: Callable = _dummy_get_user_data_batch
dt_filter_func_global: Callable = _dummy_dt_filter_func
award_badge_func: Callable = _dummy_award_badge

# --- Try to import the real functions, overwriting dummies if successful ---
try:
    from ..utils import get_user_data_by_id as real_get_user_data_by_id_util
    from ..utils import get_user_data_batch as real_get_user_data_batch_util
    from ..utils import dt_filter_func as real_dt_filter_func_util
    from ..utils import award_badge as real_award_badge_util
    
    get_user_data_by_id_func = real_get_user_data_by_id_util
    get_user_data_batch_func = real_get_user_data_batch_util
    dt_filter_func_global = real_dt_filter_func_util
    award_badge_func = real_award_badge_util
    log.debug("Successfully imported real utility functions from app.utils.")
except ImportError:
    log.critical(
        "IMPORT ERROR: Could not import functions from utils. "
        "Using dummy implementations. Forum functionality will be limited."
    )
    # User model should be imported from models, check if it was successful
    if 'User' not in globals() or User is None:
        log.error("User model from app.models is not available. Fallback User type is None.")
        User = None # type: ignore


# Importer Forms
from ..forms import ForumReplyForm, ForumNewThreadForm, ForumEditPostForm


# Opret Blueprint
forum_bp = Blueprint('forum', __name__, url_prefix='/forum')
# API Blueprint for Forum
forum_api_bp = Blueprint('forum_api', __name__, url_prefix='/api/v1/forum')

@forum_api_bp.route('/categories', methods=['GET'])
def api_get_forum_categories():
    log.debug("API request: Fetching all forum categories.")
    try:
        categories_stmt = select(ForumCategory).order_by(ForumCategory.sort_order, ForumCategory.name) # type: ignore[arg-type]
        categories = db.session.scalars(categories_stmt).all()

        results = []
        if not categories:
            return jsonify([])

        category_ids = [cat.id for cat in categories]
        last_threads_by_cat_id = {}
        latest_posts_data = {}
        usernames_to_fetch = set()

        # Optimized query for last thread info
        if category_ids:
            ThreadAlias = aliased(ForumThread)
            subq_last_thread = select(
                ThreadAlias.category_id, func.max(ThreadAlias.updated_at).label('max_updated_at')
            ).group_by(ThreadAlias.category_id).where(ThreadAlias.category_id.in_(category_ids)).subquery()

            stmt_last_thread_info = select(
                ForumThread.id.label('thread_id'),
                ForumThread.title.label('thread_title'),
                ForumThread.category_id,
                ForumThread.last_post_id,
                ForumThread.updated_at.label('last_activity_at') # Use thread's updated_at as last_activity
            ).join(subq_last_thread,
                   (ForumThread.category_id == subq_last_thread.c.category_id) &
                   (ForumThread.updated_at == subq_last_thread.c.max_updated_at))
            last_threads_mapping = db.session.execute(stmt_last_thread_info).mappings().all()
            last_threads_by_cat_id = {row['category_id']: dict(row) for row in last_threads_mapping}

            last_post_ids = [row.get('last_post_id') for row in last_threads_by_cat_id.values() if row.get('last_post_id')]
            if last_post_ids:
                stmt_latest_posts = select(
                    ForumPost.id,
                    ForumPost.author_username,
                    ForumPost.created_at
                ).where(ForumPost.id.in_(last_post_ids))
                post_results = db.session.execute(stmt_latest_posts).mappings().all()
                for post_row in post_results:
                    latest_posts_data[post_row['id']] = dict(post_row)
                    if post_row.get('author_username'):
                        usernames_to_fetch.add(post_row['author_username'])

        authors_details = get_user_data_batch_func(usernames_to_fetch) if usernames_to_fetch else {}

        for category in categories:
            last_thread_info = last_threads_by_cat_id.get(category.id)
            last_activity_obj = {}

            if last_thread_info:
                last_post_id = last_thread_info.get('last_post_id')
                last_post_detail = latest_posts_data.get(last_post_id) if last_post_id else None
                author_username = None
                if last_post_detail: # If there's a last post, use its author
                    author_username = last_post_detail.get('author_username')
                elif last_thread_info.get('thread_id'): # Fallback to thread author if no last post (e.g. thread just created)
                    # This requires fetching thread author if not already available
                    # For simplicity, we'll rely on last_post_detail for now or leave it blank
                    # To get thread author: thread_obj = db.session.get(ForumThread, last_thread_info['thread_id']); author_username = thread_obj.author_username
                    pass


                last_activity_obj = {
                    "thread_id": last_thread_info.get('thread_id'),
                    "thread_title": last_thread_info.get('thread_title'),
                    # Use thread's updated_at directly as it reflects the latest activity (new post or thread creation)
                    "last_post_at": last_thread_info.get('last_activity_at').isoformat() if last_thread_info.get('last_activity_at') else None, # type: ignore[attr-defined]
                    "last_post_by_username": author_username if author_username else None
                }


            results.append({
                "id": category.id,
                "name": category.name,
                "slug": category.slug,
                "description": category.description,
                "icon": category.icon,
                "thread_count": category.thread_count, # Assuming this is a property or efficiently loaded
                "post_count": category.post_count,     # Assuming this is a property or efficiently loaded
                "last_activity": last_activity_obj if last_activity_obj else None
            })
        return jsonify(results)
    except SQLAlchemyError as e:
        log.exception("API Error: Database error fetching forum categories.")
        return jsonify({"error": "Database error", "details": str(e)}), 500
    except Exception as e:
        log.exception("API Error: Unexpected error fetching forum categories.")
        return jsonify({"error": "Unexpected server error", "details": str(e)}), 500
@forum_api_bp.route('/categories/<int:category_id>/threads', methods=['GET'])
def api_get_category_threads(category_id: int):
    log.debug(f"API request: Fetching threads for category ID: {category_id}")
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', current_app.config.get('THREADS_PER_PAGE_API', 20), type=int)
    per_page = max(1, min(per_page, 50)) # Clamp per_page

    try:
        category = db.session.get(ForumCategory, category_id)
        if not category:
            return jsonify({"error": "Category not found"}), 404

        threads_query = (
            select(ForumThread)
            .where(ForumThread.category_id == category_id)
            .options(
                selectinload(ForumThread.last_post).load_only(ForumPost.id, ForumPost.author_username, ForumPost.created_at) # type: ignore[arg-type]
            )
            .order_by(ForumThread.is_sticky.desc(), ForumThread.updated_at.desc())
        )
        
        pagination = db.paginate(threads_query, page=page, per_page=per_page, error_out=False)
        threads_on_page: List[ForumThread] = pagination.items

        thread_list_data = []
        for thread in threads_on_page:
            last_post_data = None
            if thread.last_post:
                last_post_data = {
                    "id": thread.last_post.id,
                    "author_username": thread.last_post.author_username,
                    "created_at": thread.last_post.created_at.isoformat() if thread.last_post.created_at else None
                }
            
            thread_list_data.append({
                "id": thread.id,
                "title": thread.title,
                "author_username": thread.author_username, # Author of the thread itself
                "created_at": thread.created_at.isoformat() if thread.created_at else None,
                "updated_at": thread.updated_at.isoformat() if thread.updated_at else None, # Timestamp of the latest post or thread update
                "post_count": thread.post_count, # Using the pre-calculated column
                "view_count": thread.view_count,
                "is_sticky": thread.is_sticky,
                "is_locked": thread.is_locked,
                "last_post": last_post_data
            })

        return jsonify({
            "category": {
                "id": category.id,
                "name": category.name,
                "slug": category.slug
            },
            "threads": thread_list_data,
            "pagination": {
                "current_page": pagination.page,
                "per_page": pagination.per_page,
                "total_items": pagination.total,
                "total_pages": pagination.pages
            }
        })

    except SQLAlchemyError as e:
        log.exception(f"API Error: Database error fetching threads for category {category_id}.")
        return jsonify({"error": "Database error", "details": str(e)}), 500
    except Exception as e:
        log.exception(f"API Error: Unexpected error fetching threads for category {category_id}.")
        return jsonify({"error": "Unexpected server error", "details": str(e)}), 500

@forum_api_bp.route('/threads/<int:thread_id>/posts', methods=['GET'])
def api_get_thread_posts(thread_id: int):
    log.debug(f"API request: Fetching posts for thread ID: {thread_id}")
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', current_app.config.get('POSTS_PER_PAGE_API', 15), type=int)
    per_page = max(1, min(per_page, 50)) # Clamp per_page

    try:
        thread = db.session.query(ForumThread).options(
            selectinload(ForumThread.category).load_only(ForumCategory.id, ForumCategory.name, ForumCategory.slug) # type: ignore[arg-type]
        ).filter_by(id=thread_id).first()

        if not thread:
            return jsonify({"error": "Thread not found"}), 404

        posts_query = (
            select(ForumPost)
            .where(ForumPost.thread_id == thread_id)
            .order_by(ForumPost.created_at.asc()) # Typically posts are ordered chronologically
        )
        
        pagination = db.paginate(posts_query, page=page, per_page=per_page, error_out=False)
        posts_on_page: List[ForumPost] = pagination.items
        
        # Fetch author details in batch if needed (e.g., for avatar URLs not directly on post)
        # For now, assuming author_username is sufficient, and avatar can be constructed/fetched client-side or via User model
        # If User objects are needed:
        author_usernames = {post.author_username for post in posts_on_page if post.author_username}
        authors_details_map = get_user_data_batch_func(author_usernames) if author_usernames else {}

        post_list_data = []
        for post in posts_on_page:
            author_details = authors_details_map.get(post.author_username, {})
            post_list_data.append({
                "id": post.id,
                "author_username": post.author_username,
                "user_avatar_url": author_details.get('avatar_url'), # If fetching full user details
                "body_html": post.body_html, # Already sanitized HTML
                "created_at": post.created_at.isoformat() if post.created_at else None,
                "updated_at": post.updated_at.isoformat() if post.updated_at else None,
                "last_edited_by_username": post.last_edited_by,
            })

        return jsonify({
            "thread": {
                "id": thread.id,
                "title": thread.title,
                "category_id": thread.category.id if thread.category else None,
                "category_name": thread.category.name if thread.category else None,
                "category_slug": thread.category.slug if thread.category else None,
            },
            "posts": post_list_data,
            "pagination": {
                "current_page": pagination.page,
                "per_page": pagination.per_page,
                "total_items": pagination.total,
                "total_pages": pagination.pages
            }
        })

    except SQLAlchemyError as e:
        log.exception(f"API Error: Database error fetching posts for thread {thread_id}.")
        return jsonify({"error": "Database error", "details": str(e)}), 500
    except Exception as e:
        log.exception(f"API Error: Unexpected error fetching posts for thread {thread_id}.")
        return jsonify({"error": "Unexpected server error", "details": str(e)}), 500

@forum_api_bp.route('/threads/<int:thread_id>/posts', methods=['POST'])
@firebase_token_required
def api_create_thread_post(thread_id: int):
    log.debug(f"API request: Creating post in thread ID: {thread_id}")

    try:
        thread = db.session.get(ForumThread, thread_id)
        if not thread:
            return jsonify({"error": "Thread not found"}), 404
        
        if thread.is_locked:
            return jsonify({"error": "Thread is locked, cannot post replies."}), 403

        data = request.get_json()
        if not data or 'body' not in data or not data['body'].strip():
            return jsonify({"error": "Post body is required and cannot be empty."}), 400
        
        post_body = data['body'].strip()

        # Get Firebase UID from the decorator-populated flask_g
        firebase_user_data = getattr(flask_g, 'firebase_user', None)
        if not firebase_user_data: # Check if firebase_user itself is None or empty
            log.error(f"API Create Post: firebase_user not found in flask_g for thread {thread_id}.")
            return jsonify({"error": "Authentication context error: Firebase user data not found."}), 401

        firebase_uid = firebase_user_data.get('uid')
        if not firebase_uid:
            log.error(f"API Create Post: Firebase UID not found in firebase_user data for thread {thread_id}. Data: {firebase_user_data}")
            return jsonify({"error": "Authentication error: Firebase UID not found in token."}), 401

        # Find the local user by Firebase UID to get their username
        author = db.session.scalar(select(User).filter_by(firebase_uid=firebase_uid)) # type: ignore[arg-type]
        if not author or not author.username:
            log.warning(f"API Create Post: Local user not found or username missing for Firebase UID {firebase_uid} in thread {thread_id}.")
            return jsonify({"error": "User profile not found or incomplete. Cannot determine author."}), 403
        
        author_username = author.username

        new_post = ForumPost(
            thread_id=thread_id,
            author_username=author_username,
            body=post_body
        )
        db.session.add(new_post)
        db.session.commit()

        try:
            add_post_to_index(new_post)
        except Exception as index_err:
            log.error(f"API Create Post: Failed to index new post {new_post.id} for thread {thread_id}: {index_err}")

        log.info(f"API: User '{author_username}' (Firebase UID: {firebase_uid}) created post ID {new_post.id} in thread {thread_id}.")
        
        # Update thread's last_post_id and updated_at
        thread.last_post_id = new_post.id
        thread.updated_at = new_post.created_at # or func.now() if preferred
        # Increment post_count on thread - this should ideally be handled by a counter cache or trigger
        # For now, let's do it directly if the column exists and is simple.
        # A more robust way is thread.post_count = ForumPost.query.with_parent(thread).count()
        # or an event listener.
        # Direct increment:
        thread.post_count = (thread.post_count or 0) + 1
        db.session.add(thread)
        db.session.commit()


        return jsonify({
            "id": new_post.id,
            "author_username": new_post.author_username,
            "body_html": new_post.body_html,
            "created_at": new_post.created_at.isoformat() if new_post.created_at else None,
            "thread_id": new_post.thread_id
        }), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        log.exception(f"API Error: Database error creating post in thread {thread_id}.")
        return jsonify({"error": "Database error", "details": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        log.exception(f"API Error: Unexpected error creating post in thread {thread_id}.")
        return jsonify({"error": "Unexpected server error", "details": str(e)}), 500

@forum_api_bp.route('/categories/&lt;int:category_id&gt;/threads', methods=['POST'])
@firebase_token_required
def api_create_category_thread(category_id: int):
    log.debug(f"API request: Creating thread in category ID: {category_id}")

    try:
        category = db.session.get(ForumCategory, category_id)
        if not category:
            return jsonify({"error": "Category not found"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON payload"}), 400
        
        title = data.get('title', '').strip()
        body = data.get('body', '').strip()

        if not title:
            return jsonify({"error": "Thread title is required."}), 400
        if not body:
            return jsonify({"error": "Initial post body is required."}), 400

        firebase_user_data = getattr(flask_g, 'firebase_user', None)
        if not firebase_user_data:
            log.error(f"API Create Thread: firebase_user not found in flask_g for category {category_id}.")
            return jsonify({"error": "Authentication context error: Firebase user data not found."}), 401

        firebase_uid = firebase_user_data.get('uid')
        if not firebase_uid:
            log.error(f"API Create Thread: Firebase UID not found in firebase_user data for category {category_id}. Data: {firebase_user_data}")
            return jsonify({"error": "Authentication error: Firebase UID not found in token."}), 401

        author = db.session.scalar(select(User).filter_by(firebase_uid=firebase_uid)) # type: ignore[arg-type]
        if not author or not author.username:
            log.warning(f"API Create Thread: Local user not found or username missing for Firebase UID {firebase_uid} in category {category_id}.")
            return jsonify({"error": "User profile not found or incomplete. Cannot determine author."}), 403
        
        author_username = author.username

        new_thread = ForumThread()
        new_thread.title = title
        new_thread.category_id = category.id
        new_thread.author_username = author_username
        db.session.add(new_thread)
        db.session.flush() # To get new_thread.id for the first post

        first_post = ForumPost(
            thread_id=new_thread.id,
            author_username=author_username,
            body=body
        )
        db.session.add(first_post)
        db.session.flush() # To get first_post.id

        # Update thread's last_post_id and initial post_count
        new_thread.last_post_id = first_post.id
        new_thread.post_count = 1 
        # new_thread.updated_at will be set by ForumPost's event listener or implicitly by DB

        db.session.commit()

        try:
            add_post_to_index(first_post)
        except Exception as index_err:
            log.error(f"API Create Thread: Failed to index first post {first_post.id} for new thread {new_thread.id}: {index_err}")

        log.info(f"API: User '{author_username}' (Firebase UID: {firebase_uid}) created thread ID {new_thread.id} ('{new_thread.title}') in category {category_id} with first post ID {first_post.id}.")
        
        # Update category counters (if they are simple columns, otherwise use more robust methods)
        # category.thread_count = (category.thread_count or 0) + 1
        # category.post_count = (category.post_count or 0) + 1
        # db.session.add(category)
        # db.session.commit() 
        # Note: Counter updates on category might be better handled by triggers or event listeners for accuracy.
        # For now, relying on existing mechanisms or periodic recalculations if these direct updates are not robust.

        return jsonify({
            "thread_id": new_thread.id,
            "title": new_thread.title,
            "category_id": new_thread.category_id
        })
    except SQLAlchemyError as e:
        db.session.rollback()
        log.exception(f"API Error: Database error creating thread in category {category_id}.")
        return jsonify({"error": "Database error", "details": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        log.exception(f"API Error: Unexpected error creating thread in category {category_id}.")
        return jsonify({"error": "Unexpected server error", "details": str(e)}), 500

@forum_api_bp.route('/threads/&lt;int:thread_id&gt;', methods=['PUT'])
@firebase_token_required
def api_update_thread(thread_id: int):
    log.debug(f"API request: Updating thread ID: {thread_id}")

    try:
        thread = db.session.get(ForumThread, thread_id)
        if not thread:
            return jsonify({"error": "Thread not found"}), 404

        firebase_user_data = getattr(flask_g, 'firebase_user', None)
        if not firebase_user_data:
            log.error(f"API Update Thread: firebase_user not found in flask_g for thread {thread_id}.")
            return jsonify({"error": "Authentication context error"}), 401

        firebase_uid = firebase_user_data.get('uid')
        if not firebase_uid:
            log.error(f"API Update Thread: Firebase UID not found in token for thread {thread_id}.")
            return jsonify({"error": "Authentication error: Firebase UID missing"}), 401

        if User is None: # ADDED: Check if User model is available
            log.critical("API Update Thread: User model is not available. This is a critical configuration error.")
            return jsonify({"error": "Server configuration error: User model unavailable."}), 500

        acting_user = db.session.scalar(select(User).filter_by(firebase_uid=firebase_uid)) # type: ignore[arg-type]
        if not acting_user:
            log.warning(f"API Update Thread: Local user not found for Firebase UID {firebase_uid} for thread {thread_id}.")
            return jsonify({"error": "User profile not found"}), 403

        # Authorization check: Must be thread author or an admin
        if thread.author_username != acting_user.username and not acting_user.is_admin:
            log.warning(f"API Update Thread: User '{acting_user.username}' (Firebase UID: {firebase_uid}) is not authorized to update thread {thread_id} (author: '{thread.author_username}').")
            return jsonify({"error": "Forbidden: You are not authorized to update this thread."}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON payload"}), 400
        
        new_title = data.get('title', '').strip()
        if not new_title:
            return jsonify({"error": "Thread title cannot be empty."}), 400
        
        if thread.title == new_title:
            return jsonify({
                "message": "Thread title is already up to date. No changes made.",
                "thread_id": thread.id,
                "title": thread.title,
                "updated_at": thread.updated_at.isoformat() if thread.updated_at else None
            }), 200


        thread.title = new_title
        # The updated_at timestamp on the thread should ideally be updated automatically
        # by the model's event listener if one is set up for title changes,
        # or manually here if not. For now, assuming direct update or ORM handles it.
        # If manual update is needed: thread.updated_at = datetime.datetime.utcnow()
        
        db.session.add(thread)
        db.session.commit()

        log.info(f"API: Thread ID {thread.id} title updated to '{new_title}' by user '{acting_user.username}' (Firebase UID: {firebase_uid}).")

        return jsonify({
            "thread_id": thread.id,
            "title": thread.title,
            "category_id": thread.category_id,
            "author_username": thread.author_username,
            "created_at": thread.created_at.isoformat() if thread.created_at else None,
            "updated_at": thread.updated_at.isoformat() if thread.updated_at else None, # Reflects the update time
            "message": "Thread updated successfully."
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        log.exception(f"API Error: Database error updating thread {thread_id}.")
        return jsonify({"error": "Database error", "details": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        log.exception(f"API Error: Unexpected error updating thread {thread_id}.")
        return jsonify({"error": "Unexpected server error", "details": str(e)}), 500
@forum_api_bp.route('/threads/&lt;int:thread_id&gt;', methods=['DELETE'])
@firebase_token_required
def api_delete_thread(thread_id: int):
    log.debug(f"API request: Deleting thread ID: {thread_id}")

    try:
        thread = db.session.get(ForumThread, thread_id)
        if not thread:
            return jsonify({"error": "Thread not found"}), 404

        firebase_user_data = getattr(flask_g, 'firebase_user', None)
        if not firebase_user_data:
            log.error(f"API Delete Thread: firebase_user not found in flask_g for thread {thread_id}.")
            return jsonify({"error": "Authentication context error"}), 401

        firebase_uid = firebase_user_data.get('uid')
        if not firebase_uid:
            log.error(f"API Delete Thread: Firebase UID not found in token for thread {thread_id}.")
            return jsonify({"error": "Authentication error: Firebase UID missing"}), 401

        if User is None: # type: ignore
            log.error("API Delete Thread: User model is not available.")
            return jsonify({"error": "Server configuration error: User model unavailable."}), 500
            
        acting_user = db.session.scalar(select(User).filter_by(firebase_uid=firebase_uid)) # type: ignore
        if not acting_user:
            log.warning(f"API Delete Thread: Local user not found for Firebase UID {firebase_uid} for thread {thread_id}.")
            return jsonify({"error": "User profile not found"}), 403

        # Authorization check: Must be thread author or an admin
        if thread.author_username != acting_user.username and not acting_user.is_admin:
            log.warning(f"API Delete Thread: User '{acting_user.username}' (Firebase UID: {firebase_uid}) is not authorized to delete thread {thread_id} (author: '{thread.author_username}').")
            return jsonify({"error": "Forbidden: You are not authorized to delete this thread."}), 403

        # Fetch category before deleting thread to update counts later
        category_id = thread.category_id

        # Delete associated posts and remove them from search index
        posts_to_delete = db.session.scalars(select(ForumPost).filter_by(thread_id=thread_id)).all()
        post_ids_for_index_removal = [post.id for post in posts_to_delete]

        for post in posts_to_delete:
            db.session.delete(post)
        
        # Delete the thread
        db.session.delete(thread)
        
        # Commit deletions
        db.session.commit()

        # Remove posts from search index after successful DB commit
        for post_id_to_remove in post_ids_for_index_removal:
            try:
                remove_post_from_index(post_id_to_remove)
            except Exception as index_err:
                log.error(f"API Delete Thread: Failed to remove post {post_id_to_remove} from index for deleted thread {thread_id}: {index_err}")
        
        # Note: Category post_count and thread_count should be updated.
        # This can be complex due to concurrency. Consider using database triggers,
        # event listeners, or a periodic recalculation task.
        # For now, we'll log this requirement.
        log.info(f"API: Thread ID {thread_id} and its posts deleted by user '{acting_user.username}' (Firebase UID: {firebase_uid}). Category {category_id} counts need update.")

        return jsonify({"message": "Thread and all associated posts deleted successfully."}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        log.exception(f"API Error: Database error deleting thread {thread_id}.")
        return jsonify({"error": "Database error", "details": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        log.exception(f"API Error: Unexpected error deleting thread {thread_id}.")
        return jsonify({"error": "Unexpected server error", "details": str(e)}), 500
@forum_api_bp.route('/threads/&lt;int:thread_id&gt;/posts/&lt;int:post_id&gt;', methods=['PUT'])
@firebase_token_required
def api_update_thread_post(thread_id: int, post_id: int):
    log.debug(f"API request: Updating post ID: {post_id} in thread ID: {thread_id}")

    try:
        post = db.session.get(ForumPost, post_id)
        if not post:
            return jsonify({"error": "Post not found"}), 404
        
        if post.thread_id != thread_id:
            log.warning(f"API Update Post: Post {post_id} does not belong to thread {thread_id}.")
            return jsonify({"error": "Post not found in this thread"}), 404

        thread = db.session.get(ForumThread, thread_id) # Fetch thread for context if needed (e.g. locked status)
        if not thread: # Should not happen if post.thread_id is valid, but good check
            return jsonify({"error": "Thread not found"}), 404

        if thread.is_locked and not (getattr(flask_g, 'firebase_user_is_admin', False)): # Allow admins to edit posts in locked threads
            return jsonify({"error": "Thread is locked, posts cannot be edited."}), 403

        data = request.get_json()
        if not data or 'body' not in data or not data['body'].strip():
            return jsonify({"error": "Post body is required and cannot be empty."}), 400
        
        new_body = data['body'].strip()

        firebase_user_data = getattr(flask_g, 'firebase_user', None)
        if not firebase_user_data:
            log.error(f"API Update Post: firebase_user not found in flask_g for post {post_id}.")
            return jsonify({"error": "Authentication context error"}), 401

        firebase_uid = firebase_user_data.get('uid')
        if not firebase_uid:
            log.error(f"API Update Post: Firebase UID not found in token for post {post_id}.")
            return jsonify({"error": "Authentication error: Firebase UID missing"}), 401

        if User is None:
            log.error("API Update Post: User model is not available.")
            return jsonify({"error": "Server configuration error: User model unavailable."}), 500
        
        acting_user = db.session.scalar(select(User).filter_by(firebase_uid=firebase_uid)) # type: ignore[arg-type]
        if not acting_user:
            log.warning(f"API Update Post: Local user not found for Firebase UID {firebase_uid} for post {post_id}.")
            return jsonify({"error": "User profile not found"}), 403

        # Authorization: Must be post author or an admin
        if post.author_username != acting_user.username and not acting_user.is_admin:
            log.warning(f"API Update Post: User '{acting_user.username}' (Firebase UID: {firebase_uid}) is not authorized to update post {post_id} (author: '{post.author_username}').")
            return jsonify({"error": "Forbidden: You are not authorized to edit this post."}), 403

        if post.body == new_body:
             return jsonify({
                "message": "Post content is already up to date. No changes made.",
                "post_id": post.id,
                "body_html": post.body_html,
                "updated_at": post.updated_at.isoformat() if post.updated_at else post.created_at.isoformat()
            }), 200

        post.body = new_body
        post.updated_at = datetime.datetime.utcnow() # type: ignore
        post.last_edited_by = acting_user.username
        # body_html is updated by the model's @property or event listener

        db.session.add(post)
        db.session.commit()

        try:
            add_post_to_index(post)
        except Exception as index_err:
            log.error(f"API Update Post: Failed to update index for post {post.id}: {index_err}")

        log.info(f"API: Post ID {post.id} updated by user '{acting_user.username}' (Firebase UID: {firebase_uid}).")
        
        return jsonify({
            "id": post.id,
            "thread_id": post.thread_id,
            "author_username": post.author_username,
            "body_html": post.body_html, # This should reflect the updated content
            "created_at": post.created_at.isoformat() if post.created_at else None,
            "updated_at": post.updated_at.isoformat() if post.updated_at else None,
            "last_edited_by_username": post.last_edited_by,
            "message": "Post updated successfully."
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        log.exception(f"API Error: Database error updating post {post_id} in thread {thread_id}.")
        return jsonify({"error": "Database error", "details": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        log.exception(f"API Error: Unexpected error updating post {post_id} in thread {thread_id}.")
        return jsonify({"error": "Unexpected server error", "details": str(e)}), 500
@forum_api_bp.route('/threads/&lt;int:thread_id&gt;/posts/&lt;int:post_id&gt;', methods=['DELETE'])
@firebase_token_required
def api_delete_thread_post(thread_id: int, post_id: int):
    log.debug(f"API request: Deleting post ID: {post_id} from thread ID: {thread_id}")

    try:
        post = db.session.get(ForumPost, post_id)
        if not post:
            return jsonify({"error": "Post not found"}), 404

        if post.thread_id != thread_id:
            log.warning(f"API Delete Post: Post {post_id} does not belong to thread {thread_id}.")
            return jsonify({"error": "Post not found in this thread"}), 404
            
        thread = db.session.get(ForumThread, post.thread_id) # Fetch the parent thread
        if not thread:
             # This case should ideally not be reached if post.thread_id is valid and DB is consistent
            log.error(f"API Delete Post: Thread {post.thread_id} for post {post_id} not found. Data inconsistency?")
            return jsonify({"error": "Associated thread not found"}), 500

        # Prevent deletion of the first post in a thread via this endpoint.
        # The entire thread should be deleted instead.
        if thread.first_post_id == post.id:
            log.warning(f"API Delete Post: Attempt to delete first post {post_id} of thread {thread.id}. Denied.")
            return jsonify({"error": "Cannot delete the first post of a thread. Delete the thread instead."}), 403

        firebase_user_data = getattr(flask_g, 'firebase_user', None)
        if not firebase_user_data:
            log.error(f"API Delete Post: firebase_user not found in flask_g for post {post_id}.")
            return jsonify({"error": "Authentication context error"}), 401

        firebase_uid = firebase_user_data.get('uid')
        if not firebase_uid:
            log.error(f"API Delete Post: Firebase UID not found in token for post {post_id}.")
            return jsonify({"error": "Authentication error: Firebase UID missing"}), 401

        if User is None:
            log.error("API Delete Post: User model is not available.")
            return jsonify({"error": "Server configuration error: User model unavailable."}), 500

        acting_user = db.session.scalar(select(User).filter_by(firebase_uid=firebase_uid)) # type: ignore[arg-type]
        if not acting_user:
            log.warning(f"API Delete Post: Local user not found for Firebase UID {firebase_uid} for post {post_id}.")
            return jsonify({"error": "User profile not found"}), 403

        # Authorization: Must be post author or an admin
        if post.author_username != acting_user.username and not acting_user.is_admin:
            log.warning(f"API Delete Post: User '{acting_user.username}' (Firebase UID: {firebase_uid}) is not authorized to delete post {post_id} (author: '{post.author_username}').")
            return jsonify({"error": "Forbidden: You are not authorized to delete this post."}), 403

        post_id_for_index = post.id # Store before deletion
        
        # Determine if this was the last post in the thread
        is_last_post_in_thread = (thread.last_post_id == post.id)

        db.session.delete(post)
        
        # Update thread's post_count and potentially last_post_id and updated_at
        thread.post_count = max(0, (thread.post_count or 1) - 1) # Decrement, ensure not negative

        if is_last_post_in_thread:
            if thread.post_count == 0: # This was the only post, and it's being deleted (should be handled by first_post_id check, but as a safeguard)
                # This scenario implies deleting the thread itself, which is not this endpoint's job.
                # However, if we reach here, it means the first_post_id check might have been bypassed or is for a different logic.
                # For now, we'll set last_post_id to None. The thread would be empty.
                thread.last_post_id = None
                # thread.updated_at should ideally be the thread's creation time or a special marker.
                # For simplicity, we might leave updated_at as is, or set to thread.created_at
            else:
                # Find the new last post
                new_last_post_stmt = select(ForumPost)\
                    .where(ForumPost.thread_id == thread.id)\
                    .order_by(ForumPost.created_at.desc())\
                    .limit(1)
                new_last_post = db.session.scalars(new_last_post_stmt).first()
                if new_last_post:
                    thread.last_post_id = new_last_post.id
                    thread.updated_at = new_last_post.created_at
                else: # Should not happen if post_count > 0
                    thread.last_post_id = None
                    thread.updated_at = thread.created_at


        db.session.add(thread) # Add thread to session to save changes to post_count, last_post_id, updated_at
        db.session.commit()

        try:
            remove_post_from_index(post_id_for_index)
        except Exception as index_err:
            log.error(f"API Delete Post: Failed to remove post {post_id_for_index} from index: {index_err}")

        log.info(f"API: Post ID {post_id_for_index} deleted by user '{acting_user.username}' (Firebase UID: {firebase_uid}). Thread {thread.id} counters updated.")
        
        return jsonify({"message": "Post deleted successfully."}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        log.exception(f"API Error: Database error deleting post {post_id} in thread {thread_id}.")
        return jsonify({"error": "Database error", "details": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        log.exception(f"API Error: Unexpected error deleting post {post_id} in thread {thread_id}.")
        return jsonify({"error": "Unexpected server error", "details": str(e)}), 500
# === HJÆLPEFUNKTION: Batch Fetching og Behandling af Brugerdata ===
def fetch_user_details(usernames: Set[str]) -> Dict[str, Dict[str, Any]]:
    if not usernames:
        return {}

    log.debug(f"--- Starting fetch_user_details for usernames: {usernames} ---")
    processed_data: Dict[str, Dict[str, Any]] = {
        name: {
            'username': name, 'original_case': name, 'rank': 'Bruger',
            'post_count': 0, 'join_date': None, 'avatar_url': None, 'is_online': False
        } for name in usernames
    }

    default_avatar_fallback_url = "/static/avatars/default_avatar.png"
    try:
        from flask import url_for, current_app # Local import for context-dependent calls
        default_avatar_path = current_app.config.get('DEFAULT_AVATAR', 'avatars/default_avatar.png').lstrip('/').replace('static/', '', 1)
        default_avatar_fallback_url = url_for('static', filename=default_avatar_path)
    except Exception:
        log.exception("Could not generate default avatar URL in fetch_user_details. Using hardcoded fallback.")

    try:
        # Call the assigned function (real or dummy)
        user_object_map = get_user_data_batch_func(list(usernames))
        log.debug(f"Batch fetch (get_user_data_batch_func) returned {len(user_object_map)} entries.")

        for original_case_username, user_obj_or_dict in user_object_map.items():
            # Check if user_obj_or_dict is a User instance (from models)
            # This check is crucial if the dummy functions return dicts and real ones return User objects
            if User and isinstance(user_obj_or_dict, User): # Check User is not None
                user_obj = user_obj_or_dict # It's a User object
                log.debug(f"Processing User object for: '{user_obj.username}' (original request: '{original_case_username}')")
                user_avatar_url = getattr(user_obj, 'avatar_url', default_avatar_fallback_url)
                if not user_avatar_url: user_avatar_url = default_avatar_fallback_url
                registration_date_obj = getattr(user_obj, 'registration_date', None)

                processed_data[original_case_username] = {
                    'username': getattr(user_obj, 'username', original_case_username),
                    'original_case': original_case_username,
                    'rank': getattr(user_obj, 'rank', 'Bruger') or 'Bruger',
                    'post_count': getattr(user_obj, 'post_count', 0),
                    'join_date': registration_date_obj.isoformat() if registration_date_obj else None,
                    'avatar_url': user_avatar_url,
                    'is_online': getattr(user_obj, 'is_online', False)
                }
            else: # Handle None or if it's a dummy Dict (which it shouldn't be if real import worked)
                log.warning(f"No valid User object found for '{original_case_username}'. Using default details.")
                processed_data[original_case_username]['avatar_url'] = default_avatar_fallback_url
                processed_data[original_case_username]['is_online'] = False
        return processed_data
    except Exception as e:
        log.exception(f"CRITICAL error during fetch_user_details processing {len(usernames)} usernames: {e}")
        for name in usernames:
            if name not in processed_data:
                 processed_data[name] = {'username': name, 'original_case': name, 'rank': 'Bruger', 'post_count': 0, 'join_date': None, 'avatar_url': default_avatar_fallback_url, 'is_online': False}
            elif processed_data[name].get('avatar_url') is None:
                 processed_data[name]['avatar_url'] = default_avatar_fallback_url
        return processed_data

# ======================================================
#                     FORUM RUTER
# ======================================================

@forum_bp.route('/')
def index():
    log.info("======== Forum Index Route Start ========")
    category_render_data = []
    try:
        log.debug("Step 1: Fetching categories...")
        categories_stmt = select(ForumCategory).order_by(ForumCategory.sort_order, ForumCategory.name) # type: ignore[arg-type]
        categories = db.session.scalars(categories_stmt).all()
        log.debug(f"Step 1 DONE: Found {len(categories)} categories.")

        category_ids = [cat.id for cat in categories]
        if not category_ids:
            return render_template('forum/index.html', categories_data=category_render_data)

        log.debug(f"Step 2: Finding last thread IDs for categories: {category_ids}...")
        ThreadAlias = aliased(ForumThread)
        subq_last_thread = select(
             ThreadAlias.category_id, func.max(ThreadAlias.updated_at).label('max_updated_at')
           ).group_by(ThreadAlias.category_id).where(ThreadAlias.category_id.in_(category_ids)).subquery()
        stmt_last_thread_info = select(
             ForumThread.id, ForumThread.title, ForumThread.category_id, ForumThread.last_post_id
            ).join(subq_last_thread,
                   (ForumThread.category_id == subq_last_thread.c.category_id) &
                   (ForumThread.updated_at == subq_last_thread.c.max_updated_at))
        last_threads_mapping = db.session.execute(stmt_last_thread_info).mappings().all()
        last_threads_by_cat_id = {row['category_id']: dict(row) for row in last_threads_mapping}
        log.debug(f"Step 2 DONE: Found last thread info for {len(last_threads_by_cat_id)} categories.")

        last_post_ids = [row.get('last_post_id') for row in last_threads_by_cat_id.values() if row.get('last_post_id')]
        latest_posts_data: Dict[int, Dict[str, Any]] = {}
        usernames_to_fetch: Set[str] = set()
        if last_post_ids:
             stmt_latest_posts = select(ForumPost.id, ForumPost.author_username, ForumPost.created_at).where(ForumPost.id.in_(last_post_ids))
             post_results = db.session.execute(stmt_latest_posts).mappings().all()
             for post_row in post_results:
                 latest_posts_data[post_row['id']] = dict(post_row)
                 if post_row.get('author_username'):
                      usernames_to_fetch.add(post_row['author_username'])
        log.debug(f"Step 3 DONE: Fetched details for {len(latest_posts_data)} posts. Usernames to fetch: {usernames_to_fetch}")

        authors_details = get_user_data_batch_func(usernames_to_fetch) if usernames_to_fetch else {}
        log.debug(f"Step 4 DONE: fetch_user_details returned {len(authors_details)} results.")

        for category in categories:
            last_thread_info = last_threads_by_cat_id.get(category.id)
            last_post_detail = None
            last_author_detail = None
            if last_thread_info:
                last_post_id = last_thread_info.get('last_post_id')
                if last_post_id:
                    last_post_detail = latest_posts_data.get(last_post_id)
                    if last_post_detail:
                        last_post_author_username = last_post_detail.get('author_username')
                        if last_post_author_username:
                            last_author_detail = authors_details.get(last_post_author_username, {})
            category_render_data.append({
                 'id': category.id, 'name': category.name, 'slug': category.slug,
                 'description': category.description, 'icon': category.icon,
                 'thread_count': getattr(category, 'thread_count', 0),
                 'post_count': getattr(category, 'post_count', 0),
                 'last_thread_id': last_thread_info.get('id') if last_thread_info else None,
                 'last_thread_title': last_thread_info.get('title') if last_thread_info else None,
                 'last_post_created_at': last_post_detail.get('created_at') if last_post_detail else None,
                 'last_post_author_username': last_post_detail.get('author_username') if last_post_detail else None,
                 'last_post_author_avatar_url': last_author_detail.get('avatar_url') if last_author_detail else None,
            })
        log.debug("Step 5 DONE: Finished combining data.")
    except SQLAlchemyError as e:
        log.exception("Database error preparing forum index data.")
        flash('Der opstod en databasefejl.', 'danger')
    except Exception as e:
        tb_info = traceback.extract_tb(e.__traceback__)
        tb_lineno = tb_info[-1].lineno if tb_info else 'N/A'
        log.exception(f"Unexpected error preparing forum index data (at line ~{tb_lineno}): {e}")
        flash('Der opstod en uventet systemfejl.', 'danger')
    return render_template('forum/index.html', categories_data=category_render_data)

@forum_bp.route('/category/<string:slug>/')
def view_category(slug: str):
    log.info(f"Viewing forum category with slug: {slug}")
    page = request.args.get('page', 1, type=int)
    threads_per_page = current_app.config.get('THREADS_PER_PAGE', 15)
    all_authors_details: Dict[str, Dict[str, Any]] = {}
    last_post_info: Dict[int, Dict[str, Any]] = {}
    thread_counts: Dict[int, int] = {}
    pagination = None
    category = None

    try:
        category = db.session.scalar(select(ForumCategory).filter_by(slug=slug))
        if not category: abort(404, "Kategori ikke fundet")

        threads_query = select(ForumThread).where(ForumThread.category_id == category.id)\
            .order_by(ForumThread.is_sticky.desc(), ForumThread.updated_at.desc())
        pagination = db.paginate(threads_query, page=page, per_page=threads_per_page, error_out=False)
        threads_on_page: List[ForumThread] = pagination.items

        thread_ids = [t.id for t in threads_on_page]
        starter_usernames = {t.author_username for t in threads_on_page if t.author_username}
        last_post_ids = [t.last_post_id for t in threads_on_page if t.last_post_id]
        usernames_to_fetch = set(starter_usernames)

        if last_post_ids:
             stmt_last_posts = select(ForumPost.id, ForumPost.author_username, ForumPost.created_at)\
                .where(ForumPost.id.in_(last_post_ids))
             results = db.session.execute(stmt_last_posts).mappings().all()
             for row in results:
                 last_post_info[row['id']] = dict(row)
                 if row['author_username']:
                      usernames_to_fetch.add(row['author_username'])
        if thread_ids:
            stmt_counts = select(ForumPost.thread_id, func.count(ForumPost.id))\
                .where(ForumPost.thread_id.in_(thread_ids)).group_by(ForumPost.thread_id)
            thread_counts = {tid: count for tid, count in db.session.execute(stmt_counts).all()}
        if usernames_to_fetch:
            all_authors_details = get_user_data_batch_func(usernames_to_fetch)
    except SQLAlchemyError as e:
        log.exception(f"Database error preparing category view for '{slug}'.")
        flash('Databasefejl ved hentning af tråde.', 'danger')
        abort(500)
    except Exception as e:
        log.exception(f"Unexpected error preparing category view for '{slug}'.")
        flash('Uventet systemfejl.', 'danger')
        abort(500)

    return render_template(
        'forum/category.html', category=category, pagination=pagination,
        all_authors_data=all_authors_details, last_post_info=last_post_info,
        thread_counts=thread_counts
    )

@forum_bp.route('/thread/<int:thread_id>/', methods=['GET', 'POST'])
def view_thread(thread_id: int):
    log.debug(f"Accessing thread ID: {thread_id} (Method: {request.method})")
    page = request.args.get('page', 1, type=int)
    posts_per_page = current_app.config.get('POSTS_PER_PAGE', 10)
    authors_details: Dict[str, Dict[str, Any]] = {}
    pagination = None
    thread = None

    try:
        thread = db.session.scalar(
            select(ForumThread).options(selectinload(ForumThread.category)).filter_by(id=thread_id) # type: ignore[arg-type]
        )
        if not thread: abort(404, "Tråd ikke fundet.")

        reply_form = ForumReplyForm()

        if reply_form.validate_on_submit():
            if not current_user.is_authenticated:
                 flash('Log ind for at svare.', 'warning'); return redirect(url_for('auth.login_route', next=request.url))
            if thread.is_locked:
                 flash('Tråden er låst.', 'warning'); return redirect(url_for('forum.view_thread', thread_id=thread.id, page=page))
            try:
                 author_name = getattr(current_user, 'username', None)
                 if not author_name: raise ValueError("Current user object missing username.")
                 new_post = ForumPost(body=reply_form.body.data, author_username=author_name, thread_id=thread.id) # type: ignore[call-arg]
                 db.session.add(new_post)
                 db.session.commit()
                 try: add_post_to_index(new_post)
                 except Exception as index_err: log.error(f"Failed to index new reply post {new_post.id}: {index_err}")
                 log.info(f"User '{author_name}' replied to thread {thread.id} (Post ID: {new_post.id}).")
                 try:
                     if current_user.post_count == 10:
                         if callable(award_badge_func): award_badge_func(current_user.id, 'Forum Skribent')
                         else: log.error("award_badge_func not available. Skipping badge check.")
                 except NameError: log.error("award_badge_func not available (NameError). Skipping badge check.")
                 except Exception as badge_err: log.error(f"Error checking/awarding badge for user {current_user.id}: {badge_err}")
                 flash('Svar tilføjet.', 'success')
                 total_posts = db.session.scalar(select(func.count(ForumPost.id)).where(ForumPost.thread_id == thread.id)) or 0
                 last_page = max(1, (total_posts + posts_per_page - 1) // posts_per_page)
                 return redirect(url_for('forum.view_thread', thread_id=thread.id, page=last_page, _anchor=f'post-{new_post.id}'))
            except (SQLAlchemyError, ValueError, Exception) as e_save:
                 db.session.rollback()
                 log.exception(f"Error saving reply by '{getattr(current_user, 'username', 'N/A')}' to thread {thread.id}: {e_save}")
                 flash(f'Fejl ved gemning af svar: {e_save}', 'danger')

        posts_query = select(ForumPost).where(ForumPost.thread_id == thread.id).order_by(ForumPost.created_at.asc())
        pagination = db.paginate(posts_query, page=page, per_page=posts_per_page, error_out=False)
        posts_on_page: List[ForumPost] = pagination.items
        usernames_on_page = {p.author_username for p in posts_on_page if p.author_username}
        if usernames_on_page: authors_details = get_user_data_batch_func(usernames_on_page)

        if request.method == 'GET' and thread:
             db.session.execute(
                 sql_update(ForumThread).where(ForumThread.id == thread_id)
                 .values(view_count=(ForumThread.view_count or 0) + 1)
                 .execution_options(synchronize_session=False)
             )
             db.session.commit()
             thread.view_count = (thread.view_count or 0) + 1
    except SQLAlchemyError as e_load:
         db.session.rollback()
         log.exception(f"DB error loading posts/view count for thread {thread_id}.")
         flash('Databasefejl ved hentning af indlæg.', 'danger'); abort(500)
    except Exception as e_load:
         db.session.rollback()
         log.exception(f"Unexpected error loading thread data for {thread_id}.")
         flash('Uventet systemfejl.', 'danger'); abort(500)

    return render_template(
        'forum/thread.html', thread=thread, pagination=pagination,
        form=reply_form, authors_data=authors_details
    )

@forum_bp.route('/category/<string:category_slug>/new_thread/', methods=['GET', 'POST'])
@login_required
def create_thread(category_slug: str):
    log.debug(f"Accessing create thread form for category slug: {category_slug}")
    category = db.session.scalar(select(ForumCategory).filter_by(slug=category_slug))
    if not category: abort(404, "Kategori ikke fundet.")

    form = ForumNewThreadForm()
    author_name = getattr(current_user, 'username', None)
    if not author_name:
         log.error("Create thread failed: current_user missing username.")
         flash("Systemfejl: Kunne ikke finde brugernavn.", "danger")
         return redirect(url_for('forum.view_category', category_slug=category.slug))

    if form.validate_on_submit():
        log.debug(f"Create thread form validated by '{author_name}'.")
        try:
            new_thread = ForumThread(title=form.title.data, category_id=category.id, author_username=author_name) # type: ignore[call-arg]
            db.session.add(new_thread)
            db.session.flush()
            first_post = ForumPost(body=form.body.data, author_username=author_name, thread_id=new_thread.id) # type: ignore[call-arg]
            db.session.add(first_post)
            db.session.commit()
            try: add_post_to_index(first_post)
            except Exception as index_err: log.error(f"Failed to index new post {first_post.id}: {index_err}")
            log.info(f"User '{author_name}' created thread ID {new_thread.id} in category '{category.slug}'.")
            flash('Tråd oprettet!', 'success')
            return redirect(url_for('forum.view_thread', thread_id=new_thread.id))
        except SQLAlchemyError as e:
            db.session.rollback()
            log.exception(f"DB error creating thread by '{author_name}'.")
            flash('Databasefejl ved oprettelse.', 'danger')
        except Exception as e:
            db.session.rollback()
            log.exception(f"Unexpected error creating thread by '{author_name}'.")
            flash('Systemfejl ved oprettelse.', 'danger')
    return render_template('forum/create_thread.html', category=category, form=form)

@forum_bp.route('/post/<int:post_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_post(post_id: int):
    log.debug(f"Accessing edit post form for post ID: {post_id} by user '{getattr(current_user,'username','N/A')}'")
    post_stmt = select(ForumPost).options(
         selectinload(ForumPost.thread).selectinload(ForumThread.category) # type: ignore[arg-type]
        ).filter_by(id=post_id)
    post = db.session.scalar(post_stmt)
    if not post: abort(404, "Indlæg ikke fundet.")

    current_username = getattr(current_user, 'username', None)
    is_admin = getattr(current_user, 'is_admin', False)
    if post.author_username != current_username and not is_admin:
        abort(403, "Du har ikke tilladelse til at redigere dette indlæg.")

    form = ForumEditPostForm(obj=post)
    if form.validate_on_submit():
        log.debug(f"Edit post form validated for post {post_id} by '{current_username}'.")
        body_changed = post.body != form.body.data
        try:
            post.body = form.body.data
            if hasattr(post, 'last_edited_by'): post.last_edited_by = current_username
            if hasattr(post, 'last_edited_at'): post.last_edited_at = func.now()
            db.session.add(post)
            db.session.commit()
            if body_changed:
                try: add_post_to_index(post)
                except Exception as index_err: log.error(f"Failed to update index for edited post {post.id}: {index_err}")
            log.info(f"Post ID {post_id} updated by '{current_username}'.")
            flash('Indlægget er opdateret.', 'success')
            return redirect(url_for('forum.view_thread', thread_id=post.thread_id, _anchor=f'post-{post.id}'))
        except SQLAlchemyError as e:
            db.session.rollback(); log.exception("DB error updating post."); flash('Databasefejl ved opdatering.', 'danger')
        except Exception as e:
            db.session.rollback(); log.exception("Unexpected error updating post."); flash('Systemfejl ved opdatering.', 'danger')
    return render_template('forum/edit_post.html', form=form, post=post)

@forum_bp.route('/post/<int:post_id>/delete', methods=['POST'])
@login_required
def delete_post(post_id: int):
    log.debug(f"Attempting delete post ID: {post_id} by user '{getattr(current_user,'username','N/A')}'.")
    post = db.session.scalar(select(ForumPost).options(selectinload(ForumPost.thread)).filter_by(id=post_id)) # type: ignore[arg-type]
    if not post:
         flash("Indlægget blev ikke fundet.", "warning")
         return redirect(url_for('forum.index'))

    thread_id = post.thread_id
    current_username = getattr(current_user, 'username', None)
    is_admin = getattr(current_user, 'is_admin', False)

    if post.thread and post.thread.first_post_id == post.id: # Check if post.thread is not None
        flash('Første indlæg kan ikke slettes. Slet tråden.', 'warning')
        return redirect(url_for('forum.view_thread', thread_id=thread_id))
    if post.author_username != current_username and not is_admin:
        abort(403, "Du har ikke tilladelse til at slette dette indlæg.")
    try:
         db.session.delete(post)
         db.session.commit()
         try: remove_post_from_index(post_id)
         except Exception as index_err: log.error(f"Failed to remove post {post_id} from index: {index_err}")
         log.info(f"Post ID {post_id} deleted by '{current_username}'.")
         flash('Indlægget er slettet.', 'success')
    except SQLAlchemyError as e:
         db.session.rollback(); log.exception("DB error deleting post."); flash('Databasefejl ved sletning.', 'danger')
    except Exception as e:
         db.session.rollback(); log.exception("Unexpected error deleting post."); flash('Systemfejl ved sletning.', 'danger')
    return redirect(url_for('forum.view_thread', thread_id=thread_id))
    

@forum_bp.route('/api/forum/latest')
def api_latest_forum_posts():
    limit = request.args.get('limit', 5, type=int)
    limit = max(1, min(limit, 20))
    log.debug(f"API request: Fetching latest {limit} forum posts.")
    try:
        stmt = (select(ForumPost.id, ForumPost.author_username, ForumPost.created_at,
                       ForumPost.thread_id, ForumThread.title.label('thread_title'))
                .join(ForumThread, ForumPost.thread_id == ForumThread.id)
                .order_by(ForumPost.created_at.desc()).limit(limit))
        latest_posts_raw = db.session.execute(stmt).mappings().all()
        if not latest_posts_raw: return jsonify([])

        author_usernames = {post['author_username'] for post in latest_posts_raw if post.get('author_username')}
        authors_details = get_user_data_batch_func(author_usernames) if author_usernames else {}
        latest_posts_processed = []
        for post_mapping in latest_posts_raw:
            post = dict(post_mapping) # Convert RowMapping to dict
            author_name = post.get('author_username')
            author_info = authors_details.get(author_name, {}) if author_name else {}
            relative_time = "Ukendt tidspunkt"
            created_at_dt = post.get('created_at')
            if created_at_dt:
                try:
                    if callable(dt_filter_func_global): # Check if the global function is callable
                         relative_time = dt_filter_func_global(created_at_dt, relative=True, default='dato-fejl')
                    else:
                         log.error("dt_filter_func_global not available. Cannot format relative time.")
                         relative_time = created_at_dt.strftime('%d.%m.%Y %H:%M')
                except Exception as time_err:
                     log.error(f"Error formatting relative time for post {post.get('id')}: {time_err}")
                     relative_time = created_at_dt.strftime('%d.%m.%Y %H:%M')
            latest_posts_processed.append({
                'post_id': post.get('id'), 'author_username': author_name,
                'author_display_name': author_info.get('username', author_name),
                'author_avatar_url': author_info.get('avatar_url'),
                'created_at_iso': created_at_dt.isoformat() if created_at_dt else None,
                'created_at_relative': relative_time,
                'thread_id': post.get('thread_id'),
                'thread_title': post.get('thread_title', 'Ukendt Tråd')
            })
        return jsonify(latest_posts_processed)
    except SQLAlchemyError as e:
        log.exception("API Error: Database error fetching latest forum posts.")
        return jsonify({"error": "Database fejl ved hentning af posts."}), 500
    except Exception as e:
        log.exception("API Error: Unexpected error fetching latest forum posts.")
        return jsonify({"error": "Uventet system fejl."}), 500

# ----- Forum Search Route -----
@forum_bp.route('/search')
def search():
    query = request.args.get('q', '').strip()
    page = request.args.get('page', 1, type=int)
    posts_per_page = current_app.config.get('POSTS_PER_PAGE', 10)
    search_results_objects: List[ForumPost] = []
    authors_details: Dict[str, Dict[str, Any]] = {}
    total_hits = 0 # Initialize total_hits

    if not query:
        flash("Indtast venligst et søgeord.", "info")
    else:
        log.info(f"Forum search initiated for query: '{query}', page: {page}")
        try:
            search_result_data, total_hits = search_posts(query, page=page, per_page=posts_per_page)
            post_ids = [int(hit['id']) for hit in search_result_data if hit.get('id')]
            posts_map: Dict[int, ForumPost] = {}
            if post_ids:
                posts_query = db.select(ForumPost).options(
                    selectinload(ForumPost.thread).selectinload(ForumThread.category) # type: ignore[arg-type]
                ).where(ForumPost.id.in_(post_ids))
                posts_list = db.session.scalars(posts_query).all()
                posts_map = {post.id: post for post in posts_list}
            
            temp_results = [posts_map.get(int(hit['id'])) for hit in search_result_data if hit.get('id') and int(hit['id']) in posts_map]
            search_results_objects = [p for p in temp_results if p is not None]

            usernames_on_page = {p.author_username for p in search_results_objects if p and p.author_username}
            if usernames_on_page:
                authors_details = get_user_data_batch_func(usernames_on_page)
        except Exception as e:
            log.exception(f"Error during forum search for query '{query}': {e}")
            flash("Der opstod en fejl under søgningen.", "danger")
            total_hits = 0 # Reset on error

    return render_template(
        'forum/search_results.html', query=query, results=search_results_objects,
        authors_data=authors_details, title=f"Søgeresultater for '{query}'" if query else "Søg i Forum",
        current_page=page, items_per_page=posts_per_page, total_items=total_hits
    )
# === EOF: app/routes/forum.py ===
