"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { app as firebaseApp } from "@/lib/firebase"; // Assuming you have firebase initialized here
import { confirmPasswordReset, getAuth, verifyPasswordResetCode } from "firebase/auth";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const auth = getAuth(firebaseApp);

export default function ConfirmPasswordResetPage() {
    const router = useRouter();
    const params = useParams();
    const token = params?.token as string | undefined;

    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError("Nulstillingskode mangler eller er ugyldig.");
            toast.error("Nulstillingskode mangler eller er ugyldig.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError("Adgangskoderne matcher ikke.");
            toast.error("Adgangskoderne matcher ikke.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Adgangskoden skal være på mindst 6 tegn.");
            toast.error("Adgangskoden skal være på mindst 6 tegn.");
            return;
        }

        setIsLoading(true);
        try {
            // Optional: Verify the code first to provide a more specific error if the code is invalid/expired
            await verifyPasswordResetCode(auth, token);
            // If verifyPasswordResetCode is successful, proceed to confirmPasswordReset
            await confirmPasswordReset(auth, token, newPassword);
            toast.success("Din adgangskode er blevet nulstillet. Du kan nu logge ind med din nye adgangskode.");
            router.push("/auth/login");
        } catch (err: any) {
            console.error("Fejl ved nulstilling af adgangskode:", err);
            let errorMessage = "Der opstod en fejl. Prøv igen.";
            if (err.code === 'auth/expired-action-code') {
                errorMessage = "Nulstillingslinket er udløbet. Anmod venligst om et nyt.";
            } else if (err.code === 'auth/invalid-action-code') {
                errorMessage = "Nulstillingslinket er ugyldigt. Det kan være blevet brugt eller er forkert.";
            } else if (err.code === 'auth/user-disabled') {
                errorMessage = "Din brugerkonto er deaktiveret.";
            } else if (err.code === 'auth/user-not-found') {
                errorMessage = "Ingen bruger fundet med denne email. Dette burde ikke ske med et gyldigt link.";
            } else if (err.code === 'auth/weak-password') {
                errorMessage = "Adgangskoden er for svag. Vælg en stærkere adgangskode.";
            }
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
    };

    if (!token) {
        // This case should ideally be handled by Next.js routing if the token is mandatory
        // or show a specific message if token is not present.
        // For now, auth/layout provides a centered container.
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl">Ugyldigt Link</CardTitle>
                        <CardDescription>
                            Nulstillingslinket mangler eller er ugyldigt. Gå tilbage og prøv igen.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" asChild>
                            <Link href="/auth/login">Tilbage til login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }


    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="w-full max-w-md"
        >
            <Card>
                <form onSubmit={handleResetPassword}>
                    <CardHeader className="space-y-1">
                        <motion.div variants={itemVariants}>
                            <CardTitle className="text-2xl">Indtast ny adgangskode</CardTitle>
                        </motion.div>
                        <motion.div variants={itemVariants} transition={{ delay: 0.1 }}>
                            <CardDescription>
                                Vælg en ny adgangskode til din konto.
                            </CardDescription>
                        </motion.div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <motion.div variants={itemVariants} transition={{ delay: 0.2 }} className="grid gap-2">
                            <Label htmlFor="new-password">Ny adgangskode</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </motion.div>
                        <motion.div variants={itemVariants} transition={{ delay: 0.3 }} className="grid gap-2">
                            <Label htmlFor="confirm-new-password">Bekræft ny adgangskode</Label>
                            <Input
                                id="confirm-new-password"
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </motion.div>
                        {error && (
                            <motion.p
                                variants={itemVariants}
                                transition={{ delay: 0.4 }}
                                className="text-sm font-medium text-destructive"
                            >
                                {error}
                            </motion.p>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <motion.div variants={itemVariants} transition={{ delay: 0.5 }} className="w-full">
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? "Gemmer..." : "Gem ny adgangskode"}
                            </Button>
                        </motion.div>
                        <motion.p
                            variants={itemVariants}
                            transition={{ delay: 0.6 }}
                            className="text-center text-sm"
                        >
                            <Link href="/auth/login" className="underline hover:text-primary">
                                Tilbage til login
                            </Link>
                        </motion.p>
                    </CardFooter>
                </form>
            </Card>
        </motion.div>
    );
}
