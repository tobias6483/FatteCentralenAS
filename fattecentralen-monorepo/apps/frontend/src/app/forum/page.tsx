import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, MessageSquare, PlusCircle } from 'lucide-react';
import Link from 'next/link';

// Mock data - erstat med data fra API senere
const forumCategories = [
    {
        id: '1',
        name: 'Generel Diskussion',
        description: 'Snak om alt mellem himmel og jord relateret til FatteCentralen.',
        threads: [
            { id: 't1', title: 'Velkommen til det nye forum!', lastReply: 'For 5 minutter siden', repliesCount: 2, author: 'AdminFC' },
            { id: 't2', title: 'Forslag til nye funktioner', lastReply: 'For 1 time siden', repliesCount: 15, author: 'Bruger123' },
        ],
        icon: MessageSquare,
    },
    {
        id: '2',
        name: 'Live Sports Betting',
        description: 'Diskuter strategier, odds og kommende kampe.',
        threads: [
            { id: 't3', title: 'Champions League Finale - Hvem vinder?', lastReply: 'For 20 minutter siden', repliesCount: 35, author: 'BoldEkspert' },
            { id: 't4', title: 'Bedste betting sider i 2025?', lastReply: 'For 3 timer siden', repliesCount: 8, author: 'BetterMax' },
        ],
        icon: MessageSquare, // Kan skiftes til en mere specifik ikon
    },
    {
        id: '3',
        name: 'Aktiedysten',
        description: 'Tips, tricks og pral om dine aktiegevinster.',
        threads: [
            { id: 't5', title: 'Mine top 3 aktier for Q3', lastReply: 'For 45 minutter siden', repliesCount: 22, author: 'InvestoGirl' },
        ],
        icon: MessageSquare, // Kan skiftes
    },
];

export default function ForumIndexPage() {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Forum</h1>
                <Button asChild>
                    <Link href="/forum/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> Opret Ny Tråd
                    </Link>
                </Button>
            </div>

            <div className="space-y-6">
                {forumCategories.map((category) => (
                    <Card key={category.id}>
                        <CardHeader>
                            <div className="flex items-center space-x-3">
                                <category.icon className="h-6 w-6 text-primary" />
                                <CardTitle className="text-xl">{category.name}</CardTitle>
                            </div>
                            <CardDescription>{category.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {category.threads.length > 0 ? (
                                <ul className="space-y-3">
                                    {category.threads.map((thread) => (
                                        <li key={thread.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                                            <Link href={`/forum/${thread.id}`} className="group">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="text-md font-semibold group-hover:text-primary">{thread.title}</h3>
                                                        <p className="text-xs text-muted-foreground">
                                                            Af: {thread.author} | {thread.repliesCount} svar | Seneste: {thread.lastReply}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">Ingen tråde i denne kategori endnu.</p>
                            )}
                            <Button variant="link" className="p-0 h-auto mt-3 text-sm" asChild>
                                <Link href={`/forum/category/${category.id}`}>Se alle tråde i {category.name} <ChevronRight className="ml-1 h-4 w-4" /></Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
