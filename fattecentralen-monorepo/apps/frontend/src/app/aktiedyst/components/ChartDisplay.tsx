import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'; // Assuming recharts for charts
import { AnalysisData, AnalysisFormData } from '../types';

interface ChartDisplayProps {
    selectedAnalysis: AnalysisFormData | null; // Changed from AnalysisFormData to selectedAnalysis
    analysisData: AnalysisData | null;
    isLoading: boolean;
}

// Mock data for chart - replace with actual data fetching and processing
const generateMockChartData = (indicator: string) => {
    const data = [];
    const today = new Date();
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        let value = Math.random() * 100 + 50; // Base price
        let upper, lower, signal;

        if (indicator === 'rsi') value = Math.random() * 70 + 15; // RSI range
        if (indicator === 'macd') {
            value = Math.random() * 10 - 5; // MACD line
            signal = value - (Math.random() * 2 - 1); // Signal line
        }
        if (indicator === 'bollinger') {
            upper = value + Math.random() * 10 + 5;
            lower = value - Math.random() * 10 - 5;
        }

        data.push({
            date: date.toLocaleDateString('da-DK', { month: 'short', day: 'numeric' }),
            price: indicator === 'price' || indicator === 'bollinger' ? parseFloat(value.toFixed(2)) : undefined,
            rsi: indicator === 'rsi' ? parseFloat(value.toFixed(2)) : undefined,
            macd: indicator === 'macd' ? parseFloat(value.toFixed(2)) : undefined,
            signal: indicator === 'macd' && signal !== undefined ? parseFloat(signal.toFixed(2)) : undefined,
            bollingerUpper: indicator === 'bollinger' && upper !== undefined ? parseFloat(upper.toFixed(2)) : undefined,
            bollingerLower: indicator === 'bollinger' && lower !== undefined ? parseFloat(lower.toFixed(2)) : undefined,
        });
    }
    return data;
};

const ChartDisplay: React.FC<ChartDisplayProps> = ({ selectedAnalysis, analysisData, isLoading }) => {
    if (isLoading) {
        return (
            <Card className="min-h-[400px] flex items-center justify-center">
                <CardContent>
                    <p className="text-muted-foreground">Henter grafdata...</p>
                </CardContent>
            </Card>
        );
    }

    if (!selectedAnalysis || !analysisData) {
        return (
            <Card className="min-h-[400px] flex items-center justify-center">
                <CardContent>
                    <p className="text-muted-foreground">Vælg et symbol og en indikator for at vise grafen.</p>
                </CardContent>
            </Card>
        );
    }

    const chartDataToDisplay = analysisData?.data || []; // Use analysisData.data
    const indicatorName = selectedAnalysis ? {
        price: 'Prisudvikling',
        rsi: 'Relative Strength Index (RSI)',
        macd: 'MACD',
        bollinger: 'Bollinger Bands',
        sma: 'Simple Moving Average (SMA)', // Added sma
        '': 'Vælg Indikator'
    }[selectedAnalysis.indicator] : 'Vælg Analyse';

    return (
        <Card>
            <CardHeader>
                <CardTitle>{indicatorName} for {selectedAnalysis?.symbol || 'N/A'}</CardTitle>
                <CardDescription>Tidsinterval: {selectedAnalysis?.interval || 'N/A'}</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDataToDisplay}> {/* Use chartDataToDisplay */}
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={selectedAnalysis?.indicator === 'rsi' ? [0, 100] : ['auto', 'auto']} />
                        <Tooltip
                            formatter={(value: number, name: string) => [
                                value.toFixed(2),
                                name === 'price' ? 'Pris' :
                                    name === 'rsi' ? 'RSI' :
                                        name === 'macd' ? 'MACD' :
                                            name === 'signal' ? 'Signal Linje' :
                                                name === 'bollingerUpper' ? 'Øvre Band' :
                                                    name === 'bollingerLower' ? 'Nedre Band' : name
                            ]}
                        />
                        <Legend />
                        {selectedAnalysis?.indicator === 'price' && <Line type="monotone" dataKey="value" stroke="#8884d8" name="Pris" activeDot={{ r: 6 }} />}
                        {selectedAnalysis?.indicator === 'rsi' && <Line type="monotone" dataKey="value" stroke="#82ca9d" name="RSI" activeDot={{ r: 6 }} />}
                        {selectedAnalysis?.indicator === 'sma' && <Line type="monotone" dataKey="value" stroke="#ffc658" name="SMA" activeDot={{ r: 6 }} />}
                        {selectedAnalysis?.indicator === 'macd' && (
                            <>
                                <Line type="monotone" dataKey="value" stroke="#8884d8" name="MACD" activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="signal" stroke="#82ca9d" name="Signal" activeDot={{ r: 6 }} />
                            </>
                        )}
                        {selectedAnalysis?.indicator === 'bollinger' && (
                            <>
                                <Line type="monotone" dataKey="value" stroke="#8884d8" name="Pris" activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="bollingerUpper" stroke="#ff7300" name="Øvre Band" activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="bollingerLower" stroke="#387908" name="Nedre Band" activeDot={{ r: 6 }} />
                            </>
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default ChartDisplay;
