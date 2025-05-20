'use client'; // Ensure this is a client component

import { useAuthStore } from '@/stores/authStore'; // Import the auth store
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      redirect('/dashboard');
    }
  }, [isAuthenticated, isLoading]);

  // Optional: Show a loading state while auth is being checked
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  // If not loading and not authenticated, show the homepage content
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Velkommen til FatteCentralen</h1>
        <p className="mb-4">
          Dette er startsiden for FatteCentralen. Herfra kan du navigere til de
          forskellige sektioner af platformen.
        </p>
        <p>
          Brug sidebaren til venstre (eller menuen på mobile enheder) for at komme
          i gang.
        </p>
        {/* TODO: Add more specific content for the main page based on index.html or other requirements */}
      </div>
    );
  }

  // Fallback, though the redirect should have happened
  return null;
}
