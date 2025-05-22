import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AnalysisData, AnalysisFormData } from '../types';

interface ChartDisplayProps {
    selectedAnalysis: AnalysisFormData | null;
    analysisData: AnalysisData | null;
    isLoading: boolean;
}

// Mock data generation can be kept for development/testing if needed, or removed if live data is always used.
// const generateMockChartData = ... (existing mock data function)

const ChartDisplay: React.FC<ChartDisplayProps> = ({ selectedAnalysis, analysisData, isLoading }) => {
    const cardBaseClasses = "bg-card border border-border text-card-foreground shadow-md";
    const mutedTextClasses = "text-muted-foreground";

    if (isLoading) {
        return (
            <Card className={`${cardBaseClasses} min-h-[400px] flex items-center justify-center`}>
                <CardContent className="p-6">
                    <p className={mutedTextClasses}>Henter grafdata...</p>
                </CardContent>
            </Card>
        );
    }

    if (!selectedAnalysis || !analysisData || !analysisData.data || analysisData.data.length === 0) {
        return (
            <Card className={`${cardBaseClasses} min-h-[400px] flex items-center justify-center`}>
                <CardContent className="p-6">
                    <p className={mutedTextClasses}>Vælg et symbol og en indikator for at vise grafen, eller ingen data tilgængelig.</p>
                </CardContent>
            </Card>
        );
    }

    const chartDataToDisplay = analysisData.data;
    const indicatorName = selectedAnalysis ? {
        price: 'Prisudvikling',
        rsi: 'Relative Strength Index (RSI)',
        macd: 'MACD',
        bollinger: 'Bollinger Bands',
        sma: 'Simple Moving Average (SMA)',
        ema: 'Exponential Moving Average (EMA)', // Added EMA
        '': 'Vælg Indikator'
    }[selectedAnalysis.indicator] : 'Vælg Analyse';

    // Define colors for dark theme
    const strokeColorPrimary = "hsl(var(--primary))" // Use primary color from theme
    const strokeColorSecondary = "hsl(var(--secondary))" // Use secondary color from theme
    const tyrkiskGrøn = "#40E0D0"; // Turkish Green
    const rødAccent = "#FF4136"; // Red Accent
    const gridStrokeColor = "hsl(var(--border))";
    const textColor = "hsl(var(--foreground))";
    const tooltipBackgroundColor = "hsl(var(--popover))";
    const tooltipTextColor = "hsl(var(--popover-foreground))";

    return (
        <Card className={cardBaseClasses}>
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl text-foreground">{indicatorName} for {selectedAnalysis?.symbol || 'N/A'}</CardTitle>
                <CardDescription className={`${mutedTextClasses} text-xs sm:text-sm`}>Tidsinterval: {selectedAnalysis?.interval || 'N/A'}</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] w-full p-2 sm:p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDataToDisplay}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                        <XAxis dataKey="date" stroke={textColor} tick={{ fill: textColor, fontSize: 12 }} />
                        <YAxis stroke={textColor} tick={{ fill: textColor, fontSize: 12 }} domain={selectedAnalysis?.indicator === 'rsi' ? [0, 100] : ['auto', 'auto']} />
                        <Tooltip
                            contentStyle={{ backgroundColor: tooltipBackgroundColor, borderColor: gridStrokeColor, borderRadius: '0.5rem' }}
                            labelStyle={{ color: tooltipTextColor, fontWeight: 'bold' }}
                            itemStyle={{ color: tooltipTextColor }}
                            formatter={(value: number, name: string, props: any) => {
                                const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
                                let displayName = name;
                                if (name === 'value') displayName = indicatorName;
                                else if (name === 'signal') displayName = 'Signal Linje';
                                else if (name === 'bollingerUpper') displayName = 'Øvre Band';
                                else if (name === 'bollingerLower') displayName = 'Nedre Band';
                                return [formattedValue, displayName];
                            }}
                        />
                        <Legend wrapperStyle={{ color: textColor, fontSize: '12px' }} />

                        {/* Conditional rendering of lines based on indicator */}
                        {selectedAnalysis?.indicator === 'price' && <Line type="monotone" dataKey="value" stroke={tyrkiskGrøn} name="Pris" activeDot={{ r: 6, fill: tyrkiskGrøn }} dot={{ r: 2, fill: tyrkiskGrøn }} />}
                        {selectedAnalysis?.indicator === 'rsi' && <Line type="monotone" dataKey="value" stroke={tyrkiskGrøn} name="RSI" activeDot={{ r: 6, fill: tyrkiskGrøn }} dot={{ r: 2, fill: tyrkiskGrøn }} />}
                        {selectedAnalysis?.indicator === 'sma' && <Line type="monotone" dataKey="value" stroke={tyrkiskGrøn} name="SMA" activeDot={{ r: 6, fill: tyrkiskGrøn }} dot={{ r: 2, fill: tyrkiskGrøn }} />}
                        {selectedAnalysis?.indicator === 'ema' && <Line type="monotone" dataKey="value" stroke={tyrkiskGrøn} name="EMA" activeDot={{ r: 6, fill: tyrkiskGrøn }} dot={{ r: 2, fill: tyrkiskGrøn }} />}

                        {selectedAnalysis?.indicator === 'macd' && (
                            <>
                                <Line type="monotone" dataKey="value" stroke={tyrkiskGrøn} name="MACD" activeDot={{ r: 6, fill: tyrkiskGrøn }} dot={{ r: 2, fill: tyrkiskGrøn }} />
                                <Line type="monotone" dataKey="signal" stroke={rødAccent} name="Signal" activeDot={{ r: 6, fill: rødAccent }} dot={{ r: 2, fill: rødAccent }} />
                            </>
                        )}
                        {selectedAnalysis?.indicator === 'bollinger' && (
                            <>
                                <Line type="monotone" dataKey="value" stroke={strokeColorPrimary} name="Pris" activeDot={{ r: 6, fill: strokeColorPrimary }} dot={{ r: 2, fill: strokeColorPrimary }} />
                                <Line type="monotone" dataKey="bollingerUpper" stroke={tyrkiskGrøn} name="Øvre Band" activeDot={{ r: 6, fill: tyrkiskGrøn }} dot={{ r: 2, fill: tyrkiskGrøn }} />
                                <Line type="monotone" dataKey="bollingerLower" stroke={rødAccent} name="Nedre Band" activeDot={{ r: 6, fill: rødAccent }} dot={{ r: 2, fill: rødAccent }} />
                            </>
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default ChartDisplay;
