import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Medal, Star, TrendingUp, Trophy, UserCircle } from 'lucide-react';
import React from 'react';

// Mock data - erstat med API-kald
const mockLeaderboardData = {
    overall: [
        { rank: 1, user: 'SuperInvestor_77', points: 12500, avatar: '/avatars/avatar1.png', trend: 'up' },
        { rank: 2, user: 'AktieHajen92', points: 11800, avatar: '/avatars/avatar2.png', trend: 'stable' },
        { rank: 3, user: 'PorteføljePrinsessen', points: 11500, avatar: '/avatars/avatar3.png', trend: 'down' },
        { rank: 4, user: 'DayTraderDynamo', points: 10900, avatar: '/avatars/avatar4.png', trend: 'up' },
        { rank: 5, user: 'ValueViking', points: 10500, avatar: '/avatars/avatar5.png', trend: 'stable' },
    ],
    aktiedyst: [ // Specifik for Aktiedyst - Juli
        { rank: 1, user: 'AktieHajen92', portfolioValue: 152030.50, avatar: '/avatars/avatar2.png', trend: 'up' },
        { rank: 2, user: 'SuperInvestor_77', portfolioValue: 149800.00, avatar: '/avatars/avatar1.png', trend: 'up' },
        { rank: 3, user: 'BørsBossen', portfolioValue: 145000.00, avatar: '/avatars/avatar6.png', trend: 'down' },
    ],
    quizmaster: [
        { rank: 1, user: 'QuizKongeKarl', correctAnswers: 580, totalQuizzes: 60, avatar: '/avatars/avatar7.png' },
        { rank: 2, user: 'SpørgeJørgen', correctAnswers: 550, totalQuizzes: 62, avatar: '/avatars/avatar8.png' },
    ],
    badges: [ // Top brugere efter antal badges
        { rank: 1, user: 'BadgeSamlerSøren', badgeCount: 75, rarestBadge: 'Ultimativ Fatter', avatar: '/avatars/avatar9.png' },
        { rank: 2, user: 'PorteføljePrinsessen', badgeCount: 68, rarestBadge: 'Investor Guru', avatar: '/avatars/avatar3.png' },
    ]
};

const TrendIcon: React.FC<{ trend?: 'up' | 'down' | 'stable' }> = ({ trend }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />; // Simple down trend
    return <Star className="h-4 w-4 text-yellow-500" />; // Or some other icon for stable/neutral
};

const RankCell: React.FC<{ rank: number }> = ({ rank }) => {
    let color = "text-muted-foreground";
    if (rank === 1) color = "text-yellow-500 font-bold"; // Gold
    else if (rank === 2) color = "text-gray-400 font-bold"; // Silver
    else if (rank === 3) color = "text-orange-400 font-bold"; // Bronze

    return (
        <TableCell className={`text-center ${color}`}>
            {rank === 1 && <Medal className="inline mr-1 h-4 w-4" />}
            {rank}
        </TableCell>
    );
};


export default function LeaderboardPage() {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="flex items-center mb-8">
                <Trophy className="h-10 w-10 text-primary mr-3" />
                <div>
                    <h1 className="text-3xl font-bold">Leaderboards</h1>
                    <p className="text-muted-foreground">Se hvem der topper listerne på Fattecentralen.</p>
                </div>
            </div>

            <Tabs defaultValue="overall" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
                    <TabsTrigger value="overall">Overall Top</TabsTrigger>
                    <TabsTrigger value="aktiedyst">Aktiedysten</TabsTrigger>
                    <TabsTrigger value="quizmaster">Quizmaster</TabsTrigger>
                    <TabsTrigger value="badges">Badge Samlere</TabsTrigger>
                </TabsList>

                <TabsContent value="overall">
                    <Card>
                        <CardHeader>
                            <CardTitle>Overall Top Pointscorere</CardTitle>
                            <CardDescription>De brugere med flest point på tværs af platformen.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px] text-center">Rank</TableHead>
                                        <TableHead>Bruger</TableHead>
                                        <TableHead className="text-right">Point</TableHead>
                                        <TableHead className="w-[100px] text-center">Trend</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockLeaderboardData.overall.map((user) => (
                                        <TableRow key={user.rank}>
                                            <RankCell rank={user.rank} />
                                            <TableCell>
                                                <div className="flex items-center">
                                                    {/* <Image src={user.avatar} alt={user.user} width={32} height={32} className="rounded-full mr-2" /> */}
                                                    <UserCircle className="h-8 w-8 text-muted-foreground mr-2" /> {/* Placeholder */}
                                                    <span className="font-medium">{user.user}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{user.points.toLocaleString()}</TableCell>
                                            <TableCell className="text-center"><TrendIcon trend={user.trend as any} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="aktiedyst">
                    <Card>
                        <CardHeader>
                            <CardTitle>Aktiedyst Leaderboard (Månedsdysten - Juli)</CardTitle>
                            <CardDescription>Top porteføljer i den igangværende Aktiedyst.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px] text-center">Rank</TableHead>
                                        <TableHead>Bruger</TableHead>
                                        <TableHead className="text-right">Porteføljeværdi</TableHead>
                                        <TableHead className="w-[100px] text-center">Trend</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockLeaderboardData.aktiedyst.map((user) => (
                                        <TableRow key={user.rank}>
                                            <RankCell rank={user.rank} />
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <UserCircle className="h-8 w-8 text-muted-foreground mr-2" /> {/* Placeholder */}
                                                    <span className="font-medium">{user.user}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                                {user.portfolioValue.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
                                            </TableCell>
                                            <TableCell className="text-center"><TrendIcon trend={user.trend as any} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="quizmaster">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quizmastere</CardTitle>
                            <CardDescription>Top brugere baseret på korrekte svar i quizzes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px] text-center">Rank</TableHead>
                                        <TableHead>Bruger</TableHead>
                                        <TableHead className="text-right">Korrekte Svar</TableHead>
                                        <TableHead className="text-right">Antal Quizzes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockLeaderboardData.quizmaster.map((user) => (
                                        <TableRow key={user.rank}>
                                            <RankCell rank={user.rank} />
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <UserCircle className="h-8 w-8 text-muted-foreground mr-2" /> {/* Placeholder */}
                                                    <span className="font-medium">{user.user}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{user.correctAnswers}</TableCell>
                                            <TableCell className="text-right">{user.totalQuizzes}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="badges">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Badge Samlere</CardTitle>
                            <CardDescription>Brugere med flest unikke badges optjent.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px] text-center">Rank</TableHead>
                                        <TableHead>Bruger</TableHead>
                                        <TableHead className="text-right">Antal Badges</TableHead>
                                        <TableHead>Mest Sjældne Badge</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockLeaderboardData.badges.map((user) => (
                                        <TableRow key={user.rank}>
                                            <RankCell rank={user.rank} />
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <UserCircle className="h-8 w-8 text-muted-foreground mr-2" /> {/* Placeholder */}
                                                    <span className="font-medium">{user.user}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{user.badgeCount}</TableCell>
                                            <TableCell>{user.rarestBadge}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
