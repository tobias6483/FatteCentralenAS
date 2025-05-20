"""
Pytest configuration file for Flask backend testing.
This file contains shared fixtures for all tests.
"""

import os
import sys
import tempfile

import pytest
from flask import Flask

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.models import ForumCategory, ForumPost, ForumThread, User
from app.models import db as _db


@pytest.fixture(scope="session")
def app():
    """Create and configure a Flask app for testing."""
    # Create a temporary file for SQLite database
    db_fd, db_path = tempfile.mkstemp()

    # Create the app with testing config
    app = create_app(
        test_config={
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
            "SQLALCHEMY_TRACK_MODIFICATIONS": False,
            "SECRET_KEY": "test_secret_key",
            "JWT_SECRET_KEY": "test_jwt_secret_key",
            "WTF_CSRF_ENABLED": False,
        }
    )

    # Create the application context
    with app.app_context():
        yield app

    # Clean up
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture(scope="session")
def db(app):
    """Create and configure a database for testing."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.remove()
        _db.drop_all()


@pytest.fixture(scope="function")
def session(db):
    """Create a new database session for a test."""
    connection = db.engine.connect()
    transaction = connection.begin()

    session = db.create_scoped_session(options={"bind": connection, "binds": {}})

    db.session = session

    yield session

    transaction.rollback()
    connection.close()
    session.remove()


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture
def auth_headers():
    """Generate headers for authenticated requests."""
    return {"Authorization": "Bearer test_token", "Content-Type": "application/json"}


@pytest.fixture
def create_test_user(session):
    """Create a test user in the database."""

    def _create_user(
        username="testuser",
        email="test@example.com",
        password="Password123",
        firebase_uid=None,
    ):
        user = User(
            username=username,
            email=email,
            firebase_uid=firebase_uid or f"firebase_{username}",
        )
        user.set_password(password)
        session.add(user)
        session.commit()
        return user

    return _create_user


@pytest.fixture
def create_forum_category(session):
    """Create a test forum category."""

    def _create_category(name="Test Category", description="Test Description"):
        category = ForumCategory(
            name=name, description=description, slug=name.lower().replace(" ", "-")
        )
        session.add(category)
        session.commit()
        return category

    return _create_category


@pytest.fixture
def create_forum_thread(session, create_test_user, create_forum_category):
    """Create a test forum thread."""

    def _create_thread(
        title="Test Thread", user=None, category=None, is_sticky=False, is_locked=False
    ):
        if user is None:
            user = create_test_user()
        if category is None:
            category = create_forum_category()

        thread = ForumThread(
            title=title,
            user_id=user.id,
            category_id=category.id,
            is_sticky=is_sticky,
            is_locked=is_locked,
        )
        session.add(thread)
        session.commit()
        return thread

    return _create_thread


@pytest.fixture
def create_forum_post(session, create_test_user, create_forum_thread):
    """Create a test forum post."""

    def _create_post(body="Test post content", user=None, thread=None):
        if user is None:
            user = create_test_user()
        if thread is None:
            thread = create_forum_thread()

        post = ForumPost(body=body, user_id=user.id, thread_id=thread.id)
        session.add(post)
        session.commit()
        return post

    return _create_post
