import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data - erstat med data fra API senere
const userProfile = {
    username: "SpilMaster",
    email: "spilmaster@fattecentralen.dk",
    avatarUrl: "/placeholder-avatar.png", // Sørg for at have et placeholder billede
    bio: "Entusiastisk gamer og sportsfan. Altid klar på en god aktiedyst!",
    memberSince: "Januar 2023",
};

export default function ProfilePage() {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <Avatar className="w-24 h-24 mx-auto mb-4">
                        <AvatarImage src={userProfile.avatarUrl} alt={userProfile.username} />
                        <AvatarFallback>{userProfile.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl">{userProfile.username}</CardTitle>
                    <CardDescription>{userProfile.email}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold">Om Mig</h3>
                            <p className="text-muted-foreground">{userProfile.bio || "Ingen biografi tilføjet."}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Medlem Siden</h3>
                            <p className="text-muted-foreground">{userProfile.memberSince}</p>
                        </div>
                        {/* Tilføj flere profilsektioner her, f.eks. spilhistorik, badges etc. */}
                        <Button className="w-full mt-6">Rediger Profil (Funktionalitet kommer senere)</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
