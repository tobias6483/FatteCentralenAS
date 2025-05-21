'use client'; // Add use client directive

import { Button } from "@/components/ui/button";
// Card components are not used in the new design, replaced by motion.div and direct styling
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from '@/lib/firebase'; // Import Firebase auth
import { sendPasswordResetEmail } from 'firebase/auth'; // Import sendPasswordResetEmail
import { motion } from 'framer-motion'; // Import Framer Motion
import Link from "next/link";
import { useState } from 'react'; // Import useState for loading state
import { toast } from 'sonner'; // Import toast for notifications

// Framer Motion varianter (consistent with other auth pages)
const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            delay: 0.1,
            when: "beforeChildren",
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};
export default function RequestPasswordResetPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success('Link sendt!', { description: 'Hvis en konto med denne email eksisterer, er der sendt et link til nulstilling af adgangskoden.' });
            setEmail(''); // Clear email field after successful submission
        } catch (error: any) {
            console.error("Error sending password reset email: ", error);
            toast.error('Fejl', { description: error.message || 'Kunne ikke sende link til nulstilling af adgangskode. Prøv igen.' });
        }
        setIsLoading(false);
    };

    return (
        // Centered single-column layout
        <motion.div
            className="w-full max-w-md p-8 lg:p-10 space-y-6 bg-card shadow-xl rounded-lg flex flex-col justify-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="text-center" variants={itemVariants}>
                <h1 className="text-3xl font-bold text-card-foreground">Nulstil adgangskode</h1>
                <p className="text-muted-foreground mt-2">
                    Indtast din emailadresse for at modtage et link til nulstilling af din adgangskode.
                </p>
            </motion.div>

            <motion.form onSubmit={handleSubmit} className="space-y-5" variants={itemVariants}>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="din@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1"
                    />
                </div>
                <Button type="submit" className="w-full !mt-6" disabled={isLoading} size="lg">
                    {isLoading ? 'Sender link...' : 'Send nulstillingslink'}
                </Button>
            </motion.form>

            <motion.p className="!mt-8 text-center text-sm text-muted-foreground" variants={itemVariants}>
                <Link href="/auth/login" className="font-medium text-primary hover:underline">
                    Tilbage til login
                </Link>
            </motion.p>
        </motion.div>
    );
}
