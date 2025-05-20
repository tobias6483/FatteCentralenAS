"""
Tests for Forum API endpoints.
"""

import json
from unittest.mock import patch

import pytest


def test_get_forum_categories(client, create_forum_category):
    """Test getting the list of forum categories."""
    # Create some test categories
    # cat1 = create_forum_category(
    #     name="General Discussion", description="General topics"
    # )
    # cat2 = create_forum_category(name="Help & Support", description="Get help here")

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
    # sticky_thread = create_forum_thread(
    #     title="Sticky Thread", user=user, category=category, is_sticky=True
    # )

    # regular_thread = create_forum_thread(
    #     title="Regular Thread", user=user, category=category
    # )

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
    # post1 = create_forum_post(body="Initial post content", user=user1, thread=thread)

    # post2 = create_forum_post(body="Reply to the post", user=user2, thread=thread)

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


def test_create_category(
    client, test_user, create_forum_category
):  # Added create_forum_category fixture
    """Test creating a new forum category."""
    # Create a user (assuming the test user is valid and has the right permissions)
    # test_user = create_test_user(username="categorycreator")

    # Prepare category data
    category_data = {"name": "New Category", "description": "Category description"}

    # Make the request
    response = client.post(
        "/api/v1/forum/categories",
        headers={"Authorization": "Bearer valid_firebase_token"},
        json=category_data,
    )

    # Verify the response
    assert response.status_code == 201
    data = json.loads(response.data)

    # Verify new category
    assert data["name"] == category_data["name"]
    assert data["description"] == category_data["description"]

    # cat1 = client.post("/api/v1/forum/categories", json={"name": "Category 1", "description": "Description 1"})
    # assert cat1.status_code == 200
    # assert cat1.json()["name"] == "Category 1"
    # Use the fixture to create a category if needed for the test, or remove if not.
    # Example:
    # category = create_forum_category(name="Test Category 1")
    # assert category.name == "Test Category 1"
    pass


def test_create_duplicate_category(
    client, test_user, create_forum_category
):  # Added create_forum_category fixture
    """Test creating a duplicate forum category."""
    # Prepare duplicate category data
    duplicate_category_data = {
        "name": "Duplicate Category",
        "description": "This is a duplicate category",
    }

    # Make the request
    response = client.post(
        "/api/v1/forum/categories",
        headers={"Authorization": "Bearer valid_firebase_token"},
        json=duplicate_category_data,
    )

    # Verify the response
    assert (
        response.status_code == 400
    )  # Assuming 400 for bad request due to duplication
    data = json.loads(response.data)

    # Check error message
    assert "error" in data
    assert "duplicate" in data["error"].lower()

    # client.post("/api/v1/forum/categories", json={"name": "Category 1", "description": "Description 1"})
    # cat2 = client.post("/api/v1/forum/categories", json={"name": "Category 1", "description": "Description 1"})
    # assert cat2.status_code == 400
    # Example:
    # create_forum_category(name="Duplicate Category", description="Test category") # First category
    # response = client.post("/api/v1/forum/categories", json={"name": "Duplicate Category", "description": "Attempt to create duplicate"})
    # assert response.status_code == 400 # Or whatever the expected error is
    # The line below was causing F821, remove or use fixture:
    # create_forum_category(name="Duplicate Category", description="Test category")
    pass


def test_create_thread_with_sticky_and_regular(
    client, test_user, test_category, create_forum_thread
):  # Added create_forum_thread
    """Test creating both sticky and regular threads in a category."""
    # Create a user (assuming test_user is valid)
    # test_user = create_test_user(username="threadcreator")

    # Create a category
    # test_category = create_forum_category(name="Sticky and Regular Threads")

    # Sticky thread data
    sticky_thread_data = {
        "title": "Sticky Thread",
        "content": "This is a sticky thread.",
        "is_sticky": True,
    }

    # Regular thread data
    regular_thread_data = {
        "title": "Regular Thread",
        "content": "This is a regular thread.",
        "is_sticky": False,
    }

    # Create sticky thread
    response = client.post(
        f"/api/v1/forum/categories/{test_category.id}/threads",
        headers={"Authorization": "Bearer valid_firebase_token"},
        json=sticky_thread_data,
    )

    # Verify sticky thread creation
    assert response.status_code == 201
    sticky_thread = response.json()
    assert sticky_thread["title"] == sticky_thread_data["title"]
    assert sticky_thread["is_sticky"] is True

    # Create regular thread
    response = client.post(
        f"/api/v1/forum/categories/{test_category.id}/threads",
        headers={"Authorization": "Bearer valid_firebase_token"},
        json=regular_thread_data,
    )

    # Verify regular thread creation
    assert response.status_code == 201
    regular_thread = response.json()
    assert regular_thread["title"] == regular_thread_data["title"]
    assert regular_thread["is_sticky"] is False

    # sticky_thread = client.post(
    #     f"/api/v1/forum/categories/{test_category.id}/threads",
    #     json={"title": "Sticky Thread", "content": "This is a sticky thread.", "is_sticky": True}
    # )
    # assert sticky_thread.status_code == 200
    # regular_thread = client.post(
    #     f"/api/v1/forum/categories/{test_category.id}/threads",
    #     json={"title": "Regular Thread", "content": "This is a regular thread."}
    # )
    # assert regular_thread.status_code == 200
    # Example using fixture:
    # sticky = create_forum_thread(category=test_category, title="Sticky Test", is_sticky=True, author_username=test_user.username)
    # regular = create_forum_thread(category=test_category, title="Regular Test", author_username=test_user.username)
    # assert sticky.is_sticky
    # assert not regular.is_sticky
    pass


def test_create_posts_in_thread(
    client, test_user, test_thread, create_forum_post
):  # Added create_forum_post
    """Test creating posts in a thread."""
    # Create a user (assuming test_user is valid)
    # test_user = create_test_user(username="postcreator")

    # Prepare post data
    post_data = {"content": "This is a test post."}

    # Make the request to create the first post
    response = client.post(
        f"/api/v1/forum/threads/{test_thread.id}/posts",
        headers={"Authorization": "Bearer valid_firebase_token"},
        json=post_data,
    )

    # Verify first post creation
    assert response.status_code == 201
    post1 = response.json()
    assert post1["content"] == post_data["content"]

    # Make the request to create a second post
    response = client.post(
        f"/api/v1/forum/threads/{test_thread.id}/posts",
        headers={"Authorization": "Bearer valid_firebase_token"},
        json=post_data,
    )

    # Verify second post creation
    assert response.status_code == 201
    post2 = response.json()
    assert post2["content"] == post_data["content"]

    # post1 = client.post(f"/api/v1/forum/threads/{test_thread.id}/posts", json={"content": "First post"})
    # assert post1.status_code == 200
    # post2 = client.post(f"/api/v1/forum/threads/{test_thread.id}/posts", json={"content": "Second post"})
    # assert post2.status_code == 200
    # Example using fixture:
    # p1 = create_forum_post(thread=test_thread, body="Post 1 content", author_username=test_user.username)
    # p2 = create_forum_post(thread=test_thread, body="Post 2 content", author_username=test_user.username)
    # assert p1.body == "Post 1 content"
    # assert p2.body == "Post 2 content"
    pass
