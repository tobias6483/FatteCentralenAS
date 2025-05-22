import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import React from 'react';
import { AdvancedOrder } from '../types';

interface ActiveAdvancedOrdersTableProps {
    orders: AdvancedOrder[];
    onCancelOrder: (orderId: string) => void;
    isLoading: boolean;
}

const getOrderStatusBadgeVariant = (status: AdvancedOrder['status']) => {
    switch (status) {
        case 'active':
            return 'default';
        case 'pending':
            return 'secondary';
        case 'triggered':
            return 'outline'; // Or another variant like 'success' if you have one
        case 'cancelled':
            return 'destructive';
        default:
            return 'default';
    }
};

const ActiveAdvancedOrdersTable: React.FC<ActiveAdvancedOrdersTableProps> = ({ orders, onCancelOrder, isLoading }) => {
    if (isLoading && orders.length === 0) {
        return (
            <div className="flex items-center justify-center py-10 rounded-lg bg-muted border p-4">
                <p className="text-sm text-muted-foreground">Henter aktive ordrer...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex items-center justify-center py-10 rounded-lg bg-muted border p-4">
                <p className="text-sm text-muted-foreground">Ingen aktive avancerede ordrer.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border overflow-hidden bg-card">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="text-foreground px-4 py-3">Oprettet</TableHead>
                        <TableHead className="text-foreground px-4 py-3">Symbol</TableHead>
                        <TableHead className="text-foreground px-4 py-3">Type</TableHead>
                        <TableHead className="text-right text-foreground px-4 py-3">Trigger/Limit Pris</TableHead>
                        <TableHead className="text-right text-foreground px-4 py-3">Antal</TableHead>
                        <TableHead className="text-foreground px-4 py-3">Status</TableHead>
                        <TableHead className="text-center text-foreground px-4 py-3">Annuller</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="px-4 py-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('da-DK')}</TableCell>
                            <TableCell className="font-medium px-4 py-3 text-foreground">{order.symbol}</TableCell>
                            <TableCell className="px-4 py-3 text-muted-foreground">
                                {order.orderType === 'stop-loss' && 'Stop-Loss'}
                                {order.orderType === 'take-profit' && 'Take-Profit'}
                                {order.orderType === 'limit-buy' && 'Limit Køb'}
                                {order.orderType === 'limit-sell' && 'Limit Sælg'}
                            </TableCell>
                            <TableCell className="text-right px-4 py-3">{order.price.toFixed(2)} DKK</TableCell> {/* Assuming DKK, adjust if currency varies */}
                            <TableCell className="text-right px-4 py-3">{order.quantity}</TableCell>
                            <TableCell className="px-4 py-3">
                                <Badge variant={getOrderStatusBadgeVariant(order.status)} className="capitalize">
                                    {order.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center px-4 py-3">
                                {order.status === 'active' || order.status === 'pending' ? (
                                    <Button
                                        variant="destructive" // Changed to destructive for cancel
                                        size="sm"
                                        onClick={() => onCancelOrder(order.id)}
                                        disabled={isLoading}
                                        className="hover:bg-destructive/80"
                                    >
                                        Annuller
                                    </Button>
                                ) : (
                                    <span>-</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default ActiveAdvancedOrdersTable;
