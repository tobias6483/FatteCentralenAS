# Database Review for Sports & Aktiedyst Models

## 1. Current Model Analysis

### Sports Models
The sports models are well-structured with a hierarchy matching the domain:

1. **SportCategory**
   - Represents broad categories like "Football", "Basketball"
   - Has fields for name, slug, description, icon
   - One-to-many relationship with League

2. **League**
   - Represents specific leagues like "Premier League", "NBA"
   - Contains name, slug, logo_url, country, active status
   - Belongs to a SportCategory
   - One-to-many relationship with SportEvent

3. **Team**
   - Represents teams participating in leagues
   - Contains name, short_name, slug, logo_url, country
   - Has backward relationships to SportEvent as home or away team

4. **SportEvent**
   - Represents a single match/game
   - Contains details like commence_time, status, scores by period
   - References league, home_team, away_team
   - Has JSON fields for venue_info, statistics, timeline_events, lineups
   - One-to-many relationship with SportOutcome
   - One-to-many relationship with GameSession

5. **SportOutcome**
   - Represents betting outcomes for events
   - Contains bookmaker, market_key, name, price, point
   - Belongs to a SportEvent

6. **GameSession**
   - Represents a user-created betting session
   - Can be linked to a SportEvent
   - Contains game-specific details in coupon_details JSON field

### Aktiedyst Models
The Aktiedyst functionality is primarily contained within JSON fields in the User model:

1. **User Model JSON Fields for Aktiedyst:**
   - portfolio (JSON): Portfolio holdings
   - stock_transactions (JSON): Transaction history
   - watchlist (JSON): Tracked stocks
   - dividends (JSON): Dividend payments
   - settings (JSON): User-specific settings

## 2. Recommendations for Model Improvements

### Sports Models

1. **SportCategory**
   - Add `sort_order` field (already present)
   - Add `icon_svg_name` field: For more flexibility in icon display
   - ✅ The model is generally well-structured

2. **League**
   - Add `season` field: Current season identifier
   - Add `standings` JSON field: Current league standings
   - Add `type` field: League type (e.g., "League", "Cup", "Tournament")

3. **Team**
   - Add `venue_name` and `venue_capacity` fields: Home stadium information
   - Add `founded_year` field: Year the team was founded
   - Add `coach_name` field: Current coach/manager

4. **SportEvent**
   - Add `winner` field: 'home', 'away', or 'draw'
   - Add `last_update_time` field: To track when last updated (helpful for cache validation)
   - Add `weather_conditions` JSON field: For outdoor sports
   - Add `betting_status` field: Whether the event is open for betting

5. **SportOutcome**
   - Add `status` field: 'active', 'settled', 'void', etc.
   - Add `result` field: Whether the outcome was correct ('win', 'loss', 'void')
   - Add `public_visible` field: To control visibility of certain markets/odds

### Aktiedyst Models
Rather than using purely JSON fields in the User model, create dedicated models:

1. **New Model: Stock**
   ```python
   class Stock(db.Model):
       __tablename__ = 'stock'
       id = db.Column(db.Integer, primary_key=True)
       symbol = db.Column(db.String(20), unique=True, nullable=False, index=True)
       company_name = db.Column(db.String(150), nullable=False)
       description = db.Column(db.Text, nullable=True)
       sector = db.Column(db.String(100), nullable=True)
       industry = db.Column(db.String(100), nullable=True)
       logo_url = db.Column(db.String(512), nullable=True)
       last_price = db.Column(db.Float, nullable=True)
       last_update = db.Column(db.DateTime(timezone=True), nullable=True)
       is_active = db.Column(db.Boolean, default=True, nullable=False)

       # Relationships
       price_history = db.relationship('StockPrice', back_populates='stock', lazy='dynamic', cascade="all, delete-orphan")
       portfolio_items = db.relationship('PortfolioItem', back_populates='stock', lazy='dynamic')
       transactions = db.relationship('StockTransaction', back_populates='stock', lazy='dynamic')
   ```

2. **New Model: StockPrice**
   ```python
   class StockPrice(db.Model):
       __tablename__ = 'stock_price'
       id = db.Column(db.Integer, primary_key=True)
       stock_id = db.Column(db.Integer, db.ForeignKey('stock.id'), nullable=False, index=True)
       date = db.Column(db.Date, nullable=False, index=True)
       timestamp = db.Column(db.DateTime(timezone=True), nullable=False)
       open_price = db.Column(db.Float, nullable=False)
       high_price = db.Column(db.Float, nullable=False)
       low_price = db.Column(db.Float, nullable=False)
       close_price = db.Column(db.Float, nullable=False)
       volume = db.Column(db.BigInteger, nullable=True)

       # Relationships
       stock = db.relationship('Stock', back_populates='price_history')

       # Composite index for efficient queries
       __table_args__ = (db.UniqueConstraint('stock_id', 'date', name='unique_stock_date'),)
   ```

3. **New Model: Portfolio**
   ```python
   class Portfolio(db.Model):
       __tablename__ = 'portfolio'
       id = db.Column(db.Integer, primary_key=True)
       user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
       name = db.Column(db.String(100), nullable=False)
       description = db.Column(db.Text, nullable=True)
       created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
       last_updated = db.Column(db.DateTime(timezone=True), nullable=True)
       cash_balance = db.Column(db.Float, default=10000.0, nullable=False)  # Starting cash

       # Relationships
       user = db.relationship('User', backref=db.backref('portfolios', lazy='dynamic'))
       items = db.relationship('PortfolioItem', back_populates='portfolio', lazy='dynamic', cascade="all, delete-orphan")
   ```

4. **New Model: PortfolioItem**
   ```python
   class PortfolioItem(db.Model):
       __tablename__ = 'portfolio_item'
       id = db.Column(db.Integer, primary_key=True)
       portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolio.id'), nullable=False, index=True)
       stock_id = db.Column(db.Integer, db.ForeignKey('stock.id'), nullable=False, index=True)
       quantity = db.Column(db.Integer, nullable=False)
       average_purchase_price = db.Column(db.Float, nullable=False)
       last_updated = db.Column(db.DateTime(timezone=True), nullable=True)

       # Relationships
       portfolio = db.relationship('Portfolio', back_populates='items')
       stock = db.relationship('Stock', back_populates='portfolio_items')

       # Composite index for efficient queries
       __table_args__ = (db.UniqueConstraint('portfolio_id', 'stock_id', name='unique_portfolio_stock'),)
   ```

5. **New Model: StockTransaction**
   ```python
   class StockTransaction(db.Model):
       __tablename__ = 'stock_transaction'
       id = db.Column(db.Integer, primary_key=True)
       portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolio.id'), nullable=False, index=True)
       stock_id = db.Column(db.Integer, db.ForeignKey('stock.id'), nullable=False, index=True)
       transaction_type = db.Column(db.String(20), nullable=False)  # 'buy', 'sell', 'dividend'
       quantity = db.Column(db.Integer, nullable=False)
       price_per_share = db.Column(db.Float, nullable=False)
       total_amount = db.Column(db.Float, nullable=False)
       timestamp = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
       notes = db.Column(db.Text, nullable=True)

       # Relationships
       portfolio = db.relationship('Portfolio', backref=db.backref('transactions', lazy='dynamic'))
       stock = db.relationship('Stock', back_populates='transactions')
   ```

6. **New Model: StockOrder**
   ```python
   class StockOrder(db.Model):
       __tablename__ = 'stock_order'
       id = db.Column(db.Integer, primary_key=True)
       portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolio.id'), nullable=False, index=True)
       stock_id = db.Column(db.Integer, db.ForeignKey('stock.id'), nullable=False, index=True)
       order_type = db.Column(db.String(20), nullable=False)  # 'buy', 'sell'
       order_status = db.Column(db.String(20), nullable=False, index=True)  # 'pending', 'filled', 'cancelled', etc.
       quantity = db.Column(db.Integer, nullable=False)
       price_limit = db.Column(db.Float, nullable=True)  # NULL for market orders
       created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
       filled_at = db.Column(db.DateTime(timezone=True), nullable=True)
       filled_price = db.Column(db.Float, nullable=True)

       # Relationships
       portfolio = db.relationship('Portfolio', backref=db.backref('orders', lazy='dynamic'))
       stock = db.relationship('Stock', backref=db.backref('orders', lazy='dynamic'))
   ```

7. **User Model Modification**
   - Remove the JSON fields for Aktiedyst (keep settings JSON for general user settings)
   - Add relationships to the new models

## 3. Migration Strategy

1. **For Sports Models:**
   - The current models are well-structured and complete
   - Only minor additions needed (new fields as listed above)
   - Create a database migration to add the recommended fields

2. **For Aktiedyst Models:**
   - Create a phased migration:
     a) Create the new database models
     b) Add a data migration script to convert JSON data to relational models
     c) Test both systems in parallel
     d) Once verified, remove redundant JSON fields from User model

## 4. Conclusion

The Sports models are already well-structured and require only minor enhancements. The Aktiedyst functionality would benefit significantly from dedicated relational models rather than embedded JSON, as this would improve query capabilities, enforce referential integrity, and enable more complex features in the future.
