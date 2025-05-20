import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <h1 className="text-3xl font-bold mb-8">Indstillinger</h1>

            <div className="grid gap-8 md:grid-cols-1"> {/* Kan opdeles i flere kolonner hvis nødvendigt */}
                <Card>
                    <CardHeader>
                        <CardTitle>Kontoindstillinger</CardTitle>
                        <CardDescription>Administrer dine kontooplysninger.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="username">Brugernavn</Label>
                            <Input id="username" defaultValue="SpilMaster" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue="spilmaster@fattecentralen.dk" />
                        </div>
                        <Button>Gem ændringer (Funktionalitet kommer senere)</Button>
                        <Separator className="my-6" />
                        <div>
                            <h3 className="text-lg font-medium mb-2">Skift Adgangskode</h3>
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Nuværende Adgangskode</Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div className="space-y-2 mt-4">
                                <Label htmlFor="new-password">Ny Adgangskode</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <div className="space-y-2 mt-4">
                                <Label htmlFor="confirm-new-password">Bekræft Ny Adgangskode</Label>
                                <Input id="confirm-new-password" type="password" />
                            </div>
                            <Button className="mt-4">Skift Adgangskode (Funktionalitet kommer senere)</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifikationsindstillinger</CardTitle>
                        <CardDescription>Vælg hvordan du vil modtage notifikationer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="email-notifications" defaultChecked />
                            <Label htmlFor="email-notifications" className="font-normal">
                                Modtag notifikationer via email
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="push-notifications" />
                            <Label htmlFor="push-notifications" className="font-normal">
                                Modtag push-notifikationer (hvis understøttet)
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="forum-activity" defaultChecked />
                            <Label htmlFor="forum-activity" className="font-normal">
                                Notifikationer om aktivitet i forumtråde du følger
                            </Label>
                        </div>
                        <Button className="mt-4">Gem Notifikationsindstillinger (Funktionalitet kommer senere)</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Privatlivsindstillinger</CardTitle>
                        <CardDescription>Kontroller synligheden af din profil og aktivitet.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="profile-visibility" className="font-normal">
                                Hvem kan se din profil?
                            </Label>
                            {/* Implementer med Select komponent senere */}
                            <p className="text-sm text-muted-foreground">Alle (Offentlig)</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="activity-visibility" className="font-normal">
                                Hvem kan se din spilaktivitet?
                            </Label>
                            <p className="text-sm text-muted-foreground">Kun venner</p>
                        </div>
                        <Button className="mt-4">Gem Privatlivsindstillinger (Funktionalitet kommer senere)</Button>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
