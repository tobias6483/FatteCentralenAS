"""
Tests for Firebase Authentication integration.
"""

import json
from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture
def mock_firebase_verify():
    """Mock the Firebase ID token verification."""
    with patch("app.auth.firebase_admin.auth.verify_id_token") as mock:
        # Mock successful verification
        mock.return_value = {
            "uid": "firebase_test_uid",
            "email": "firebase_test@example.com",
            "name": "Firebase Test User",
        }
        yield mock


def test_firebase_auth_decorator(client, mock_firebase_verify, create_test_user):
    """Test the firebase_token_required decorator."""
    # Create a user with matching Firebase UID
    user = create_test_user(
        username="firebaseuser",
        email="firebase_test@example.com",
        firebase_uid="firebase_test_uid",
    )

    # Test with a valid token
    response = client.get(
        "/api/v1/users/me/profile",
        headers={"Authorization": "Bearer valid_firebase_token"},
    )

    # Verify the request was successful
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["username"] == user.username
    assert data["email"] == user.email

    # Verify our mock was called
    mock_firebase_verify.assert_called_once_with("valid_firebase_token")


def test_firebase_auth_invalid_token(client):
    """Test with an invalid Firebase token."""
    with patch("app.auth.firebase_admin.auth.verify_id_token") as mock:
        # Mock verification failure
        mock.side_effect = Exception("Invalid token")

        response = client.get(
            "/api/v1/users/me/profile",
            headers={"Authorization": "Bearer invalid_token"},
        )

        # Should return 401 Unauthorized
        assert response.status_code == 401
        data = json.loads(response.data)
        assert "error" in data
        assert "unauthorized" in data["error"].lower()


def test_firebase_auth_missing_user(client, mock_firebase_verify):
    """Test when Firebase auth succeeds but local user doesn't exist."""
    # No local user with the Firebase UID exists

    response = client.get(
        "/api/v1/users/me/profile",
        headers={"Authorization": "Bearer valid_firebase_token"},
    )

    # Should return 401 or 404, depending on implementation
    assert response.status_code in (401, 404)
    data = json.loads(response.data)
    assert "error" in data
