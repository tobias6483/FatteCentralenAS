import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BellRing, Trash2 } from 'lucide-react';

// Mock data - erstat med data fra API senere
const mockNotifications = [
    { id: "1", title: "Nyt svar i din tråd", message: "Brugeren 'SuperBruger' har svaret på din tråd 'Bedste fodboldmål nogensinde?'", time: "For 5 minutter siden", read: false, type: "forum" },
    { id: "2", title: "Din Aktiedyst er startet!", message: "Ugens aktiedyst er nu i gang. Held og lykke!", time: "For 1 time siden", read: false, type: "game" },
    { id: "3", title: "Velkommen til FatteCentralen", message: "Tak fordi du har oprettet en bruger. Udforsk platformen!", time: "For 1 dag siden", read: true, type: "system" },
    { id: "4", title: "Ny besked fra Admin", message: "Husk at læse vores opdaterede betingelser.", time: "For 2 dage siden", read: true, type: "message" },
];


export default function NotificationsPage() {
    const unreadCount = mockNotifications.filter(n => !n.read).length;

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Notifikationer</h1>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled={unreadCount === 0}>
                        Marker alle som læst ({unreadCount} ulæste)
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Slet alle
                    </Button>
                </div>
            </div>

            {mockNotifications.length === 0 ? (
                <Card>
                    <CardContent className="p-6 text-center">
                        <BellRing className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Du har ingen nye notifikationer.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {mockNotifications.map((notification) => (
                        <Card key={notification.id} className={` ${notification.read ? 'bg-card' : 'bg-primary/5 border-primary/20'}`}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{notification.title}</CardTitle>
                                    {!notification.read && (
                                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Ny</span>
                                    )}
                                </div>
                                <CardDescription className="text-xs text-muted-foreground pt-1">{notification.time}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{notification.message}</p>
                                <div className="mt-3 flex justify-end space-x-2">
                                    {!notification.read && (
                                        <Button variant="ghost" size="sm">Marker som læst</Button>
                                    )}
                                    <Button variant="outline" size="sm">Vis detaljer</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
