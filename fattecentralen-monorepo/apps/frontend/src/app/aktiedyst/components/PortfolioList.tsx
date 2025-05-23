"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit3, FolderOpen, Trash2 } from "lucide-react";
import { Portfolio } from "../types";

interface PortfolioListProps {
    portfolios: Portfolio[];
    selectedPortfolioId?: string | null; // Added selectedPortfolioId prop
    onSelectPortfolio: (portfolioId: string | null) => void; // Uncommented and typed
    // onEditPortfolio: (portfolioId: string) => void;
    // onDeletePortfolio: (portfolioId: string) => void;
}

// Mock data for static display
const mockPortfolios: Portfolio[] = [
    {
        id: "pf1",
        name: "Min Danske Aktieportefølje",
        currency: "DKK",
        totalValue: 125000.50,
        holdingsCount: 5,
    },
    {
        id: "pf2",
        name: "Crypto S&P 500",
        currency: "USD",
        totalValue: 7500.22,
        holdingsCount: 3,
    },
    {
        id: "pf3",
        name: "Europæiske ETF'er",
        currency: "EUR",
        totalValue: 22000.00,
        holdingsCount: 2,
    },
];

export function PortfolioList({
    portfolios = mockPortfolios, // Keep mock data for standalone testing
    selectedPortfolioId,
    onSelectPortfolio,
}: PortfolioListProps) {
    if (portfolios.length === 0) {
        return (
            <Card className="bg-card border-border text-foreground shadow-md">
                <CardHeader className="border-b border-border">
                    <CardTitle className="flex items-center text-tyrkisk-gron"><FolderOpen className="mr-2 h-5 w-5 text-tyrkisk-gron" />Eksisterende Porteføljer</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <p className="text-muted-foreground">Du har ingen porteføljer endnu. Opret en ovenfor.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {portfolios.map((portfolio) => (
                <Card
                    key={portfolio.id}
                    className={`cursor-pointer hover:shadow-lg transition-shadow bg-card border border-border text-foreground
                        ${selectedPortfolioId === portfolio.id ? "border-tyrkisk-gron ring-2 ring-tyrkisk-gron" : "hover:border-muted-foreground/50"}
                        `}
                    onClick={() => onSelectPortfolio(portfolio.id)}
                >
                    <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-semibold leading-tight text-foreground">
                                {portfolio.name}
                            </CardTitle>
                            <div className="flex space-x-1">
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-tyrkisk-gron hover:bg-muted/50" onClick={(e) => { e.stopPropagation(); /* onEditPortfolio(portfolio.id); */ console.log('Edit:', portfolio.id); }}>
                                    <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-accent hover:bg-muted/50" onClick={(e) => { e.stopPropagation(); /* onDeletePortfolio(portfolio.id); */ console.log('Delete:', portfolio.id); }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 text-xs text-muted-foreground">
                        <p>Værdi: {portfolio.totalValue.toLocaleString("da-DK", { style: "currency", currency: portfolio.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p>Beholdninger: {portfolio.holdingsCount}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
