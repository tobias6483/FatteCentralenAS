'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/authStore";
import {
    Activity, ArrowDownRight, ArrowUpRight, BarChart3,
    Briefcase, CalendarDays,
    CircleDollarSign, Coins, ExternalLink, MessageCircle, Newspaper,
    Settings, ShieldCheck, Star,
    Trophy, Users, Wallet, Zap
} from "lucide-react";

const placeholderUserData = {
    username: "FatteKongen",
    email: "kongen@fattecentralen.dk",
    avatarUrl: "https://github.com/shadcn.png",
    rank: "System Admin",
    lastLogin: new Date(Date.now() - 3600 * 1000 * 2), // 2 hours ago
    balance: 12345.67,
    wins: 150,
    losses: 75,
    largestWin: 2500,
    largestLoss: -1000,
    netProfit: 1250.75,
    totalStaked: 50000,
};

const quickLinks = [
    { label: "Start Nyt Spil", href: "/game-area", icon: Zap, color: "text-sky-500" },
    { label: "Se Aktive Sessions", href: "/active-sessions", icon: Briefcase, color: "text-violet-500" },
    { label: "Min Spilhistorik", href: "/history", icon: CalendarDays, color: "text-amber-500" },
    { label: "Indstillinger", href: "/settings", icon: Settings, color: "text-foreground" },
];

const recentActivities = [
    { id: 1, text: "Vandt 500 kr. på FCK sejr", time: "1 time siden", type: "win" },
    { id: 2, text: "Tabte 200 kr. på Aktiedysten", time: "3 timer siden", type: "loss" },
    { id: 3, text: "Ny besked fra 'Admin'", time: "5 timer siden", type: "message" },
];

const forumPosts = [
    { id: 1, title: "Bedste strategi for Premier League?", author: "Boldtosse", replies: 12 },
    { id: 2, title: "Aktiedysten Q2 - Hvem vinder?", author: "Investor haj", replies: 34 },
];

const sessionsInvites = [
    { id: 1, name: "Fredagsbold med Gutterne", type: "Session", status: "Åben" },
    { id: 2, name: "Aktiedyst Udfordring", type: "Invite", status: "Afventer" },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(amount);
};

export default function DashboardPage() {
    const { user: authUser, isLoading: authIsLoading } = useAuthStore();

    let displayUsername: string = placeholderUserData.username;
    let displayEmail: string = placeholderUserData.email;
    let displayAvatarUrl: string = placeholderUserData.avatarUrl;
    let lastLoginDateString: string = new Date(placeholderUserData.lastLogin).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' });

    if (authIsLoading) {
        return (
            <div className="container mx-auto py-8 px-4 md:px-6 space-y-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
                <p>Loading user data...</p>
            </div>
        );
    }

    if (authUser) {
        displayUsername = authUser.displayName || authUser.email || `User (${authUser.uid ? authUser.uid.substring(0, 6) : 'N/A'})`;
        displayEmail = authUser.email || "Email not provided";
        displayAvatarUrl = authUser.photoURL || placeholderUserData.avatarUrl;

        const lastLoginTimestamp = authUser.metadata?.lastSignInTime;
        if (lastLoginTimestamp) {
            lastLoginDateString = new Date(lastLoginTimestamp).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' });
        } else {
            lastLoginDateString = "Last login not available";
        }
    }

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
            {/* Welcome Header */}
            <header className="fade-in-down">
                <h1 className="text-4xl font-bold tracking-tight">
                    Velkommen tilbage, <span className="text-primary">{displayUsername}!</span>
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                    Klar til at fatte nogle gevinster i dag? <Trophy className="inline-block h-5 w-5 text-yellow-500" />
                </p>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat Cards */}
                <Card className="lg:col-span-1 fade-in-up shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                        <Wallet className="h-5 w-5 text-primary" /> {/* Changed icon color */}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(placeholderUserData.balance)}</div>
                        <p className="text-xs text-muted-foreground">+20.1% fra sidste måned</p>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1 fade-in-up shadow-lg hover:shadow-xl transition-shadow" style={{ animationDelay: "0.1s" }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Wins / Losses</CardTitle>
                        <Star className="h-5 w-5 text-yellow-500" /> {/* Changed icon color */}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <span className="text-primary">{placeholderUserData.wins}</span> / <span className="text-destructive">{placeholderUserData.losses}</span> {/* Changed wins color */}
                        </div>
                        <p className="text-xs text-muted-foreground">Win rate: {((placeholderUserData.wins / (placeholderUserData.wins + placeholderUserData.losses || 1)) * 100).toFixed(1)}%</p>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1 fade-in-up shadow-lg hover:shadow-xl transition-shadow" style={{ animationDelay: "0.2s" }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Netto Profit</CardTitle>
                        <CircleDollarSign className="h-5 w-5 text-primary" /> {/* Changed icon color */}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${placeholderUserData.netProfit >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                            {formatCurrency(placeholderUserData.netProfit)}
                        </div>
                        <p className="text-xs text-muted-foreground">Største gevinst: {formatCurrency(placeholderUserData.largestWin)}</p>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1 fade-in-up shadow-lg hover:shadow-xl transition-shadow" style={{ animationDelay: "0.3s" }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Indsatser</CardTitle>
                        <Coins className="h-5 w-5 text-amber-500" /> {/* Changed icon color */}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(placeholderUserData.totalStaked)}</div>
                        <p className="text-xs text-muted-foreground">Gennemsnit pr. indsats: {formatCurrency(placeholderUserData.totalStaked / (placeholderUserData.wins + placeholderUserData.losses || 1))}</p>
                    </CardContent>
                </Card>

                {/* Profile Card */}
                <Card className="md:col-span-2 lg:col-span-2 fade-in-up shadow-lg hover:shadow-xl transition-shadow" style={{ animationDelay: "0.4s" }}>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Users className="mr-2 h-6 w-6" /> Din Profil</CardTitle>
                        <CardDescription>Overblik over dine kontooplysninger.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={displayAvatarUrl} alt={displayUsername} />
                                <AvatarFallback>{displayUsername ? displayUsername.substring(0, 2).toUpperCase() : "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-xl font-semibold">{displayUsername}</h3>
                                <p className="text-sm text-muted-foreground">{displayEmail}</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Rank</p>
                                <Badge variant={placeholderUserData.rank === "System Admin" ? "destructive" : "secondary"}>
                                    <ShieldCheck className="mr-1 h-4 w-4" /> {placeholderUserData.rank} {/* Rank is still placeholder */}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Sidst Set</p>
                                <p>{lastLoginDateString}</p>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full">
                            <Settings className="mr-2 h-4 w-4" /> Rediger Profil
                        </Button>
                    </CardContent>
                </Card>

                {/* Balance Chart */}
                <Card className="md:col-span-2 lg:col-span-2 fade-in-up shadow-lg hover:shadow-xl transition-shadow" style={{ animationDelay: "0.5s" }}>
                    <CardHeader>
                        <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-6 w-6" /> Saldo Udvikling</CardTitle>
                        <CardDescription>Din saldo over de sidste 30 dage.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <BarChart3 className="mx-auto h-12 w-12 mb-2" />
                            <p>Diagram kommer snart her!</p>
                            <p className="text-xs">(Integrer Recharts eller lignende her)</p>
                        </div>
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground">
                        Opdateres dagligt.
                    </CardFooter>
                </Card>

                {/* Recent Activity */}
                <Card className="lg:col-span-2 fade-in-up shadow-lg hover:shadow-xl transition-shadow" style={{ animationDelay: "0.6s" }}>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Activity className="mr-2 h-6 w-6" /> Seneste Aktivitet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentActivities.length > 0 ? (
                            <ul className="space-y-3">
                                {recentActivities.map((activity) => (
                                    <li key={activity.id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center">
                                            {activity.type === "win" && <ArrowUpRight className="h-4 w-4 mr-2 text-primary" />}
                                            {activity.type === "loss" && <ArrowDownRight className="h-4 w-4 mr-2 text-destructive" />}
                                            {activity.type === "message" && <MessageCircle className="h-4 w-4 mr-2 text-muted-foreground" />}
                                            <span>{activity.text}</span>
                                        </div>
                                        <span className="text-muted-foreground">{activity.time}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">Ingen nylig aktivitet.</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" size="sm" className="w-full">Se al aktivitet</Button>
                    </CardFooter>
                </Card>

                {/* Forum Posts */}
                <Card className="lg:col-span-2 fade-in-up shadow-lg hover:shadow-xl transition-shadow" style={{ animationDelay: "0.7s" }}>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Newspaper className="mr-2 h-6 w-6" /> Nyt fra Forum</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {forumPosts.length > 0 ? (
                            <ul className="space-y-3">
                                {forumPosts.map((post) => (
                                    <li key={post.id} className="text-sm hover:bg-muted/50 p-2 rounded-md">
                                        <a href="#" className="font-medium text-foreground hover:text-foreground/80 hover:underline block">{post.title}</a>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                            <span>af {post.author}</span>
                                            <span>{post.replies} svar</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">Ingen nye forumindlæg.</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" size="sm" className="w-full">Gå til Forum <ExternalLink className="ml-2 h-4 w-4" /></Button>
                    </CardFooter>
                </Card>

                {/* Quick Links */}
                <Card className="lg:col-span-2 fade-in-up shadow-lg hover:shadow-xl transition-shadow" style={{ animationDelay: "0.8s" }}>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Zap className="mr-2 h-6 w-6 text-muted-foreground" /> Hurtige Links</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        {quickLinks.map((link) => (
                            <Button key={link.label} variant="outline" asChild>
                                <a href={link.href} className="flex w-full items-center justify-center text-foreground"> {/* Added text-foreground for adaptive text color */}
                                    <link.icon className={`mr-2 h-4 w-4 ${link.color}`} />
                                    {link.label}
                                </a>
                            </Button>
                        ))}
                    </CardContent>
                </Card>

                {/* Sessions & Invites */}
                <Card className="lg:col-span-2 fade-in-up shadow-lg hover:shadow-xl transition-shadow" style={{ animationDelay: "0.9s" }}>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Briefcase className="mr-2 h-6 w-6" /> Sessions & Invites</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sessionsInvites.length > 0 ? (
                            <ul className="space-y-3">
                                {sessionsInvites.map((item) => (
                                    <li key={item.id} className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded-md">
                                        <div>
                                            <span className="font-medium mr-2">{item.name}</span>
                                            <Badge className={`text-white border ${item.type === "Session"
                                                ? "bg-sky-500 border-sky-600"
                                                : item.type === "Invite"
                                                    ? "bg-blue-700 border-blue-800"
                                                    : "bg-gray-500 border-gray-600" // Fallback for type
                                                }`}>
                                                {item.type}
                                            </Badge>
                                        </div>
                                        <Badge className={`ml-2 text-white border ${item.status === "Åben"
                                            ? "bg-sky-500 border-sky-600"
                                            : item.status === "Afventer"
                                                ? "bg-orange-500 border-orange-600"
                                                : "bg-gray-500 border-gray-600" // Fallback for status
                                            }`}>
                                            {item.status}
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">Ingen aktive sessions eller invites.</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" size="sm" className="w-full">Administrer Sessions</Button>
                    </CardFooter>
                </Card>

            </div>
        </div>
    );
}

// Overvej at flytte placeholder data og helper funktioner til separate filer i en større applikation.
// F.eks. lib/placeholder-data.ts og lib/utils.ts
// Animation classes 'fade-in-down' and 'fade-in-up' would need to be defined in your global CSS.
// Example for globals.css:
// @keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
// .fade-in-down { animation: fadeInDown 0.5s ease-out forwards; }
// @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
// .fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
