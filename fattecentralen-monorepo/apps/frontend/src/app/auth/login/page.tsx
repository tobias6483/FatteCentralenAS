'use client';

import { auth, googleProvider } from '@/lib/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
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

// Framer Motion varianter
const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            delay: 0.1,
            when: 'beforeChildren',
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const loginSchema = z.object({
    email: z.string().email({ message: 'Ugyldig email adresse' }),
    password: z.string().min(6, { message: 'Adgangskode skal være mindst 6 tegn' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const handleEmailLogin = async (data: LoginFormValues) => {
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
            toast.success('Login succesfuld!', { description: 'Omdirigerer til dashboard...' });
            router.push('/dashboard');
        } catch (err: any) {
            toast.error('Login Fejl', { description: err.message || 'Ugyldig email eller adgangskode.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            toast.success('Login succesfuld med Google!', { description: 'Omdirigerer til dashboard...' });
            router.push('/dashboard');
        } catch (err: any) {
            toast.error('Google Login Fejl', { description: err.message || 'Kunne ikke logge ind med Google.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Adjusted to a single column centered layout
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-4">
            {/* Login Form Section - Now centered */}
            <motion.div
                className="w-full max-w-md p-8 lg:p-10 space-y-6 bg-card shadow-xl rounded-lg flex flex-col justify-center" // Removed lg:w-1/2, lg:min-h-[550px]
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div className="text-center" variants={itemVariants}>
                    {/* Removed "FC" placeholder div */}
                    {/* The Gamepad2 icon and "FatteCentralen" text from auth/layout.tsx will serve as the logo */}
                    <h1 className="text-3xl font-bold text-card-foreground mt-4">Log ind på FatteCentralen</h1>
                </motion.div>

                <motion.form onSubmit={handleSubmit(handleEmailLogin)} className="space-y-5" variants={itemVariants}>
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
                        <div className="flex justify-between items-center">
                            <Label htmlFor="password">Adgangskode</Label>
                            <Link href="/auth/request-password-reset" className="text-sm text-primary hover:underline">
                                Glemt adgangskode?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            {...register('password')}
                            className={`${errors.password ? 'border-destructive' : ''} mt-1`}
                        />
                        {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full !mt-6" disabled={isLoading} size="lg">
                        {isLoading ? 'Logger ind...' : 'Log ind'}
                    </Button>
                </motion.form>

                <motion.div className="relative my-5" variants={itemVariants}>
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Eller fortsæt med</span>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading} size="lg">
                        {/* Google Icon */}
                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path
                                d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 256S109.8 0 244 0c49.3 0 95.1 15.3 132.3 42.6l-58.2 58.3C300.6 82.8 273.2 73 244 73c-73.2 0-133.2 60.3-133.2 134.3s60 134.3 133.2 134.3c50.5 0 92.3-26.3 112.8-64.3H244v-71.4h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                                fill="currentColor"
                            />
                        </svg>
                        {isLoading ? 'Logger ind...' : 'Log ind med Google'}
                    </Button>
                </motion.div>

                <motion.p className="!mt-8 text-center text-sm text-muted-foreground" variants={itemVariants}>
                    Har du ikke en konto?{' '}
                    <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                        Opret konto her
                    </Link>
                </motion.p>
            </motion.div>
        </div>
    );
}
