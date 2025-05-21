"use client";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { LineChart, ShoppingCart, Trash2 } from "lucide-react";
import { WatchlistItem } from "../types"; // Assuming WatchlistItem type will be defined

interface WatchlistTableProps {
    items: WatchlistItem[];
    onRemoveItem: (symbol: string) => void;
    onTradeItem: (symbol: string) => void; // For quick trade action
    onViewChart: (symbol: string) => void; // For viewing chart/analysis
}

// Mock data for static display - replace with props
const mockItems: WatchlistItem[] = [
    {
        symbol: "TSLA",
        name: "Tesla Inc.",
        lastPrice: 180.25,
        currency: "USD",
        changePercent: 1.5,
        changeAbsolute: 2.67,
        note: "Holder øje med Q3 earnings.",
    },
    {
        symbol: "NVO B",
        name: "Novo Nordisk A/S",
        lastPrice: 950.70,
        currency: "DKK",
        changePercent: -0.25,
        changeAbsolute: -2.38,
        note: "Overvejer køb ved fald under 900.",
    },
    {
        symbol: "BTC-USD",
        name: "Bitcoin",
        lastPrice: 65000.00,
        currency: "USD",
        changePercent: 3.12,
        changeAbsolute: 1968.00,
    },
];

export function WatchlistTable({
    items = mockItems,
    onRemoveItem,
    onTradeItem,
    onViewChart,
}: WatchlistTableProps) {
    if (items.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8">
                <LineChart className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                <p className="text-lg font-medium">Din watchlist er tom.</p>
                <p className="text-sm">Tilføj aktiver ved hjælp af formularen ovenfor for at begynde at overvåge dem.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Navn</TableHead>
                        <TableHead className="text-right">Seneste Kurs</TableHead>
                        <TableHead className="text-right">Ændring (Dag)</TableHead>
                        <TableHead>Notat</TableHead>
                        <TableHead className="text-center">Handlinger</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.symbol}>
                            <TableCell className="font-medium">{item.symbol}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">
                                {item.lastPrice.toLocaleString("da-DK", {
                                    style: "currency",
                                    currency: item.currency,
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </TableCell>
                            <TableCell
                                className={cn("text-right", {
                                    "text-green-500": item.changePercent > 0,
                                    "text-red-500": item.changePercent < 0,
                                })}
                            >
                                {item.changeAbsolute.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                                ({item.changePercent.toFixed(2)}%)
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                {item.note || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onTradeItem(item.symbol)}
                                    title="Handl"
                                    className="mr-1"
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onViewChart(item.symbol)}
                                    title="Se Graf/Analyse"
                                    className="mr-1"
                                >
                                    <LineChart className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onRemoveItem(item.symbol)}
                                    title="Fjern fra Watchlist"
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
