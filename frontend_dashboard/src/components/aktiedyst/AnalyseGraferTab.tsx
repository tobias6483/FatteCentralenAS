"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // For time range
import { PresentationChartLineIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Placeholder for chart component - to be implemented with a library like Recharts
const PlaceholderChart = ({ symbol, indicator, timeRange }: { symbol?: string, indicator?: string, timeRange?: string }) => (
  <div className="h-96 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-gray-500">
    {symbol ? `Chart for ${symbol} (${indicator} - ${timeRange}) will be displayed here.` : 'Select an asset and analysis type to view chart.'}
  </div>
);

export default function AnalyseGraferTab() {
  const [analysisSymbol, setAnalysisSymbol] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState('price');
  const [selectedTimeRange, setSelectedTimeRange] = useState('1mo');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [displayChart, setDisplayChart] = useState(false);

  const handleRunAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisSymbol.trim()) {
      // Optionally show a toast or message to select a symbol
      setDisplayChart(false);
      return;
    }
    setIsLoadingAnalysis(true);
    // Simulate API call for analysis data
    setTimeout(() => {
      setDisplayChart(true);
      setIsLoadingAnalysis(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 text-white">
      {/* Analysis Tools Section */}
      <Card className="bg-gray-850 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <PresentationChartLineIcon className="h-6 w-6 mr-2 text-sky-400" />
            Værktøjer til Analyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRunAnalysis} className="space-y-4 md:space-y-0 md:grid md:grid-cols-12 md:gap-4 md:items-end">
            <div className="md:col-span-4">
              <label htmlFor="analysis-symbol" className="block text-sm font-medium text-gray-300 mb-1">Vælg Symbol</label>
              <Input
                id="analysis-symbol" type="text" value={analysisSymbol}
                onChange={(e) => setAnalysisSymbol(e.target.value)} placeholder="F.eks. AAPL"
                className="bg-gray-800 border-gray-600 focus:border-sky-500 text-white"
              />
            </div>
            <div className="md:col-span-3">
              <label htmlFor="analysis-indicator" className="block text-sm font-medium text-gray-300 mb-1">Vælg Indikator/Analyse</label>
              <Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="price">Pris Graf</SelectItem>
                  <SelectItem value="rsi">RSI (Relative Strength Index)</SelectItem>
                  <SelectItem value="macd">MACD</SelectItem>
                  <SelectItem value="bollinger">Bollinger Bands</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">Tidsramme</label>
              <ToggleGroup
                type="single"
                value={selectedTimeRange}
                onValueChange={(value: string) => { if (value) setSelectedTimeRange(value); }}
                className="justify-start bg-gray-800 rounded-md border border-gray-600 p-0.5"
              >
                {['1D', '5D', '1M', '6M', '1Y', 'MAX'].map(range => (
                  <ToggleGroupItem
                    key={range}
                    value={range.toLowerCase().replace('å', 'y')} // Ensure value matches state (e.g., 1y)
                    aria-label={`Vælg ${range}`}
                    className="px-3 py-1.5 data-[state=on]:bg-sky-600 data-[state=on]:text-white text-gray-300 hover:bg-gray-700 hover:text-sky-300 text-xs h-auto"
                  >
                    {range}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white h-10 flex items-center justify-center gap-2" disabled={isLoadingAnalysis}>
                {isLoadingAnalysis ? 'Analyserer...' : <><MagnifyingGlassIcon className="h-5 w-5" /> Vis Analyse</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Analysis Result Area */}
      {(isLoadingAnalysis || displayChart) && (
        <Card className="bg-gray-850 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">
              Analyse for {analysisSymbol.toUpperCase()} - {selectedIndicator.toUpperCase()} ({selectedTimeRange.toUpperCase()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAnalysis && (
              <div className="h-96 flex items-center justify-center text-gray-400">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Genererer analyse...
              </div>
            )}
            {!isLoadingAnalysis && displayChart && (
              <PlaceholderChart symbol={analysisSymbol} indicator={selectedIndicator} timeRange={selectedTimeRange} />
            )}
            {/* Placeholder for key figures/textual analysis */}
            {!isLoadingAnalysis && displayChart && analysisSymbol && (
              <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                <h4 className="text-md font-semibold mb-2">Nøgletal for {analysisSymbol.toUpperCase()}</h4>
                <p className="text-sm text-gray-400">[Nøgletal og yderligere tekstanalyse kommer her...]</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}