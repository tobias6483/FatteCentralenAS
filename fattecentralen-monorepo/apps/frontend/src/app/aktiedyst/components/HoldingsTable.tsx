"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowUpWideNarrow, Edit, TrendingDown, TrendingUp } from "lucide-react";
import { Holding } from "../types"; // Assuming Holding type is defined

interface HoldingsTableProps {
    holdings: Holding[];
    isLoading?: boolean;
}

// Mock data for static display
const mockHoldings: Holding[] = [
    {
        id: "h1",
        type: "Aktie",
        symbol: "AAPL",
        name: "Apple Inc.",
        quantity: 10,
        avgBuyPrice: 150.00,
        currentPrice: 175.50,
        marketValue: 1755.00,
        profitOrLoss: 255.00,
        profitOrLossPercentage: 17.00,
        currency: "USD",
    },
    {
        id: "h2",
        type: "Crypto",
        symbol: "BTC",
        name: "Bitcoin",
        quantity: 0.05,
        avgBuyPrice: 30000.00,
        currentPrice: 40000.00,
        marketValue: 2000.00,
        profitOrLoss: 500.00,
        profitOrLossPercentage: 25.00,
        currency: "USD",
    },
    {
        id: "h3",
        type: "ETF",
        symbol: "SPY",
        name: "SPDR S&P 500 ETF Trust",
        quantity: 5,
        avgBuyPrice: 400.00,
        currentPrice: 450.00,
        marketValue: 2250.00,
        profitOrLoss: 250.00,
        profitOrLossPercentage: 12.50,
        currency: "USD",
    },
    {
        id: "h4",
        type: "Aktie",
        symbol: "NOVO B",
        name: "Novo Nordisk A/S",
        quantity: 20,
        avgBuyPrice: 800.00,
        currentPrice: 780.50,
        marketValue: 15610.00,
        profitOrLoss: -390.00,
        profitOrLossPercentage: -2.44,
        currency: "DKK",
    },
];

const formatCurrency = (value: number, currency: string) => {
    return value.toLocaleString("da-DK", { style: "currency", currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function HoldingsTable({ holdings = mockHoldings, isLoading = false }: HoldingsTableProps) {
    const totalMarketValue = holdings.reduce((sum, h) => sum + (h.marketValue * (h.currency === 'DKK' ? 1 : 6.8)), 0); // Simple conversion for demo
    const totalProfitOrLoss = holdings.reduce((sum, h) => sum + (h.profitOrLoss * (h.currency === 'DKK' ? 1 : 6.8)), 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10 bg-card text-foreground rounded-lg shadow-md">
                <ArrowUpWideNarrow className="h-8 w-8 animate-spin text-tyrkisk-gron" />
                <p className="ml-2 text-muted-foreground">Henter beholdning...</p>
            </div>
        );
    }

    if (holdings.length === 0) {
        return <p className="text-muted-foreground py-4 text-center bg-card rounded-lg shadow-md">Ingen beholdning fundet for valgte portefølje.</p>;
    }

    return (
        <div className="overflow-x-auto bg-card text-foreground rounded-lg shadow-md border border-border">
            <Table>
                <TableCaption className="mt-4 text-muted-foreground">Din detaljerede beholdning. Kurser opdateres periodisk. Gevinst/tab er urealiseret.</TableCaption>
                <TableHeader className="border-b border-border">
                    <TableRow className="hover:bg-muted/20">
                        <TableHead className="text-tyrkisk-gron">Type</TableHead>
                        <TableHead className="text-tyrkisk-gron">Symbol</TableHead>
                        <TableHead className="text-tyrkisk-gron">Navn</TableHead>
                        <TableHead className="text-right text-tyrkisk-gron">Antal</TableHead>
                        <TableHead className="text-right text-tyrkisk-gron">Gns. Købspris</TableHead>
                        <TableHead className="text-right text-tyrkisk-gron">Nuv. Kurs</TableHead>
                        <TableHead className="text-right text-tyrkisk-gron">Markedsværdi</TableHead>
                        <TableHead className="text-right text-tyrkisk-gron">Gevinst/Tab (%)</TableHead>
                        <TableHead className="text-center text-tyrkisk-gron">Handlinger</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {holdings.map((holding) => (
                        <TableRow key={holding.id} className="border-b border-border hover:bg-muted/20">
                            <TableCell><Badge variant="outline" className="border-border text-foreground bg-background hover:bg-muted/30">{holding.type}</Badge></TableCell>
                            <TableCell className="font-medium text-foreground">{holding.symbol}</TableCell>
                            <TableCell className="text-muted-foreground">{holding.name}</TableCell>
                            <TableCell className="text-right text-foreground">{holding.quantity.toLocaleString("da-DK")}</TableCell>
                            <TableCell className="text-right text-foreground">{formatCurrency(holding.avgBuyPrice, holding.currency)}</TableCell>
                            <TableCell className="text-right text-foreground">{formatCurrency(holding.currentPrice, holding.currency)}</TableCell>
                            <TableCell className="text-right text-foreground">{formatCurrency(holding.marketValue, holding.currency)}</TableCell>
                            <TableCell className={cn("text-right font-semibold", holding.profitOrLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                {formatCurrency(holding.profitOrLoss, holding.currency)} ({holding.profitOrLossPercentage.toFixed(2)}%)
                                {holding.profitOrLoss >= 0 ? <TrendingUp className="inline-block ml-1 h-4 w-4 text-green-600 dark:text-green-400" /> : <TrendingDown className="inline-block ml-1 h-4 w-4 text-red-600 dark:text-red-400" />}
                            </TableCell>
                            <TableCell className="text-center">
                                <Button variant="outline" size="sm" className="mr-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                                    <Edit className="h-3 w-3 mr-1" /> Info/Sælg
                                </Button>
                                {/* <Button variant="ghost" size="icon" className="text-red-accent hover:text-red-accent/80">\n                  <Trash2 className="h-4 w-4" />\n                  <span className="sr-only">Slet post (ikke handel)</span>\n                </Button> */}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter className="border-t border-border">
                    <TableRow className="bg-muted/50 hover:bg-muted/70">
                        <TableCell colSpan={6} className="text-right font-bold text-foreground">Total Værdi (DKK estimat):</TableCell>
                        <TableCell className="text-right font-bold text-foreground">{formatCurrency(totalMarketValue, "DKK")}</TableCell>
                        <TableCell className={cn("text-right font-bold", totalProfitOrLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                            {formatCurrency(totalProfitOrLoss, "DKK")}
                        </TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
}
