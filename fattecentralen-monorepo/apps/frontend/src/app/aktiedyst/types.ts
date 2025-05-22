export interface Competition {
    id: string;
    name: string;
    participants?: number;
    prize: string;
    endDate?: string;
    startDate?: string;
    userRank?: number; // Tilføjet for "Mine Dyster" og "Resultater"
    userPortfolioValue?: number; // Tilføjet for "Mine Dyster"
    winner?: string; // Tilføjet for "Resultater"
}

export interface AktiedystData {
    ongoingCompetitions: Competition[];
    upcomingCompetitions: Competition[];
    myCompetitions?: Competition[]; // Tilføjet for "Mine Dyster" tab
    pastCompetitions?: Competition[]; // Tilføjet for "Resultater" tab
    userPortfolioValue: number;
    userRank: number;
    totalParticipantsThisMonth: number;
    cashBalance?: number; // Added for economic status
    todaysProfitLoss?: number; // Added for economic status
    todaysProfitLossPercentage?: number; // Added for economic status
    portfolios?: Portfolio[]; // Added for portfolio management
    holdings?: Holding[]; // Added for holdings display
    watchlist?: WatchlistItem[]; // Added for watchlist
    advancedOrders?: AdvancedOrder[]; // Added for advanced orders
    analysis?: AnalysisData; // Added for analysis and charts
    dividends?: Dividend[]; // Added for dividend tracking
}

// New interface for Portfolio
export interface Portfolio {
    id: string;
    name: string;
    currency: string;
    totalValue: number;
    holdingsCount: number;
    // Potentially add creation date, last updated, etc.
}

// New interface for Holding (individual asset in a portfolio)
export interface Holding {
    id: string;
    type: "Aktie" | "ETF" | "Crypto" | "Indeks" | "Råvare"; // Asset type
    symbol: string;
    name: string;
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
    marketValue: number;
    profitOrLoss: number;
    profitOrLossPercentage: number;
    currency: string; // Currency of the holding
    portfolioId?: string; // Optional: if holdings are globally managed and filtered
    // Potentially add last trade date, notes, etc.
}

// New interface for Watchlist Item
export interface WatchlistItem {
    symbol: string;
    name: string;
    lastPrice: number;
    currency: string;
    changePercent: number;    // e.g., 1.5 for +1.5%
    changeAbsolute: number;   // e.g., 2.67 for +2.67 DKK/USD
    note?: string;
    // Potentially add: exchange, type (stock, crypto), last updated timestamp
}

export interface AdvancedOrderFormData {
    symbol: string;
    orderType: 'stop-loss' | 'take-profit' | 'limit-buy' | 'limit-sell'; // Removed ''
    price: number;
    quantity: number;
}

export interface AdvancedOrder {
    id: string;
    createdAt: string; // ISO date string
    symbol: string;
    orderType: 'stop-loss' | 'take-profit' | 'limit-buy' | 'limit-sell';
    price: number;
    quantity: number;
    status: 'active' | 'pending' | 'triggered' | 'cancelled' | 'partially-filled'; // Example statuses
    // Potentially add: filledQuantity, filledPrice, expiryDate
}

export interface AnalysisFormData {
    symbol: string;
    indicator: 'price' | 'rsi' | 'macd' | 'bollinger' | 'sma' | 'ema' | ''; // Added 'ema' to match component
    interval: TimeInterval; // Using the new TimeInterval type
    // Potentially add: dateRangeStart, dateRangeEnd
}

export type TimeInterval = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'MAX'; // Added '3M' and 'YTD'

export interface ChartDataPoint {
    date: string; // or Date object
    value: number;
    // Potentially add other values like volume, open, high, low, close for candlestick charts
}

export interface AnalysisData {
    symbol: string;
    indicator?: 'price' | 'rsi' | 'macd' | 'bollinger' | 'sma' | ''; // Added 'sma', allow '' or undefined
    interval?: TimeInterval;
    data: ChartDataPoint[];
    // Potentially add: analysisSummary, buySellSignals
}

// New interface for Dividend
export interface Dividend {
    id: string;
    date: string; // ISO date string for when the dividend was received
    symbol: string;
    name: string; // Name of the asset
    amount: number; // Total dividend amount received
    currency: string;
    perShare: number; // Dividend amount per share
    quantity: number; // Number of shares held that paid dividend
    portfolioId?: string; // Optional: if dividends are tied to a specific portfolio
}
