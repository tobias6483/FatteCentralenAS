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
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4 sm:p-6">
            {/* Simpelt Logo øverst */}
            <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
                <Link href="/" className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors">
                    <Gamepad2 className="h-7 w-7 sm:h-8 sm:w-8" />
                    <span className="text-lg sm:text-xl font-bold">FatteCentralen A/S</span>
                </Link>
            </div>
            {/* Indhold (login/signup kort) vil blive centreret af flex-containeren */}
            {children}
            {/* Footer fjernet */}
        </div>
    );
};

export default AuthLayout;
