"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheckIcon, ListBulletIcon, TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

interface AdvancedOrder {
  id: string;
  createdAt: string;
  symbol: string;
  type: 'stop-loss' | 'take-profit' | 'limit-buy' | 'limit-sell';
  triggerPrice: number;
  shares: number;
  status: 'active' | 'triggered' | 'cancelled';
}

// Dummy initial data
const initialAdvancedOrders: AdvancedOrder[] = [
  { id: 'ao1', createdAt: new Date(Date.now() - 86400000).toISOString(), symbol: 'AAPL', type: 'stop-loss', triggerPrice: 165.00, shares: 10, status: 'active' },
  { id: 'ao2', createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), symbol: 'TSLA', type: 'take-profit', triggerPrice: 200.00, shares: 5, status: 'active' },
  { id: 'ao3', createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), symbol: 'MSFT', type: 'limit-buy', triggerPrice: 320.00, shares: 8, status: 'active' },
];

export default function AvanceredeOrdrerTab() {
  const [advancedOrders, setAdvancedOrders] = useState<AdvancedOrder[]>(initialAdvancedOrders);
  const [newOrderSymbol, setNewOrderSymbol] = useState('');
  const [newOrderType, setNewOrderType] = useState<AdvancedOrder['type']>('stop-loss');
  const [newOrderPrice, setNewOrderPrice] = useState('');
  const [newOrderShares, setNewOrderShares] = useState('');

  const handleCreateAdvancedOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderSymbol.trim() || !newOrderPrice.trim() || !newOrderShares.trim()) return;

    const newOrder: AdvancedOrder = {
      id: `ao${advancedOrders.length + 1}`,
      createdAt: new Date().toISOString(),
      symbol: newOrderSymbol.toUpperCase(),
      type: newOrderType,
      triggerPrice: parseFloat(newOrderPrice),
      shares: parseInt(newOrderShares, 10),
      status: 'active',
    };
    setAdvancedOrders([newOrder, ...advancedOrders]); // Add to top
    setNewOrderSymbol('');
    // setNewOrderType('stop-loss'); // Keep selected type or reset?
    setNewOrderPrice('');
    setNewOrderShares('');
  };

  const handleCancelOrder = (id: string) => {
    setAdvancedOrders(
      advancedOrders.map(order =>
        order.id === id ? { ...order, status: 'cancelled' } : order
      )
    );
  };

  return (
    <div className="space-y-6 text-white">
      {/* Create Advanced Order Section */}
      <Card className="bg-gray-850 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <ShieldCheckIcon className="h-6 w-6 mr-2 text-sky-400" />
            Opret Avanceret Ordre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAdvancedOrder} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label htmlFor="adv-order-symbol" className="block text-sm font-medium text-gray-300 mb-1">Symbol</label>
              <Input
                id="adv-order-symbol" type="text" value={newOrderSymbol}
                onChange={(e) => setNewOrderSymbol(e.target.value)} placeholder="AAPL"
                className="bg-gray-800 border-gray-600 focus:border-sky-500 text-white" required
              />
            </div>
            <div>
              <label htmlFor="adv-order-type" className="block text-sm font-medium text-gray-300 mb-1">Ordretype</label>
              <Select value={newOrderType} onValueChange={(value) => setNewOrderType(value as AdvancedOrder['type'])}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="stop-loss">Stop-Loss (Sælg)</SelectItem>
                  <SelectItem value="take-profit">Take-Profit (Sælg)</SelectItem>
                  <SelectItem value="limit-buy">Limit Køb</SelectItem>
                  <SelectItem value="limit-sell">Limit Sælg</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="adv-order-price" className="block text-sm font-medium text-gray-300 mb-1">Trigger/Limit Pris</label>
              <Input
                id="adv-order-price" type="number" value={newOrderPrice}
                onChange={(e) => setNewOrderPrice(e.target.value)} placeholder="170.00"
                className="bg-gray-800 border-gray-600 focus:border-sky-500 text-white" required step="any"
              />
            </div>
            <div>
              <label htmlFor="adv-order-shares" className="block text-sm font-medium text-gray-300 mb-1">Antal</label>
              <Input
                id="adv-order-shares" type="number" value={newOrderShares}
                onChange={(e) => setNewOrderShares(e.target.value)} placeholder="10"
                className="bg-gray-800 border-gray-600 focus:border-sky-500 text-white" required step="any"
              />
            </div>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white h-10 flex items-center justify-center gap-2">
              <PlusCircleIcon className="h-5 w-5" /> Opret Ordre
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Advanced Orders Section */}
      <Card className="bg-gray-850 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <ListBulletIcon className="h-6 w-6 mr-2 text-sky-400" />
            Aktive Avancerede Ordrer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-800">
                <TableHead className="text-gray-300">Oprettet</TableHead>
                <TableHead className="text-gray-300">Symbol</TableHead>
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-right text-gray-300">Trigger/Limit Pris</TableHead>
                <TableHead className="text-right text-gray-300">Antal</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-center text-gray-300">Annuller</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advancedOrders.filter(o => o.status === 'active').length > 0 ?
                advancedOrders.filter(o => o.status === 'active').map(order => (
                <TableRow key={order.id} className="border-gray-700 hover:bg-gray-800">
                  <TableCell className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('da-DK')}</TableCell>
                  <TableCell className="font-medium">{order.symbol}</TableCell>
                  <TableCell>
                    {order.type === 'stop-loss' && 'Stop-Loss'}
                    {order.type === 'take-profit' && 'Take-Profit'}
                    {order.type === 'limit-buy' && 'Limit Køb'}
                    {order.type === 'limit-sell' && 'Limit Sælg'}
                  </TableCell>
                  <TableCell className="text-right">{order.triggerPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{order.shares}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'active' ? 'bg-blue-500 text-blue-100' :
                      order.status === 'triggered' ? 'bg-green-500 text-green-100' :
                      'bg-gray-600 text-gray-200'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {order.status === 'active' && (
                      <Button
                        variant="ghost" size="icon" onClick={() => handleCancelOrder(order.id)}
                        className="text-red-500 hover:bg-red-700 hover:text-white"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow className="border-gray-700 hover:bg-gray-800">
                  <TableCell colSpan={7} className="text-center text-gray-400 py-4">
                    Ingen aktive avancerede ordrer.
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