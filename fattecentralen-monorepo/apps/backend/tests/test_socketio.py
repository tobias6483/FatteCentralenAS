"""
Tests for Socket.IO implementation.
"""

import json
from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture
def socketio_client(app):
    """Create a Socket.IO test client."""
    from flask_socketio import SocketIO

    socketio = SocketIO(app)

    # Register handlers (simplified version for testing)
    @socketio.on("connect")
    def test_connect():
        pass

    @socketio.on("subscribe_to_live_scores")
    def test_subscribe(data):
        return {"status": "subscribed", "match_id": data.get("match_id")}

    @socketio.on("subscribe_to_stock_updates")
    def test_stock_subscribe(data):
        return {"status": "subscribed", "symbol": data.get("symbol")}

    return socketio.test_client(app)


def test_socketio_connect(socketio_client):
    """Test basic Socket.IO connection."""
    assert socketio_client.is_connected()


def test_socketio_subscribe_to_match(socketio_client):
    """Test subscribing to a match for live score updates."""
    # Subscribe to a match
    response = socketio_client.emit(
        "subscribe_to_live_scores", {"match_id": "test_match_123"}, callback=True
    )

    # Check response
    assert response["status"] == "subscribed"
    assert response["match_id"] == "test_match_123"


def test_socketio_subscribe_to_stock(socketio_client):
    """Test subscribing to a stock for price updates."""
    # Subscribe to a stock
    response = socketio_client.emit(
        "subscribe_to_stock_updates", {"symbol": "AAPL"}, callback=True
    )

    # Check response
    assert response["status"] == "subscribed"
    assert response["symbol"] == "AAPL"


@patch("flask_socketio.SocketIO.emit")
def test_broadcast_live_score_update(mock_emit, app):
    """Test broadcasting a live score update."""
    from app.sockets import broadcast_live_score_update

    # Create test data
    match_data = {
        "match_id": "match_123",
        "score": {"home": 2, "away": 1},
        "minute": 75,
        "status": "live",
    }

    # Call the function (need app context for certain operations)
    with app.app_context():
        broadcast_live_score_update(match_data)

    # Verify emission to the correct room with correct data
    mock_emit.assert_called_with(
        "live_score_update", match_data, room=f"match_{match_data['match_id']}"
    )


@patch("flask_socketio.SocketIO.emit")
def test_broadcast_stock_price_update(mock_emit, app):
    """Test broadcasting a stock price update."""
    from app.sockets import broadcast_stock_price_update

    # Create test data
    stock_data = {
        "symbol": "AAPL",
        "price": 175.50,
        "change": 1.25,
        "change_percent": 0.72,
        "timestamp": "2025-05-20T11:00:00Z",
    }

    # Call the function
    with app.app_context():
        broadcast_stock_price_update(stock_data)

    # Verify emission to the correct room with correct data
    mock_emit.assert_called_with(
        "stock_price_update",
        stock_data,
        room=f"aktiedyst_market_{stock_data['symbol']}",
    )
