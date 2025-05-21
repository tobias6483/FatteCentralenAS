// filepath: /Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt/fattecentralen-monorepo/apps/frontend/src/app/aktiedyst/components/CompetitionCard.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Info, PlayCircle, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { Competition } from '../types'; // Importer Competition type

interface CompetitionCardProps {
    competition: Competition;
    type: 'my-competition' | 'open-ongoing' | 'open-upcoming' | 'result';
    // Potentielt en action prop for specifikke handlinger, hvis knapperne bliver meget forskellige
    // actionButton?: React.ReactNode;
}

const CompetitionCard: React.FC<CompetitionCardProps> = ({ competition, type }) => {
    const {
        id,
        name,
        participants,
        prize,
        endDate,
        startDate,
        userRank,
        userPortfolioValue,
        winner
    } = competition;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('da-DK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null) return 'N/A';
        return value.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' });
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle className="text-lg">{name}</CardTitle>
                {type === 'open-ongoing' && endDate && <CardDescription>Slutter: {formatDate(endDate)}</CardDescription>}
                {type === 'open-upcoming' && startDate && <CardDescription>Starter: {formatDate(startDate)}</CardDescription>}
                {type === 'my-competition' && endDate && (
                    <CardDescription>
                        Slutter: {formatDate(endDate)} <br />
                        Din placering: <span className="font-semibold">#{userRank || 'N/A'}</span>
                    </CardDescription>
                )}
                {type === 'result' && endDate && <CardDescription>Afsluttet: {formatDate(endDate)}</CardDescription>}
            </CardHeader>
            <CardContent className="grow space-y-2 text-sm">
                {participants !== undefined && (
                    <p className="flex items-center"><Users className="mr-2 h-4 w-4 text-muted-foreground" /> {participants} deltagere</p>
                )}
                <p className="flex items-center"><Trophy className="mr-2 h-4 w-4 text-muted-foreground" /> Præmie: <span className="font-semibold ml-1">{prize}</span></p>

                {type === 'my-competition' && userPortfolioValue !== undefined && (
                    <p>Min portefølje: <span className="font-semibold">{formatCurrency(userPortfolioValue)}</span></p>
                )}
                {type === 'result' && winner && (
                    <p>Vinder: <span className="font-semibold">{winner}</span></p>
                )}
                {type === 'result' && userRank !== undefined && (
                    <p>Din placering: <span className="font-semibold">#{userRank}</span></p>
                )}
            </CardContent>
            <CardFooter>
                {type === 'my-competition' && (
                    <Button className="w-full" asChild>
                        <Link href={`/aktiedyst/dyst/${id}`}><PlayCircle className="mr-2 h-4 w-4" /> Se Dyst</Link>
                    </Button>
                )}
                {type === 'open-ongoing' && (
                    <Button className="w-full" asChild>
                        <Link href={`/aktiedyst/dyst/${id}`}><PlayCircle className="mr-2 h-4 w-4" /> Se Dyst / Tilmeld</Link>
                    </Button>
                )}
                {type === 'open-upcoming' && (
                    <Button className="w-full" variant="outline" disabled>
                        <Info className="mr-2 h-4 w-4" /> Info Kommer Snart
                    </Button>
                )}
                {type === 'result' && (
                    <Button className="w-full" variant="secondary" asChild>
                        <Link href={`/aktiedyst/results/${id}`}><BarChart2 className="mr-2 h-4 w-4" /> Se Detaljer</Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default CompetitionCard;
