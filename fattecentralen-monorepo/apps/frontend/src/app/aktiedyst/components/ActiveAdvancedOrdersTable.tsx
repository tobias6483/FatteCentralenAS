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
            <div className="flex items-center justify-center py-10">
                <p className="text-muted-foreground">Henter aktive ordrer...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex items-center justify-center py-10">
                <p className="text-muted-foreground">Ingen aktive avancerede ordrer.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Oprettet</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Trigger/Limit Pris</TableHead>
                    <TableHead className="text-right">Antal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Annuller</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map((order) => (
                    <TableRow key={order.id}>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString('da-DK')}</TableCell>
                        <TableCell className="font-medium">{order.symbol}</TableCell>
                        <TableCell>
                            {order.orderType === 'stop-loss' && 'Stop-Loss'}
                            {order.orderType === 'take-profit' && 'Take-Profit'}
                            {order.orderType === 'limit-buy' && 'Limit Køb'}
                            {order.orderType === 'limit-sell' && 'Limit Sælg'}
                        </TableCell>
                        <TableCell className="text-right">{order.price.toFixed(2)} DKK</TableCell> {/* Assuming DKK, adjust if currency varies */}
                        <TableCell className="text-right">{order.quantity}</TableCell>
                        <TableCell>
                            <Badge variant={getOrderStatusBadgeVariant(order.status)} className="capitalize">
                                {order.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                            {order.status === 'active' || order.status === 'pending' ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onCancelOrder(order.id)}
                                    disabled={isLoading} // Disable if any global loading state is active
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
    );
};

export default ActiveAdvancedOrdersTable;
