# fattecentralen-monorepo/apps/backend/routes/api_aktiedyst.py
import logging

from flask import Blueprint, g, jsonify, request
from flask_jwt_extended import (  # Example, replace with Firebase
    get_jwt_identity,
    jwt_required,
)

from ..extensions import db

# from ..utils import firebase_token_required # Assuming this decorator exists
from ..models import (  # Add other models like Stock, Transaction, Portfolio as needed
    User,
)

log = logging.getLogger(__name__)
aktiedyst_api_bp = Blueprint(
    "aktiedyst_api_v1", __name__, url_prefix="/api/v1/aktiedyst"
)


@aktiedyst_api_bp.route("/ping", methods=["GET"])
def ping_aktiedyst():
    """A simple ping endpoint to confirm the blueprint is working."""
    return jsonify(message="Aktiedyst API v1 is alive!"), 200


@aktiedyst_api_bp.route("/portfolio", methods=["GET"])
# @firebase_token_required # Protect this route
def get_portfolio():
    """
    Returns the authenticated user's stock portfolio.
    Requires Firebase authentication.
    """
    # In a real scenario with @firebase_token_required, user info would be in g.firebase_user
    # For now, let's assume a placeholder or direct JWT usage if Firebase decorator isn't ready
    # firebase_uid = g.firebase_user['uid']
    # user = User.query.filter_by(firebase_uid=firebase_uid).first()
    # if not user:
    #     return jsonify(error="User not found or not linked"), 404

    # Placeholder data
    mock_portfolio = {
        "user_id": "mock_user_firebase_uid",  # Replace with actual user identifier
        "total_value": 12500.75,
        "cash_balance": 1500.25,
        "holdings": [
            {
                "symbol": "FCG",
                "name": "FatteCentral Group",
                "shares": 100,
                "avg_price": 50.00,
                "current_price": 55.20,
                "total_value": 5520.00,
            },
            {
                "symbol": "MEGA",
                "name": "MegaCorp Inc.",
                "shares": 50,
                "avg_price": 100.00,
                "current_price": 110.50,
                "total_value": 5525.50,
            },
        ],
    }
    # log.info(f"Fetching portfolio for user: {firebase_uid}")
    return jsonify(mock_portfolio), 200


@aktiedyst_api_bp.route("/transactions", methods=["GET"])
# @firebase_token_required # Protect this route
def get_transactions():
    """
    Returns the authenticated user's transaction history.
    Requires Firebase authentication.
    """
    # firebase_uid = g.firebase_user['uid']
    # user = User.query.filter_by(firebase_uid=firebase_uid).first()
    # if not user:
    #     return jsonify(error="User not found or not linked"), 404

    # Placeholder data
    mock_transactions = {
        "user_id": "mock_user_firebase_uid",  # Replace with actual user identifier
        "transactions": [
            {
                "id": "txn_1",
                "timestamp": "2025-05-19T10:00:00Z",
                "type": "buy",
                "symbol": "FCG",
                "shares": 50,
                "price": 49.50,
                "total_amount": 2475.00,
            },
            {
                "id": "txn_2",
                "timestamp": "2025-05-19T11:30:00Z",
                "type": "buy",
                "symbol": "MEGA",
                "shares": 50,
                "price": 100.00,
                "total_amount": 5000.00,
            },
            {
                "id": "txn_3",
                "timestamp": "2025-05-20T14:15:00Z",
                "type": "sell",
                "symbol": "FCG",
                "shares": 20,
                "price": 55.00,
                "total_amount": 1100.00,
            },
            {
                "id": "txn_4",
                "timestamp": "2025-05-21T09:05:00Z",
                "type": "buy",
                "symbol": "FCG",
                "shares": 70,
                "price": 50.50,
                "total_amount": 3535.00,
            },
        ],
    }
    # log.info(f"Fetching transactions for user: {firebase_uid}")
    return jsonify(mock_transactions), 200


@aktiedyst_api_bp.route("/markets", methods=["GET"])
def get_markets():
    """
    Returns a list of tradable stocks/symbols.
    This endpoint might not require authentication if market data is public.
    """
    # Placeholder data
    mock_markets = [
        {
            "symbol": "FCG",
            "name": "FatteCentral Group",
            "current_price": 55.20,
            "change_pct": 1.25,
            "volume": 150000,
        },
        {
            "symbol": "MEGA",
            "name": "MegaCorp Inc.",
            "current_price": 110.50,
            "change_pct": -0.50,
            "volume": 75000,
        },
        {
            "symbol": "TECH",
            "name": "Tech Innovations Ltd.",
            "current_price": 250.75,
            "change_pct": 2.50,
            "volume": 300000,
        },
        {
            "symbol": "GREEN",
            "name": "Green Energy Co.",
            "current_price": 75.10,
            "change_pct": 0.10,
            "volume": 50000,
        },
    ]
    # log.info("Fetching list of markets.")
    return jsonify(mock_markets), 200


@aktiedyst_api_bp.route("/markets/<string:symbol>/history", methods=["GET"])
def get_market_history(symbol: str):
    """
    Returns historical price data for a given stock symbol.
    Optional query parameter: period (e.g., "1d", "7d", "1m", "3m", "1y", "max").
    This endpoint might not require authentication if market data is public.
    """
    period = request.args.get("period", "1m")  # Default to 1 month

    # Validate symbol (e.g., check if it exists in our list of markets)
    # For now, we'll just use it in the mock data.

    # Placeholder data - in a real app, fetch from DB or financial API
    mock_history_data = {
        "symbol": symbol.upper(),
        "period": period,
        "history": [
            {
                "date": "2025-04-19",
                "open": 50.00,
                "high": 51.00,
                "low": 49.50,
                "close": 50.75,
                "volume": 10000,
            },
            {
                "date": "2025-04-22",
                "open": 50.80,
                "high": 52.00,
                "low": 50.50,
                "close": 51.50,
                "volume": 12000,
            },
            # ... more data points depending on period
            {
                "date": "2025-05-17",
                "open": 54.00,
                "high": 55.50,
                "low": 53.80,
                "close": 55.20,
                "volume": 15000,
            },
        ],
    }
    if symbol.upper() == "FCG":  # Example specific data
        mock_history_data["history"].append(
            {
                "date": "2025-05-19",
                "open": 55.00,
                "high": 55.80,
                "low": 54.90,
                "close": 55.20,
                "volume": 13000,
            }
        )

    # log.info(f"Fetching history for symbol {symbol.upper()} for period {period}.")
    return jsonify(mock_history_data), 200


@aktiedyst_api_bp.route("/orders", methods=["POST"])
# @firebase_token_required # Protect this route
def place_order():
    """
    Places a new stock order (buy/sell).
    Requires Firebase authentication.
    Expects JSON payload with order details (symbol, type, shares, price_limit [optional]).
    """
    # firebase_uid = g.firebase_user['uid']
    # user = User.query.filter_by(firebase_uid=firebase_uid).first()
    # if not user:
    #     return jsonify(error="User not found or not linked"), 404

    data = request.get_json()
    if not data:
        return jsonify(error="Invalid request. JSON payload required."), 400

    symbol = data.get("symbol")
    order_type = data.get("type")  # "buy" or "sell"
    shares = data.get("shares")
    # price_limit = data.get("price_limit") # For limit orders

    if not all([symbol, order_type, shares]):
        return jsonify(error="Missing required fields: symbol, type, shares."), 400

    if order_type.lower() not in ["buy", "sell"]:
        return jsonify(error="Invalid order type. Must be 'buy' or 'sell'."), 400

    try:
        shares = int(shares)
        if shares <= 0:
            raise ValueError("Shares must be positive.")
    except ValueError:
        return jsonify(error="Invalid shares format. Must be a positive integer."), 400

    # Placeholder logic:
    # 1. Validate symbol
    # 2. Check user's buying power (for buy) or holdings (for sell)
    # 3. Create transaction record
    # 4. Update portfolio
    # 5. Potentially interact with a matching engine or external brokerage API

    # log.info(f"Order received from user {firebase_uid}: {order_type} {shares} shares of {symbol.upper()}")

    return (
        jsonify(
            message=f"Order to {order_type} {shares} shares of {symbol.upper()} received successfully.",
            order_id="mock_order_123",
        ),
        201,
    )


# Add other Aktiedyst API endpoints here as per PROJECT_PLAN.md
