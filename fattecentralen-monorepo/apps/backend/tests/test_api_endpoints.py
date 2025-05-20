"""
Basic tests for API endpoints.
"""

import json

import pytest


def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "ok"
    assert "version" in data


def test_auth_required_endpoints(client):
    """Test that protected endpoints require authentication."""
    # Test user profile endpoint
    response = client.get("/api/v1/users/me/profile")
    assert response.status_code == 401

    # Test aktiedyst portfolio endpoint
    response = client.get("/api/v1/aktiedyst/portfolio")
    assert response.status_code == 401

    # Test posting to forum
    response = client.post("/api/v1/forum/threads/1/posts", json={"body": "Test post"})
    assert response.status_code == 401


def test_public_endpoints(client):
    """Test that public endpoints are accessible without auth."""
    # Test sports list endpoint
    response = client.get("/api/v1/sports")
    assert response.status_code == 200

    # Test forum categories endpoint
    response = client.get("/api/v1/forum/categories")
    assert response.status_code == 200

    # Test markets endpoint
    response = client.get("/api/v1/aktiedyst/markets")
    assert response.status_code == 200
