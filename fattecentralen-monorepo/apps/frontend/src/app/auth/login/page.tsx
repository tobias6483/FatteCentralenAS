'use client';

import { auth, googleProvider } from '@/lib/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner'; // Import sonner
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const loginSchema = z.object({
    email: z.string().email({ message: 'Ugyldig email adresse' }),
    password: z.string().min(6, { message: 'Adgangskode skal være mindst 6 tegn' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const handleEmailLogin = async (data: LoginFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
            toast.success('Login succesfuld!', { description: 'Omdirigerer til dashboard...' }); // Use sonner toast
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login fejlede. Prøv igen.');
            toast.error('Login Fejl', { description: err.message || 'Ukendt fejl.' }); // Use sonner toast
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
            toast.success('Login succesfuld!', { description: 'Omdirigerer til dashboard...' }); // Use sonner toast
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Google login fejlede. Prøv igen.');
            toast.error('Login Fejl', { description: err.message || 'Ukendt fejl.' }); // Use sonner toast
        } finally {
            setIsLoading(false);
        }
    };
    console.log('LoginPage: Rendering with original form content'); // Added a log
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <div className="w-full max-w-md p-8 space-y-6 bg-card shadow-lg rounded-lg">
                <h1 className="text-2xl font-bold text-center text-card-foreground">Login</h1>

                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                <form onSubmit={handleSubmit(handleEmailLogin)} className="space-y-4">
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="din@email.com"
                            {...register('email')}
                            className={errors.email ? 'border-destructive' : ''}
                        />
                        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="password">Adgangskode</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="********"
                            {...register('password')}
                            className={errors.password ? 'border-destructive' : ''}
                        />
                        {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Logger ind...' : 'Login'}
                    </Button>
                </form>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                            Eller fortsæt med
                        </span>
                    </div>
                </div>

                <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
                    {/* TODO: Add Google Icon */}
                    {isLoading ? 'Logger ind...' : 'Login med Google'}
                </Button>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Har du ikke en konto?{' '}
                    <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                        Opret konto
                    </Link>
                </p>
            </div>
        </div>
    );
}
