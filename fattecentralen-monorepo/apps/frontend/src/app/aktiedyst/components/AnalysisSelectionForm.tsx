import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { AnalysisFormData, Indicator, TimeInterval } from '../types'; // Ensure types are correctly imported

interface AnalysisSelectionFormProps {
    allSymbols: string[];
    formData: AnalysisFormData;
    onFormDataChange: (fieldName: keyof AnalysisFormData, value: string) => void;
    onSubmit: (data: AnalysisFormData) => void;
    isLoading: boolean;
}

const indicatorOptions: { value: Indicator; label: string }[] = [
    { value: 'price', label: 'Prisudvikling' },
    { value: 'sma', label: 'Simple Moving Average (SMA)' },
    { value: 'ema', label: 'Exponential Moving Average (EMA)' },
    { value: 'rsi', label: 'Relative Strength Index (RSI)' },
    { value: 'macd', label: 'MACD' },
    { value: 'bollinger', label: 'Bollinger Bands' },
    // Add other relevant indicators here
];

const intervalOptions: { value: TimeInterval; label: string }[] = [
    { value: '1D', label: '1 Dag' },
    { value: '5D', label: '5 Dage' },
    { value: '1M', label: '1 Måned' },
    { value: '3M', label: '3 Måneder' },
    { value: '6M', label: '6 Måneder' },
    { value: '1Y', label: '1 År' },
    { value: 'YTD', label: 'Year-to-Date' },
    // Add other relevant intervals here
];

const AnalysisSelectionForm: React.FC<AnalysisSelectionFormProps> = ({
    allSymbols,
    formData,
    onFormDataChange,
    onSubmit,
    isLoading,
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                    <Label htmlFor="symbol" className="text-sm font-medium text-muted-foreground mb-1 block">Symbol</Label>
                    <Select
                        value={formData.symbol}
                        onValueChange={(value) => onFormDataChange('symbol', value)}
                        disabled={isLoading}
                    >
                        <SelectTrigger id="symbol" className="w-full bg-input border-border text-foreground focus:ring-primary focus:border-primary">
                            <SelectValue placeholder="Vælg symbol" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                            {allSymbols.map((symbol) => (
                                <SelectItem key={symbol} value={symbol} className="hover:bg-muted focus:bg-muted">
                                    {symbol}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="indicator" className="text-sm font-medium text-muted-foreground mb-1 block">Indikator</Label>
                    <Select
                        value={formData.indicator}
                        onValueChange={(value) => onFormDataChange('indicator', value as Indicator)}
                        disabled={isLoading}
                    >
                        <SelectTrigger id="indicator" className="w-full bg-input border-border text-foreground focus:ring-primary focus:border-primary">
                            <SelectValue placeholder="Vælg indikator" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                            {indicatorOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="hover:bg-muted focus:bg-muted">
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="interval" className="text-sm font-medium text-muted-foreground mb-1 block">Tidsinterval</Label>
                    <Select
                        value={formData.interval}
                        onValueChange={(value) => onFormDataChange('interval', value as TimeInterval)}
                        disabled={isLoading}
                    >
                        <SelectTrigger id="interval" className="w-full bg-input border-border text-foreground focus:ring-primary focus:border-primary">
                            <SelectValue placeholder="Vælg interval" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                            {intervalOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="hover:bg-muted focus:bg-muted">
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Button
                type="submit"
                disabled={isLoading || !formData.symbol || !formData.indicator || !formData.interval}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-colors"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Henter data...
                    </>
                ) : (
                    'Vis Analyse'
                )}
            </Button>
        </form>
    );
};

export default AnalysisSelectionForm;
