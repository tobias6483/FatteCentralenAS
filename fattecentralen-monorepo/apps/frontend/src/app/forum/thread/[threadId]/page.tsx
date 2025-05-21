import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CornerUpLeft, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import Link from 'next/link';

// Mock data - erstat med data fra API senere
const mockThread = {
    id: 't1',
    title: 'Velkommen til det nye forum!',
    category: { id: '1', name: 'Generel Diskussion' },
    author: { username: 'AdminFC', avatarUrl: '/placeholder-avatar.png' }, // Sørg for placeholder
    createdAt: '19. maj 2025, 10:00',
    posts: [
        {
            id: 'p1',
            author: { username: 'AdminFC', avatarUrl: '/placeholder-avatar.png' },
            createdAt: '19. maj 2025, 10:00',
            content: '<p>Hej alle sammen!</p><p>Velkommen til det spritnye FatteCentralen forum. Vi håber, I vil tage godt imod det og bruge det til at diskutere alt mellem himmel og jord - selvfølgelig med respekt for hinanden.</p><p>Vi glæder os til at se jeres input!</p>',
            upvotes: 15,
            downvotes: 1,
        },
        {
            id: 'p2',
            author: { username: 'Bruger123', avatarUrl: '/placeholder-avatar.png' }, // Sørg for placeholder
            createdAt: '19. maj 2025, 10:35',
            content: '<p>Fedt initiativ! Det ser godt ud. Glæder mig til at deltage.</p>',
            upvotes: 8,
            downvotes: 0,
        },
        {
            id: 'p3',
            author: { username: 'KritiskKaj', avatarUrl: '/placeholder-avatar.png' }, // Sørg for placeholder
            createdAt: '19. maj 2025, 11:15',
            content: '<p>Hmm, er der planer om en mørk tilstand? Det ville være rart for øjnene.</p>',
            upvotes: 5,
            downvotes: 0,
        },
    ]
};

interface ForumThreadPageProps {
    params: { threadId: string };
}

export default function ForumThreadPage({ params }: ForumThreadPageProps) {
    // I en rigtig applikation ville threadId bruges til at hente data
    const thread = mockThread; // Bruger mock data for nu

    if (!thread) {
        return <p>Tråd ikke fundet.</p>; // Eller en mere avanceret 404 side
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

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl">{thread.title}</CardTitle>
                    <CardDescription>
                        I kategorien <Link href={`/forum/category/${thread.category.id}`} className="text-primary hover:underline">{thread.category.name}</Link> | Oprettet af {thread.author.username} den {thread.createdAt}
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="space-y-6">
                {thread.posts.map((post, index) => (
                    <Card key={post.id} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-start space-x-4 bg-muted/50 p-4 border-b">
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={post.author.avatarUrl} alt={post.author.username} />
                                <AvatarFallback>{post.author.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="grow">
                                <p className="font-semibold">{post.author.username}</p>
                                <p className="text-xs text-muted-foreground">{post.createdAt}</p>
                            </div>
                            <div className="text-xs text-muted-foreground">#{index + 1}</div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div dangerouslySetInnerHTML={{ __html: post.content }} className="prose dark:prose-invert max-w-none" />
                        </CardContent>
                        <CardFooter className="bg-muted/50 p-3 flex justify-between items-center border-t">
                            <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500">
                                    <ThumbsUp className="mr-1 h-4 w-4" /> ({post.upvotes})
                                </Button>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                                    <ThumbsDown className="mr-1 h-4 w-4" /> ({post.downvotes})
                                </Button>
                            </div>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <CornerUpLeft className="mr-1 h-4 w-4" /> Svar
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Skriv et svar</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea placeholder="Dit svar her..." rows={5} />
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button>
                        <MessageSquare className="mr-2 h-4 w-4" /> Send Svar
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
