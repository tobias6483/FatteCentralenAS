"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

interface QuickTradeFormProps {
    assetSymbol?: string;
    assetName?: string;
    // For static display, we can use mock data or placeholders
}

export function QuickTradeForm({ assetSymbol = "AAPL", assetName = "Apple Inc." }: QuickTradeFormProps) {
    // Mock data for display purposes
    const estimatedBuyCost = "1.750,00 DKK"; // Example formatting
    const availableToSell = 10;
    const userBalance = "50.000,00 DKK"; // Example user balance

    return (
        <div className="grid md:grid-cols-2 gap-6 mt-4">
            {/* Buy Card */}
            <Card className="border-green-500/50">
                <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                    <ArrowUpCircle className="h-6 w-6 text-green-500" />
                    <CardTitle className="text-lg font-medium">Køb {assetName}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                        <div>
                            <Label htmlFor="buy-shares">Antal / Mængde</Label>
                            <Input type="number" id="buy-shares" placeholder="0" min="0" step="any" className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="buy-limit-price">Limit Købspris (valgfri)</Label>
                            <Input type="number" id="buy-limit-price" placeholder="Valgfri" step="any" min="0" className="mt-1" />
                        </div>
                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                            Køb Nu
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            Estimeret totalpris: <span className="font-semibold">{estimatedBuyCost}</span>
                        </p>
                        {/* <p className="text-xs text-red-500 mt-1">Utilstrækkelig saldo.</p> */}
                    </form>
                </CardContent>
            </Card>

            {/* Sell Card */}
            <Card className="border-red-500/50">
                <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                    <ArrowDownCircle className="h-6 w-6 text-red-500" />
                    <CardTitle className="text-lg font-medium">Sælg {assetName}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                        <div>
                            <Label htmlFor="sell-shares">Antal / Mængde</Label>
                            <Input type="number" id="sell-shares" placeholder="0" min="0" step="any" className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="sell-limit-price">Limit Salgspris (valgfri)</Label>
                            <Input type="number" id="sell-limit-price" placeholder="Valgfri" step="any" min="0" className="mt-1" />
                        </div>
                        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
                            Sælg Nu
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            Tilgængelig for salg: <span className="font-semibold">{availableToSell} stk</span>.
                        </p>
                        {/* <p className="text-xs text-red-500 mt-1">Du ejer ikke nok af dette aktiv.</p> */}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
