"""
Tests for Forum API endpoints.
"""

import json
from unittest.mock import patch

import pytest


def test_get_forum_categories(client, create_forum_category):
    """Test getting the list of forum categories."""
    # Create some test categories
    cat1 = create_forum_category(
        name="General Discussion", description="General topics"
    )
    cat2 = create_forum_category(name="Help & Support", description="Get help here")

    # Make the request
    response = client.get("/api/v1/forum/categories")

    # Verify the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) >= 2

    # Verify each category has the expected fields
    category_names = [c["name"] for c in data]
    assert "General Discussion" in category_names
    assert "Help & Support" in category_names

    # Verify structure
    for category in data:
        assert "id" in category
        assert "name" in category
        assert "description" in category
        assert "slug" in category


def test_get_threads_in_category(
    client, create_forum_category, create_forum_thread, create_test_user
):
    """Test getting threads within a category."""
    # Create a category and some threads
    user = create_test_user(username="threadauthor")
    category = create_forum_category(name="Test Category")

    # Create sticky and regular threads
    sticky_thread = create_forum_thread(
        title="Sticky Thread", user=user, category=category, is_sticky=True
    )

    regular_thread = create_forum_thread(
        title="Regular Thread", user=user, category=category
    )

    # Make the request
    response = client.get(f"/api/v1/forum/categories/{category.id}/threads")

    # Verify the response
    assert response.status_code == 200
    data = json.loads(response.data)

    # Check structure
    assert "category" in data
    assert "threads" in data
    assert "pagination" in data

    # Verify category info
    assert data["category"]["id"] == category.id
    assert data["category"]["name"] == category.name

    # Verify threads are returned
    thread_titles = [t["title"] for t in data["threads"]]
    assert "Sticky Thread" in thread_titles
    assert "Regular Thread" in thread_titles

    # Verify sticky threads appear first
    # This assumes the API returns sticky threads first, which is standard practice
    assert data["threads"][0]["is_sticky"] is True

    # Check pagination
    assert data["pagination"]["current_page"] == 1


def test_get_posts_in_thread(
    client, create_forum_thread, create_forum_post, create_test_user
):
    """Test getting posts within a thread."""
    # Create users, thread and posts
    user1 = create_test_user(username="postauthor1")
    user2 = create_test_user(username="postauthor2", email="author2@example.com")

    thread = create_forum_thread(title="Discussion Thread", user=user1)

    # Create initial post and reply
    post1 = create_forum_post(body="Initial post content", user=user1, thread=thread)

    post2 = create_forum_post(body="Reply to the post", user=user2, thread=thread)

    # Make the request
    response = client.get(f"/api/v1/forum/threads/{thread.id}/posts")

    # Verify the response
    assert response.status_code == 200
    data = json.loads(response.data)

    # Check structure
    assert "thread" in data
    assert "posts" in data
    assert "pagination" in data

    # Verify thread info
    assert data["thread"]["id"] == thread.id
    assert data["thread"]["title"] == thread.title

    # Verify posts
    assert len(data["posts"]) == 2

    # Posts should be in chronological order (oldest first)
    assert data["posts"][0]["author_username"] == "postauthor1"
    assert data["posts"][1]["author_username"] == "postauthor2"

    # Check post content
    assert "Initial post content" in data["posts"][0]["body_html"]
    assert "Reply to the post" in data["posts"][1]["body_html"]


@pytest.mark.parametrize("is_locked", [True, False])
def test_create_post(
    client, create_forum_thread, create_test_user, mock_firebase_verify, is_locked
):
    """Test creating a new post in a thread, considering locked status."""
    # Create a user with matching Firebase UID (from the mock)
    user = create_test_user(
        username="firebaseuser",
        email="firebase_test@example.com",
        firebase_uid="firebase_test_uid",
    )

    # Create a thread (locked or unlocked based on parameter)
    thread = create_forum_thread(
        title="Thread for Posting", user=user, is_locked=is_locked
    )

    # Prepare post data
    post_data = {"body": "This is a **markdown** test post."}

    # Make the request
    response = client.post(
        f"/api/v1/forum/threads/{thread.id}/posts",
        headers={"Authorization": "Bearer valid_firebase_token"},
        json=post_data,
    )

    if is_locked:
        # Posting to locked threads should fail
        assert response.status_code == 403
        data = json.loads(response.data)
        assert "error" in data
        assert "locked" in data["error"].lower()
    else:
        # Posting to regular threads should succeed
        assert response.status_code == 201
        data = json.loads(response.data)

        # Verify new post
        assert data["author_username"] == user.username
        assert "<strong>markdown</strong>" in data["body_html"]
        assert data["thread_id"] == thread.id
