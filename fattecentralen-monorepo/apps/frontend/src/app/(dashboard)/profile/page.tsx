'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    Award,
    BarChart2,
    CalendarCheck,
    Camera,
    Clock,
    Coins,
    Edit3,
    Filter,
    Fingerprint,
    History,
    Info,
    LineChart,
    Mail,
    MailPlus,
    Medal,
    Percent,
    PieChart,
    Receipt,
    RefreshCw,
    Settings,
    Star,
    TrendingDown,
    TrendingUp,
    Trophy,
    UserCircle,
    UserPlus,
    Users,
    Wallet
} from "lucide-react";

const ProfilePage = () => {
    const isOwnProfile = true; // For static rendering, assume it's own profile
    const profileUser = {
        username: "TestBruger",
        avatarUrl: "/placeholder-avatar.png", // Replace with actual path or remove if not available
        registrationDate: "2023-01-15T10:00:00Z",
        email: "testbruger@example.com",
        lastLogin: "2025-05-19T14:30:00Z",
        uid: "user123abc",
        invitedBy: "SuperAdmin",
        aboutMe: "Dette er en testbeskrivelse om mig. Jeg kan godt lide at kode og spille spil. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        level: 5,
        xp: 650,
        xpNextLevel: 1000,
    };

    const recentBetHistory = [
        { id: 1, timestamp: "2025-05-19T10:00:00Z", matchName: "Fodbold: Hold A vs Hold B", outcomeName: "Hold A Vinder", stake: 100, status: "won", payout: 200 },
        { id: 2, timestamp: "2025-05-18T15:30:00Z", matchName: "eSport: Team X vs Team Y", outcomeName: "Team Y Vinder", stake: 50, status: "lost", payout: 0 },
        { id: 3, timestamp: "2025-05-17T20:00:00Z", matchName: "Basketball: Spiller Z Over 20 Points", outcomeName: "Ja", stake: 75, status: "pending", payout: 0 },
    ];

    const userStats = {
        balance: 1234.56,
        totalStaked: 5000,
        totalWon: 6500,
        totalLost: 1500,
        wins: 30,
        losses: 10,
        totalBetsPlaced: 40,
        winRate: 75.0,
        netProfit: 5000,
        largestWin: 1000,
        largestLoss: 200,
    };

    const xpPercentage = profileUser.xpNextLevel > 0 ? (profileUser.xp / profileUser.xpNextLevel) * 100 : 0;

    // Helper to format date (very basic, consider a library for i18n and better formatting)
    const formatDate = (dateString?: string, relative = false) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (relative) {
            // Basic relative time - replace with a proper library if needed
            const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + " år siden";
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + " mdr siden";
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + " dage siden";
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + " timer siden";
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + " min siden";
            return Math.floor(seconds) + " sek siden";
        }
        return date.toLocaleDateString('da-DK', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatCurrency = (amount?: number) => {
        if (amount === undefined || amount === null) return 'N/A';
        return amount.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' });
    }

    return (
        <div className="container mx-auto py-5 px-4 md:px-6">
            {/* Profile Header */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b">
                <h2 className="text-2xl font-semibold mb-2 md:mb-0 flex items-center">
                    <UserCircle className="mr-2 h-7 w-7" />
                    {isOwnProfile ? "Din Profil" : `${profileUser.username}'s Profil`}
                </h2>
                <div className="space-x-2">
                    <Button variant="outline" size="sm" asChild>
                        <a href="/dashboard"> {/* Assuming dashboard is the front page */}
                            <ArrowLeft className="mr-1 h-4 w-4" /> Forside
                        </a>
                    </Button>
                    {isOwnProfile ? (
                        <Button variant="outline" size="sm" asChild>
                            <a href="/settings">
                                <Settings className="mr-1 h-4 w-4" /> Indstillinger
                            </a>
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm">
                            <MailPlus className="mr-1 h-4 w-4" /> Send Besked
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Profile Info Card */}
            <Card className="mb-6 shadow-lg">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="flex items-center"><UserCircle className="mr-2" /> Brugeroplysninger</CardTitle>
                    {isOwnProfile && (
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <Edit3 className="h-4 w-4" />
                            <span className="sr-only">Rediger profil</span>
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="flex flex-col items-center md:items-start">
                            <Avatar className="h-32 w-32 mb-3 border-2 border-primary">
                                <AvatarImage src={profileUser.avatarUrl} alt={profileUser.username} />
                                <AvatarFallback>{profileUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {isOwnProfile && (
                                <div className="space-y-2 w-full max-w-xs text-center md:text-left">
                                    <Button variant="outline" className="w-full">
                                        <Camera className="mr-2 h-4 w-4" /> Skift avatar
                                    </Button>
                                    {/* Placeholder for file input and upload button */}
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <h3 className="text-xl font-semibold">{profileUser.username}</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center"><CalendarCheck className="mr-2 h-4 w-4 text-sky-500" /><strong>Oprettet:</strong> <span className="ml-1">{formatDate(profileUser.registrationDate)}</span></li>
                                <li className="flex items-center"><Mail className="mr-2 h-4 w-4 text-sky-500" /><strong>Email:</strong> <span className="ml-1">{isOwnProfile ? profileUser.email : "Skjult"}</span></li>
                                <li className="flex items-center"><Clock className="mr-2 h-4 w-4 text-sky-500" /><strong>Sidst set:</strong> <span className="ml-1">{formatDate(profileUser.lastLogin, true)}</span></li>
                                <li className="flex items-center"><Fingerprint className="mr-2 h-4 w-4 text-sky-500" /><strong>UID:</strong> <span className="ml-1 font-mono text-xs">{profileUser.uid}</span></li>
                                {profileUser.invitedBy && (
                                    <li className="flex items-center"><UserPlus className="mr-2 h-4 w-4 text-sky-500" /><strong>Inviteret af:</strong> <span className="ml-1">{profileUser.invitedBy}</span></li>
                                )}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* About Me & Badges Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle className="flex items-center"><Info className="mr-2" /> Om Mig</CardTitle>
                        {isOwnProfile && (
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <Edit3 className="h-4 w-4" />
                                <span className="sr-only">Rediger om mig</span>
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {profileUser.aboutMe || <span className="italic">Brugeren har ikke tilføjet en beskrivelse.</span>}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center"><Award className="mr-2" /> Badges & Achievements</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {/* Placeholder Badges */}
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><Star className="mr-1 h-3 w-3" /> Første Sejr</Badge>
                        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white"><Medal className="mr-1 h-3 w-3" /> Aktiv Deltager</Badge>
                        <Badge variant="default" className="bg-purple-500 hover:bg-purple-600 text-white"><Users className="mr-1 h-3 w-3" /> Social Sommerfugl</Badge>
                        <Badge variant="secondary"><Star className="mr-1 h-3 w-3" /> Nybegynder</Badge>
                        {/* <p className="text-sm text-muted-foreground italic">Ingen badges optjent endnu.</p> */}
                    </CardContent>
                </Card>
            </div>

            {/* Progress Card (Own Profile Only) */}
            {isOwnProfile && (
                <Card className="mb-6 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center"><LineChart className="mr-2" /> Din Fremgang</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-1">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">Niveau {profileUser.level}</span>
                                <span className="text-muted-foreground">{profileUser.xp} / {profileUser.xpNextLevel} XP</span>
                            </div>
                            <Progress value={xpPercentage} aria-label={`${xpPercentage}% fremgang til næste niveau`} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Bets Table */}
            <Card className="mb-6 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center"><History className="mr-2" /> Seneste Bets ({recentBetHistory.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tidspunkt</TableHead>
                                <TableHead>Kamp/Session</TableHead>
                                <TableHead>Valg</TableHead>
                                <TableHead className="text-right">Indsats</TableHead>
                                <TableHead className="text-center">Resultat</TableHead>
                                <TableHead className="text-right">Gevinst/Tab</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentBetHistory.length > 0 ? recentBetHistory.map((bet) => (
                                <TableRow key={bet.id}>
                                    <TableCell className="text-xs">{formatDate(bet.timestamp, true)}</TableCell>
                                    <TableCell>{bet.matchName}</TableCell>
                                    <TableCell>{bet.outcomeName}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(bet.stake)}</TableCell>
                                    <TableCell className="text-center">
                                        {bet.status === 'pending' && <Badge variant="outline" className="bg-yellow-400 text-yellow-900">Afventer</Badge>}
                                        {bet.status === 'won' && <Badge variant="outline" className="bg-green-500 text-white">Vundet</Badge>}
                                        {bet.status === 'lost' && <Badge variant="outline" className="bg-red-500 text-white">Tabt</Badge>}
                                    </TableCell>
                                    <TableCell className={`text-right font-medium ${bet.status === 'won' ? 'text-green-500' : bet.status === 'lost' ? 'text-red-500' : 'text-muted-foreground'}`}>
                                        {bet.status === 'won' ? `+${formatCurrency(bet.payout - bet.stake)}` : bet.status === 'lost' ? `-${formatCurrency(bet.stake)}` : '-'}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-4">Ingen betting historik fundet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs defaultValue="stats" className="mb-6">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-4">
                    <TabsTrigger value="stats" className="flex items-center"><PieChart className="mr-2 h-4 w-4" /> Statistik</TabsTrigger>
                    <TabsTrigger value="bets" className="flex items-center"><Receipt className="mr-2 h-4 w-4" /> Fuld Bets Historik</TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center"><History className="mr-2 h-4 w-4" /> Seneste Aktivitet</TabsTrigger>
                </TabsList>

                <TabsContent value="stats">
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle className="flex items-center"><BarChart2 className="mr-2" /> Nøgletal</CardTitle>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <RefreshCw className="h-4 w-4" />
                                <span className="sr-only">Opdater statistik</span>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground flex items-center"><Wallet className="mr-2 h-4 w-4 text-blue-500" />Saldo</span> <span className="font-medium">{formatCurrency(userStats.balance)}</span></div>
                                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground flex items-center"><Coins className="mr-2 h-4 w-4 text-blue-500" />Total Indsats</span> <span className="font-medium">{formatCurrency(userStats.totalStaked)}</span></div>
                                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground flex items-center"><TrendingUp className="mr-2 h-4 w-4 text-green-500" />Total Gevinst</span> <span className="font-medium">{formatCurrency(userStats.totalWon)}</span></div>
                                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground flex items-center"><TrendingDown className="mr-2 h-4 w-4 text-red-500" />Total Tab</span> <span className="font-medium">{formatCurrency(userStats.totalLost)}</span></div>
                                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground flex items-center"><Trophy className="mr-2 h-4 w-4 text-yellow-500" />Wins / Losses</span> <span className="font-medium">{userStats.wins} / {userStats.losses}</span></div>
                                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground flex items-center"><Receipt className="mr-2 h-4 w-4 text-blue-500" />Antal Bets</span> <span className="font-medium">{userStats.totalBetsPlaced}</span></div>
                                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground flex items-center"><Percent className="mr-2 h-4 w-4 text-blue-500" />Win Rate</span> <span className="font-medium">{userStats.winRate.toFixed(1)}%</span></div>
                                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground flex items-center"><BarChart2 className="mr-2 h-4 w-4 text-blue-500" />Netto Resultat</span> <span className={`font-medium ${userStats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(userStats.netProfit)}</span></div>
                                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground flex items-center"><TrendingUp className="mr-2 h-4 w-4 text-green-500" />Største Gevinst</span> <span className="font-medium">{formatCurrency(userStats.largestWin)}</span></div>
                                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground flex items-center"><TrendingDown className="mr-2 h-4 w-4 text-red-500" />Største Tab</span> <span className="font-medium">{formatCurrency(userStats.largestLoss)}</span></div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bets">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Receipt className="mr-2" /> Fuld Bets Historik (Filtrerbar)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end mb-4">
                                <div className="space-y-1">
                                    <label htmlFor="bet_start_date" className="text-xs font-medium">Fra dato</label>
                                    <Input type="date" id="bet_start_date" name="start_date" />
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="bet_end_date" className="text-xs font-medium">Til dato</label>
                                    <Input type="date" id="bet_end_date" name="end_date" />
                                </div>
                                <Button type="button" className="sm:self-end flex items-center">
                                    <Filter className="mr-2 h-4 w-4" /> Filtrer
                                </Button>
                            </form>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kamp/Event</TableHead>
                                            <TableHead>Valg</TableHead>
                                            <TableHead className="text-right">Indsats</TableHead>
                                            <TableHead>Tidspunkt</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                            <TableHead className="text-right">Gevinst/Tab</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* Placeholder for dynamically loaded bets */}
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                                                Bet historik vil blive indlæst her.
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex justify-center mt-4">
                                <Button variant="outline" disabled>Indlæs Flere Bets</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity">
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle className="flex items-center"><History className="mr-2" /> Seneste Aktivitet</CardTitle>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <RefreshCw className="h-4 w-4" />
                                <span className="sr-only">Opdater aktivitet</span>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {/* Placeholder for recent activity */}
                                <li className="flex items-center justify-between p-3 bg-muted/50 rounded-md text-sm">
                                    <div className="flex items-center">
                                        <Star className="mr-3 h-5 w-5 text-yellow-500" />
                                        <span>Du har optjent et nyt badge: "Første Sejr"</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatDate(new Date(Date.now() - 3600000).toISOString(), true)}</span>
                                </li>
                                <li className="flex items-center justify-between p-3 bg-muted/50 rounded-md text-sm">
                                    <div className="flex items-center">
                                        <Mail className="mr-3 h-5 w-5 text-blue-500" />
                                        <span>Din email blev opdateret.</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatDate(new Date(Date.now() - 86400000).toISOString(), true)}</span>
                                </li>
                                <li className="flex items-center justify-between p-3 bg-muted/50 rounded-md text-sm">
                                    <div className="flex items-center">
                                        <TrendingUp className="mr-3 h-5 w-5 text-green-500" />
                                        <span>Du vandt et bet på "Hold A vs Hold B".</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatDate(new Date(Date.now() - 172800000).toISOString(), true)}</span>
                                </li>
                                <li className="text-center text-muted-foreground py-6">
                                    Seneste aktivitet vil blive vist her.
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modals (Structure only, no open/close logic for static) */}
            {/* Edit Profile Modal Placeholder */}
            {/*
      <Dialog>
        <DialogTrigger asChild><Button>Edit Profile (Modal Trigger)</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Rediger Profil</DialogTitle></DialogHeader>
          <p>Email input etc.</p>
          <DialogFooter><Button>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      */}
            {/* Edit About Me Modal Placeholder */}

        </div>
    );
};

export default ProfilePage;
