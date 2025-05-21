'use client';

import { useAuthStore } from '@/stores/authStore';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function RootRedirectPage() {
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        redirect('/dashboard');
      } else {
        redirect('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading]);

  // Vis en simpel loading-besked mens omdirigering sker
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
      <p>Omdirigerer...</p>
    </div>
  );
}
