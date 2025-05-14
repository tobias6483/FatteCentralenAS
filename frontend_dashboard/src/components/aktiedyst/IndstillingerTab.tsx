"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { CogIcon, KeyIcon, BellIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AktiedystSettings {
  dataSourceApiKey: string;
  defaultCurrency: 'DKK' | 'USD' | 'EUR';
  refreshRate: '30' | '60' | '300' | '0'; // seconds, 0 for manual
  enableNotifications: boolean;
}

export default function IndstillingerTab() {
  const [settings, setSettings] = useState<AktiedystSettings>({
    dataSourceApiKey: '',
    defaultCurrency: 'DKK',
    refreshRate: '60',
    enableNotifications: true,
  });
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleInputChange = (field: keyof AktiedystSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: keyof AktiedystSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value as AktiedystSettings[keyof AktiedystSettings] }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate saving settings
    console.log("Saving settings:", settings);
    // Add toast notification for success
  };

  const handleResetAktiedyst = async () => {
    if (resetConfirmationInput !== "NULSTIL") {
      // Add toast notification for error
      console.error("Reset confirmation text does not match.");
      return;
    }
    setIsResetting(true);
    // Simulate API call for reset
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Aktiedyst data has been reset.");
    // Add toast notification for success
    // Potentially redirect or refresh data
    setIsResetting(false);
    setResetConfirmationInput('');
    // Close dialog programmatically if needed, or rely on DialogClose
  };

  return (
    <div className="space-y-6 text-white">
      <form onSubmit={handleSaveSettings}>
        {/* API Integration Section */}
        <Card className="bg-gray-850 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <KeyIcon className="h-6 w-6 mr-2 text-sky-400" />
              API Integration (Valgfri)
            </CardTitle>
            <CardDescription className="text-gray-400">
              Indtast API nøgler hvis du ønsker at hente data fra eksterne kilder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label htmlFor="setting-datasource-api-key" className="block text-sm font-medium text-gray-300 mb-1">Ekstern Datakilde API Nøgle</label>
            <Input
              id="setting-datasource-api-key"
              type="password"
              value={settings.dataSourceApiKey}
              onChange={(e) => handleInputChange('dataSourceApiKey', e.target.value)}
              placeholder="Indtast din API nøgle"
              className="bg-gray-800 border-gray-600 focus:border-sky-500 text-white"
            />
          </CardContent>
        </Card>

        {/* Display Settings Section */}
        <Card className="bg-gray-850 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <CogIcon className="h-6 w-6 mr-2 text-sky-400" />
              Visningsindstillinger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="setting-default-currency" className="block text-sm font-medium text-gray-300 mb-1">Standard Valuta</label>
              <Select value={settings.defaultCurrency} onValueChange={(value) => handleSelectChange('defaultCurrency', value)}>
                <SelectTrigger className="w-[180px] bg-gray-800 border-gray-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="DKK">DKK</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="setting-refresh-rate" className="block text-sm font-medium text-gray-300 mb-1">Opdateringsfrekvens (kurser)</label>
              <Select value={settings.refreshRate} onValueChange={(value) => handleSelectChange('refreshRate', value)}>
                <SelectTrigger className="w-[180px] bg-gray-800 border-gray-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="30">30 sekunder</SelectItem>
                  <SelectItem value="60">1 minut</SelectItem>
                  <SelectItem value="300">5 minutter</SelectItem>
                  <SelectItem value="0">Manuelt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="enable-notifications"
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => handleInputChange('enableNotifications', checked)}
                className="data-[state=checked]:bg-sky-500"
              />
              <label htmlFor="enable-notifications" className="text-sm font-medium text-gray-300">Aktiver Notifikationer</label>
            </div>
          </CardContent>
          <CardFooter className="border-t border-gray-700 pt-4 mt-4">
            <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white">Gem Indstillinger</Button>
          </CardFooter>
        </Card>
      </form>

      {/* Reset Aktiedyst Section */}
      <Card className="bg-gray-850 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-xl text-red-400">
            <TrashIcon className="h-6 w-6 mr-2" />
            Nulstil Aktiedyst
          </CardTitle>
          <CardDescription className="text-gray-500">
            Advarsel: Dette sletter ALLE dine porteføljer, beholdninger, ordrer og transaktioner i aktiedysten permanent. Din startkapital vil blive gendannet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" /> Nulstil Min Aktiedyst Nu
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-400">
                  <ExclamationTriangleIcon className="h-6 w-6 mr-2" />Bekræft Total Nulstilling
                </DialogTitle>
                <DialogDescription className="text-gray-400 pt-2">
                  Er du <strong>helt sikker</strong> på, at du vil nulstille din aktiedyst? Denne handling kan IKKE fortrydes.
                  Skriv "NULSTIL" nedenfor for at bekræfte.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  id="reset-confirm"
                  value={resetConfirmationInput}
                  onChange={(e) => setResetConfirmationInput(e.target.value)}
                  placeholder='Skriv "NULSTIL" her'
                  className="bg-gray-800 border-gray-600 focus:border-red-500 text-white"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="text-gray-300 border-gray-600 hover:bg-gray-700">Annuller</Button>
                </DialogClose>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleResetAktiedyst}
                  disabled={resetConfirmationInput !== "NULSTIL" || isResetting}
                  className="bg-red-700 hover:bg-red-800"
                >
                  {isResetting ? "Nulstiller..." : "Ja, Nulstil ALT"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}