// filepath: /Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt/fattecentralen-monorepo/apps/frontend/src/app/aktiedyst/components/CompetitionCard.tsx
import { Button, buttonVariants } from "@/components/ui/button"; // Added buttonVariants
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, CalendarDays, CheckCircle2, Info, PlayCircle, TrendingUp, Trophy, Users } from 'lucide-react'; // Removed XCircle
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
        <Card className="flex flex-col h-full bg-card hover:shadow-lg transition-shadow duration-200 ease-in-out rounded-lg border"> {/* Added bg-card, hover effect, rounded-lg, border */}
            <CardHeader className="pb-3 pt-4 px-4"> {/* Adjusted padding */}
                <CardTitle className="text-base font-semibold text-foreground leading-tight truncate">{name}</CardTitle> {/* Adjusted style, truncate */}
                {type === 'open-ongoing' && endDate &&
                    <CardDescription className="text-xs pt-1"> {/* Removed flex items-center here, will be on inner span */}
                        <span className="flex items-center"> {/* Ensure single child & apply flex here */}
                            <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-primary" /> {/* Icon color */}
                            Slutter: {formatDate(endDate)}
                        </span>
                    </CardDescription>}
                {type === 'open-upcoming' && startDate &&
                    <CardDescription className="text-xs pt-1"> {/* Removed flex items-center here, will be on inner span */}
                        <span className="flex items-center"> {/* Ensure single child & apply flex here */}
                            <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-primary" /> {/* Icon color */}
                            Starter: {formatDate(startDate)}
                        </span>
                    </CardDescription>}
                {type === 'my-competition' && endDate && (
                    <CardDescription className="text-xs pt-1">
                        <div> {/* Wrap multiple lines in a single div */}
                            <span className="flex items-center">
                                <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                Slutter: {formatDate(endDate)}
                            </span>
                            <span className="flex items-center mt-0.5">
                                <TrendingUp className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                Din placering: <span className="font-semibold ml-1">#{userRank || 'N/A'}</span>
                            </span>
                        </div>
                    </CardDescription>
                )}
                {type === 'result' && endDate &&
                    <CardDescription className="text-xs pt-1"> {/* Removed flex items-center here, will be on inner span */}
                        <span className="flex items-center"> {/* Ensure single child & apply flex here */}
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-primary" /> {/* Icon color */}
                            Afsluttet: {formatDate(endDate)}
                        </span>
                    </CardDescription>}
            </CardHeader>
            <CardContent className="grow space-y-1.5 text-sm px-4 pb-3"> {/* Adjusted padding and space */}
                {participants !== undefined && (
                    <p className="flex items-center text-muted-foreground text-xs"> {/* Adjusted style */}
                        <Users className="mr-1.5 h-3.5 w-3.5" /> {participants} deltagere
                    </p>
                )}
                <p className="flex items-center text-muted-foreground text-xs"> {/* Adjusted style */}
                    <Trophy className="mr-1.5 h-3.5 w-3.5" /> Præmie: <span className="font-semibold text-foreground ml-1">{prize}</span>
                </p>

                {type === 'my-competition' && userPortfolioValue !== undefined && (
                    <p className="text-xs text-muted-foreground">Min portefølje: <span className="font-semibold text-foreground">{formatCurrency(userPortfolioValue)}</span></p>
                )}
                {type === 'result' && winner && (
                    <p className="text-xs text-muted-foreground">Vinder: <span className="font-semibold text-foreground">{winner}</span></p>
                )}
                {type === 'result' && userRank !== undefined && (
                    <p className="text-xs text-muted-foreground">Din placering: <span className="font-semibold text-foreground">#{userRank}</span></p>
                )}
            </CardContent>
            <CardFooter className="px-4 pb-4 pt-0"> {/* Adjusted padding */}
                {type === 'my-competition' && (
                    <Link
                        href={`/aktiedyst/dyst/${id}`}
                        className={buttonVariants({ variant: 'default', size: 'sm', className: 'w-full h-9 text-xs' })} // Use buttonVariants
                    >
                        <PlayCircle className="mr-1.5 h-4 w-4" /> Se Dyst
                    </Link>
                )}
                {type === 'open-ongoing' && (
                    <Link
                        href={`/aktiedyst/dyst/${id}`}
                        className={buttonVariants({ variant: 'default', size: 'sm', className: 'w-full h-9 text-xs' })} // Use buttonVariants
                    >
                        <PlayCircle className="mr-1.5 h-4 w-4" /> Se Dyst / Tilmeld
                    </Link>
                )}
                {type === 'open-upcoming' && (
                    <Button className="w-full h-9 text-xs" variant="outline" disabled> {/* Adjusted size and text */}
                        <Info className="mr-1.5 h-4 w-4" /> Info Kommer Snart
                    </Button>
                )}
                {type === 'result' && (
                    <Link
                        href={`/aktiedyst/results/${id}`}
                        className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'w-full h-9 text-xs' })} // Use buttonVariants
                    >
                        <BarChart2 className="mr-1.5 h-4 w-4" /> Se Detaljer
                    </Link>
                )}
            </CardFooter>
        </Card>
    );
};

export default CompetitionCard;
