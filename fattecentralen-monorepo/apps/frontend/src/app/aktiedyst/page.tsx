import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, PlusCircle, TrendingUp, Trophy, Users } from 'lucide-react';
import Link from 'next/link';

// Mock data - erstat med API-kald
const mockAktiedystData = {
    ongoingCompetitions: [
        { id: 'comp1', name: 'Månedsdysten - Juli', participants: 150, prize: '1000 kr', endDate: '2024-07-31' },
        { id: 'comp2', name: 'Sommer Special', participants: 75, prize: '500 kr + Merch', endDate: '2024-08-15' },
    ],
    upcomingCompetitions: [
        { id: 'comp3', name: 'Efterårsdysten', startDate: '2024-09-01', prize: 'Eksklusivt Badge' },
    ],
    userPortfolioValue: 12500.75,
    userRank: 23,
    totalParticipantsThisMonth: 150,
};

export default function AktiedystPage() {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <div className="flex items-center">
                    <Trophy className="h-10 w-10 text-primary mr-3" />
                    <div>
                        <h1 className="text-3xl font-bold">Aktiedyst</h1>
                        <p className="text-muted-foreground">Konkurrér og vind præmier med din aktieportefølje.</p>
                    </div>
                </div>
                <Button size="lg" asChild>
                    <Link href="/aktiedyst/new">
                        <PlusCircle className="mr-2 h-5 w-5" /> Opret Ny Dyst (Admin)
                    </Link>
                </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Min Porteføljeværdi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-500">{mockAktiedystData.userPortfolioValue.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}</p>
                        <p className="text-sm text-muted-foreground">Din nuværende placering: #{mockAktiedystData.userRank}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Aktive Deltagere</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{mockAktiedystData.totalParticipantsThisMonth}</p>
                        <p className="text-sm text-muted-foreground">Denne måned</p>
                    </CardContent>
                </Card>
                <Card className="bg-primary text-primary-foreground">
                    <CardHeader>
                        <CardTitle className="text-lg">Klar til at Dyste?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm mb-3">Tilmeld dig en af de igangværende konkurrencer eller se kommende.</p>
                        <Button variant="secondary" asChild>
                            <Link href="#ongoing-competitions">Se Konkurrencer</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <section id="ongoing-competitions" className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 flex items-center"><TrendingUp className="mr-2 h-6 w-6 text-primary" /> Igangværende Dyster</h2>
                {mockAktiedystData.ongoingCompetitions.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {mockAktiedystData.ongoingCompetitions.map(comp => (
                            <Card key={comp.id}>
                                <CardHeader>
                                    <CardTitle>{comp.name}</CardTitle>
                                    <CardDescription>Slutter {new Date(comp.endDate).toLocaleDateString('da-DK')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm flex items-center"><Users className="mr-1 h-4 w-4" /> {comp.participants} deltagere</span>
                                        <span className="text-sm font-semibold">Præmie: {comp.prize}</span>
                                    </div>
                                    <Button className="w-full" asChild>
                                        <Link href={`/aktiedyst/dyst/${comp.id}`}>Se Dyst</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">Ingen igangværende dyster i øjeblikket.</p>
                )}
            </section>

            <section id="upcoming-competitions" className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Kommende Dyster</h2>
                {mockAktiedystData.upcomingCompetitions.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {mockAktiedystData.upcomingCompetitions.map(comp => (
                            <Card key={comp.id} className="border-dashed">
                                <CardHeader>
                                    <CardTitle>{comp.name}</CardTitle>
                                    <CardDescription>Starter {new Date(comp.startDate).toLocaleDateString('da-DK')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm mb-2">Præmie: <span className="font-semibold">{comp.prize}</span></p>
                                    <Button variant="outline" disabled>Info Kommer Snart</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">Ingen kommende dyster annonceret endnu.</p>
                )}
            </section>

            <Card className="mt-8 bg-muted/50">
                <CardHeader>
                    <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5" />Hvordan Virker Aktiedysten?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <p>1. Du starter med en fiktiv kapital (f.eks. 100.000 kr.) i starten af hver dyst.</p>
                    <p>2. Køb og sælg aktier (baseret på realtidsdata med en lille forsinkelse) for at øge værdien af din portefølje.</p>
                    <p>3. Den deltager med den højeste porteføljeværdi ved dystens afslutning vinder.</p>
                    <p>4. Nogle dyster kan have specifikke regler eller temaer (f.eks. kun grønne aktier).</p>
                    <Link href="/aktiedyst/rules" className="text-primary hover:underline">Læs fulde regler og FAQ</Link>
                </CardContent>
            </Card>
        </div>
    );
}
