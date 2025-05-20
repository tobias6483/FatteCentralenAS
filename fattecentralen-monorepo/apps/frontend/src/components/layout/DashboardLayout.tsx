'use client';

import { useRouter } from 'next/navigation'; // Corrected import
import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore'; // Corrected import path
import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback, we can return null or a redirect component.
    // For now, returning null as the redirect should have already occurred.
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 lg:ml-64 lg:pt-20">
          {/* Main content goes here */}
          {children}
        </main>
      </div>
      {/* <Footer /> */}
    </div>
  );
};

export default DashboardLayout;
