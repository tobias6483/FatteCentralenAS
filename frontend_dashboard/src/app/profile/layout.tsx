import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function ProfileRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}