import { Button } from '@/components/ui/button';
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
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6 items-end">
                <div>
                    <Label htmlFor="adv-order-symbol" className="text-sm font-medium text-foreground mb-1.5 block">Symbol</Label>
                    <Input
                        id="adv-order-symbol"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        placeholder="F.eks. AAPL"
                        list="ownedSymbolsDataList"
                        required
                        className="bg-input text-foreground border-border placeholder:text-muted-foreground focus:ring-ring focus:border-primary rounded-md"
                    />
                    <datalist id="ownedSymbolsDataList">
                        {ownedSymbols.map((s) => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>
                </div>

                <div>
                    <Label htmlFor="adv-order-type" className="text-sm font-medium text-foreground mb-1.5 block">Ordretype</Label>
                    <Select
                        value={orderType}
                        onValueChange={(value) => setOrderType(value as typeof orderType)}
                    >
                        <SelectTrigger id="adv-order-type" className="bg-input text-foreground border-border data-[placeholder]:text-muted-foreground focus:ring-ring focus:border-primary rounded-md w-full">
                            <SelectValue placeholder="Vælg ordretype..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground border-border rounded-md shadow-md">
                            <SelectItem value="stop-loss" className="hover:bg-muted focus:bg-muted rounded-sm">Stop-Loss (Sælg ved/under pris)</SelectItem>
                            <SelectItem value="take-profit" className="hover:bg-muted focus:bg-muted rounded-sm">Take-Profit (Sælg ved/over pris)</SelectItem>
                            <SelectItem value="limit-buy" className="hover:bg-muted focus:bg-muted rounded-sm">Limit Køb (Køb ved/under pris)</SelectItem>
                            <SelectItem value="limit-sell" className="hover:bg-muted focus:bg-muted rounded-sm">Limit Sælg (Sælg ved/over pris)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="adv-order-price" className="text-sm font-medium text-foreground mb-1.5 block">Trigger/Limit Pris</Label>
                    <Input
                        id="adv-order-price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Pris"
                        required
                        min="0"
                        step="any"
                        className="bg-input text-foreground border-border placeholder:text-muted-foreground focus:ring-ring focus:border-primary rounded-md"
                    />
                </div>

                <div>
                    <Label htmlFor="adv-order-shares" className="text-sm font-medium text-foreground mb-1.5 block">Antal / Mængde</Label>
                    <Input
                        id="adv-order-shares"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Antal"
                        required
                        min="0"
                        step="any"
                        className="bg-input text-foreground border-border placeholder:text-muted-foreground focus:ring-ring focus:border-primary rounded-md"
                    />
                </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="col-span-full pt-3">
                <Button type="submit" className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? 'Opretter...' : 'Opret Ordre'}
                </Button>
            </div>
            <div className="col-span-full">
                <p className="text-xs text-muted-foreground pt-1">
                    F.eks: Sæt et Stop-Loss på AAPL ved 170 USD for 5 aktier.
                </p>
            </div>
        </form>
    );
};

export default AdvancedOrderForm;
