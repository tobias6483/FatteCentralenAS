import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronLeft, Flame, MessageSquare, PlusCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

// Mock data - erstat med data fra API senere
const mockCategory = {
    id: '1',
    slug: 'generel-diskussion',
    name: 'Generel Diskussion',
    description: 'Snak om alt mellem himmel og jord relateret til FatteCentralen.',
    icon: MessageSquare, // Placeholder
    threads: [
        { id: 't1', slug: 'velkommen-til-det-nye-forum', title: 'Velkommen til det nye forum!', lastPostInfo: { author: 'AdminFC', timestamp: 'For 5 minutter siden', isNew: true }, repliesCount: 2, author: 'AdminFC', isHot: false, views: 120 },
        { id: 't2', slug: 'forslag-til-nye-funktioner', title: 'Forslag til nye funktioner', lastPostInfo: { author: 'Bruger123', timestamp: 'For 1 time siden', isNew: undefined }, repliesCount: 15, author: 'Bruger123', isHot: true, views: 560 },
        { id: 't7', slug: 'feedback-paa-seneste-opdatering', title: 'Feedback på seneste opdatering', lastPostInfo: { author: 'KritiskBruger', timestamp: 'For 3 timer siden', isNew: undefined }, repliesCount: 7, author: 'KritiskBruger', isHot: false, views: 250 },
    ],
};

// Helper function to get category icon (replace with actual logic if icons are dynamic)
const getCategoryIcon = (slug: string) => {
    if (slug === 'live-sports-betting') return Flame;
    if (slug === 'aktiedysten') return TrendingUp;
    return MessageSquare; // Default
};


export default async function ForumCategoryPage({ params }: { params: { categoryIdOrSlug: string } }) {
    // In a real app, you would fetch category data based on params.categoryIdOrSlug
    // For now, we'll use the mock data and try to find a match or default
    const categoryName = params.categoryIdOrSlug.replace(/-/g, ' ').replace(/\b(\w)/g, s => s.toUpperCase());
    const CategoryIcon = getCategoryIcon(params.categoryIdOrSlug);


    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="mb-8">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/forum">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Tilbage til forumoversigt
                    </Link>
                </Button>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                    <CategoryIcon className="h-10 w-10 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">{mockCategory.name}</h1>
                </div>
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href={`/forum/new?category=${params.categoryIdOrSlug}`}>
                        <PlusCircle className="mr-2 h-5 w-5" /> Opret Ny Tråd
                    </Link>
                </Button>
            </div>
            <p className="text-lg text-muted-foreground mb-8">{mockCategory.description}</p>

            <Card className="shadow-md">
                <CardHeader className="bg-muted/50 px-4 py-3 border-b">
                    <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-muted-foreground">
                        <div className="col-span-6">Tråd</div>
                        <div className="col-span-1 text-center">Svar</div>
                        <div className="col-span-1 text-center">Visn.</div>
                        <div className="col-span-4">Seneste Aktivitet</div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {mockCategory.threads.length > 0 ? (
                        <ul className="divide-y divide-border">
                            {mockCategory.threads.map((thread) => (
                                <li key={thread.id} className="hover:bg-muted/30 transition-colors">
                                    <Link href={`/forum/threads/${thread.slug}`} className="grid grid-cols-12 gap-4 items-center p-4">
                                        <div className="col-span-6">
                                            <div className="flex items-center">
                                                <h3 className="text-base font-semibold group-hover:text-primary">{thread.title}</h3>
                                                {thread.isHot && <Badge variant="outline" className="ml-2 border-amber-500 text-amber-600 text-xs px-1.5 py-0.5">Hot 🔥</Badge>}
                                                {thread.lastPostInfo?.isNew && <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5">NY</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Af: <span className="font-medium">{thread.author}</span>
                                            </p>
                                        </div>
                                        <div className="col-span-1 text-center text-sm text-muted-foreground">{thread.repliesCount}</div>
                                        <div className="col-span-1 text-center text-sm text-muted-foreground">{thread.views}</div>
                                        <div className="col-span-4 text-sm text-muted-foreground">
                                            <p>{thread.lastPostInfo.author}</p>
                                            <p className="text-xs">{thread.lastPostInfo.timestamp}</p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted-foreground py-10">Ingen tråde i denne kategori endnu.</p>
                    )}
                </CardContent>
            </Card>

            {/* TODO: Pagination */}
            <div className="mt-8 flex justify-center">
                {/* Placeholder for pagination controls */}
            </div>
        </div>
    );
}
