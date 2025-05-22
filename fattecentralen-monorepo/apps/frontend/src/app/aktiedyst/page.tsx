"use client";

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDown, ArrowUp, BarChart3, Briefcase, CalendarClock, DollarSign, History, Info, ListChecks, PlusCircle, SearchIcon, Star, TrendingUp, Trophy, UserCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from 'react';
import ActiveAdvancedOrdersTable from './components/ActiveAdvancedOrdersTable';
import AdvancedOrderForm from './components/AdvancedOrderForm';
import AnalysisSelectionForm from './components/AnalysisSelectionForm';
import { AssetInfoDisplay } from './components/AssetInfoDisplay';
import { AssetSearchForm } from './components/AssetSearchForm';
import ChartDisplay from './components/ChartDisplay';
import CompetitionCard from './components/CompetitionCard';
import { CreatePortfolioForm } from './components/CreatePortfolioForm';
import { HoldingsTable } from './components/HoldingsTable';
import { PortfolioFilterDropdown } from './components/PortfolioFilterDropdown';
import { PortfolioList } from './components/PortfolioList';
import { QuickTradeForm } from './components/QuickTradeForm';
import { WatchlistAddItemForm } from './components/WatchlistAddItemForm';
import { WatchlistTable } from './components/WatchlistTable';
import { AdvancedOrder, AdvancedOrderFormData, AktiedystData, AnalysisData, AnalysisFormData, ChartDataPoint, Competition, Dividend, Holding, Portfolio, WatchlistItem } from './types';

const mockAktiedystData: AktiedystData = {
    ongoingCompetitions: [
        { id: 'comp1', name: 'Månedsdysten - Juli', participants: 150, prize: '1000 kr', endDate: '2024-07-31' },
        { id: 'comp2', name: 'Sommer Special', participants: 75, prize: '500 kr + Merch', endDate: '2024-08-15' },
    ],
    upcomingCompetitions: [
        { id: 'comp3', name: 'Efterårsdysten', startDate: '2024-09-01', prize: 'Eksklusivt Badge' },
    ],
    myCompetitions: [
        { id: 'comp1', name: 'Månedsdysten - Juli', participants: 150, prize: '1000 kr', endDate: '2024-07-31', userRank: 12, userPortfolioValue: 115000 },
        { id: 'comp4', name: 'Weekend Sprint', participants: 50, prize: '250 kr', endDate: '2025-05-26', userRank: 3, userPortfolioValue: 105000 },
    ],
    pastCompetitions: [
        { id: 'comp0', name: 'Forårsdysten - April', participants: 120, prize: '1000 kr', endDate: '2024-04-30', userRank: 5, winner: 'Bruger123' },
    ],
    userPortfolioValue: 12500.75,
    userRank: 23,
    totalParticipantsThisMonth: 150,
    cashBalance: 7500.50,
    todaysProfitLoss: 120.25,
    todaysProfitLossPercentage: 0.97,
    portfolios: [
        { id: 'pf1', name: 'Min Primære Portefølje', currency: 'DKK', totalValue: 125000, holdingsCount: 3 },
        { id: 'pf2', name: 'Teknologi Fokus', currency: 'USD', totalValue: 75000, holdingsCount: 2 },
        { id: 'pf3', name: 'Grøn Energi', currency: 'EUR', totalValue: 50000, holdingsCount: 1 },
    ],
    holdings: [
        { id: 'h1', type: 'Aktie', symbol: 'AAPL', name: 'Apple Inc.', quantity: 10, avgBuyPrice: 150, currentPrice: 170, marketValue: 1700, profitOrLoss: 200, profitOrLossPercentage: 13.33, currency: 'USD', portfolioId: 'pf2' },
        { id: 'h2', type: 'Aktie', symbol: 'MSFT', name: 'Microsoft Corp.', quantity: 5, avgBuyPrice: 300, currentPrice: 330, marketValue: 1650, profitOrLoss: 150, profitOrLossPercentage: 10, currency: 'USD', portfolioId: 'pf2' },
        { id: 'h3', type: 'Aktie', symbol: 'VEST.CO', name: 'Vestas Wind Systems', quantity: 100, avgBuyPrice: 200, currentPrice: 210, marketValue: 21000, profitOrLoss: 1000, profitOrLossPercentage: 5, currency: 'DKK', portfolioId: 'pf1' },
        { id: 'h4', type: 'Aktie', symbol: 'NVO.CO', name: 'Novo Nordisk A/S', quantity: 20, avgBuyPrice: 600, currentPrice: 650, marketValue: 13000, profitOrLoss: 1000, profitOrLossPercentage: 8.33, currency: 'DKK', portfolioId: 'pf1' },
        { id: 'h5', type: 'ETF', symbol: 'IXN.DE', name: 'iShares Global Tech', quantity: 50, avgBuyPrice: 80, currentPrice: 85, marketValue: 4250, profitOrLoss: 250, profitOrLossPercentage: 6.25, currency: 'EUR', portfolioId: 'pf3' },
        { id: 'h6', type: 'Aktie', symbol: 'DSV.CO', name: 'DSV A/S', quantity: 10, avgBuyPrice: 1200, currentPrice: 1150, marketValue: 11500, profitOrLoss: -500, profitOrLossPercentage: -4.17, currency: 'DKK', portfolioId: 'pf1' },
    ],
    watchlist: [
        {
            symbol: "MSFT",
            name: "Microsoft Corp.",
            lastPrice: 330.50,
            currency: "USD",
            changePercent: 0.75,
            changeAbsolute: 2.46,
            note: "Venter på entry under $320",
        },
        {
            symbol: "ORSTED.CO",
            name: "Ørsted A/S",
            lastPrice: 450.20,
            currency: "DKK",
            changePercent: -1.10,
            changeAbsolute: -5.00,
            note: "Grøn energi, langsigtet.",
        },
        {
            symbol: "ETH-USD",
            name: "Ethereum",
            lastPrice: 2050.00,
            currency: "USD",
            changePercent: 2.50,
            changeAbsolute: 50.00,
        },
    ],
    advancedOrders: [
        { id: 'ao1', createdAt: '2024-07-28T10:00:00Z', symbol: 'AAPL', orderType: 'stop-loss', price: 165.00, quantity: 10, status: 'active' },
        { id: 'ao2', createdAt: '2024-07-27T14:30:00Z', symbol: 'MSFT', orderType: 'limit-buy', price: 320.00, quantity: 5, status: 'active' },
        { id: 'ao3', createdAt: '2024-07-26T09:15:00Z', symbol: 'NVO.CO', orderType: 'take-profit', price: 700.00, quantity: 15, status: 'pending' },
        { id: 'ao4', createdAt: '2024-07-25T16:45:00Z', symbol: 'VEST.CO', orderType: 'limit-sell', price: 220.00, quantity: 50, status: 'triggered' },
        { id: 'ao5', createdAt: '2024-07-24T11:00:00Z', symbol: 'ORSTED.CO', orderType: 'stop-loss', price: 400.00, quantity: 20, status: 'cancelled' },
    ],
    analysis: {
        symbol: 'AAPL',
        indicator: 'sma', // Changed from SMA to sma
        interval: '1D',
        data: [
            { date: '2024-07-01', value: 160 },
            { date: '2024-07-02', value: 162 },
            { date: '2024-07-03', value: 161 },
            { date: '2024-07-04', value: 163 },
            { date: '2024-07-05', value: 165 },
            { date: '2024-07-08', value: 168 },
            { date: '2024-07-09', value: 170 },
            { date: '2024-07-10', value: 169 },
            { date: '2024-07-11', value: 172 },
            { date: '2024-07-12', value: 175 },
            { date: '2024-07-15', value: 173 },
            { date: '2024-07-16', value: 177 },
            { date: '2024-07-17', value: 176 },
            { date: '2024-07-18', value: 178 },
            { date: '2024-07-19', value: 180 },
        ]
    },
    dividends: [
        { id: 'div1', date: '2024-07-15', symbol: 'AAPL', name: 'Apple Inc.', amount: 50.00, currency: 'USD', perShare: 0.25, quantity: 200, portfolioId: 'pf2' },
        { id: 'div2', date: '2024-07-20', symbol: 'MSFT', name: 'Microsoft Corp.', amount: 75.00, currency: 'USD', perShare: 0.50, quantity: 150, portfolioId: 'pf2' },
        { id: 'div3', date: '2024-06-10', symbol: 'NVO.CO', name: 'Novo Nordisk A/S', amount: 120.00, currency: 'DKK', perShare: 2.00, quantity: 60, portfolioId: 'pf1' },
        { id: 'div4', date: '2024-05-05', symbol: 'VEST.CO', name: 'Vestas Wind Systems', amount: 200.00, currency: 'DKK', perShare: 1.00, quantity: 200, portfolioId: 'pf1' },
    ]
};

export default function AktiedystPage() {
    const myCompetitions = mockAktiedystData.myCompetitions || [];
    const pastCompetitions = mockAktiedystData.pastCompetitions || [];
    const ongoingCompetitions = mockAktiedystData.ongoingCompetitions || [];
    const upcomingCompetitions = mockAktiedystData.upcomingCompetitions || [];

    const [isAssetDetailsVisible, setIsAssetDetailsVisible] = useState(true);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(
        mockAktiedystData.portfolios && mockAktiedystData.portfolios.length > 0 ? mockAktiedystData.portfolios[0].id : null
    );

    // State for watchlist items
    const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>(
        mockAktiedystData.watchlist || []
    );

    // State for advanced orders
    const [advancedOrders, setAdvancedOrders] = useState<AdvancedOrder[]>(
        mockAktiedystData.advancedOrders || []
    );
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [ownedSymbolsForOrders, setOwnedSymbolsForOrders] = useState<string[]>(
        mockAktiedystData.holdings?.map(h => h.symbol) || [] // Example: derive from holdings
    );

    // State for Analysis & Charts
    const [analysisFormData, setAnalysisFormData] = useState<AnalysisFormData>(() => ({
        symbol: mockAktiedystData.analysis?.symbol || (mockAktiedystData.holdings && mockAktiedystData.holdings.length > 0 ? mockAktiedystData.holdings[0].symbol : 'AAPL'),
        indicator: (mockAktiedystData.analysis?.indicator as AnalysisFormData['indicator']) || 'price', // Ensure this is a valid value like 'price'
        interval: mockAktiedystData.analysis?.interval || '1D',
    }));
    const [chartData, setChartData] = useState<AnalysisData | null>(() =>
        mockAktiedystData.analysis ?
            { ...mockAktiedystData.analysis, indicator: (mockAktiedystData.analysis.indicator as AnalysisFormData['indicator']) || 'price' } // Ensure this is a valid value
            : null
    );
    const [isFetchingChartData, setIsFetchingChartData] = useState(false);

    const [dividends, setDividends] = useState<Dividend[]>(mockAktiedystData.dividends || []);

    // Calculate dividend summaries
    const dividendSummary = dividends.reduce((acc, dividend) => {
        if (!acc[dividend.currency]) {
            acc[dividend.currency] = { totalAmount: 0, count: 0 };
        }
        acc[dividend.currency].totalAmount += dividend.amount;
        acc[dividend.currency].count += 1;
        return acc;
    }, {} as Record<string, { totalAmount: number; count: number }>);

    const grandTotalDividends = Object.values(dividendSummary).reduce((sum, curr) => sum + curr.totalAmount, 0); // Note: This assumes all are convertible or for display purposes only.

    const availableSymbolsForAnalysis = Array.from(new Set([
        ...(mockAktiedystData.holdings?.map(h => h.symbol) || []),
        ...(mockAktiedystData.watchlist?.map(w => w.symbol) || []),
        'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVO.CO', 'VEST.CO', // Add some popular/relevant symbols
        ...(mockAktiedystData.analysis?.symbol ? [mockAktiedystData.analysis.symbol] : []),
    ].filter(Boolean) as string[]));

    const filteredHoldings = mockAktiedystData.holdings?.filter((h: Holding) => h.portfolioId === selectedPortfolioId) || [];
    const currentPortfolios = mockAktiedystData.portfolios || [];

    // Watchlist Handlers
    const handleAddToWatchlist = (symbol: string, note?: string) => {
        // Basic validation: check if symbol already exists
        if (watchlistItems.find(item => item.symbol === symbol)) {
            // For now, just log or perhaps show a toast notification in a real app
            console.warn(`Symbol ${symbol} is already in the watchlist.`);
            return;
        }
        const newItem: WatchlistItem = {
            symbol,
            name: `${symbol} Name Placeholder`, // In a real app, you'd fetch this
            lastPrice: Math.random() * 1000, // Placeholder price
            currency: "USD", // Placeholder currency
            changePercent: (Math.random() * 5 - 2.5), // Random change +/- 2.5%
            changeAbsolute: (Math.random() * 10 - 5), // Random change +/- 5
            note,
        };
        setWatchlistItems(prevItems => [...prevItems, newItem]);
    };

    const handleRemoveFromWatchlist = (symbol: string) => {
        setWatchlistItems(prevItems => prevItems.filter(item => item.symbol !== symbol));
    };

    const handleTradeWatchlistItem = (symbol: string) => {
        // Placeholder: Could navigate to a trade page or open a trade modal
        console.log(`Trade action for: ${symbol}`);
        // Potentially set state to show AssetSearchForm/QuickTradeForm with this symbol
    };

    const handleViewChartWatchlistItem = (symbol: string) => {
        // Placeholder: Could navigate to an analysis/chart page or tab
        console.log(`View chart for: ${symbol}`);
        // Potentially switch to "Analyse & Grafer" tab and set symbol
        setAnalysisFormData(prev => ({ ...prev, symbol: symbol }));
    };

    // Advanced Order Handlers
    const handleCreateAdvancedOrder = (data: AdvancedOrderFormData) => {
        console.log("Creating advanced order:", data);
        setIsSubmittingOrder(true);
        // Simulate API call
        setTimeout(() => {
            const newOrder: AdvancedOrder = {
                id: `ao${advancedOrders.length + 1}`,
                createdAt: new Date().toISOString(),
                status: 'active',
                ...data,
            };
            setAdvancedOrders(prevOrders => [newOrder, ...prevOrders]);
            setIsSubmittingOrder(false);
            // Potentially show a success toast
        }, 1500);
    };

    const handleCancelAdvancedOrder = (orderId: string) => {
        console.log("Cancelling advanced order:", orderId);
        // Simulate API call
        setAdvancedOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId ? { ...order, status: 'cancelled' } : order
            )
        );
        // Potentially show a success toast
    };

    // Analysis & Charts Handlers
    const handleAnalysisFormSubmit = (data: AnalysisFormData) => {
        console.log("Fetching analysis data for:", data);
        setAnalysisFormData(data);
        setIsFetchingChartData(true);
        // Simulate API call
        setTimeout(() => {
            const baseValue = 50 + Math.random() * 150;
            const trendStrength = (Math.random() - 0.5) * 5;
            const volatility = 0.5 + Math.random() * 2;

            const today = new Date(); // Define 'today' once, outside the loop

            const newDataPoints: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => {
                const pointDate = new Date(today); // Create a new Date object for each point, initialized to 'today'

                if (data.interval === 'YTD') {
                    const yearStartDate = new Date(today.getFullYear(), 0, 1);
                    const totalDaysInYTD = Math.floor((today.getTime() - yearStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    // Distribute 30 points (i from 0 to 29) across totalDaysInYTD.
                    // Point i=0 is yearStartDate, point i=29 is today.
                    const dayOffsetForPoint = Math.round((i / 29) * (totalDaysInYTD - 1));
                    pointDate.setTime(yearStartDate.getTime());
                    pointDate.setDate(yearStartDate.getDate() + dayOffsetForPoint);
                } else {
                    let spanInDays;
                    switch (data.interval) {
                        case '1D': spanInDays = 1; break;
                        case '5D': spanInDays = 5; break;
                        case '1M': spanInDays = 30; break;
                        case '3M': spanInDays = 90; break;
                        case '1Y': spanInDays = 365; break;
                        default:
                            console.warn(`Unknown interval: ${data.interval}, defaulting to 30 days span.`);
                            spanInDays = 30;
                    }
                    // For point i (0=oldest, 29=newest), calculate how many days back from 'today' it is.
                    // (29-i) is index from newest (0 for i=29) to oldest (29 for i=0)
                    // Proportion into the past is ((29-i) / 29)
                    const daysToSubtract = Math.round(spanInDays * ((29 - i) / 29));
                    pointDate.setDate(today.getDate() - daysToSubtract);
                }

                let value = baseValue + i * trendStrength + (Math.random() - 0.5) * 10 * volatility;
                // Apply indicator-based modification (simplified)
                if (data.indicator === 'price') value += Math.sin(i / 5) * 5 * volatility;
                else if (data.indicator === 'rsi') value = 50 + Math.sin(i / 3) * 20 * volatility;
                else if (data.indicator === 'macd') value += Math.cos(i / 6) * 7 * volatility - Math.sin(i / 3) * 3 * volatility;
                else if (data.indicator === 'bollinger') value += Math.cos(i / 4) * 8 * volatility;
                // Note: 'sma' and 'ema' indicators are typed but not implemented in this mock logic

                return {
                    date: pointDate.toISOString().split('T')[0],
                    value: Math.max(10, parseFloat(value.toFixed(2))),
                };
            });

            const newChartData: AnalysisData = {
                symbol: data.symbol,
                indicator: data.indicator as AnalysisData['indicator'], // Cast to ensure type compatibility
                interval: data.interval,
                data: newDataPoints,
            };
            setChartData(newChartData);
            setIsFetchingChartData(false);
        }, 1500);
    };


    return (
        <DashboardLayout>
            <div className="container mx-auto py-8 px-4 md:px-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <div className="flex items-center">
                        <Trophy className="h-10 w-10 text-primary mr-3" />
                        <div>
                            <h1 className="text-3xl font-bold">Aktiedyst</h1>
                            <p className="text-muted-foreground">Konkurrér og vind præmier med din aktieportefølje.</p>
                        </div>
                    </div>
                    <Button size="lg" asChild>
                        <Link href="/aktiedyst/new">
                            <PlusCircle className="mr-2 h-5 w-5" /> Opret Ny Dyst (Admin)
                        </Link>
                    </Button>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 mb-6 bg-card border border-border rounded-md p-1">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 rounded-sm text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"><Trophy className="mr-1.5 h-4 w-4" /> Oversigt</TabsTrigger>
                        <TabsTrigger value="portfolios-holdings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 rounded-sm text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"><Briefcase className="mr-1.5 h-4 w-4" /> Porteføljer</TabsTrigger>
                        <TabsTrigger value="watchlist" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 rounded-sm text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"><Star className="mr-1.5 h-4 w-4" /> Watchlist</TabsTrigger>
                        <TabsTrigger value="advanced-orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 rounded-sm text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"><ListChecks className="mr-1.5 h-4 w-4" /> Ordrer</TabsTrigger>
                        <TabsTrigger value="analysis-charts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 rounded-sm text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"><BarChart3 className="mr-1.5 h-4 w-4" /> Analyse</TabsTrigger>
                        <TabsTrigger value="dividends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 rounded-sm text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"><DollarSign className="mr-1.5 h-4 w-4" /> Dividender</TabsTrigger>
                        <TabsTrigger value="my-competitions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 rounded-sm text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"><UserCheck className="mr-1.5 h-4 w-4" /> Mine Dyster</TabsTrigger>
                        <TabsTrigger value="open-competitions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 rounded-sm text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"><ListChecks className="mr-1.5 h-4 w-4" /> Åbne Dyster</TabsTrigger>
                        <TabsTrigger value="results" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 rounded-sm text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"><History className="mr-1.5 h-4 w-4" /> Resultater</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Kontant Saldo
                                    </CardTitle>
                                    <Wallet className="h-5 w-5 text-primary" />
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <p className="text-3xl font-bold text-foreground">
                                        {mockAktiedystData.cashBalance?.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' }) || 'N/A'}
                                    </p>
                                    <p className="text-xs text-muted-foreground pt-1">
                                        Tilgængelig for handel
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Total Porteføljeværdi
                                    </CardTitle>
                                    <Briefcase className="h-5 w-5 text-primary" />
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <p className="text-3xl font-bold text-primary">
                                        {mockAktiedystData.userPortfolioValue.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
                                    </p>
                                    <p className="text-xs text-muted-foreground pt-1">
                                        Din nuværende placering: #{mockAktiedystData.userRank}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Samlet Resultat (I Dag)
                                    </CardTitle>
                                    {mockAktiedystData.todaysProfitLoss && mockAktiedystData.todaysProfitLoss >= 0 ? (
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                    ) : (
                                        <TrendingUp className="h-5 w-5 text-destructive" /> // Could be TrendingDown if you prefer
                                    )}
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <p className={`text-3xl font-bold ${mockAktiedystData.todaysProfitLoss && mockAktiedystData.todaysProfitLoss >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                        {mockAktiedystData.todaysProfitLoss?.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' }) || 'N/A'}
                                    </p>
                                    <div className={`flex items-center text-xs ${mockAktiedystData.todaysProfitLoss && mockAktiedystData.todaysProfitLoss >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                        {mockAktiedystData.todaysProfitLoss && mockAktiedystData.todaysProfitLoss >= 0 ? (
                                            <ArrowUp className="h-3 w-3 mr-1" />
                                        ) : (
                                            <ArrowDown className="h-3 w-3 mr-1" />
                                        )}
                                        {mockAktiedystData.todaysProfitLossPercentage?.toFixed(2) || '0.00'}% i dag
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="mb-8 bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                            <CardHeader className="px-4 pt-4 pb-3">
                                <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                                    <SearchIcon className="mr-2 h-5 w-5 text-primary" /> Hurtig Søgning & Handel
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <AssetSearchForm />
                                <AssetInfoDisplay isVisible={isAssetDetailsVisible} />
                                {isAssetDetailsVisible && <QuickTradeForm />}
                            </CardContent>
                        </Card>

                        <section className="mb-10">
                            <h3 className="text-xl font-semibold mb-4 text-foreground">Hurtig adgang til dyster</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-lg font-semibold text-foreground mb-3">Igangværende</h4>
                                    {ongoingCompetitions.slice(0, 2).map((comp: Competition) => (
                                        <CompetitionCard key={comp.id} competition={comp} type="open-ongoing" />
                                    ))}
                                    {ongoingCompetitions.length === 0 && <p className="text-sm text-muted-foreground p-4 bg-card border rounded-lg text-center">Ingen igangværende dyster lige nu.</p>}
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-foreground mb-3">Kommende</h4>
                                    {upcomingCompetitions.slice(0, 2).map((comp: Competition) => (
                                        <CompetitionCard key={comp.id} competition={comp} type="open-upcoming" />
                                    ))}
                                    {upcomingCompetitions.length === 0 && <p className="text-sm text-muted-foreground p-4 bg-card border rounded-lg text-center">Ingen kommende dyster annonceret.</p>}
                                </div>
                            </div>
                        </section>

                        <Card className="mt-8 bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                            <CardHeader className="px-4 pt-4 pb-3">
                                <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                                    <Info className="mr-2 h-5 w-5 text-primary" />Hvordan Virker Aktiedysten?
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-3 text-muted-foreground px-4 pb-4">
                                <p><span className="font-semibold text-foreground">1. Startkapital:</span> Du starter med en fiktiv kapital (f.eks. 100.000 kr.) i starten af hver dyst.</p>
                                <p><span className="font-semibold text-foreground">2. Handel:</span> Køb og sælg aktier (baseret på realtidsdata med en lille forsinkelse) for at øge værdien af din portefølje.</p>
                                <p><span className="font-semibold text-foreground">3. Mål:</span> Den deltager med den højeste porteføljeværdi ved dystens afslutning vinder.</p>
                                <p><span className="font-semibold text-foreground">4. Variation:</span> Nogle dyster kan have specifikke regler eller temaer (f.eks. kun grønne aktier).</p>
                                <Link href="/aktiedyst/rules" className="text-primary hover:underline font-medium block pt-2">
                                    Læs fulde regler og FAQ
                                </Link>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* New Tab Content for Portfolios & Holdings */}
                    <TabsContent value="portfolios-holdings">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 space-y-6">
                                <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                    <CardHeader className="px-4 pt-4 pb-3">
                                        <CardTitle className="text-lg font-semibold text-foreground">Opret Ny Portefølje</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4">
                                        <CreatePortfolioForm />
                                    </CardContent>
                                </Card>
                                <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                                        <CardTitle className="text-lg font-semibold text-foreground">Mine Porteføljer</CardTitle>
                                        {currentPortfolios.length > 1 && (
                                            <PortfolioFilterDropdown
                                                portfolios={currentPortfolios}
                                                selectedPortfolioId={selectedPortfolioId}
                                                onSelectPortfolio={setSelectedPortfolioId}
                                            />
                                        )}
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4">
                                        <PortfolioList
                                            portfolios={currentPortfolios}
                                            selectedPortfolioId={selectedPortfolioId}
                                            onSelectPortfolio={setSelectedPortfolioId}
                                        />
                                        {currentPortfolios.length === 0 && (
                                            <p className="text-sm text-muted-foreground p-4 bg-muted border rounded-lg text-center">Du har ingen porteføljer endnu. Opret en for at starte!</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-2">
                                <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                    <CardHeader className="px-4 pt-4 pb-3">
                                        <CardTitle className="text-lg font-semibold text-foreground">
                                            Beholdning for {selectedPortfolioId ? currentPortfolios.find((p: Portfolio) => p.id === selectedPortfolioId)?.name : 'Valgt Portefølje'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4">
                                        {selectedPortfolioId && filteredHoldings.length > 0 ? (
                                            <HoldingsTable holdings={filteredHoldings} />
                                        ) : selectedPortfolioId && filteredHoldings.length === 0 ? (
                                            <p className="text-muted-foreground p-4 bg-muted border rounded-lg text-center">Denne portefølje har ingen beholdninger endnu.</p>
                                        ) : (
                                            <p className="text-muted-foreground p-4 bg-muted border rounded-lg text-center">Vælg en portefølje for at se beholdningen.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Watchlist Tab Content */}
                    <TabsContent value="watchlist">
                        <div className="space-y-6">
                            <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                <CardHeader className="px-4 pt-4 pb-3">
                                    <CardTitle className="text-lg font-semibold text-foreground">Tilføj til Watchlist</CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <WatchlistAddItemForm onAddItem={handleAddToWatchlist} />
                                </CardContent>
                            </Card>
                            <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                <CardHeader className="px-4 pt-4 pb-3">
                                    <CardTitle className="text-lg font-semibold text-foreground">Min Watchlist</CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    {watchlistItems.length > 0 ? (
                                        <WatchlistTable
                                            items={watchlistItems}
                                            onRemoveItem={handleRemoveFromWatchlist}
                                            onTradeItem={handleTradeWatchlistItem}
                                            onViewChart={handleViewChartWatchlistItem}
                                        />
                                    ) : (
                                        <p className="text-sm text-muted-foreground p-4 bg-muted border rounded-lg text-center">Din watchlist er tom. Tilføj aktiver for at følge dem.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Advanced Orders Tab Content */}
                    <TabsContent value="advanced-orders">
                        <div className="space-y-6">
                            <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                <CardHeader className="px-4 pt-4 pb-3">
                                    <CardTitle className="text-lg font-semibold text-foreground">Opret Avanceret Ordre</CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <AdvancedOrderForm
                                        ownedSymbols={ownedSymbolsForOrders}
                                        onSubmit={handleCreateAdvancedOrder}
                                        isLoading={isSubmittingOrder}
                                    />
                                </CardContent>
                            </Card>
                            <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                <CardHeader className="px-4 pt-4 pb-3">
                                    <CardTitle className="text-lg font-semibold text-foreground">Aktive Avancerede Ordrer</CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <ActiveAdvancedOrdersTable
                                        orders={advancedOrders.filter(o => o.status === 'active' || o.status === 'pending')}
                                        onCancelOrder={handleCancelAdvancedOrder}
                                        isLoading={false} // Or a specific loading state for the table if needed
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* New Tab Content for Analysis & Charts */}
                    <TabsContent value="analysis-charts">
                        <div className="space-y-6">
                            <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                <CardHeader className="px-4 pt-4 pb-3">
                                    <CardTitle className="text-lg font-semibold text-foreground">Vælg Analyseparametre</CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <AnalysisSelectionForm
                                        allSymbols={availableSymbolsForAnalysis} // Changed from availableSymbols to allSymbols
                                        formData={analysisFormData} // Changed from initialData to formData
                                        onFormDataChange={(fieldName, value) => setAnalysisFormData(prev => ({ ...prev, [fieldName]: value }))} // Added onFormDataChange
                                        onSubmit={handleAnalysisFormSubmit}
                                        isLoading={isFetchingChartData}
                                    />
                                </CardContent>
                            </Card>
                            <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                <CardHeader className="px-4 pt-4 pb-3">
                                    <CardTitle className="text-lg font-semibold text-foreground">
                                        Analyse for {chartData?.symbol || analysisFormData.symbol}
                                        {chartData?.indicator ? ` (${chartData.indicator})` : analysisFormData.indicator ? ` (${analysisFormData.indicator})` : ''}
                                        {chartData?.interval ? ` - ${chartData.interval}` : analysisFormData.interval ? ` - ${analysisFormData.interval}` : ''}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <ChartDisplay
                                        selectedAnalysis={analysisFormData} // Pass analysisFormData as selectedAnalysis
                                        analysisData={chartData}
                                        isLoading={isFetchingChartData}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Dividends Tab Content */}
                    <TabsContent value="dividends">
                        <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                            <CardHeader className="px-4 pt-4 pb-3 border-b border-border">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                    <CardTitle className="text-lg font-semibold text-foreground flex items-center mb-2 sm:mb-0">
                                        <DollarSign className="mr-2 h-5 w-5 text-primary" /> Modtagne Dividender
                                    </CardTitle>
                                    {dividends.length > 0 && (
                                        <div className="text-sm text-muted-foreground">
                                            Total: <span className="font-semibold text-tyrkisk-gron">{grandTotalDividends.toLocaleString('da-DK', { style: 'currency', currency: 'DKK', minimumFractionDigits: 2, maximumFractionDigits: 2 })} (DKK ækvivalent - fordel på valuta nedenfor)</span>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 py-4">
                                {dividends.length > 0 ? (
                                    <div className="space-y-6">
                                        {Object.keys(dividendSummary).length > 0 && (
                                            <Card className="bg-muted/30 p-4 rounded-lg border border-border">
                                                <h4 className="text-md font-semibold text-foreground mb-2">Resumé pr. Valuta</h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {Object.entries(dividendSummary).map(([currency, summary]) => (
                                                        <div key={currency} className="p-3 bg-card border border-border rounded-md">
                                                            <p className="text-xs text-muted-foreground">{currency}</p>
                                                            <p className="font-semibold text-tyrkisk-gron text-lg">
                                                                {summary.totalAmount.toLocaleString('da-DK', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">({summary.count} udbetalinger)</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>
                                        )}

                                        <div className="space-y-4">
                                            {dividends.map((dividend) => {
                                                const portfolio = currentPortfolios.find(p => p.id === dividend.portfolioId);
                                                return (
                                                    <div key={dividend.id} className="p-4 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150 ease-in-out">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                                            <div>
                                                                <p className="font-semibold text-lg text-foreground">{dividend.symbol} - {dividend.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Modtaget: {new Date(dividend.date).toLocaleDateString('da-DK', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                                </p>
                                                            </div>
                                                            <div className="mt-2 sm:mt-0 text-left sm:text-right">
                                                                <p className="font-bold text-xl text-tyrkisk-gron">
                                                                    +{dividend.amount.toLocaleString('da-DK', { style: 'currency', currency: dividend.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground border-t border-border pt-2 mt-2">
                                                            <p>Detaljer: {dividend.quantity} aktier @ {dividend.perShare.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {dividend.currency}/aktie</p>
                                                            {portfolio && (
                                                                <p>Portefølje: <span className="font-medium text-foreground">{portfolio.name}</span></p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground p-4 bg-muted border rounded-lg text-center">
                                        Du har endnu ikke modtaget dividender i denne dyst, eller denne funktion er under udvikling.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="my-competitions">
                        <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                            <CardHeader className="px-4 pt-4 pb-3">
                                <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                                    <UserCheck className="mr-2 h-5 w-5 text-primary" /> Mine Igangværende Dyster
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {myCompetitions.length > 0 ? (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {myCompetitions.map((comp: Competition) => (
                                            <CompetitionCard key={comp.id} competition={comp} type="my-competition" />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground p-4 bg-muted border rounded-lg text-center">Du deltager ikke i nogen dyster i øjeblikket.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="open-competitions">
                        <div className="space-y-6">
                            <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                <CardHeader className="px-4 pt-4 pb-3">
                                    <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                                        <TrendingUp className="mr-2 h-5 w-5 text-primary" /> Igangværende Dyster
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    {ongoingCompetitions.length > 0 ? (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {ongoingCompetitions.map((comp: Competition) => (
                                                <CompetitionCard key={comp.id} competition={comp} type="open-ongoing" />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground p-4 bg-muted border rounded-lg text-center">Ingen igangværende dyster i øjeblikket.</p>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                                <CardHeader className="px-4 pt-4 pb-3">
                                    <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                                        <CalendarClock className="mr-2 h-5 w-5 text-primary" /> Kommende Dyster
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    {upcomingCompetitions.length > 0 ? (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {upcomingCompetitions.map((comp: Competition) => (
                                                <CompetitionCard key={comp.id} competition={comp} type="open-upcoming" />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground p-4 bg-muted border rounded-lg text-center">Ingen kommende dyster annonceret endnu.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="results">
                        <Card className="bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border">
                            <CardHeader className="px-4 pt-4 pb-3">
                                <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                                    <History className="mr-2 h-5 w-5 text-primary" /> Afsluttede Dyster
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {pastCompetitions.length > 0 ? (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {pastCompetitions.map((comp: Competition) => (
                                            <CompetitionCard key={comp.id} competition={comp} type="result" />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground p-4 bg-muted border rounded-lg text-center">Ingen afsluttede dyster at vise.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
