'use client'; // Skal være client component for at bruge hooks fra DashboardLayout og Dialog

import DashboardLayout from '@/components/layout/DashboardLayout'; // Importer DashboardLayout
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, ChevronRight, Clock, Dribbble, Flame, Ticket, Zap } from 'lucide-react';
import Link from 'next/link';
import { CouponSelection, LiveEvent, Sport, UpcomingEvent } from './types';

// Mock Data - Erstat med API-kald senere
const sportsData: Sport[] = [ // Brug Sport[] type
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
                odds: { teamA: '1.80', draw: 'N/A', teamB: '2.00' }, // Bemærk: 'N/A' for draw, håndter dette i UI
                streamingLink: '#',
                statsLink: '/live-sports/esports/evt4/stats',
            },
        ],
        upcomingEvents: []
    },
    // Tilføj flere sportsgrene efter behov
];

// Mock data for coupon (static for Phase 2)
const mockCouponSelections: CouponSelection[] = [
    { eventId: 'evt1', sportKey: 'football', matchName: 'Real Madrid vs Bayern München', outcomeName: 'Real Madrid', odds: 2.10 },
    { eventId: 'evt4', sportKey: 'esports', matchName: 'Team Vitality vs G2 Esports', outcomeName: 'Team Vitality', odds: 1.80 },
];


{/* ----- Komponenter ----- */ }

interface SportTabsProps {
    sports: Sport[];
    defaultSportId: string;
}

const SportTabs: React.FC<SportTabsProps> = ({ sports, defaultSportId }) => (
    <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mb-6">
        {sports.map((sport) => (
            <TabsTrigger key={sport.id} value={sport.id} className="flex items-center">
                <sport.icon className="mr-2 h-5 w-5" /> {sport.name}
            </TabsTrigger>
        ))}
    </TabsList>
);

interface EventCardProps {
    event: LiveEvent;
    sportId: string;
}

const EventCard: React.FC<EventCardProps> = ({ event, sportId }) => (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
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
                {event.streamingLink && (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={event.streamingLink} target="_blank">Se Stream <ChevronRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
                <Button variant="outline" className="w-full h-auto flex-col py-2">
                    <span>1</span>
                    <span className="font-semibold text-primary">{event.odds.teamA}</span>
                </Button>
                <Button variant="outline" className="w-full h-auto flex-col py-2" disabled={event.odds.draw === 'N/A'}>
                    <span>X</span>
                    <span className="font-semibold text-primary">{event.odds.draw}</span>
                </Button>
                <Button variant="outline" className="w-full h-auto flex-col py-2">
                    <span>2</span>
                    <span className="font-semibold text-primary">{event.odds.teamB}</span>
                </Button>
            </div>
            <DialogTrigger asChild>
                <Button variant="secondary" className="w-full">
                    Opret Session <Ticket className="ml-2 h-4 w-4" />
                </Button>
            </DialogTrigger>
            {/* Senere: Link til detaljeret statistik */}
            {/* <Button variant="secondary" className="w-full mt-2" asChild>
                <Link href={`/live-sports/${sportId}/${event.id}/stats`}>Detaljeret Statistik <BarChart2 className="ml-2 h-4 w-4" /></Link>
            </Button> */}
        </CardContent>
    </Card>
);

interface LiveEventsSectionProps {
    sport: Sport;
}

const LiveEventsSection: React.FC<LiveEventsSectionProps> = ({ sport }) => (
    <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Zap className="mr-2 h-6 w-6 text-red-500" /> Live Kampe - {sport.name}
        </h2>
        {sport.liveEvents.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {sport.liveEvents.map((event) => (
                    <EventCard key={event.id} event={event} sportId={sport.id} />
                ))}
            </div>
        ) : (
            <p className="text-muted-foreground">Ingen live kampe i {sport.name} i øjeblikket.</p>
        )}
    </section>
);


interface UpcomingEventRowProps {
    event: UpcomingEvent;
    sportId: string;
}

const UpcomingEventRow: React.FC<UpcomingEventRowProps> = ({ event, sportId }) => (
    <TableRow>
        <TableCell>
            <Link href={`/live-sports/${sportId}/${event.id}/stats`} className="font-medium hover:text-primary">
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
                <span className={event.odds.draw === 'N/A' ? 'text-muted-foreground' : ''}>{event.odds.draw}</span>
                <span>{event.odds.teamB}</span>
            </div>
        </TableCell>
        <TableCell className="text-right">
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    Opret Session <Ticket className="ml-1 h-4 w-4" />
                </Button>
            </DialogTrigger>
            {/* <Button variant="ghost" size="sm" asChild>
                <Link href={`/live-sports/${sportId}/${event.id}/stats`}>Detaljer <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button> */}
        </TableCell>
    </TableRow>
);

interface UpcomingEventsSectionProps {
    sport: Sport;
}

const UpcomingEventsSection: React.FC<UpcomingEventsSectionProps> = ({ sport }) => (
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
                            <TableHead className="text-right">Handlinger</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sport.upcomingEvents.map((event) => (
                            <UpcomingEventRow key={event.id} event={event} sportId={sport.id} />
                        ))}
                    </TableBody>
                </Table>
            </Card>
        ) : (
            <p className="text-muted-foreground">Ingen kommende kampe i {sport.name} i øjeblikket.</p>
        )}
    </section>
);

interface CouponSidebarProps {
    selections: CouponSelection[];
}

const CouponSidebar: React.FC<CouponSidebarProps> = ({ selections }) => {
    if (selections.length === 0) {
        return (
            <Card className="mt-8 lg:mt-0">
                <CardHeader>
                    <CardTitle className="flex items-center"><Ticket className="mr-2 h-5 w-5" /> Min Kupon</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Din kupon er tom. Klik på odds for at tilføje dem.</p>
                </CardContent>
            </Card>
        );
    }

    const totalOdds = selections.reduce((acc, sel) => acc * sel.odds, 1);

    return (
        <Card className="mt-8 lg:mt-0">
            <CardHeader>
                <CardTitle className="flex items-center"><Ticket className="mr-2 h-5 w-5" /> Min Kupon</CardTitle>
                <CardDescription>{selections.length} valg på kuponen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {selections.map((sel, index) => (
                    <div key={index} className="text-sm p-2 border rounded-md bg-muted/20">
                        <p className="font-semibold">{sel.matchName}</p>
                        <p className="text-xs text-muted-foreground">{sel.outcomeName} @ {sel.odds.toFixed(2)}</p>
                    </div>
                ))}
                <div className="font-bold text-lg pt-2 border-t">
                    Samlet Odds: {totalOdds.toFixed(2)}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <DialogTrigger asChild>
                    <Button className="w-full">Opret Kupon Session</Button>
                </DialogTrigger>
                <Button variant="outline" className="w-full">Ryd Kupon</Button>
            </CardFooter>
        </Card>
    );
};

const SessionSettingsModal: React.FC = () => (
    <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle>Opret Session</DialogTitle>
            <DialogDescription>
                Indstil detaljerne for din nye spilsession. Klik opret når du er klar.
            </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sessionName" className="text-right">
                    Navn
                </Label>
                <Input id="sessionName" defaultValue="Min fede session" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxPlayers" className="text-right">
                    Max Spillere
                </Label>
                <Input id="maxPlayers" type="number" defaultValue={10} className="col-span-3" />
            </div>
            <div className="col-span-4 flex items-center space-x-2 justify-end">
                <Checkbox id="isPrivate" />
                <Label htmlFor="isPrivate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Privat Session?
                </Label>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                    Kodeord
                </Label>
                <Input id="password" type="password" className="col-span-3" placeholder="Kun hvis privat" />
            </div>
        </div>
        <DialogFooter>
            <Button type="submit">Opret Session</Button>
        </DialogFooter>
    </DialogContent>
);


export default function LiveSportsPage() {
    return (
        <DashboardLayout> {/* Wrap med DashboardLayout */}
            <Dialog>
                <div className="container mx-auto py-8 px-4 md:px-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 gap-6">
                        <div className="grow">
                            <div className="flex justify-between items-center mb-4">
                                <h1 className="text-3xl font-bold flex items-center">
                                    <Flame className="mr-3 h-8 w-8 text-primary" /> Live Sports & Kommende Kampe
                                </h1>
                                {/* TODO: Refresh knap her senere */}
                            </div>
                            {/* TODO: Filter controls her senere */}
                            {/* <FilterControls /> */}
                        </div>
                        <div className="shrink-0 lg:w-1/4">
                            {/* Placeholder for Sportskatalog knap eller lignende */}
                            {/* <Button variant="outline">Vis Sportskatalog <Search className="ml-2 h-4 w-4" /></Button> */}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <Tabs defaultValue={sportsData[0]?.id || 'football'} className="w-full">
                                <SportTabs sports={sportsData} defaultSportId={sportsData[0]?.id || 'football'} />
                                {sportsData.map((sport) => (
                                    <TabsContent key={sport.id} value={sport.id}>
                                        <LiveEventsSection sport={sport} />
                                        <UpcomingEventsSection sport={sport} />
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                        <div className="lg:col-span-1">
                            <CouponSidebar selections={mockCouponSelections} />
                        </div>
                    </div>
                    <SessionSettingsModal /> {/* Modal indhold */}
                </div>
            </Dialog>
        </DashboardLayout>
    );
}
