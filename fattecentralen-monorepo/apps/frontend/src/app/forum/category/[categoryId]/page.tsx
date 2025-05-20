import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowLeft, MessageSquare, PlusCircle } from 'lucide-react';
import Link from 'next/link';


// Mock data - erstat med data fra API senere
const allForumCategories = [
    { id: '1', name: 'Generel Diskussion', description: 'Snak om alt mellem himmel og jord relateret til FatteCentralen.', icon: MessageSquare },
    { id: '2', name: 'Live Sports Betting', description: 'Diskuter strategier, odds og kommende kampe.', icon: MessageSquare },
    { id: '3', name: 'Aktiedysten', description: 'Tips, tricks og pral om dine aktiegevinster.', icon: MessageSquare },
    { id: '4', name: 'Teknisk Support', description: 'Få hjælp til tekniske problemer med platformen.', icon: MessageSquare },
];

const mockThreadsForCategory = [
    { id: 't1', title: 'Velkommen til det nye forum!', lastReply: 'For 5 minutter siden', repliesCount: 2, author: 'AdminFC', views: 102 },
    { id: 't2', title: 'Forslag til nye funktioner', lastReply: 'For 1 time siden', repliesCount: 15, author: 'Bruger123', views: 345 },
    { id: 't6', title: 'Hvordan fungerer pointsystemet?', lastReply: 'For 2 timer siden', repliesCount: 5, author: 'NysgerrigPer', views: 88 },
    { id: 't7', title: 'Feedback på designet', lastReply: 'For 4 timer siden', repliesCount: 9, author: 'DesignGuru', views: 150 },
    // Tilføj flere tråde for at teste paginering
];

interface ForumCategoryPageProps {
    params: { categoryId: string };
}

export default function ForumCategoryPage({ params }: ForumCategoryPageProps) {
    const category = allForumCategories.find(cat => cat.id === params.categoryId);
    const threads = mockThreadsForCategory; // For nu, alle tråde er i alle kategorier

    if (!category) {
        return <p>Kategori ikke fundet.</p>; // Eller en 404 side
    }

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="mb-6">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/forum">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Tilbage til forumoversigt
                    </Link>
                </Button>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center">
                        <category.icon className="mr-3 h-8 w-8 text-primary" /> {category.name}
                    </h1>
                    <p className="text-muted-foreground mt-1">{category.description}</p>
                </div>
                <Button asChild>
                    <Link href={`/forum/new?category=${category.id}`}> {/* Pre-fill category in new thread page */}
                        <PlusCircle className="mr-2 h-4 w-4" /> Opret Ny Tråd i {category.name}
                    </Link>
                </Button>
            </div>

            {threads.length > 0 ? (
                <Card>
                    <CardHeader className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                        <div className="col-span-6">Tråd</div>
                        <div className="col-span-2 text-center hidden md:block">Svar</div>
                        <div className="col-span-1 text-center hidden md:block">Visn.</div>
                        <div className="col-span-3 text-right hidden md:block">Seneste Aktivitet</div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ul className="divide-y">
                            {threads.map((thread) => (
                                <li key={thread.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
                                    <div className="col-span-12 md:col-span-6">
                                        <Link href={`/forum/${thread.id}`} className="group">
                                            <h3 className="font-semibold group-hover:text-primary">{thread.title}</h3>
                                            <p className="text-xs text-muted-foreground">Af: {thread.author}</p>
                                        </Link>
                                    </div>
                                    <div className="col-span-2 text-center text-sm text-muted-foreground hidden md:block">{thread.repliesCount}</div>
                                    <div className="col-span-1 text-center text-sm text-muted-foreground hidden md:block">{thread.views}</div>
                                    <div className="col-span-3 text-right text-xs text-muted-foreground hidden md:block">
                                        {thread.lastReply}
                                    </div>
                                    <div className="col-span-12 md:hidden mt-2 pt-2 border-t text-xs text-muted-foreground">
                                        Svar: {thread.repliesCount} | Visn: {thread.views} | Seneste: {thread.lastReply}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-6 text-center">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Ingen tråde i denne kategori endnu.</p>
                    </CardContent>
                </Card>
            )}

            {threads.length > 5 && ( // Vis kun paginering hvis der er nok tråde
                <div className="mt-8 flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious href="#" />
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink href="#">1</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink href="#" isActive>2</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink href="#">3</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext href="#" />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
