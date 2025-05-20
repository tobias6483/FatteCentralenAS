import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function RequestPasswordResetPage() {
    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Nulstil adgangskode</CardTitle>
                <CardDescription>
                    Indtast din emailadresse for at modtage et link til nulstilling af din adgangskode.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@eksempel.dk" />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col">
                <Button className="w-full">Send nulstillingslink</Button>
                <p className="mt-4 text-center text-sm">
                    <Link href="/login" className="underline">
                        Tilbage til login
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
