import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Flame, MessagesSquare, PlusCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

// Mock data - erstat med data fra API senere
const forumCategories = [
    {
        id: '1',
        slug: 'generel-diskussion',
        name: 'Generel Diskussion',
        description: 'Snak om alt mellem himmel og jord relateret til FatteCentralen.',
        icon: MessagesSquare,
        threadCount: 120,
        postCount: 1580,
        categoryLastActivity: {
            threadTitle: 'Forslag til nye funktioner',
            threadSlug: 'forslag-til-nye-funktioner',
            author: 'Bruger123',
            timestamp: 'For 1 time siden',
            isNew: true,
        },
        threads: [
            { id: 't1', slug: 'velkommen-til-det-nye-forum', title: 'Velkommen til det nye forum!', lastPostInfo: { author: 'AdminFC', timestamp: 'For 5 minutter siden', isNew: true }, repliesCount: 2, author: 'AdminFC', isHot: false },
            { id: 't2', slug: 'forslag-til-nye-funktioner', title: 'Forslag til nye funktioner', lastPostInfo: { author: 'Bruger123', timestamp: 'For 1 time siden', isNew: undefined }, repliesCount: 15, author: 'Bruger123', isHot: true },
        ],
    },
    {
        id: '2',
        slug: 'live-sports-betting',
        name: 'Live Sports Betting',
        description: 'Diskuter strategier, odds og kommende kampe.',
        icon: Flame,
        threadCount: 75,
        postCount: 930,
        categoryLastActivity: {
            threadTitle: 'Champions League Finale - Hvem vinder?',
            threadSlug: 'champions-league-finale-hvem-vinder',
            author: 'BoldEkspert',
            timestamp: 'For 20 minutter siden',
            isNew: true,
        },
        threads: [
            { id: 't3', slug: 'champions-league-finale-hvem-vinder', title: 'Champions League Finale - Hvem vinder?', lastPostInfo: { author: 'BoldEkspert', timestamp: 'For 20 minutter siden', isNew: undefined }, repliesCount: 35, author: 'BoldEkspert', isHot: true },
            { id: 't4', slug: 'bedste-betting-sider-2025', title: 'Bedste betting sider i 2025?', lastPostInfo: { author: 'BetterMax', timestamp: 'For 3 timer siden', isNew: undefined }, repliesCount: 8, author: 'BetterMax', isHot: false },
        ],
    },
    {
        id: '3',
        slug: 'aktiedysten',
        name: 'Aktiedysten',
        description: 'Tips, tricks og pral om dine aktiegevinster.',
        icon: TrendingUp,
        threadCount: 40,
        postCount: 620,
        categoryLastActivity: {
            threadTitle: 'Mine top 3 aktier for Q3',
            threadSlug: 'mine-top-3-aktier-for-q3',
            author: 'InvestoGirl',
            timestamp: 'For 45 minutter siden',
        },
        threads: [
            { id: 't5', slug: 'mine-top-3-aktier-for-q3', title: 'Mine top 3 aktier for Q3', lastPostInfo: { author: 'InvestoGirl', timestamp: 'For 45 minutter siden', isNew: undefined }, repliesCount: 22, author: 'InvestoGirl', isHot: true },
            { id: 't6', slug: 'hvordan-analyserer-i-en-aktie', title: 'Hvordan analyserer I en aktie?', lastPostInfo: { author: 'Lærenem', timestamp: 'For 2 dage siden', isNew: undefined }, repliesCount: 5, author: 'Lærenem', isHot: false },
        ],
    },
];

export default function ForumIndexPage() {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-bold tracking-tight">Forum Oversigt</h1>
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/forum/new">
                        <PlusCircle className="mr-2 h-5 w-5" /> Opret Ny Tråd
                    </Link>
                </Button>
            </div>

            <div className="space-y-8">
                {forumCategories.map((category) => (
                    <Card key={category.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <category.icon className="h-8 w-8 text-primary" />
                                    <CardTitle className="text-2xl font-semibold">{category.name}</CardTitle>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    <span>Tråde: {category.threadCount}</span>
                                    <span className="mx-2">|</span>
                                    <span>Posts: {category.postCount}</span>
                                </div>
                            </div>
                            <CardDescription className="pt-1 text-base">{category.description}</CardDescription>
                            {category.categoryLastActivity && (
                                <div className="text-xs text-muted-foreground pt-2 border-t border-border/50 mt-3">
                                    Seneste aktivitet:
                                    <Link href={`/forum/threads/${category.categoryLastActivity.threadSlug}`} className="font-medium hover:text-primary ml-1">
                                        {category.categoryLastActivity.threadTitle}
                                    </Link>
                                    <span className="ml-1">af {category.categoryLastActivity.author} ({category.categoryLastActivity.timestamp})</span>
                                    {category.categoryLastActivity.isNew && <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5">NY</Badge>}
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            {category.threads.length > 0 ? (
                                <ul className="space-y-3">
                                    {category.threads.map((thread) => (
                                        <li key={thread.id} className="border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
                                            <Link href={`/forum/threads/${thread.slug}`} className="group block p-2 hover:bg-muted/50 rounded-md">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-grow">
                                                        <div className="flex items-center">
                                                            <h3 className="text-lg font-medium group-hover:text-primary">{thread.title}</h3>
                                                            {thread.isHot && <Badge variant="outline" className="ml-2 border-amber-500 text-amber-600 text-xs px-1.5 py-0.5">Hot 🔥</Badge>}
                                                            {thread.lastPostInfo?.isNew && !category.categoryLastActivity?.isNew && <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5">NY</Badge>}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Af: <span className="font-medium">{thread.author}</span> | {thread.repliesCount} svar | Seneste: {thread.lastPostInfo.timestamp}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1 flex-shrink-0" />
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-muted-foreground py-4">Ingen tråde i denne kategori endnu.</p>
                            )}
                            <Button variant="link" className="p-0 h-auto mt-4 text-base text-primary hover:text-primary/80" asChild>
                                <Link href={`/forum/category/${category.slug}`}>Se alle tråde i {category.name} <ChevronRight className="ml-1 h-4 w-4" /></Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
