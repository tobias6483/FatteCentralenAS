import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, BarChartBig, Clock, Info, ListChecks, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

// Mock Data - Erstat med API-kald senere
const mockEventStats = {
    eventId: 'evt1',
    sport: 'Fodbold',
    teamA: {
        name: 'Real Madrid',
        logoUrl: '/placeholder-team-logo.png', // Sørg for placeholder logo
        score: 1,
        possession: 58,
        shots: 12,
        shotsOnTarget: 5,
        corners: 7,
        fouls: 10,
        yellowCards: 2,
        redCards: 0,
        playerStats: [
            { name: 'Jude Bellingham', goals: 1, assists: 0, shots: 3 },
            { name: 'Vinícius Júnior', goals: 0, assists: 1, shots: 4 },
        ]
    },
    teamB: {
        name: 'Bayern München',
        logoUrl: '/placeholder-team-logo.png', // Sørg for placeholder logo
        score: 1,
        possession: 42,
        shots: 9,
        shotsOnTarget: 3,
        corners: 4,
        fouls: 12,
        yellowCards: 1,
        redCards: 0,
        playerStats: [
            { name: 'Harry Kane', goals: 1, assists: 0, shots: 5 },
            { name: 'Jamal Musiala', goals: 0, assists: 0, shots: 2 },
        ]
    },
    league: 'Champions League - Semi-finale',
    status: 'Live - 75 min',
    venue: 'Santiago Bernabéu',
    referee: 'Szymon Marciniak',
    timeline: [
        { time: "15'", event: 'Mål! Jude Bellingham (Real Madrid)', icon: 'goal' },
        { time: "30'", event: 'Gult kort, Joshua Kimmich (Bayern München)', icon: 'yellow-card' },
        { time: "HT'", event: 'Pause', icon: 'whistle' },
        { time: "62'", event: 'Mål! Harry Kane (Bayern München) - Straffe', icon: 'goal' },
    ],
    headToHead: [
        { date: '2022-04-12', teamA: 'Real Madrid', teamB: 'Bayern München', score: '2-1' },
        { date: '2021-10-20', teamA: 'Bayern München', teamB: 'Real Madrid', score: '3-1' },
    ]
};

interface EventStatsPageProps {
    params: { sport: string; eventId: string };
}

const StatBar: React.FC<{ label: string; valueA: number; valueB: number; unit?: string; higherIsBetter?: boolean }> =
    ({ label, valueA, valueB, unit = '', higherIsBetter = true }) => {
        const total = valueA + valueB;
        const percentageA = total > 0 ? (valueA / total) * 100 : 50;
        const isTeamAWinner = higherIsBetter ? valueA > valueB : valueA < valueB;
        const isTeamBWinner = higherIsBetter ? valueB > valueA : valueB < valueA;

        return (
            <div className="mb-3">
                <div className="flex justify-between items-center text-sm mb-1">
                    <span className={`font-medium ${isTeamAWinner ? 'text-primary' : 'text-muted-foreground'}`}>{valueA}{unit}</span>
                    <span className="text-muted-foreground font-semibold">{label}</span>
                    <span className={`font-medium ${isTeamBWinner ? 'text-primary' : 'text-muted-foreground'}`}>{valueB}{unit}</span>
                </div>
                <Progress value={percentageA} className="h-2" />
            </div>
        );
    };

export default function EventStatsPage({ params }: EventStatsPageProps) {
    // I en rigtig applikation ville params bruges til at hente specifikke event data
    const stats = mockEventStats;

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="mb-6">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/live-sports">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Tilbage til Live Sports
                    </Link>
                </Button>
            </div>

            <Card className="mb-8 shadow-lg">
                <CardHeader className="bg-muted/30">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center mb-2 md:mb-0">
                            {/* <img src={stats.teamA.logoUrl} alt={stats.teamA.name} className="h-10 w-10 mr-3" /> */}
                            <span className="text-2xl font-bold mr-2">{stats.teamA.name}</span>
                            <span className="text-3xl font-bold text-primary">{stats.teamA.score}</span>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground font-semibold">VS</p>
                            <p className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold inline-block">{stats.status}</p>
                        </div>
                        <div className="flex items-center mt-2 md:mt-0">
                            <span className="text-3xl font-bold text-primary mr-2">{stats.teamB.score}</span>
                            <span className="text-2xl font-bold mr-3">{stats.teamB.name}</span>
                            {/* <img src={stats.teamB.logoUrl} alt={stats.teamB.name} className="h-10 w-10" /> */}
                        </div>
                    </div>
                    <CardDescription className="text-center mt-2 text-sm">
                        {stats.league} | {stats.venue}
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Kolonne 1: Kamp Statistik */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><BarChartBig className="mr-2 h-5 w-5 text-primary" /> Kamp Statistik</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StatBar label="Boldbesiddelse" valueA={stats.teamA.possession} valueB={stats.teamB.possession} unit="%" />
                            <StatBar label="Skud" valueA={stats.teamA.shots} valueB={stats.teamB.shots} />
                            <StatBar label="Skud på Mål" valueA={stats.teamA.shotsOnTarget} valueB={stats.teamB.shotsOnTarget} />
                            <StatBar label="Hjørnespark" valueA={stats.teamA.corners} valueB={stats.teamB.corners} />
                            <StatBar label="Frispark Begået" valueA={stats.teamA.fouls} valueB={stats.teamB.fouls} higherIsBetter={false} />
                            <StatBar label="Gule Kort" valueA={stats.teamA.yellowCards} valueB={stats.teamB.yellowCards} higherIsBetter={false} />
                            <StatBar label="Røde Kort" valueA={stats.teamA.redCards} valueB={stats.teamB.redCards} higherIsBetter={false} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" /> Tidslinje</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {stats.timeline.map((item, index) => (
                                    <li key={index} className="flex items-center text-sm">
                                        {/* Placeholder for icon based on item.icon */}
                                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span className="font-semibold w-12">{item.time}</span>
                                        <span>{item.event}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Kolonne 2: Spiller Stats & Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> Top Spillere</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h4 className="font-semibold mb-1 text-sm">{stats.teamA.name}</h4>
                            {stats.teamA.playerStats.map(p => (
                                <p key={p.name} className="text-xs text-muted-foreground">{p.name} (Mål: {p.goals}, Assists: {p.assists}, Skud: {p.shots})</p>
                            ))}
                            <Separator className="my-3" />
                            <h4 className="font-semibold mb-1 text-sm">{stats.teamB.name}</h4>
                            {stats.teamB.playerStats.map(p => (
                                <p key={p.name} className="text-xs text-muted-foreground">{p.name} (Mål: {p.goals}, Assists: {p.assists}, Skud: {p.shots})</p>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5 text-primary" /> Kamp Information</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <p><span className="font-semibold">Liga:</span> {stats.league}</p>
                            <p><span className="font-semibold">Stadion:</span> {stats.venue}</p>
                            <p><span className="font-semibold">Dommer:</span> {stats.referee}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-primary" /> H2H Seneste</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs p-2">Dato</TableHead>
                                        <TableHead className="text-xs p-2">Kamp</TableHead>
                                        <TableHead className="text-right text-xs p-2">Res.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.headToHead.map((match, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="text-xs p-2">{match.date}</TableCell>
                                            <TableCell className="text-xs p-2">{match.teamA} vs {match.teamB}</TableCell>
                                            <TableCell className="text-right text-xs p-2">{match.score}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
