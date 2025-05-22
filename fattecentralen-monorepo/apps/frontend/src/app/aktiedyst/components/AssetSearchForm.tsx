"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

// Props would be added here for actual functionality, e.g., onSearch, isLoading
interface AssetSearchFormProps {
    // onSearch: (symbol: string) => void;
    // isLoading: boolean;
}

export function AssetSearchForm({ }: AssetSearchFormProps) {
    // const [searchTerm, setSearchTerm] = useState("");
    // const handleSubmit = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     if (searchTerm.trim()) {
    //         onSearch(searchTerm.trim());
    //     }
    // };

    return (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-3 p-1">
            <div>
                <Label htmlFor="asset-symbol-input" className="sr-only">Søg symbol</Label>
                <div className="flex space-x-2 items-center">
                    <div className="relative grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            id="asset-symbol-input"
                            placeholder="Søg symbol (f.eks. AAPL, NOVO B, BTC-USD)"
                            // value={searchTerm}
                            // onChange={(e) => setSearchTerm(e.target.value)}
                            // disabled={isLoading}
                            className="pl-10 w-full bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <Button
                        type="submit"
                        // disabled={isLoading || !searchTerm.trim()}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-colors"
                    >
                        {/* {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Søg'} */}
                        Søg
                    </Button>
                </div>
                {/* Placeholder for search error messages - styled for dark theme */}
                {/* <p className="text-sm text-red-accent mt-1">Søgning fejlede. Prøv igen.</p> */}
            </div>
        </form>
    );
}
