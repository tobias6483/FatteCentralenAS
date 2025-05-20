import { Gamepad2 } from 'lucide-react'; // Using Gamepad2 for consistency
import Link from 'next/link';
import React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <Gamepad2 className="h-6 w-6" />
                        <span className="font-bold sm:inline-block">FatteCentralen</span>
                    </Link>
                    <nav className="flex items-center space-x-4">
                        <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
                            Login
                        </Link>
                        <Link href="/signup" className="text-sm font-medium text-muted-foreground hover:text-primary">
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
