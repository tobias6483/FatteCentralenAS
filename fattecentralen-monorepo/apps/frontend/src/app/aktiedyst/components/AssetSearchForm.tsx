"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

// Props would be added here for actual functionality, e.g., onSearch, isLoading
interface AssetSearchFormProps { }

export function AssetSearchForm({ }: AssetSearchFormProps) {
    return (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
            <div>
                <Label htmlFor="asset-symbol-input" className="sr-only">Søg symbol</Label>
                <div className="flex space-x-2">
                    <div className="relative grow">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            id="asset-symbol-input"
                            placeholder="Søg symbol (f.eks. AAPL, NOVO B, BTC-USD)"
                            className="pl-8" // Padding for icon
                        />
                    </div>
                    <Button type="submit">
                        Søg
                    </Button>
                </div>
                {/* Placeholder for search error messages */}
                {/* <p className="text-sm text-red-500 mt-1">Søgning fejlede. Prøv igen.</p> */}
            </div>
        </form>
    );
}
