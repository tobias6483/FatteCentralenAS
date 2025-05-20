import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, CalendarDays, ChevronRight, Clock, Dribbble, Flame, Zap } from 'lucide-react'; // Added more icons
import Link from 'next/link';

// Mock Data - Erstat med API-kald senere
const sportsData = [
    {
        id: 'football',
        name: 'Fodbold',
        icon: Dribbble,
        liveEvents: [
            {
                id: 'evt1',
                league: 'Champions League - Semi-finale',
                teamA: 'Real Madrid', teamB: 'Bayern München',
                time: 'Live nu - 75 min',
                score: '1 - 1',
                odds: { teamA: '2.10', draw: '3.50', teamB: '3.20' },
                streamingLink: '#',
                statsLink: '/live-sports/football/evt1/stats',
            },
            {
                id: 'evt2',
                league: 'Premier League',
                teamA: 'Liverpool', teamB: 'Manchester City',
                time: 'Starter om 01:30:00',
                score: '0 - 0',
                odds: { teamA: '2.50', draw: '3.80', teamB: '2.80' },
                streamingLink: '#',
                statsLink: '/live-sports/football/evt2/stats',
            },
        ],
        upcomingEvents: [
            {
                id: 'evt3',
                league: 'Superligaen',
                teamA: 'FC København', teamB: 'Brøndby IF',
                date: '25. maj 2025',
                time: '19:00',
                odds: { teamA: '1.90', draw: '3.60', teamB: '4.00' },
                statsLink: '/live-sports/football/evt3/stats',
            }
        ]
    },
    {
        id: 'esports',
        name: 'E-sport',
        icon: Zap,
        liveEvents: [
            {
                id: 'evt4',
                league: 'CS:GO Major - Finale',
                teamA: 'Team Vitality', teamB: 'G2 Esports',
                time: 'Live nu - Map 3',
                score: '1 - 1 (Series)',
                odds: { teamA: '1.80', draw: 'N/A', teamB: '2.00' },
                streamingLink: '#',
                statsLink: '/live-sports/esports/evt4/stats',
            },
        ],
        upcomingEvents: []
    },
    // Tilføj flere sportsgrene efter behov
];

export default function LiveSportsPage() {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center">
                    <Flame className="mr-3 h-8 w-8 text-primary" /> Live Sports & Kommende Kampe
                </h1>
                {/* Evt. filter eller søgefunktion her */}
            </div>

            <Tabs defaultValue={sportsData[0]?.id || 'football'} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mb-6">
                    {sportsData.map((sport) => (
                        <TabsTrigger key={sport.id} value={sport.id} className="flex items-center">
                            <sport.icon className="mr-2 h-5 w-5" /> {sport.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {sportsData.map((sport) => (
                    <TabsContent key={sport.id} value={sport.id}>
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-4 flex items-center">
                                <Zap className="mr-2 h-6 w-6 text-red-500" /> Live Kampe - {sport.name}
                            </h2>
                            {sport.liveEvents.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                                    {sport.liveEvents.map((event) => (
                                        <Card key={event.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                            <CardHeader className="bg-muted/30">
                                                <div className="flex justify-between items-center">
                                                    <CardTitle className="text-lg">{event.teamA} vs {event.teamB}</CardTitle>
                                                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full font-semibold">LIVE</span>
                                                </div>
                                                <CardDescription className="text-sm">{event.league} | <span className="text-red-500 font-medium">{event.time}</span></CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-center mb-4">
                                                    <p className="text-2xl font-bold">{event.score}</p>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={event.streamingLink} target="_blank">Se Stream <ChevronRight className="ml-1 h-4 w-4" /></Link>
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
                                                    <Button variant="outline" className="w-full h-auto flex-col py-2">
                                                        <span>1</span>
                                                        <span className="font-semibold text-primary">{event.odds.teamA}</span>
                                                    </Button>
                                                    <Button variant="outline" className="w-full h-auto flex-col py-2">
                                                        <span>X</span>
                                                        <span className="font-semibold text-primary">{event.odds.draw}</span>
                                                    </Button>
                                                    <Button variant="outline" className="w-full h-auto flex-col py-2">
                                                        <span>2</span>
                                                        <span className="font-semibold text-primary">{event.odds.teamB}</span>
                                                    </Button>
                                                </div>
                                                <Button variant="secondary" className="w-full" asChild>
                                                    <Link href={event.statsLink}>Detaljeret Statistik <BarChart2 className="ml-2 h-4 w-4" /></Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Ingen live kampe i {sport.name} i øjeblikket.</p>
                            )}
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 flex items-center">
                                <CalendarDays className="mr-2 h-6 w-6 text-blue-500" /> Kommende Kampe - {sport.name}
                            </h2>
                            {sport.upcomingEvents.length > 0 ? (
                                <Card>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Kamp</TableHead>
                                                <TableHead className="hidden md:table-cell">Liga</TableHead>
                                                <TableHead className="text-center">Dato & Tid</TableHead>
                                                <TableHead className="text-center hidden sm:table-cell">Odds (1X2)</TableHead>
                                                <TableHead className="text-right">Info</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sport.upcomingEvents.map((event) => (
                                                <TableRow key={event.id}>
                                                    <TableCell>
                                                        <Link href={event.statsLink} className="font-medium hover:text-primary">
                                                            {event.teamA} vs {event.teamB}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell text-muted-foreground">{event.league}</TableCell>
                                                    <TableCell className="text-center text-muted-foreground">
                                                        <div>{event.date}</div>
                                                        <div className="text-xs"><Clock className="inline mr-1 h-3 w-3" />{event.time}</div>
                                                    </TableCell>
                                                    <TableCell className="text-center hidden sm:table-cell">
                                                        <div className="flex justify-around text-xs">
                                                            <span>{event.odds.teamA}</span>
                                                            <span>{event.odds.draw}</span>
                                                            <span>{event.odds.teamB}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={event.statsLink}>Detaljer <ChevronRight className="ml-1 h-4 w-4" /></Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Card>
                            ) : (
                                <p className="text-muted-foreground">Ingen kommende kampe i {sport.name} i øjeblikket.</p>
                            )}
                        </section>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
