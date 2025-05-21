"use client";

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Briefcase, History, Info, ListChecks, PlusCircle, Search as SearchIcon, Star, TrendingUp, Trophy, UserCheck } from 'lucide-react';
import Link from 'next/link';
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
import { AdvancedOrder, AdvancedOrderFormData, AktiedystData, AnalysisData, AnalysisFormData, ChartDataPoint, Competition, Holding, Portfolio, WatchlistItem } from './types';

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
    }
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

            const newDataPoints: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                // Adjust date based on interval - remove '1W' as it's not in TimeInterval
                if (data.interval === '1D') date.setDate(date.getDate() - (29 - i));
                // else if (data.interval === '1W') date.setDate(date.getDate() - (29 - i) * 7); // Removed 1W
                else if (data.interval === '5D') date.setDate(date.getDate() - (29 - i)); // Treat 5D similar to 1D for now, adjust if specific logic needed
                else if (data.interval === '1M') {
                    const newDate = new Date(date);
                    newDate.setMonth(date.getMonth() - (29 - i));
                    // Check if day changed due to month length, reset to last day of month if so
                    if (newDate.getMonth() === (date.getMonth() - (29 - i) + 12) % 12) {
                        // all good
                    } else {
                        newDate.setDate(0); // last day of previous month
                    }
                    date.setTime(newDate.getTime());
                }
                // Simplified 1Y: 30 points over the last year (approx. every 12 days)
                else if (data.interval === '1Y') date.setDate(date.getDate() - (29 - i) * 12);

                let value = baseValue + i * trendStrength + (Math.random() - 0.5) * 10 * volatility;
                // Apply indicator-based modification (very simplified) - remove SMA and EMA as they are not in AnalysisFormData['indicator']
                // if (data.indicator === 'SMA' || data.indicator === 'EMA') value += Math.sin(i / 5) * 5 * volatility;
                if (data.indicator === 'price') value += Math.sin(i / 5) * 5 * volatility; // Example for price
                if (data.indicator === 'rsi') value = 50 + Math.sin(i / 3) * 20 * volatility;
                if (data.indicator === 'macd') value += Math.cos(i / 6) * 7 * volatility - Math.sin(i / 3) * 3 * volatility;
                if (data.indicator === 'bollinger') value += Math.cos(i / 4) * 8 * volatility; // Example for bollinger

                return {
                    date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
                    value: Math.max(10, parseFloat(value.toFixed(2))), // Ensure positive and two decimal places
                };
            });

            const newChartData: AnalysisData = {
                symbol: data.symbol,
                indicator: data.indicator,
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
                    <TabsList className="grid w-full grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 mb-6">
                        <TabsTrigger value="overview"><Trophy className="mr-2 h-4 w-4" /> Oversigt</TabsTrigger>
                        <TabsTrigger value="portfolios-holdings"><Briefcase className="mr-2 h-4 w-4" /> Porteføljer</TabsTrigger> {/* Shortened for space */}
                        <TabsTrigger value="watchlist"><Star className="mr-2 h-4 w-4" /> Watchlist</TabsTrigger>
                        <TabsTrigger value="advanced-orders"><ListChecks className="mr-2 h-4 w-4" /> Ordrer</TabsTrigger> {/* Shortened for space */}
                        <TabsTrigger value="analysis-charts"><BarChart3 className="mr-2 h-4 w-4" /> Analyse</TabsTrigger> {/* New Tab + Icon, Shortened */}
                        <TabsTrigger value="my-competitions"><UserCheck className="mr-2 h-4 w-4" /> Mine Dyster</TabsTrigger>
                        <TabsTrigger value="open-competitions"><ListChecks className="mr-2 h-4 w-4" /> Åbne Dyster</TabsTrigger>
                        <TabsTrigger value="results"><History className="mr-2 h-4 w-4" /> Resultater</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Kontant Saldo</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">
                                        {mockAktiedystData.cashBalance?.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' }) || 'N/A'}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Total Porteføljeværdi</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-green-500">
                                        {mockAktiedystData.userPortfolioValue.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Din nuværende placering: #{mockAktiedystData.userRank}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Samlet Resultat (I Dag)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className={`text-3xl font-bold ${mockAktiedystData.todaysProfitLoss && mockAktiedystData.todaysProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {mockAktiedystData.todaysProfitLoss?.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' }) || 'N/A'}
                                    </p>
                                    <p className={`text-sm ${mockAktiedystData.todaysProfitLoss && mockAktiedystData.todaysProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {mockAktiedystData.todaysProfitLossPercentage?.toFixed(2) || '0.00'}%
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <SearchIcon className="mr-2 h-5 w-5" /> Hurtig Søgning & Handel
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <AssetSearchForm />
                                <AssetInfoDisplay isVisible={isAssetDetailsVisible} />
                                {isAssetDetailsVisible && <QuickTradeForm />}
                            </CardContent>
                        </Card>

                        <section className="mb-10">
                            <h3 className="text-xl font-semibold mb-3">Hurtig adgang til dyster</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-lg font-medium mb-2">Igangværende</h4>
                                    {ongoingCompetitions.slice(0, 2).map((comp: Competition) => (
                                        <CompetitionCard key={comp.id} competition={comp} type="open-ongoing" />
                                    ))}
                                    {ongoingCompetitions.length === 0 && <p className="text-sm text-muted-foreground">Ingen lige nu.</p>}
                                </div>
                                <div>
                                    <h4 className="text-lg font-medium mb-2">Kommende</h4>
                                    {upcomingCompetitions.slice(0, 2).map((comp: Competition) => (
                                        <CompetitionCard key={comp.id} competition={comp} type="open-upcoming" />
                                    ))}
                                    {upcomingCompetitions.length === 0 && <p className="text-sm text-muted-foreground">Ingen annonceret.</p>}
                                </div>
                            </div>
                        </section>

                        <Card className="mt-8 bg-muted/50">
                            <CardHeader>
                                <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5" />Hvordan Virker Aktiedysten?</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <p>1. Du starter med en fiktiv kapital (f.eks. 100.000 kr.) i starten af hver dyst.</p>
                                <p>2. Køb og sælg aktier (baseret på realtidsdata med en lille forsinkelse) for at øge værdien af din portefølje.</p>
                                <p>3. Den deltager med den højeste porteføljeværdi ved dystens afslutning vinder.</p>
                                <p>4. Nogle dyster kan have specifikke regler eller temaer (f.eks. kun grønne aktier).</p>
                                <Link href="/aktiedyst/rules" className="text-primary hover:underline">Læs fulde regler og FAQ</Link>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* New Tab Content for Portfolios & Holdings */}
                    <TabsContent value="portfolios-holdings">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Opret Ny Portefølje</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CreatePortfolioForm />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle>Mine Porteføljer</CardTitle>
                                        {currentPortfolios.length > 1 && (
                                            <PortfolioFilterDropdown
                                                portfolios={currentPortfolios}
                                                selectedPortfolioId={selectedPortfolioId}
                                                onSelectPortfolio={setSelectedPortfolioId}
                                            />
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <PortfolioList
                                            portfolios={currentPortfolios}
                                            selectedPortfolioId={selectedPortfolioId}
                                            onSelectPortfolio={setSelectedPortfolioId}
                                        />
                                        {currentPortfolios.length === 0 && (
                                            <p className="text-sm text-muted-foreground">Du har ingen porteføljer endnu. Opret en for at starte!</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Beholdning for {selectedPortfolioId ? currentPortfolios.find((p: Portfolio) => p.id === selectedPortfolioId)?.name : 'Valgt Portefølje'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedPortfolioId && filteredHoldings.length > 0 ? (
                                            <HoldingsTable holdings={filteredHoldings} />
                                        ) : selectedPortfolioId && filteredHoldings.length === 0 ? (
                                            <p className="text-muted-foreground">Denne portefølje har ingen beholdninger endnu.</p>
                                        ) : (
                                            <p className="text-muted-foreground">Vælg en portefølje for at se beholdningen.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Watchlist Tab Content */}
                    <TabsContent value="watchlist">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tilføj til Watchlist</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <WatchlistAddItemForm onAddItem={handleAddToWatchlist} />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Min Watchlist</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <WatchlistTable
                                        items={watchlistItems}
                                        onRemoveItem={handleRemoveFromWatchlist}
                                        onTradeItem={handleTradeWatchlistItem}
                                        onViewChart={handleViewChartWatchlistItem}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Advanced Orders Tab Content */}
                    <TabsContent value="advanced-orders">
                        <div className="space-y-6">
                            <AdvancedOrderForm
                                ownedSymbols={ownedSymbolsForOrders}
                                onSubmit={handleCreateAdvancedOrder}
                                isLoading={isSubmittingOrder}
                            />
                            <Card>
                                <CardHeader>
                                    <CardTitle>Aktive Avancerede Ordrer</CardTitle>
                                </CardHeader>
                                <CardContent>
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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Vælg Analyseparametre</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <AnalysisSelectionForm
                                        allSymbols={availableSymbolsForAnalysis} // Changed from availableSymbols to allSymbols
                                        formData={analysisFormData} // Changed from initialData to formData
                                        onFormDataChange={(fieldName, value) => setAnalysisFormData(prev => ({ ...prev, [fieldName]: value }))} // Added onFormDataChange
                                        onSubmit={handleAnalysisFormSubmit}
                                        isLoading={isFetchingChartData}
                                    />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Analyse for {chartData?.symbol || analysisFormData.symbol}
                                        {chartData?.indicator ? ` (${chartData.indicator})` : analysisFormData.indicator ? ` (${analysisFormData.indicator})` : ''}
                                        {chartData?.interval ? ` - ${chartData.interval}` : analysisFormData.interval ? ` - ${analysisFormData.interval}` : ''}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ChartDisplay
                                        selectedAnalysis={analysisFormData} // Pass analysisFormData as selectedAnalysis
                                        analysisData={chartData}
                                        isLoading={isFetchingChartData}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="my-competitions">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center"><UserCheck className="mr-2 h-6 w-6 text-primary" /> Mine Igangværende Dyster</h2>
                        {myCompetitions.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {myCompetitions.map((comp: Competition) => (
                                    <CompetitionCard key={comp.id} competition={comp} type="my-competition" />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Du deltager ikke i nogen dyster i øjeblikket.</p>
                        )}
                    </TabsContent>

                    <TabsContent value="open-competitions">
                        <section id="ongoing-competitions-tab" className="mb-10">
                            <h2 className="text-2xl font-semibold mb-4 flex items-center"><TrendingUp className="mr-2 h-6 w-6 text-primary" /> Igangværende Dyster</h2>
                            {ongoingCompetitions.length > 0 ? (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {ongoingCompetitions.map((comp: Competition) => (
                                        <CompetitionCard key={comp.id} competition={comp} type="open-ongoing" />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Ingen igangværende dyster i øjeblikket.</p>
                            )}
                        </section>
                        <section id="upcoming-competitions-tab">
                            <h2 className="text-2xl font-semibold mb-4">Kommende Dyster</h2>
                            {upcomingCompetitions.length > 0 ? (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {upcomingCompetitions.map((comp: Competition) => (
                                        <CompetitionCard key={comp.id} competition={comp} type="open-upcoming" />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Ingen kommende dyster annonceret endnu.</p>
                            )}
                        </section>
                    </TabsContent>

                    <TabsContent value="results">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center"><History className="mr-2 h-6 w-6 text-primary" /> Afsluttede Dyster</h2>
                        {pastCompetitions.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {pastCompetitions.map((comp: Competition) => (
                                    <CompetitionCard key={comp.id} competition={comp} type="result" />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Ingen afsluttede dyster at vise.</p>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
