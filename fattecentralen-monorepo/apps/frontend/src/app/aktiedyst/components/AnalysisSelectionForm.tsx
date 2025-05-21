import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';
import { AnalysisFormData, TimeInterval } from '../types';

interface AnalysisSelectionFormProps {
    allSymbols: string[];
    onSubmit: (data: AnalysisFormData) => void;
    isLoading: boolean;
    formData: AnalysisFormData;
    onFormDataChange: (fieldName: keyof AnalysisFormData, value: string | TimeInterval | AnalysisFormData['indicator']) => void; // Updated value type
}

const AnalysisSelectionForm: React.FC<AnalysisSelectionFormProps> = ({
    allSymbols,
    onSubmit,
    isLoading,
    formData,
    onFormDataChange
}) => {
    // const [symbol, setSymbol] = React.useState('');
    // const [indicator, setIndicator] = React.useState<'price' | 'rsi' | 'macd' | 'bollinger'>('price');
    // const [interval, setInterval] = React.useState<TimeInterval>('1D');
    const [error, setError] = React.useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!formData.symbol) {
            setError('Symbol skal udfyldes.');
            return;
        }
        onSubmit(formData);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Værktøjer til Analyse</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <Label htmlFor="analysis-symbol">Vælg Symbol</Label>
                            <Input
                                id="analysis-symbol"
                                value={formData.symbol}
                                onChange={(e) => onFormDataChange('symbol', e.target.value)}
                                placeholder="F.eks. AAPL, MSFT"
                                list="allSymbolsDataList"
                                required
                            />
                            <datalist id="allSymbolsDataList">
                                {allSymbols.map((s) => (
                                    <option key={s} value={s} />
                                ))}
                            </datalist>
                        </div>

                        <div>
                            <Label htmlFor="analysis-indicator">Vælg Indikator/Analyse</Label>
                            <Select
                                value={formData.indicator}
                                onValueChange={(value: AnalysisFormData['indicator']) => onFormDataChange('indicator', value)}
                            >
                                <SelectTrigger id="analysis-indicator">
                                    <SelectValue placeholder="Vælg indikator..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="price">Pris Graf</SelectItem>
                                    <SelectItem value="rsi">RSI (Relative Strength Index)</SelectItem>
                                    <SelectItem value="macd">MACD (Moving Average Convergence Divergence)</SelectItem>
                                    <SelectItem value="bollinger">Bollinger Bands</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="mb-2 block">Tidsramme for Graf</Label>
                            <RadioGroup
                                value={formData.interval} // Controlled component
                                onValueChange={(value: TimeInterval) => onFormDataChange('interval', value)}
                                className="flex space-x-2"
                                id="analysis-interval-group"
                            >
                                {(['1D', '5D', '1M', '6M', '1Y', 'MAX'] as TimeInterval[]).map((val: TimeInterval) => (
                                    <div key={val} className="flex items-center space-x-1">
                                        <RadioGroupItem value={val} id={`int-${val.toLowerCase()}`} />
                                        <Label htmlFor={`int-${val.toLowerCase()}`} className="font-normal cursor-pointer">{val}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

                    <div className="pt-2">
                        <Button type="submit" disabled={isLoading || !formData.symbol}>
                            {isLoading ? 'Henter data...' : 'Vis Analyse'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default AnalysisSelectionForm;
