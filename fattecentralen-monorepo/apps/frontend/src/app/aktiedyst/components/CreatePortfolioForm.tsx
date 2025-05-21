"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";

// Props for form submission handling (to be added later)
interface CreatePortfolioFormProps { }

export function CreatePortfolioForm({ }: CreatePortfolioFormProps) {
    return (
        <form
            onSubmit={(e) => e.preventDefault()} // Prevent default for static version
            className="grid sm:grid-cols-3 gap-4 items-end p-4 border rounded-lg mb-6"
        >
            <div className="sm:col-span-1">
                <Label htmlFor="portfolio-name">Porteføljenavn</Label>
                <Input id="portfolio-name" placeholder="F.eks. Min Teknologi Portefølje" className="mt-1" />
            </div>
            <div>
                <Label htmlFor="portfolio-currency">Valuta</Label>
                <Select defaultValue="DKK">
                    <SelectTrigger id="portfolio-currency" className="mt-1">
                        <SelectValue placeholder="Vælg valuta" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="DKK">DKK (Danske Kroner)</SelectItem>
                        <SelectItem value="USD">USD (US Dollar)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        {/* Add more currencies as needed */}
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Opret Ny Portefølje
            </Button>
            {/* Placeholder for error messages */}
            {/* <p className="text-sm text-red-500 mt-1 sm:col-span-3">Fejl ved oprettelse.</p> */}
        </form>
    );
}
