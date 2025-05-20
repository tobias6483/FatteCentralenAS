# app/routes/stocks.py

# === Standard Bibliotek Imports ===
import logging
from datetime import datetime

# === Tredjeparts Bibliotek Imports ===
from flask import current_app  # Samlet og tilføjet relevante
from flask import (
    Blueprint,
    abort,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required

# === Lokale Applikationsimports ===
from ..config import Config
from ..data_access import load_players, save_players  # Specifikke funktioner
from ..extensions import (  # <-- HØJST SANDSYNLIGT NØDVENDIG for at gemme/hente handler etc.
    db,
)

# from ..forms import BuyStockForm, SellStockForm # <-- EKSEMPEL: Tilføj Stock Forms
# from ..models import StockTransaction, PortfolioItem # <-- EKSEMPEL: Tilføj DB Modeller for stocks
from ..utils import calculate_portfolio_value, get_common_context

# 'User' model import er sandsynligvis ikke nødvendig direkte, brug current_user


# Logger & Blueprint
log = logging.getLogger(__name__)  # Ændret navn
# url_prefix sættes nu i __init__.py for konsistens, men kan beholdes her hvis ønsket
# stocks_bp = Blueprint("stocks", __name__, url_prefix="/stocks")
stocks_bp = Blueprint(
    "stocks", __name__
)  # Definer uden prefix her, det sættes ved registrering

# --- API Routes ---


# /stocks/api/data/<symbol>
@stocks_bp.route("/api/data/<symbol>", methods=["GET"])
def stock_data(symbol):
    """
    Returnerer dummy aktiedata for et symbol.
    (Kræver ikke login - offentlig prisinformation)
    """
    try:
        symbol_upper = symbol.upper().strip()
        # Mere realistisk dummy pris?
        base_price = sum(ord(c) for c in symbol_upper) % 1000 / 10
        volatility = (abs(hash(symbol_upper)) % 20) - 10
        dummy_price = max(1.0, base_price * (1 + volatility / 100))
        # log.debug(f"Generated dummy price for {symbol_upper}: {dummy_price:.2f}")
        return jsonify({"symbol": symbol_upper, "price": round(dummy_price, 2)})
    except Exception as e:
        log.exception(f"Fejl i stock_data for symbol {symbol}: {e}")
        return jsonify({"error": "Fejl ved hentning af aktiedata"}), 500


# /stocks/api/buy
@stocks_bp.route("/api/buy", methods=["POST"])
@login_required  # Aktiveret - Kræver login
def buy_stock():
    """Håndterer aktiekøb for den loggede bruger."""
    # Brug current_user fra Flask-Login
    # Antagelse: current_user.id er det 'username', der bruges som nøgle i players.json
    # Hvis din User.get_id() returnerer noget andet, skal du justere her.
    user_key = current_user.get_id()

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Ugyldigt JSON format"}), 400

        symbol = data.get("symbol", "").upper().strip()
        try:
            shares = int(data.get("shares"))
        except (ValueError, TypeError):
            return jsonify({"error": "Ugyldigt antal aktier"}), 400

        if not symbol or shares <= 0:
            return jsonify({"error": "Ugyldigt symbol eller antal aktier"}), 400

        # Brug kopi for at undgå race conditions hvis muligt (selvom svært med JSON)
        players = load_players()
        user_data = players.get(user_key)  # Brug user_key

        if not user_data:
            # Dette *burde* ikke ske hvis brugeren er logget ind via Flask-Login
            log.error(f"User '{user_key}' authenticated but not found in players data.")
            return jsonify({"error": "Brugerdata ikke fundet internt"}), 404

        # Brug det lokale API til at få pris
        # OBS: Dette er et internt kald fra Python til Python. Det virker,
        # men for rigtig ydeevne ville man kalde pris-logikken direkte.
        price_response = stock_data(symbol)
        price_data = price_response.get_json()  # Få JSON body direkte
        if price_response.status_code != 200 or "price" not in price_data:
            log.error(f"Failed to get stock price for {symbol} via internal API.")
            # Returner en mere generel fejl til brugeren
            return jsonify({"error": f"Kunne ikke verificere prisen for {symbol}"}), 500
        current_price = price_data["price"]

        total_cost = current_price * shares
        # Opdateret til at bruge float(...) for en sikkerheds skyld
        if float(user_data.get("balance", 0.0)) < total_cost:
            return jsonify({"error": "Ikke nok saldo"}), 400

        # --- Opdater Bruger Data (i den indlæste kopi) ---
        # Sikr at balancen er en float før subtraktion
        user_data["balance"] = float(user_data.get("balance", 0.0)) - total_cost
        portfolio = user_data.setdefault("portfolio", {})
        # Sikr shares/avg_price er numeriske hvis de eksisterer
        stock_info = portfolio.setdefault(symbol, {"shares": 0, "avg_price": 0.0})
        stock_info["shares"] = int(stock_info.get("shares", 0))
        stock_info["avg_price"] = float(stock_info.get("avg_price", 0.0))

        current_total_value_owned = stock_info["shares"] * stock_info["avg_price"]
        new_total_shares = stock_info["shares"] + shares
        new_total_cost = current_total_value_owned + total_cost
        stock_info["shares"] = new_total_shares
        stock_info["avg_price"] = (
            new_total_cost / new_total_shares if new_total_shares else 0.0
        )  # Undgå division med 0

        # --- Log Transaktion ---
        transaction = {
            "type": "buy",
            "symbol": symbol,
            "shares": shares,
            "price": current_price,
            "total": total_cost,
            "timestamp": datetime.now().isoformat(),
        }
        user_data.setdefault("stock_transactions", []).append(transaction)

        # Gem den modificerede 'players' dictionary
        if save_players(players):
            log.info(
                f"User '{user_key}' bought {shares} shares of {symbol} @ {current_price:.2f}."
            )
            return (
                jsonify(
                    {
                        "message": f"{shares} aktier af {symbol} købt!",
                        # Returner opdaterede data for UI
                        "portfolio": user_data.get("portfolio", {}),
                        "balance": user_data.get("balance", 0.0),
                        "transaction": transaction,
                    }
                ),
                200,
            )
        else:
            log.error(
                f"Failed to save players data after stock purchase for {user_key}."
            )
            # Bemærk: In-memory 'user_data' er ændret, men ikke gemt.
            # Rollback er svært med JSON - brugeren kan prøve igen.
            return jsonify({"error": "Kunne ikke gemme aktiekøb. Prøv igen."}), 500

    except Exception as e:
        log.exception(f"Fejl i buy_stock for user {user_key}: {e}")
        return jsonify({"error": "Intern serverfejl ved køb af aktie"}), 500


# /stocks/api/sell
@stocks_bp.route("/api/sell", methods=["POST"])
@login_required  # Aktiveret - Kræver login
def sell_stock():
    """Håndterer aktiesalg for den loggede bruger."""
    user_key = current_user.get_id()  # Brug fra Flask-Login

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Ugyldigt JSON format"}), 400

        symbol = data.get("symbol", "").upper().strip()
        try:
            shares_to_sell = int(data.get("shares"))
        except (ValueError, TypeError):
            return jsonify({"error": "Ugyldigt antal aktier"}), 400

        if not symbol or shares_to_sell <= 0:
            return jsonify({"error": "Ugyldigt symbol eller antal aktier"}), 400

        players = load_players()
        user_data = players.get(user_key)

        if not user_data:
            log.error(f"User '{user_key}' authenticated but not found in players data.")
            return jsonify({"error": "Brugerdata ikke fundet internt"}), 404

        portfolio = user_data.get("portfolio", {})
        stock_info = portfolio.get(symbol)
        # Sikr at shares er et heltal for sammenligning
        current_shares = int(stock_info.get("shares", 0)) if stock_info else 0

        if not stock_info or current_shares < shares_to_sell:
            return (
                jsonify(
                    {
                        "error": f"Ikke nok aktier af {symbol} til salg ({current_shares} haves)."
                    }
                ),
                400,
            )

        # Hent pris via lokalt API
        price_response = stock_data(symbol)
        price_data = price_response.get_json()
        if price_response.status_code != 200 or "price" not in price_data:
            log.error(
                f"Failed to get stock price for {symbol} via internal API during sell."
            )
            return jsonify({"error": f"Kunne ikke verificere prisen for {symbol}"}), 500
        current_price = price_data["price"]

        total_gain = current_price * shares_to_sell

        # --- Opdater Bruger Data (i den indlæste kopi) ---
        user_data["balance"] = float(user_data.get("balance", 0.0)) + total_gain
        stock_info["shares"] = current_shares - shares_to_sell

        # Fjern aktie fra portefølje hvis antal er 0
        if stock_info["shares"] <= 0:
            del portfolio[symbol]
            # log.debug(f"Removed {symbol} from portfolio for user {user_key} as shares reached 0.")

        # --- Log Transaktion ---
        transaction = {
            "type": "sell",
            "symbol": symbol,
            "shares": shares_to_sell,
            "price": current_price,
            "total": total_gain,
            "timestamp": datetime.now().isoformat(),
        }
        user_data.setdefault("stock_transactions", []).append(transaction)

        if save_players(players):
            log.info(
                f"User '{user_key}' sold {shares_to_sell} shares of {symbol} @ {current_price:.2f}."
            )
            return (
                jsonify(
                    {
                        "message": f"{shares_to_sell} aktier af {symbol} solgt!",
                        # Returner opdaterede data
                        "portfolio": user_data.get("portfolio", {}),
                        "balance": user_data.get("balance", 0.0),
                        "transaction": transaction,
                    }
                ),
                200,
            )
        else:
            log.error(f"Failed to save players data after stock sale for {user_key}.")
            # Bemærk: In-memory ændringer ikke gemt.
            return jsonify({"error": "Kunne ikke gemme aktiesalg. Prøv igen."}), 500

    except Exception as e:
        log.exception(f"Fejl i sell_stock for user {user_key}: {e}")
        return jsonify({"error": "Intern serverfejl ved salg af aktie"}), 500


# /stocks/api/portfolio
@stocks_bp.route("/api/portfolio", methods=["GET"])
@login_required  # Aktiveret - Kræver login
def portfolio_api():
    """Returnerer brugerens aktie portefølje og relateret info."""
    user_id = current_user.id  # Use the integer ID from SQLAlchemy User
    username = current_user.username

    try:
        # Access data directly from the SQLAlchemy current_user object
        portfolio_data = (
            current_user.portfolio if current_user.portfolio is not None else {}
        )

        # Determine stock_balance: use user.settings['stock_balance'] if available, else user.balance
        stock_balance_setting = (
            current_user.settings.get("stock_balance")
            if current_user.settings and isinstance(current_user.settings, dict)
            else None
        )
        balance = (
            stock_balance_setting
            if stock_balance_setting is not None
            else (current_user.balance if current_user.balance is not None else 0.0)
        )

        transactions = (
            current_user.stock_transactions
            if current_user.stock_transactions is not None
            else []
        )
        # Ensure transactions is a list, and take the last 20
        if not isinstance(transactions, list):
            log.warning(
                f"User {username} stock_transactions is not a list (type: {type(transactions)}). Defaulting to empty list."
            )
            transactions = []
        recent_transactions = transactions[-20:]

        # Pass the portfolio dictionary to calculate_portfolio_value
        # The stock_data function is defined in this file and can be passed directly
        portfolio_value = calculate_portfolio_value(
            portfolio_data, get_current_price_func=stock_data
        )

        return jsonify(
            {
                "username": username,
                "balance": balance,
                "portfolio": portfolio_data,
                "portfolio_value": portfolio_value,
                "total_value": balance + portfolio_value,
                "transactions": recent_transactions,
            }
        )
    except Exception as e:
        log.exception(f"Fejl i portfolio_api for user {username} (ID: {user_id}): {e}")
        return jsonify({"error": "Intern serverfejl ved hentning af portefølje"}), 500


# /stocks/api/leaderboard
@stocks_bp.route("/api/leaderboard", methods=["GET"])
@login_required  # Aktiveret - Gør leaderboard kun tilgængelig for loggede brugere
def aktiedyst_leaderboard_api():
    """Returnerer leaderboard for aktiedyst baseret på total værdi."""
    try:
        players = load_players()
        leaderboard = []

        # Hent default avatar URL én gang uden for løkken
        default_avatar_url = url_for("static", filename=Config.DEFAULT_AVATAR)

        for username, user_data in players.items():
            # Vigtigt: Check om user_data er en dictionary for at undgå fejl
            if isinstance(user_data, dict) and not user_data.get(
                "is_admin", False
            ):  # Exclude admin?
                # Genbrug beregning (kræver utils funktion er effektiv)
                # NB: Igen, dette kalder potentielt stock_data mange gange
                portfolio_value = calculate_portfolio_value(
                    user_data, stock_data_func=stock_data
                )
                total_value = float(user_data.get("balance", 0.0)) + portfolio_value
                avatar_filename = user_data.get("avatar")  # Hent gemt filnavn
                # Byg fuld URL eller brug default
                avatar_url = (
                    url_for("static", filename=f"avatars/{avatar_filename}")
                    if avatar_filename
                    else default_avatar_url
                )

                leaderboard.append(
                    {
                        "username": username,  # Eller hent et 'display_name' hvis det findes?
                        "total_value": round(total_value, 2),
                        "avatar": avatar_url,  # Send fuld URL til avatar
                    }
                )

        # Sorter efter total værdi, højest først
        leaderboard.sort(key=lambda x: x["total_value"], reverse=True)

        # Tilføj rank?
        for rank, player in enumerate(leaderboard, start=1):
            player["rank"] = rank

        log.info(f"User '{current_user.get_id()}' requested Aktiedyst leaderboard.")
        return jsonify({"leaderboard": leaderboard})
    except Exception as e:
        log.exception(f"Fejl i aktiedyst_leaderboard_api: {e}")
        return jsonify({"error": "Intern serverfejl ved hentning af leaderboard"}), 500


# --- HTML Page Route ---
# TODO: Aktiedyst HTML side (dashboard)
# /stocks/ (Dashboard siden)
@stocks_bp.route("/")
@login_required  # Aktiveret - Kræver login
def aktiedyst_dashboard_page():
    """Viser aktiedystens hovedside for den loggede bruger."""
    user_key = current_user.get_id()

    try:
        context = get_common_context()  # Fra utils - inkluderer brugerinfo mm.

        players = load_players()
        user_data = players.get(user_key)

        if not user_data:
            # Burde ikke ske hvis logget ind, men håndter for en sikkerheds skyld
            log.error(f"User '{user_key}' logged in but data not found for dashboard.")
            # Redirect til en fejlside eller logout?
            return redirect(url_for("main.index"))  # Tilbage til forsiden

        # Genbrug portefølje beregning (stadig potentielt langsomt)
        portfolio_value = calculate_portfolio_value(
            user_data, stock_data_func=stock_data
        )
        balance = float(user_data.get("balance", 0.0))
        portfolio_data = user_data.get("portfolio", {})
        transactions = user_data.get("stock_transactions", [])[
            -10:
        ]  # Kun de seneste 10

        # Opdater context med aktiedyst specifik data
        context.update(
            {
                "page_title": "Aktiedyst",  # Tilføj en sidetitel?
                "active_page": "aktiedyst",
                "user_balance": balance,
                "portfolio": portfolio_data,
                "portfolio_value": portfolio_value,
                "total_value": balance + portfolio_value,
                "transactions": transactions,
                # Hent leaderboard data (evt. fra et API kald?) for at vise på siden?
                # leaderboard_response = aktiedyst_leaderboard_api()
                # leaderboard_data = leaderboard_response.get_json().get('leaderboard', []) if leaderboard_response.status_code == 200 else []
                # "leaderboard": leaderboard_data[:5] # Top 5 f.eks.
            }
        )

        # Antager template findes her: templates/aktiedyst/dashboard.html
        # Bedre at organisere templates i undermapper
        return render_template("aktiedyst_dashboard.html", **context)
    except Exception as e:
        # Brug user_key i log
        log.exception(f"Error loading aktiedyst dashboard for user '{user_key}': {e}")
        # Brug den standard 500 fejlside
        return render_template("errors/500.html"), 500
