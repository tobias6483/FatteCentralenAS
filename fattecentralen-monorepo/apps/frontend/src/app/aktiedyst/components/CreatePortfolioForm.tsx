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
interface CreatePortfolioFormProps {
    // onSubmit: (data: { name: string; currency: string }) => void;
    // isLoading: boolean;
}

export function CreatePortfolioForm({ }: CreatePortfolioFormProps) {
    // const [name, setName] = useState("");
    // const [currency, setCurrency] = useState("DKK");

    // const handleSubmit = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     if (name.trim() && currency) {
    //         onSubmit({ name, currency });
    //     }
    // };

    return (
        <form
            onSubmit={(e) => e.preventDefault()} // Prevent default for static version
            className="grid sm:grid-cols-3 gap-4 items-end p-4 bg-card border border-border rounded-lg mb-6 shadow-md"
        >
            <div className="sm:col-span-1">
                <Label htmlFor="portfolio-name" className="text-sm font-medium text-muted-foreground mb-1 block">Porteføljenavn</Label>
                <Input
                    id="portfolio-name"
                    placeholder="F.eks. Min Teknologi Portefølje"
                    className="mt-1 w-full bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
                // value={name}
                // onChange={(e) => setName(e.target.value)}
                // disabled={isLoading}
                />
            </div>
            <div>
                <Label htmlFor="portfolio-currency" className="text-sm font-medium text-muted-foreground mb-1 block">Valuta</Label>
                <Select
                    defaultValue="DKK"
                // value={currency}
                // onValueChange={setCurrency}
                // disabled={isLoading}
                >
                    <SelectTrigger id="portfolio-currency" className="mt-1 w-full bg-input border-border text-foreground focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Vælg valuta" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                        <SelectItem value="DKK" className="hover:bg-muted focus:bg-muted">DKK (Danske Kroner)</SelectItem>
                        <SelectItem value="USD" className="hover:bg-muted focus:bg-muted">USD (US Dollar)</SelectItem>
                        <SelectItem value="EUR" className="hover:bg-muted focus:bg-muted">EUR (Euro)</SelectItem>
                        {/* Add more currencies as needed */}
                    </SelectContent>
                </Select>
            </div>
            <Button
                type="submit"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-colors"
            // disabled={isLoading || !name.trim() || !currency}
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                {/* {isLoading ? 'Opretter...' : 'Opret Ny Portefølje'} */}
                Opret Ny Portefølje
            </Button>
            {/* Placeholder for error messages - styled for dark theme */}
            {/* <p className="text-sm text-red-accent mt-1 sm:col-span-3">Fejl ved oprettelse.</p> */}
        </form>
    );
}
