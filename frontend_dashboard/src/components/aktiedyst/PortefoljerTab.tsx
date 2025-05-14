"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FolderPlusIcon, TrashIcon, PencilIcon, ListBulletIcon, BanknotesIcon } from '@heroicons/react/24/outline';

// Dummy data types - will be refined with API integration
interface Portfolio {
  id: string;
  name: string;
  currency: string;
  value: number;
}

interface Holding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgPurchasePrice: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  type: string; // Stock, ETF, Crypto
  portfolioId: string;
}

// Dummy initial data
const initialPortfolios: Portfolio[] = [
  { id: 'pf1', name: 'Tech Stocks', currency: 'USD', value: 25000 },
  { id: 'pf2', name: 'Crypto Wallet', currency: 'USD', value: 15000 },
  { id: 'pf3', name: 'Danish Giants', currency: 'DKK', value: 175000 },
];

const initialHoldings: Holding[] = [
  { id: 'h1', symbol: 'AAPL', name: 'Apple Inc.', shares: 50, avgPurchasePrice: 150, currentPrice: 175, marketValue: 8750, gainLoss: 1250, gainLossPercent: 16.67, type: 'Stock', portfolioId: 'pf1' },
  { id: 'h2', symbol: 'MSFT', name: 'Microsoft Corp.', shares: 30, avgPurchasePrice: 280, currentPrice: 330, marketValue: 9900, gainLoss: 1500, gainLossPercent: 17.86, type: 'Stock', portfolioId: 'pf1' },
  { id: 'h3', symbol: 'BTC', name: 'Bitcoin', shares: 0.5, avgPurchasePrice: 30000, currentPrice: 35000, marketValue: 17500, gainLoss: 2500, gainLossPercent: 16.67, type: 'Crypto', portfolioId: 'pf2' },
  { id: 'h4', symbol: 'NOVO B', name: 'Novo Nordisk B', shares: 100, avgPurchasePrice: 600, currentPrice: 750, marketValue: 75000, gainLoss: 15000, gainLossPercent: 25.00, type: 'Stock', portfolioId: 'pf3' },
];

export default function PortefoljerTab() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(initialPortfolios);
  const [holdings, setHoldings] = useState<Holding[]>(initialHoldings);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioCurrency, setNewPortfolioCurrency] = useState('DKK');
  const [selectedPortfolioFilter, setSelectedPortfolioFilter] = useState('all');

  const handleCreatePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;
    const newPortfolio: Portfolio = {
      id: `pf${portfolios.length + 1}`, // simple id generation
      name: newPortfolioName,
      currency: newPortfolioCurrency,
      value: 0,
    };
    setPortfolios([...portfolios, newPortfolio]);
    setNewPortfolioName('');
  };

  const filteredHoldings = selectedPortfolioFilter === 'all'
    ? holdings
    : holdings.filter(h => h.portfolioId === selectedPortfolioFilter);

  return (
    <div className="space-y-6 text-white">
      {/* Manage Portfolios Section */}
      <Card className="bg-gray-850 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <FolderPlusIcon className="h-6 w-6 mr-2 text-sky-400" />
            Administrer Porteføljer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePortfolio} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6 pb-6 border-b border-gray-700">
            <div>
              <label htmlFor="portfolio-name" className="block text-sm font-medium text-gray-300 mb-1">Porteføljenavn</label>
              <Input
                id="portfolio-name"
                type="text"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                placeholder="Navn på ny portefølje"
                className="bg-gray-800 border-gray-600 focus:border-sky-500 text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="portfolio-currency" className="block text-sm font-medium text-gray-300 mb-1">Valuta</label>
              <Select value={newPortfolioCurrency} onValueChange={setNewPortfolioCurrency}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Vælg valuta" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="DKK">DKK (Danske Kroner)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white h-10">
              Opret Ny Portefølje
            </Button>
          </form>

          <h3 className="text-lg font-semibold mb-3">Eksisterende Porteføljer</h3>
          <div className="space-y-2">
            {portfolios.map(pf => (
              <Card key={pf.id} className="bg-gray-800 border-gray-700 p-3 flex justify-between items-center">
                <div>
                  <span className="font-medium">{pf.name}</span>
                  <span className="text-xs text-gray-400 ml-2">({pf.currency}) - Værdi: {pf.value.toLocaleString('da-DK', { style: 'currency', currency: pf.currency })}</span>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="icon" className="border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-white">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {portfolios.length === 0 && <p className="text-gray-400">Ingen porteføljer oprettet endnu.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Holdings Section */}
      <Card className="bg-gray-850 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center text-xl">
            <ListBulletIcon className="h-6 w-6 mr-2 text-sky-400" />
            Detaljeret Beholdning
          </CardTitle>
          <div className="w-1/3">
            <Select value={selectedPortfolioFilter} onValueChange={setSelectedPortfolioFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Filtrer portefølje..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="all">Vis Alle Porteføljer</SelectItem>
                {portfolios.map(pf => (
                  <SelectItem key={pf.id} value={pf.id}>{pf.name} ({pf.currency})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-800">
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-gray-300">Symbol</TableHead>
                <TableHead className="text-gray-300">Navn</TableHead>
                <TableHead className="text-right text-gray-300">Antal</TableHead>
                <TableHead className="text-right text-gray-300">Gns. Købspris</TableHead>
                <TableHead className="text-right text-gray-300">Nuv. Kurs</TableHead>
                <TableHead className="text-right text-gray-300">Markedsværdi</TableHead>
                <TableHead className="text-right text-gray-300">Gevinst/Tab (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHoldings.length > 0 ? filteredHoldings.map(h => (
                <TableRow key={h.id} className="border-gray-700 hover:bg-gray-800">
                  <TableCell>{h.type}</TableCell>
                  <TableCell className="font-medium">{h.symbol}</TableCell>
                  <TableCell>{h.name}</TableCell>
                  <TableCell className="text-right">{h.shares}</TableCell>
                  <TableCell className="text-right">{h.avgPurchasePrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{h.currentPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{h.marketValue.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}</TableCell> {/* Assuming DKK for now */}
                  <TableCell className={`text-right ${h.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {h.gainLoss.toFixed(2)} ({h.gainLossPercent.toFixed(2)}%)
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow className="border-gray-700 hover:bg-gray-800">
                  <TableCell colSpan={8} className="text-center text-gray-400 py-4">
                    Ingen beholdning fundet for valgte filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}