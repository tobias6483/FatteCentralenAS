'use client'; // Ensure this is active

import { useAuthStore } from '@/stores/authStore';
import { Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React, { useEffect } from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    console.log('AuthLayout: Component function CALLED');
    const { isAuthenticated, isLoading } = useAuthStore();

    useEffect(() => {
        console.log(`AuthLayout useEffect: isLoading: ${isLoading}, isAuthenticated: ${isAuthenticated}`);
        if (!isLoading && isAuthenticated) {
            console.log('AuthLayout: User is authenticated, redirecting to /dashboard');
            redirect('/dashboard');
        }
    }, [isAuthenticated, isLoading]);

    if (isLoading) {
        console.log('AuthLayout: isLoading is true, rendering loading state');
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
                <p>Loading authentication state...</p>
            </div>
        );
    }

    if (isAuthenticated) {
        console.log('AuthLayout: isAuthenticated is true (after isLoading check), rendering null (should be redirecting)');
        return null;
    }

    console.log('AuthLayout: Rendering layout with children');
    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <Gamepad2 className="h-6 w-6" />
                        <span className="font-bold sm:inline-block">FatteCentralen</span>
                    </Link>
                    <nav className="flex items-center space-x-4">
                        <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
                            Login
                        </Link>
                        <Link href="/auth/signup" className="text-sm font-medium text-muted-foreground hover:text-primary">
                            Opret Bruger
                        </Link>
                    </nav>
                </div>
            </header>
            <main className="flex flex-1 items-center justify-center p-6">
                <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
                    {children}
                </div>
            </main>
            <footer className="border-t bg-background py-6">
                <div className="container text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} FatteCentralen A/S. Alle rettigheder forbeholdes.
                </div>
            </footer>
        </div>
    );
};

export default AuthLayout;
