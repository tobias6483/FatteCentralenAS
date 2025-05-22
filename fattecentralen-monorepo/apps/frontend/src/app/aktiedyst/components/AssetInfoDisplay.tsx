"use client";

import { cn } from "@/lib/utils";

interface AssetInfo {
    name: string;
    symbol: string;
    price: number;
    currency: string;
    change: string; // e.g., "+0.50 (0.25%)"
    changeType: "positive" | "negative" | "neutral";
    timestamp: string;
}

interface AssetInfoDisplayProps {
    asset?: AssetInfo;
    isVisible: boolean;
}

// Mock data for static display
const mockAsset: AssetInfo = {
    name: "Apple Inc.",
    symbol: "AAPL",
    price: 175.50,
    currency: "USD",
    change: "+1.20 (0.69%)",
    changeType: "positive",
    timestamp: "2023-10-27 16:00 EST",
};

export function AssetInfoDisplay({ asset = mockAsset, isVisible }: AssetInfoDisplayProps) {
    if (!isVisible || !asset) {
        return null;
    }

    return (
        <div className="p-4 bg-card border border-border rounded-lg my-4 shadow-md">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">{asset.name}</h3>
                    <p className="text-sm text-muted-foreground">{asset.symbol}</p>
                </div>
                <div className="text-right">
                    <h4 className="text-xl font-bold text-foreground">
                        {asset.price.toLocaleString("da-DK", { style: "currency", currency: asset.currency })}
                    </h4>
                    <span
                        className={cn("text-sm font-medium", {
                            "text-green-500 dark:text-tyrkisk-gron": asset.changeType === "positive", // Updated to tyrkisk-gron
                            "text-red-500 dark:text-red-accent": asset.changeType === "negative", // Updated to red-accent
                            "text-muted-foreground": asset.changeType === "neutral",
                        })}
                    >
                        {asset.change}
                    </span>
                </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                Senest opdateret: {asset.timestamp}
            </p>
        </div>
    );
}
