'use client';

import DashboardLayoutComponent from '@/components/layout/DashboardLayout'; // Renamed to avoid conflict
import React from 'react';

interface ProtectedLayoutProps {
    children: React.ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
    return <DashboardLayoutComponent>{children}</DashboardLayoutComponent>;
};

export default ProtectedLayout;
