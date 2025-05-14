"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagnifyingGlassIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, WalletIcon, BriefcaseIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

// Dummy data for now - will be replaced with API calls
interface AssetInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export default function OverviewHandelTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedAsset, setSearchedAsset] = useState<AssetInfo | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // Dummy financial data
  const financialStatus = {
    balance: 12345.67,
    portfolioValue: 78910.11,
    dailyProfitLoss: 250.75,
    dailyProfitLossPercent: 0.32,
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsLoadingSearch(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app, call: const data = await fetch(`/api/stock/${searchTerm}`);
    // For now, use dummy data if AAPL is searched
    if (searchTerm.toUpperCase() === 'AAPL') {
      setSearchedAsset({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 175.30,
        change: 1.25,
        changePercent: 0.72,
        timestamp: new Date().toLocaleString(),
      });
    } else {
      setSearchedAsset(null); // Or show a "not found" message
    }
    setIsLoadingSearch(false);
  };

  return (
    <div className="space-y-6"> {/* Removed text-white, Card component will handle text color */}
      {/* Financial Status Section */}
      <Card className="bg-card text-card-foreground border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <WalletIcon className="h-6 w-6 mr-2 text-sky-400" />
            Økonomisk Status (Samlet)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <Card className="bg-card text-card-foreground border p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Kontant Saldo</h3>
              <p className="text-2xl font-semibold text-sky-400">
                {financialStatus.balance.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
              </p>
            </Card>
            <Card className="bg-card text-card-foreground border p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Porteføljeværdi</h3>
              <p className="text-2xl font-semibold text-card-foreground">
                {financialStatus.portfolioValue.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
              </p>
            </Card>
            <Card className="bg-card text-card-foreground border p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Samlet Resultat (I dag)</h3>
              <p className={`text-2xl font-semibold ${financialStatus.dailyProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {financialStatus.dailyProfitLoss.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
                <span className="text-sm ml-1">({financialStatus.dailyProfitLossPercent.toFixed(2)}%)</span>
              </p>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Quick Search & Trade Section */}
      <Card className="bg-card text-card-foreground border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <MagnifyingGlassIcon className="h-6 w-6 mr-2 text-sky-400" />
            Hurtig Søgning & Handel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Søg symbol (f.eks. AAPL, NOVO B...)"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="bg-input border-border focus:border-ring text-foreground placeholder:text-muted-foreground"
            />
            <Button type="submit" variant="outline" className="bg-primary hover:bg-primary/90 border-primary text-primary-foreground" disabled={isLoadingSearch}>
              {isLoadingSearch ? 'Søger...' : 'Søg'}
            </Button>
          </form>

          {searchedAsset && (
            <Card className="bg-card text-card-foreground border p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">{searchedAsset.name} ({searchedAsset.symbol})</h3>
                  <p className="text-xs text-muted-foreground">Senest opdateret: {searchedAsset.timestamp}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-card-foreground">{searchedAsset.price.toFixed(2)}</p>
                  <p className={`text-sm ${searchedAsset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {searchedAsset.change.toFixed(2)} ({searchedAsset.changePercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
              {/* Buy/Sell forms will go here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Buy Form Placeholder */}
                <Card className="bg-card text-card-foreground border">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base text-card-foreground">
                      <ArrowUpCircleIcon className="h-5 w-5 mr-2 text-green-400" /> Køb {searchedAsset.symbol}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input type="number" placeholder="Antal" className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                    <Input type="number" placeholder="Limit pris (valgfri)" className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Køb</Button>
                  </CardContent>
                </Card>
                {/* Sell Form Placeholder */}
                <Card className="bg-card text-card-foreground border">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base text-card-foreground">
                      <ArrowDownCircleIcon className="h-5 w-5 mr-2 text-red-400" /> Sælg {searchedAsset.symbol}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input type="number" placeholder="Antal" className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                    <Input type="number" placeholder="Limit pris (valgfri)" className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white">Sælg</Button>
                  </CardContent>
                </Card>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}