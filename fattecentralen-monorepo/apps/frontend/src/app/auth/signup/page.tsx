'use client';

import { auth, googleProvider } from '@/lib/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { motion } from 'framer-motion'; // Import Framer Motion
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

// Framer Motion varianter (samme som login)
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

const signupSchema = z.object({
    name: z.string().min(2, { message: 'Navn skal være mindst 2 tegn' }),
    email: z.string().email({ message: 'Ugyldig email adresse' }),
    password: z.string().min(6, { message: 'Adgangskode skal være mindst 6 tegn' }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
    });

    const handleEmailSignup = async (data: SignupFormValues) => {
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            await updateProfile(userCredential.user, { displayName: data.name });
            toast.success('Konto oprettet!', { description: 'Omdirigerer til dashboard...' });
            router.push('/dashboard');
        } catch (err: any) {
            toast.error('Fejl ved oprettelse', { description: err.message || 'Denne email er muligvis allerede i brug.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setIsLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            toast.success('Konto oprettet med Google!', { description: 'Omdirigerer til dashboard...' });
            router.push('/dashboard');
        } catch (err: any) {
            toast.error('Google Signup Fejl', { description: err.message || 'Kunne ikke oprette konto med Google.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Adjusted to a single column centered layout
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-4">
            {/* Signup Form Section - Now centered */}
            <motion.div
                className="w-full max-w-md p-8 lg:p-10 space-y-6 bg-card shadow-xl rounded-lg flex flex-col justify-center" // Removed lg:w-1/2, lg:min-h-[600px]
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div className="text-center" variants={itemVariants}>
                    {/* Removed "FC" placeholder div */}
                    {/* The Gamepad2 icon and "FatteCentralen" text from auth/layout.tsx will serve as the logo */}
                    <h1 className="text-3xl font-bold text-card-foreground mt-4">Opret din konto</h1>
                </motion.div>

                <motion.form onSubmit={handleSubmit(handleEmailSignup)} className="space-y-5" variants={itemVariants}>
                    <div>
                        <Label htmlFor="name">Fulde Navn</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Indtast dit fulde navn"
                            {...register('name')}
                            className={`${errors.name ? 'border-destructive' : ''} mt-1`}
                        />
                        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="din@email.com"
                            {...register('email')}
                            className={`${errors.email ? 'border-destructive' : ''} mt-1`}
                        />
                        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="password">Adgangskode</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Vælg en stærk adgangskode"
                            {...register('password')}
                            className={`${errors.password ? 'border-destructive' : ''} mt-1`}
                        />
                        {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full !mt-6" disabled={isLoading} size="lg">
                        {isLoading ? 'Opretter konto...' : 'Opret Konto'}
                    </Button>
                </motion.form>

                <motion.div className="relative my-5" variants={itemVariants}>
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                            Eller opret med
                        </span>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={isLoading} size="lg">
                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 256S109.8 0 244 0c49.3 0 95.1 15.3 132.3 42.6l-58.2 58.3C300.6 82.8 273.2 73 244 73c-73.2 0-133.2 60.3-133.2 134.3s60 134.3 133.2 134.3c50.5 0 92.3-26.3 112.8-64.3H244v-71.4h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" fill="currentColor" />
                        </svg>
                        {isLoading ? 'Opretter konto...' : 'Opret med Google'}
                    </Button>
                </motion.div>

                <motion.p className="!mt-8 text-center text-sm text-muted-foreground" variants={itemVariants}>
                    Har du allerede en konto?{' '}
                    <Link href="/auth/login" className="font-medium text-primary hover:underline">
                        Log ind her
                    </Link>
                </motion.p>
            </motion.div>
        </div>
    );
}
