'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation'; // Added for reading search params
import { useEffect, useState } from 'react'; // Added for managing selected category

// Updated mock data with slugs
const forumCategories = [
    { id: '1', slug: 'generel-diskussion', name: 'Generel Diskussion' },
    { id: '2', slug: 'live-sports-betting', name: 'Live Sports Betting' },
    { id: '3', slug: 'aktiedysten', name: 'Aktiedysten' },
    { id: '4', slug: 'teknisk-support', name: 'Teknisk Support' },
];

export default function NewForumThreadPage() {
    const searchParams = useSearchParams();
    const initialCategorySlug = searchParams.get('category');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (initialCategorySlug) {
            const category = forumCategories.find(c => c.slug === initialCategorySlug);
            if (category) {
                setSelectedCategoryId(category.id);
            }
        }
    }, [initialCategorySlug]);

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="mb-6">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/forum">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Tilbage til forumoversigt
                    </Link>
                </Button>
            </div>

            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl">Opret Ny Forum Tråd</CardTitle>
                    <CardDescription>
                        Del dine tanker, spørgsmål eller ideer med fællesskabet.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="thread-title">Trådtitel</Label>
                        <Input id="thread-title" placeholder="En fængende titel til din tråd" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="thread-category">Kategori</Label>
                        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                            <SelectTrigger id="thread-category">
                                <SelectValue placeholder="Vælg en kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {forumCategories.map(category => (
                                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="thread-content">Indhold</Label>
                        <Textarea
                            id="thread-content"
                            placeholder="Skriv din besked her...
Understøtter grundlæggende Markdown."
                            rows={10}
                        />
                        <p className="text-xs text-muted-foreground">
                            Du kan bruge Markdown til at formatere din tekst (f.eks. **fed**, *kursiv*, [links](url)).
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit"> {/* Form submission logic to be added later */}
                        <Send className="mr-2 h-4 w-4" /> Opret Tråd
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
