'use client';

import { auth, googleProvider } from '@/lib/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { toast } from 'sonner';

const signupSchema = z.object({
    name: z.string().min(2, { message: 'Navn skal være mindst 2 tegn' }),
    email: z.string().email({ message: 'Ugyldig email adresse' }),
    password: z.string().min(6, { message: 'Adgangskode skal være mindst 6 tegn' }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
    });

    const handleEmailSignup = async (data: SignupFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            await updateProfile(userCredential.user, { displayName: data.name });
            toast.success('Konto oprettet!', { description: 'Omdirigerer til dashboard...' });
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Oprettelse af konto fejlede. Prøv igen.');
            toast.error('Fejl ved oprettelse', { description: err.message || 'Ukendt fejl.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
            toast.success('Konto oprettet med Google!', { description: 'Omdirigerer til dashboard...' });
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Google signup fejlede. Prøv igen.');
            toast.error('Google Signup Fejl', { description: err.message || 'Ukendt fejl.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <div className="w-full max-w-md p-8 space-y-6 bg-card shadow-lg rounded-lg">
                <h1 className="text-2xl font-bold text-center text-card-foreground">Opret Konto</h1>

                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                <form onSubmit={handleSubmit(handleEmailSignup)} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Navn</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Dit Navn"
                            {...register('name')}
                            className={errors.name ? 'border-destructive' : ''}
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
                        {isLoading ? 'Opretter konto...' : 'Opret Konto'}
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

                <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={isLoading}>
                    {/* TODO: Add Google Icon */}
                    {isLoading ? 'Opretter konto...' : 'Opret med Google'}
                </Button>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Har du allerede en konto?{' '}
                    <Link href="/auth/login" className="font-medium text-primary hover:underline">
                        Login her
                    </Link>
                </p>
            </div>
        </div>
    );
}
