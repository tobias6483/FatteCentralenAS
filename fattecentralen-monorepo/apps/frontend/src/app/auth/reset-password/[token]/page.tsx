import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function ConfirmPasswordResetPage() {
    // In a real application, you would handle token validation from the URL
    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Indtast ny adgangskode</CardTitle>
                <CardDescription>
                    Vælg en ny adgangskode til din konto.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="new-password">Ny adgangskode</Label>
                    <Input id="new-password" type="password" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="confirm-new-password">Bekræft ny adgangskode</Label>
                    <Input id="confirm-new-password" type="password" />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col">
                <Button className="w-full">Gem ny adgangskode</Button>
                <p className="mt-4 text-center text-sm">
                    <Link href="/login" className="underline">
                        Tilbage til login
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
