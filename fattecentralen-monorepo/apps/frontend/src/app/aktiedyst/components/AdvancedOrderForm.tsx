import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';
import { AdvancedOrderFormData } from '../types';

interface AdvancedOrderFormProps {
    ownedSymbols: string[]; // For datalist suggestions
    onSubmit: (data: AdvancedOrderFormData) => void;
    isLoading: boolean;
}

const AdvancedOrderForm: React.FC<AdvancedOrderFormProps> = ({ ownedSymbols, onSubmit, isLoading }) => {
    const [symbol, setSymbol] = React.useState('');
    const [orderType, setOrderType] = React.useState<'stop-loss' | 'take-profit' | 'limit-buy' | 'limit-sell' | ''>('');
    const [price, setPrice] = React.useState<number | ''>('');
    const [quantity, setQuantity] = React.useState<number | ''>('');
    const [error, setError] = React.useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!symbol || !orderType || price === '' || quantity === '') {
            setError('Alle felter skal udfyldes.');
            return;
        }
        if (price <= 0 || quantity <= 0) {
            setError('Pris og antal skal være positive tal.');
            return;
        }
        onSubmit({ symbol, orderType, price, quantity });
        // Optionally reset form: setSymbol(''); setOrderType(''); setPrice(''); setQuantity('');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Opret Avanceret Ordre</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <Label htmlFor="adv-order-symbol">Symbol</Label>
                            <Input
                                id="adv-order-symbol"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                                placeholder="F.eks. AAPL"
                                list="ownedSymbolsDataList"
                                required
                            />
                            <datalist id="ownedSymbolsDataList">
                                {ownedSymbols.map((s) => (
                                    <option key={s} value={s} />
                                ))}
                            </datalist>
                        </div>

                        <div>
                            <Label htmlFor="adv-order-type">Ordretype</Label>
                            <Select
                                value={orderType}
                                onValueChange={(value) => setOrderType(value as typeof orderType)}
                                required
                            >
                                <SelectTrigger id="adv-order-type">
                                    <SelectValue placeholder="Vælg ordretype..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stop-loss">Stop-Loss (Sælg ved/under pris)</SelectItem>
                                    <SelectItem value="take-profit">Take-Profit (Sælg ved/over pris)</SelectItem>
                                    <SelectItem value="limit-buy">Limit Køb (Køb ved/under pris)</SelectItem>
                                    <SelectItem value="limit-sell">Limit Sælg (Sælg ved/over pris)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="adv-order-price">Trigger/Limit Pris</Label>
                            <Input
                                id="adv-order-price"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                placeholder="Pris"
                                required
                                min="0"
                                step="any"
                            />
                        </div>

                        <div>
                            <Label htmlFor="adv-order-shares">Antal / Mængde</Label>
                            <Input
                                id="adv-order-shares"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                placeholder="Antal"
                                required
                                min="0"
                                step="any"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="col-span-full pt-2">
                        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                            {isLoading ? 'Opretter...' : 'Opret Ordre'}
                        </Button>
                    </div>
                    <div className="col-span-full">
                        <p className="text-xs text-muted-foreground">
                            F.eks: Sæt et Stop-Loss på AAPL ved 170 USD for 5 aktier.
                        </p>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default AdvancedOrderForm;
