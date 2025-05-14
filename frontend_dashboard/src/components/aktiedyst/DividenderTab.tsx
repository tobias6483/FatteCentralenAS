"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BanknotesIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface Dividend {
  id: string;
  symbol: string;
  name: string; // Company name
  exDividendDate: string;
  paymentDate: string;
  amountPerShare: number;
  sharesHeld: number; // Shares held on ex-dividend date
  totalReceived: number; // Before tax
  status: 'Paid' | 'Expected' | 'Cancelled';
  currency: string;
}

// Dummy initial data
const initialDividends: Dividend[] = [
  { id: 'd1', symbol: 'AAPL', name: 'Apple Inc.', exDividendDate: '2024-11-10', paymentDate: '2024-11-17', amountPerShare: 0.24, sharesHeld: 50, totalReceived: 12.00, status: 'Paid', currency: 'USD' },
  { id: 'd2', symbol: 'MSFT', name: 'Microsoft Corp.', exDividendDate: '2025-02-15', paymentDate: '2025-03-12', amountPerShare: 0.75, sharesHeld: 30, totalReceived: 22.50, status: 'Expected', currency: 'USD' },
  { id: 'd3', symbol: 'JNJ', name: 'Johnson & Johnson', exDividendDate: '2024-08-20', paymentDate: '2024-09-07', amountPerShare: 1.19, sharesHeld: 20, totalReceived: 23.80, status: 'Paid', currency: 'USD' },
  { id: 'd4', symbol: 'NOVO B', name: 'Novo Nordisk B', exDividendDate: '2025-03-20', paymentDate: '2025-04-05', amountPerShare: 6.40, sharesHeld: 100, totalReceived: 640.00, status: 'Expected', currency: 'DKK' },
];

export default function DividenderTab() {
  const [dividends, setDividends] = useState<Dividend[]>(initialDividends);

  // Calculate total received for a specific currency (e.g., DKK for summary)
  // This is a simplified example; real-world would need currency conversion for mixed portfolios
  const totalDkkReceivedLast12Months = dividends
    .filter(d => d.status === 'Paid' && d.currency === 'DKK') // Add date filtering for 'last 12 months'
    .reduce((sum, d) => sum + d.totalReceived, 0);

  return (
    <div className="space-y-6 text-white">
      <Card className="bg-gray-850 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <BanknotesIcon className="h-6 w-6 mr-2 text-sky-400" />
            Modtagne & Forventede Dividender
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-800">
                <TableHead className="text-gray-300">Symbol</TableHead>
                <TableHead className="text-gray-300">Navn</TableHead>
                <TableHead className="text-gray-300">Ex-Dividend Dato</TableHead>
                <TableHead className="text-gray-300">Betalingsdato</TableHead>
                <TableHead className="text-right text-gray-300">Beløb pr. Aktie</TableHead>
                <TableHead className="text-right text-gray-300">Antal Aktier</TableHead>
                <TableHead className="text-right text-gray-300">Total (før skat)</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dividends.length > 0 ? dividends.map(div => (
                <TableRow key={div.id} className="border-gray-700 hover:bg-gray-800">
                  <TableCell className="font-medium">{div.symbol}</TableCell>
                  <TableCell>{div.name}</TableCell>
                  <TableCell>{new Date(div.exDividendDate).toLocaleDateString('da-DK')}</TableCell>
                  <TableCell>{new Date(div.paymentDate).toLocaleDateString('da-DK')}</TableCell>
                  <TableCell className="text-right">{div.amountPerShare.toLocaleString('da-DK', { style: 'currency', currency: div.currency, minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">{div.sharesHeld}</TableCell>
                  <TableCell className="text-right font-semibold">{div.totalReceived.toLocaleString('da-DK', { style: 'currency', currency: div.currency, minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      div.status === 'Paid' ? 'bg-green-500 text-green-100' :
                      div.status === 'Expected' ? 'bg-yellow-500 text-yellow-100' :
                      'bg-red-500 text-red-100' // Cancelled
                    }`}>
                      {div.status}
                    </span>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow className="border-gray-700 hover:bg-gray-800">
                  <TableCell colSpan={8} className="text-center text-gray-400 py-4">
                    Ingen dividendeinformation fundet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {dividends.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700 text-right">
              <p className="text-sm text-gray-400">
                Total Modtaget (DKK, Sidste 12mdr - eksempel):
                <span className="font-semibold text-lg text-white ml-2">
                  {totalDkkReceivedLast12Months.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">*Data er vejledende og før skat. Valutaomregning ikke implementeret for total.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}