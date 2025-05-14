"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClockIcon, FunnelIcon } from '@heroicons/react/24/outline';
// import { DatePicker } from "@/components/ui/datepicker"; // Placeholder if you add a datepicker

interface Transaction {
  id: string;
  timestamp: string;
  type: 'buy' | 'sell' | 'dividend' | 'fee' | 'deposit' | 'withdraw';
  symbol?: string; // Optional, as not all types have a symbol (e.g., deposit)
  shares?: number;
  pricePerUnit?: number;
  totalAmount: number;
  currency: string;
  portfolioName?: string; // Name of the portfolio it affected
  comment?: string;
}

// Dummy initial data
const initialTransactions: Transaction[] = [
  { id: 't1', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), type: 'buy', symbol: 'AAPL', shares: 10, pricePerUnit: 150.00, totalAmount: 1500.00, currency: 'USD', portfolioName: 'Tech Stocks' },
  { id: 't2', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), type: 'sell', symbol: 'MSFT', shares: 5, pricePerUnit: 330.00, totalAmount: 1650.00, currency: 'USD', portfolioName: 'Tech Stocks' },
  { id: 't3', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), type: 'dividend', symbol: 'JNJ', totalAmount: 23.80, currency: 'USD', comment: 'Q3 Dividend' },
  { id: 't4', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), type: 'buy', symbol: 'NOVO B', shares: 20, pricePerUnit: 750.00, totalAmount: 15000.00, currency: 'DKK', portfolioName: 'Danish Giants' },
  { id: 't5', timestamp: new Date(Date.now() - 3600000 * 10).toISOString(), type: 'deposit', totalAmount: 5000.00, currency: 'DKK', comment: 'Monthly savings' },
  { id: 't6', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), type: 'fee', totalAmount: -5.00, currency: 'DKK', comment: 'Platform fee' },
];

export default function TransaktionshistorikTab() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [filterType, setFilterType] = useState('all');
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const typeMatch = filterType === 'all' || t.type === filterType;
      const symbolMatch = !filterSymbol || (t.symbol && t.symbol.toLowerCase().includes(filterSymbol.toLowerCase()));
      const dateFromMatch = !filterDateFrom || new Date(t.timestamp) >= new Date(filterDateFrom);
      const dateToMatch = !filterDateTo || new Date(t.timestamp) <= new Date(filterDateTo + 'T23:59:59.999Z'); // Include whole day
      return typeMatch && symbolMatch && dateFromMatch && dateToMatch;
    });
  }, [transactions, filterType, filterSymbol, filterDateFrom, filterDateTo]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtering is already done by useMemo, this function could trigger a re-fetch in a real app
    console.log("Filtering with:", { filterType, filterSymbol, filterDateFrom, filterDateTo });
  };

  return (
    <div className="space-y-6 text-white">
      {/* Filter Transactions Section */}
      <Card className="bg-gray-850 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <FunnelIcon className="h-6 w-6 mr-2 text-sky-400" />
            Filtrer Transaktioner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label htmlFor="filter-trans-type" className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="all">Alle Typer</SelectItem>
                  <SelectItem value="buy">Køb</SelectItem>
                  <SelectItem value="sell">Sælg</SelectItem>
                  <SelectItem value="dividend">Dividende</SelectItem>
                  <SelectItem value="fee">Gebyr</SelectItem>
                  <SelectItem value="deposit">Indskud</SelectItem>
                  <SelectItem value="withdraw">Udbetaling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="filter-trans-symbol" className="block text-sm font-medium text-gray-300 mb-1">Symbol</label>
              <Input id="filter-trans-symbol" type="text" value={filterSymbol} onChange={(e) => setFilterSymbol(e.target.value)} placeholder="AAPL" className="bg-gray-800 border-gray-600 focus:border-sky-500 text-white" />
            </div>
            <div>
              <label htmlFor="filter-trans-date-from" className="block text-sm font-medium text-gray-300 mb-1">Fra Dato</label>
              <Input id="filter-trans-date-from" type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="bg-gray-800 border-gray-600 focus:border-sky-500 text-white" />
            </div>
            <div>
              <label htmlFor="filter-trans-date-to" className="block text-sm font-medium text-gray-300 mb-1">Til Dato</label>
              <Input id="filter-trans-date-to" type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="bg-gray-800 border-gray-600 focus:border-sky-500 text-white" />
            </div>
            <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white h-10">Filtrer</Button>
          </form>
        </CardContent>
      </Card>

      {/* Transaction History Table Section */}
      <Card className="bg-gray-850 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <ClockIcon className="h-6 w-6 mr-2 text-sky-400" />
            Transaktionshistorik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-800 text-xs">
                <TableHead className="text-gray-300">Tidspunkt</TableHead>
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-gray-300">Symbol</TableHead>
                <TableHead className="text-right text-gray-300">Antal</TableHead>
                <TableHead className="text-right text-gray-300">Pris/Enhed</TableHead>
                <TableHead className="text-right text-gray-300">Total Beløb</TableHead>
                <TableHead className="text-gray-300">Valuta</TableHead>
                <TableHead className="text-gray-300">Portefølje</TableHead>
                <TableHead className="text-gray-300">Kommentar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                <TableRow key={t.id} className="border-gray-700 hover:bg-gray-800 text-sm">
                  <TableCell className="text-gray-400">{new Date(t.timestamp).toLocaleString('da-DK')}</TableCell>
                  <TableCell>{t.type.charAt(0).toUpperCase() + t.type.slice(1)}</TableCell>
                  <TableCell className="font-medium">{t.symbol || '-'}</TableCell>
                  <TableCell className="text-right">{t.shares !== undefined ? t.shares : '-'}</TableCell>
                  <TableCell className="text-right">{t.pricePerUnit !== undefined ? t.pricePerUnit.toFixed(2) : '-'}</TableCell>
                  <TableCell className="text-right font-semibold">{t.totalAmount.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{t.currency}</TableCell>
                  <TableCell className="text-xs text-gray-400">{t.portfolioName || '-'}</TableCell>
                  <TableCell className="text-xs text-gray-400">{t.comment || '-'}</TableCell>
                </TableRow>
              )) : (
                <TableRow className="border-gray-700 hover:bg-gray-800">
                  <TableCell colSpan={9} className="text-center text-gray-400 py-4">
                    Ingen transaktioner fundet for de valgte filtre.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* Pagination placeholder */}
          {/* <div className="mt-4 text-center"> <Button variant="outline">Load More</Button> </div> */}
        </CardContent>
      </Card>
    </div>
  );
}