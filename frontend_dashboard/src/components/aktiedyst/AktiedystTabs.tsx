"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BriefcaseIcon, MagnifyingGlassIcon, StarIcon, CogIcon, PresentationChartLineIcon, BanknotesIcon, ClockIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import OverviewHandelTab from './OverviewHandelTab';
import PortefoljerTab from './PortefoljerTab';
import WatchlistTab from './WatchlistTab';
import AvanceredeOrdrerTab from './AvanceredeOrdrerTab';
import AnalyseGraferTab from './AnalyseGraferTab';
import DividenderTab from './DividenderTab';
import TransaktionshistorikTab from './TransaktionshistorikTab';
import IndstillingerTab from './IndstillingerTab'; // Import the actual component

// Placeholder content components - these will be fleshed out later

export default function AktiedystTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full"> {/* Removed text-white, triggers will handle their own text color */}
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 bg-[var(--card-background)] p-2 rounded-lg border border-[var(--border)] shadow-sm">
        <TabsTrigger value="overview" className="flex items-center justify-center gap-2 text-muted-foreground data-[state=active]:bg-sky-600 data-[state=active]:text-primary-foreground hover:bg-sky-700/80 hover:text-primary-foreground py-2 px-3 rounded-md transition-colors">
          <MagnifyingGlassIcon className="h-5 w-5" /> Oversigt
        </TabsTrigger>
        <TabsTrigger value="portfolio" className="flex items-center justify-center gap-2 text-muted-foreground data-[state=active]:bg-sky-600 data-[state=active]:text-primary-foreground hover:bg-sky-700/80 hover:text-primary-foreground py-2 px-3 rounded-md transition-colors">
          <BriefcaseIcon className="h-5 w-5" /> Porteføljer
        </TabsTrigger>
        <TabsTrigger value="watchlist" className="flex items-center justify-center gap-2 text-muted-foreground data-[state=active]:bg-sky-600 data-[state=active]:text-primary-foreground hover:bg-sky-700/80 hover:text-primary-foreground py-2 px-3 rounded-md transition-colors">
          <StarIcon className="h-5 w-5" /> Watchlist
        </TabsTrigger>
        <TabsTrigger value="orders" className="flex items-center justify-center gap-2 text-muted-foreground data-[state=active]:bg-sky-600 data-[state=active]:text-primary-foreground hover:bg-sky-700/80 hover:text-primary-foreground py-2 px-3 rounded-md transition-colors">
          <AdjustmentsHorizontalIcon className="h-5 w-5" /> Ordrer
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center justify-center gap-2 text-muted-foreground data-[state=active]:bg-sky-600 data-[state=active]:text-primary-foreground hover:bg-sky-700/80 hover:text-primary-foreground py-2 px-3 rounded-md transition-colors">
          <PresentationChartLineIcon className="h-5 w-5" /> Analyse
        </TabsTrigger>
        <TabsTrigger value="dividends" className="flex items-center justify-center gap-2 text-muted-foreground data-[state=active]:bg-sky-600 data-[state=active]:text-primary-foreground hover:bg-sky-700/80 hover:text-primary-foreground py-2 px-3 rounded-md transition-colors">
          <BanknotesIcon className="h-5 w-5" /> Dividender
        </TabsTrigger>
        <TabsTrigger value="transactions" className="flex items-center justify-center gap-2 text-muted-foreground data-[state=active]:bg-sky-600 data-[state=active]:text-primary-foreground hover:bg-sky-700/80 hover:text-primary-foreground py-2 px-3 rounded-md transition-colors">
          <ClockIcon className="h-5 w-5" /> Historik
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center justify-center gap-2 text-muted-foreground data-[state=active]:bg-sky-600 data-[state=active]:text-primary-foreground hover:bg-sky-700/80 hover:text-primary-foreground py-2 px-3 rounded-md transition-colors">
          <CogIcon className="h-5 w-5" /> Indstillinger
        </TabsTrigger>
      </TabsList>
 
      <TabsContent value="overview" className="mt-4 bg-card text-card-foreground rounded-xl border py-6 shadow-sm">
        <OverviewHandelTab />
      </TabsContent>
      <TabsContent value="portfolio" className="mt-4 bg-card text-card-foreground rounded-xl border py-6 shadow-sm">
        <PortefoljerTab />
      </TabsContent>
      <TabsContent value="watchlist" className="mt-4 bg-card text-card-foreground rounded-xl border py-6 shadow-sm">
        <WatchlistTab />
      </TabsContent>
      <TabsContent value="orders" className="mt-4 bg-card text-card-foreground rounded-xl border py-6 shadow-sm">
        <AvanceredeOrdrerTab />
      </TabsContent>
      <TabsContent value="analytics" className="mt-4 bg-card text-card-foreground rounded-xl border py-6 shadow-sm">
        <AnalyseGraferTab />
      </TabsContent>
      <TabsContent value="dividends" className="mt-4 bg-card text-card-foreground rounded-xl border py-6 shadow-sm">
        <DividenderTab />
      </TabsContent>
      <TabsContent value="transactions" className="mt-4 bg-card text-card-foreground rounded-xl border py-6 shadow-sm">
        <TransaktionshistorikTab />
      </TabsContent>
      <TabsContent value="settings" className="mt-4 bg-card text-card-foreground rounded-xl border py-6 shadow-sm">
        <IndstillingerTab />
      </TabsContent>
    </Tabs>
  );
}