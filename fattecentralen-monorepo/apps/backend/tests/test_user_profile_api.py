"""
Tests for User Profile API endpoints.
"""

import json
from unittest.mock import patch

import pytest


def test_get_user_profile(client, create_test_user, mock_firebase_verify):
    """Test getting the authenticated user's profile."""
    # Create a user with matching Firebase UID
    user = create_test_user(
        username="profileuser",
        email="profile@example.com",
        firebase_uid="firebase_test_uid",
    )

    # Make the request
    response = client.get(
        "/api/v1/users/me/profile",
        headers={"Authorization": "Bearer valid_firebase_token"},
    )

    # Verify the response
    assert response.status_code == 200
    data = json.loads(response.data)

    # Check essential fields
    assert data["username"] == user.username
    assert data["email"] == user.email
    assert data["firebase_uid"] == user.firebase_uid

    # Check profile structure
    assert "avatar_url" in data
    assert "role" in data
    assert "registration_date" in data

    # User shouldn't receive sensitive information
    assert "password_hash" not in data


def test_update_user_profile(client, create_test_user, mock_firebase_verify):
    """Test updating the authenticated user's profile."""
    # Create a user with matching Firebase UID
    user = create_test_user(
        username="updateuser",
        email="update@example.com",
        firebase_uid="firebase_test_uid",
    )

    # Prepare update data
    update_data = {
        "about_me": "This is my updated profile bio.",
        "settings": {"theme": "dark", "notifications_enabled": True},
        "privacy_settings": {"profile_public": False, "show_activity": True},
    }

    # Make the request
    response = client.put(
        "/api/v1/users/me/profile",
        headers={"Authorization": "Bearer valid_firebase_token"},
        json=update_data,
    )

    # Verify the response
    assert response.status_code == 200
    data = json.loads(response.data)

    # Check updated fields
    assert data["about_me"] == update_data["about_me"]
    assert data["settings"]["theme"] == update_data["settings"]["theme"]
    assert (
        data["settings"]["notifications_enabled"]
        == update_data["settings"]["notifications_enabled"]
    )
    assert (
        data["privacy_settings"]["profile_public"]
        == update_data["privacy_settings"]["profile_public"]
    )
    assert (
        data["privacy_settings"]["show_activity"]
        == update_data["privacy_settings"]["show_activity"]
    )

    # Check that other fields remain unchanged
    assert data["username"] == user.username
    assert data["email"] == user.email


def test_update_user_profile_invalid_fields(
    client, create_test_user, mock_firebase_verify
):
    """Test updating with invalid fields is properly handled."""
    # Create a user with matching Firebase UID
    user = create_test_user(
        username="invalidupdate",
        email="invalid@example.com",
        firebase_uid="firebase_test_uid",
    )

    # Prepare update data with fields that shouldn't be modifiable
    update_data = {
        "username": "hacker",
        "email": "hacked@example.com",
        "role": "admin",
        "balance": 1000000,
        "about_me": "Valid field",
    }

    # Make the request
    response = client.put(
        "/api/v1/users/me/profile",
        headers={"Authorization": "Bearer valid_firebase_token"},
        json=update_data,
    )

    # Expect success but with only valid fields updated
    assert response.status_code == 200
    data = json.loads(response.data)

    # Verify protected fields weren't changed
    assert data["username"] == user.username
    assert data["email"] == user.email
    assert data["role"] == "user"  # Assuming default role

    # But valid fields were updated
    assert data["about_me"] == update_data["about_me"]
