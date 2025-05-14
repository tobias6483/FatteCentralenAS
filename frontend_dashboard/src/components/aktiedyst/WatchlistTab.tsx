"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircleIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  dailyChange: number;
  dailyChangePercent: number;
  note?: string;
}

// Dummy initial data
const initialWatchlistItems: WatchlistItem[] = [
  { id: 'w1', symbol: 'TSLA', name: 'Tesla Inc.', currentPrice: 180.50, dailyChange: -2.10, dailyChangePercent: -1.15, note: 'Monitor for Q3 earnings' },
  { id: 'w2', symbol: 'ETH', name: 'Ethereum', currentPrice: 2200.75, dailyChange: 55.20, dailyChangePercent: 2.57 },
  { id: 'w3', symbol: 'GM', name: 'General Motors', currentPrice: 35.10, dailyChange: 0.15, dailyChangePercent: 0.43, note: 'Check EV news' },
];

export default function WatchlistTab() {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>(initialWatchlistItems);
  const [newSymbol, setNewSymbol] = useState('');
  const [newNote, setNewNote] = useState('');

  const handleAddToWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;

    // Simulate fetching asset name and price - in a real app, this would be an API call
    const newItem: WatchlistItem = {
      id: `w${watchlistItems.length + 1}`, // simple id generation
      symbol: newSymbol.toUpperCase(),
      name: `${newSymbol.toUpperCase()} Company Name`, // Placeholder name
      currentPrice: Math.random() * 1000, // Placeholder price
      dailyChange: (Math.random() - 0.5) * 20,
      dailyChangePercent: (Math.random() - 0.5) * 5,
      note: newNote.trim() || undefined,
    };
    setWatchlistItems([...watchlistItems, newItem]);
    setNewSymbol('');
    setNewNote('');
  };

  const handleRemoveFromWatchlist = (id: string) => {
    setWatchlistItems(watchlistItems.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6 text-white">
      {/* Add to Watchlist Section */}
      <Card className="bg-gray-850 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <PlusCircleIcon className="h-6 w-6 mr-2 text-sky-400" />
            Tilføj til Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddToWatchlist} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="watchlist-symbol" className="block text-sm font-medium text-gray-300 mb-1">Symbol</label>
              <Input
                id="watchlist-symbol"
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="Aktie/ETF/Crypto symbol"
                className="bg-gray-800 border-gray-600 focus:border-sky-500 text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="watchlist-note" className="block text-sm font-medium text-gray-300 mb-1">Notat (valgfri)</label>
              <Input
                id="watchlist-note"
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Din note her..."
                className="bg-gray-800 border-gray-600 focus:border-sky-500 text-white"
              />
            </div>
            <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white h-10">
              Tilføj
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* My Watchlist Section */}
      <Card className="bg-gray-850 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <StarIcon className="h-6 w-6 mr-2 text-yellow-400" />
            Min Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-800">
                <TableHead className="text-gray-300">Symbol</TableHead>
                <TableHead className="text-gray-300">Navn</TableHead>
                <TableHead className="text-right text-gray-300">Seneste Kurs</TableHead>
                <TableHead className="text-right text-gray-300">Ændring (dag)</TableHead>
                <TableHead className="text-gray-300">Notat</TableHead>
                <TableHead className="text-center text-gray-300">Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchlistItems.length > 0 ? watchlistItems.map(item => (
                <TableRow key={item.id} className="border-gray-700 hover:bg-gray-800">
                  <TableCell className="font-medium">{item.symbol}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">{item.currentPrice.toFixed(2)}</TableCell>
                  <TableCell className={`text-right ${item.dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.dailyChange.toFixed(2)} ({item.dailyChangePercent.toFixed(2)}%)
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">{item.note || '-'}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFromWatchlist(item.id)}
                      className="text-red-500 hover:bg-red-700 hover:text-white"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow className="border-gray-700 hover:bg-gray-800">
                  <TableCell colSpan={6} className="text-center text-gray-400 py-4">
                    Din watchlist er tom. Tilføj symboler ovenfor.
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