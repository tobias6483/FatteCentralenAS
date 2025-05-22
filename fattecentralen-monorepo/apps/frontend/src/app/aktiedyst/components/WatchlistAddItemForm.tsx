"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { useState } from "react";

interface WatchlistAddItemFormProps {
    onAddItem: (symbol: string, note?: string) => void; // Callback for when an item is added
}

export function WatchlistAddItemForm({ onAddItem }: WatchlistAddItemFormProps) {
    const [symbol, setSymbol] = useState("");
    const [note, setNote] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!symbol.trim()) {
            setError("Symbol er påkrævet.");
            return;
        }
        setError("");
        onAddItem(symbol.trim().toUpperCase(), note.trim());
        setSymbol("");
        setNote("");
        // console.log("Adding to watchlist:", { symbol, note }); // Placeholder
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 bg-card border border-border rounded-lg">
            <div className="md:col-span-5">
                <Label htmlFor="watchlist-symbol" className="text-foreground mb-1 block">
                    Symbol
                </Label>
                <Input
                    id="watchlist-symbol"
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="F.eks. AAPL, NOVO B"
                    aria-label="Symbol for watchlist"
                    className="bg-input text-foreground border-border placeholder:text-muted-foreground"
                />
            </div>
            <div className="md:col-span-5">
                <Label htmlFor="watchlist-note" className="text-foreground mb-1 block">
                    Notat (valgfri)
                </Label>
                <Input
                    id="watchlist-note"
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Notat (valgfri)"
                    aria-label="Notat til watchlist item"
                    className="bg-input text-foreground border-border placeholder:text-muted-foreground"
                />
            </div>
            <div className="md:col-span-2">
                <Button type="submit" className="w-full bg-tyrkisk-gron text-tyrkisk-gron-foreground hover:bg-tyrkisk-gron/90">
                    <PlusCircle className="mr-2 h-4 w-4" /> Tilføj
                </Button>
            </div>
            {error && <p className="md:col-span-12 text-sm text-red-accent mt-1">{error}</p>}
        </form>
    );
}
