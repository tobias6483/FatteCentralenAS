"use client";

import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Portfolio } from "../types";

interface PortfolioFilterDropdownProps {
    portfolios: Portfolio[];
    selectedPortfolioId: string | null; // Changed from string | undefined
    onSelectPortfolio: (portfolioId: string | null) => void; // Uncommented and typed
}

// Mock data for static display - should match PortfolioList's mock data for consistency
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

export function PortfolioFilterDropdown({
    portfolios = mockPortfolios, // Keep mock data for standalone testing if needed
    selectedPortfolioId,
    onSelectPortfolio,
}: PortfolioFilterDropdownProps) {
    return (
        <div className="mb-4 p-4 bg-card text-foreground rounded-lg shadow-md border border-border">
            <Label htmlFor="portfolio-filter" className="text-sm font-medium text-muted-foreground mb-2 block">Filtrer beholdning efter portefølje</Label>
            <Select
                value={selectedPortfolioId || ""} // Handle null case for Select value
                onValueChange={(value) => onSelectPortfolio(value === "all" || value === "" ? null : value)}
            >
                <SelectTrigger
                    id="portfolio-filter"
                    className="w-full md:w-[300px] bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
                >
                    <SelectValue placeholder="Vælg portefølje at vise" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="all" className="hover:bg-muted/50 focus:bg-muted/50">Alle Porteføljer</SelectItem>
                    {portfolios.map((portfolio) => (
                        <SelectItem
                            key={portfolio.id}
                            value={portfolio.id}
                            className="hover:bg-muted/50 focus:bg-muted/50"
                        >
                            {portfolio.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
