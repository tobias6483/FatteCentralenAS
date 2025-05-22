import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ChevronRight, CornerDownRight, Edit3, Flag, MessageSquare, MoreVertical, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import Link from 'next/link';

// Mock data - erstat med data fra API senere
const mockThread = {
    id: 't1',
    title: 'Velkommen til det nye forum!',
    // Ensure category has a slug for breadcrumbs
    category: { name: 'Generel Diskussion', slug: 'generel-diskussion' },
    author: { name: 'AdminFC', avatarUrl: '/static/avatars/admin.png', joinDate: 'Jan 2023', postCount: 150, role: 'Administrator' },
    createdAt: 'For 2 dage siden', // More relative time
    posts: [
        {
            id: 'p1',
            author: { name: 'AdminFC', avatarUrl: '/static/avatars/admin.png', joinDate: 'Jan 2023', postCount: 150, role: 'Administrator' },
            createdAt: 'For 2 dage siden',
            content: `
                <p>Hej alle sammen,</p>
                <p>Velkommen til det spritnye FatteCentralen forum! Vi er glade for endelig at kunne lancere denne platform, hvor vi kan samles, diskutere og dele alt relateret til FatteCentralen.</p>
                <p>Dette forum er skabt for jer, vores fantastiske brugere. Her kan I:</p>
                <ul>
                    <li>Starte nye diskussioner og deltage i eksisterende.</li>
                    <li>Stille spørgsmål og få hjælp fra både teamet og andre brugere.</li>
                    <li>Dele jeres tips, tricks og strategier.</li>
                    <li>Give feedback og forslag til forbedringer af FatteCentralen.</li>
                </ul>
                <p>Vi opfordrer alle til at læse vores retningslinjer for god opførsel, så vi kan opretholde et positivt og konstruktivt miljø.</p>
                <p>Vi glæder os til at se jer aktive herinde!</p>
                <p>Med venlig hilsen,<br>FatteCentralen Teamet</p>
            `,
            isOriginalPost: true,
            reactions: { likes: 12, dislikes: 1 }, // Changed from upvotes/downvotes for clarity
        },
        {
            id: 'p2',
            author: { name: 'Bruger123', avatarUrl: '/static/avatars/user1.png', joinDate: 'Mar 2023', postCount: 45, role: 'Medlem' },
            createdAt: 'For 1 dag siden',
            content: `
                <p>Fedt initiativ! Det ser rigtig godt ud. Glæder mig til at bruge det.</p>
                <p>Et hurtigt spørgsmål: Kommer der en sektion for Aktiedysten specifikt?</p>
            `,
            reactions: { likes: 5, dislikes: 0 },
        },
        {
            id: 'p3',
            author: { name: 'BoldEkspert', avatarUrl: '/static/avatars/user2.png', joinDate: 'Feb 2024', postCount: 88, role: 'VIP Medlem' },
            createdAt: 'For 1 dag siden',
            content: `
                <p>Super! Endelig et sted vi kan diskutere live betting strategier uden at spamme andre kanaler.</p>
                <p>Godt arbejde, FC Team! 👍</p>
            `,
            reactions: { likes: 8, dislikes: 0 },
        },
        {
            id: 'p4',
            author: { name: 'AdminFC', avatarUrl: '/static/avatars/admin.png', joinDate: 'Jan 2023', postCount: 151, role: 'Administrator' }, // Post count incremented
            createdAt: 'For 23 timer siden',
            content: `
                <p>Tak for den positive feedback @Bruger123 og @BoldEkspert!</p>
                <p>@Bruger123: Ja, der er allerede en kategori for <a href="/forum/category/aktiedysten" class="text-primary hover:underline">Aktiedysten</a>. Du kan finde den i forumoversigten.</p>
                <p>Vi lytter altid til jeres forslag, så bliv endelig ved med at dele dem.</p>
            `,
            reactions: { likes: 3, dislikes: 0 },
        },
    ]
};


export default function ForumThreadPage({ params }: { params: { threadIdOrSlug: string } }) {
    // In a real app, fetch thread data based on params.threadIdOrSlug
    const thread = mockThread; // Using mock data

    if (!thread) {
        return (
            <div className="container mx-auto py-8 px-4 md:px-6 text-center">
                <p className="text-xl text-muted-foreground">Tråd ikke fundet.</p>
                <Button variant="outline" asChild className="mt-4">
                    <Link href="/forum">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Tilbage til forumoversigt
                    </Link>
                </Button>
            </div>
        );
    }

    const { title, category, posts } = thread;

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            {/* Breadcrumbs */}
            <div className="mb-6 text-sm text-muted-foreground flex items-center space-x-1.5">
                <Link href="/forum" className="hover:text-primary">Forum</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href={`/forum/category/${category.slug}`} className="hover:text-primary">{category.name}</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground truncate max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl">{title}</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground w-full md:w-auto">
                    {/* Assuming a reply takes you to the bottom or a new page/modal */}
                    <Link href={`#quick-reply`}>
                        <CornerDownRight className="mr-2 h-5 w-5" /> Svar på tråd
                    </Link>
                </Button>
            </div>

            {/* Posts */}
            <div className="space-y-6">
                {posts.map((post) => (
                    <Card key={post.id} className={`shadow-md overflow-hidden ${post.isOriginalPost ? 'border-primary border-2 ring-1 ring-primary' : ''}`}>
                        <CardHeader className="p-4 bg-muted/30 flex flex-row justify-between items-start gap-2">
                            <div className="flex items-start space-x-3 flex-grow">
                                <Avatar className="h-10 w-10 md:h-12 md:w-12 border">
                                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                                    <AvatarFallback>{post.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <p className="font-semibold text-sm md:text-base">{post.author.name}</p>
                                    <div className="text-xs text-muted-foreground space-x-2">
                                        <span>{post.author.role}</span>
                                        <span>•</span>
                                        <span>Medlem: {post.author.joinDate}</span>
                                        <span>•</span>
                                        <span>Posts: {post.author.postCount}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                                <p>Postet: {post.createdAt}</p>
                                {post.isOriginalPost && <Badge variant="secondary" className="mt-1 text-xs">Original Post</Badge>}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 mt-1 ml-auto">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="text-sm">
                                        <DropdownMenuItem>
                                            <Edit3 className="mr-2 h-3.5 w-3.5" /> Rediger
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <CornerDownRight className="mr-2 h-3.5 w-3.5" /> Citer
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Slet
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Flag className="mr-2 h-3.5 w-3.5" /> Anmeld
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        {/* Ensure prose styles are available or Tailwind typography plugin is installed */}
                        <CardContent className="p-4 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
                        <CardFooter className="p-3 bg-muted/30 border-t flex justify-between items-center">
                            <div className="flex items-center space-x-1 md:space-x-2">
                                <Button variant="ghost" size="sm" className="group text-muted-foreground hover:text-green-600">
                                    <ThumbsUp className="h-4 w-4 mr-1 group-hover:text-green-500" /> ({post.reactions.likes})
                                </Button>
                                <Button variant="ghost" size="sm" className="group text-muted-foreground hover:text-red-600">
                                    <ThumbsDown className="h-4 w-4 mr-1 group-hover:text-red-500" /> ({post.reactions.dislikes})
                                </Button>
                            </div>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <CornerDownRight className="mr-1.5 h-4 w-4" /> Svar
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* TODO: Pagination for posts - consider if needed or use infinite scroll */}
            <div className="mt-8 flex justify-center">
                {/* Example: <Button variant="outline">Load More Posts</Button> */}
            </div>

            {/* Quick Reply Form */}
            <div id="quick-reply" className="mt-8 scroll-mt-20"> {/* scroll-mt for better anchor link focus */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <h3 className="text-xl font-semibold flex items-center">
                            <MessageSquare className="mr-2 h-6 w-6 text-primary" /> Hurtigt Svar
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <Textarea placeholder={`Svar på "${title}"...`} rows={5} className="text-base" />
                    </CardContent>
                    <CardFooter className="flex justify-end border-t pt-4">
                        <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <MessageSquare className="mr-2 h-5 w-5" /> Send Svar
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
