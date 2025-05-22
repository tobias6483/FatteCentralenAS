// filepath: /Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt/fattecentralen-monorepo/apps/frontend/src/app/forum/layout.tsx
import DashboardLayout from '@/components/layout/DashboardLayout';
import React from 'react';

export default function ForumLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
