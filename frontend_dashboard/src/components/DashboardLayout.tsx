"use client"; // Mark this component as a Client Component

import React from 'react';
import { usePathname } from 'next/navigation'; // Import usePathname
import Header from './Header'; // Import the Header component
import {
  HomeIcon,
  UserCircleIcon,
  Squares2X2Icon,
  ChatBubbleLeftEllipsisIcon,
  EnvelopeIcon,
  PlayCircleIcon,
  ChartBarIcon,
  UserPlusIcon,
  UsersIcon,
  TrophyIcon,
  ClockIcon,
  Cog6ToothIcon,
  PuzzlePieceIcon, // Added PuzzlePieceIcon for the title
} from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  profileCard?: React.ReactNode; // Profile card is now optional here, will be primary in sidebar
  statsOverview?: React.ReactNode;
  detailedStats?: React.ReactNode;
  balanceChart?: React.ReactNode;
  recentActivity?: React.ReactNode;
  forumPosts?: React.ReactNode;
  sessionsInvites?: React.ReactNode;
  quickLinks?: React.ReactNode;
  children?: React.ReactNode; // To allow passing main page content
  // headerContent prop is removed as Header component will be used directly
  sidebarNavItems?: NavItem[]; // For dynamic sidebar navigation
}

interface NavItem {
  name: string;
  href: string;
  icon?: React.ReactNode; // Optional icon component or SVG string
  current?: boolean;
}

// Placeholder navigation items - these would ideally come from a config or be passed as props
const defaultNavItems: NavItem[] = [
  { name: 'Home', href: '/', icon: <HomeIcon className="h-5 w-5" /> }, // Assuming home is '/'
  { name: 'Profil', href: '/profile', icon: <UserCircleIcon className="h-5 w-5" /> },
  { name: 'Game Area', href: '#', icon: <Squares2X2Icon className="h-5 w-5" /> },
  { name: 'Forum', href: '#', icon: <ChatBubbleLeftEllipsisIcon className="h-5 w-5" /> },
  { name: 'Beskeder', href: '#', icon: <EnvelopeIcon className="h-5 w-5" /> },
  { name: 'Live Sports', href: '#', icon: <PlayCircleIcon className="h-5 w-5" /> },
  { name: 'Aktiedysten', href: '/aktiedyst', icon: <ChartBarIcon className="h-5 w-5" /> },
  { name: 'Join Game', href: '#', icon: <UserPlusIcon className="h-5 w-5" /> },
  { name: 'Active Sessions', href: '#', icon: <UsersIcon className="h-5 w-5" /> },
  { name: 'Leaderboard', href: '#', icon: <TrophyIcon className="h-5 w-5" /> },
  { name: 'Historik', href: '#', icon: <ClockIcon className="h-5 w-5" /> },
];

const adminNavItems: NavItem[] = [
    { name: 'Admin Menu', href: '#', icon: <Cog6ToothIcon className="h-5 w-5" /> },
];


export default function DashboardLayout({
  profileCard,
  statsOverview,
  detailedStats,
  balanceChart,
  recentActivity,
  forumPosts,
  sessionsInvites,
  quickLinks,
  children,
  // headerContent, // Removed from props
  sidebarNavItems = defaultNavItems,
}: DashboardLayoutProps) {
  const pathname = usePathname(); // Get current pathname

  return (
    // The overall page background is now controlled by globals.css -> var(--background) -> #121212
    <div className="flex h-screen text-[var(--foreground)] overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      <aside
        className="w-64 p-4 flex flex-col shadow-lg"
        style={{ backgroundColor: 'var(--chrome-bg-very-dark)', color: 'var(--bet365-text-secondary)' }} // Default text color for sidebar
      >
        <div
          className="flex items-center justify-center text-2xl font-semibold mb-4 border-b pb-4 pt-1"
          style={{ borderColor: 'var(--bet365-border)', color: 'var(--bet365-text-primary)' }} // Title text can be primary
        >
          <PuzzlePieceIcon className="h-7 w-7 mr-2" style={{ color: 'var(--bet365-primary-green)' }} />
          Fattecentralen
        </div>
        
        {profileCard && <div className="mb-3">{profileCard}</div>}

        <div className="border-t my-3" style={{ borderColor: 'var(--bet365-border)' }}></div>

        <nav className="flex-grow space-y-0.5">
          {sidebarNavItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out`}
              style={{
                color: pathname === item.href ? 'var(--bet365-text-primary)' : 'var(--bet365-text-secondary)', // Active text: bright, Inactive text: secondary
                backgroundColor: pathname === item.href ? 'var(--bet365-primary-green)' : 'transparent',
              }}
              onMouseOver={(e) => {
                if (pathname !== item.href) {
                  e.currentTarget.style.backgroundColor = 'var(--bet365-primary-green)';
                  e.currentTarget.style.color = 'var(--bet365-text-primary)'; // Hover text: bright
                }
              }}
              onMouseOut={(e) => {
                if (pathname !== item.href) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--bet365-text-secondary)'; // Restore inactive text color
                }
              }}
            >
              {item.icon && <span className="mr-3 flex-shrink-0">{item.icon}</span>} {/* Icons will inherit color */}
              {item.name}
            </a>
          ))}
        </nav>

        <div className="border-t my-3" style={{ borderColor: 'var(--bet365-border)' }}></div>
        
        <nav className="space-y-0.5">
            {adminNavItems.map((item) => (
                 <a
                   key={item.name}
                   href={item.href}
                   className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out`}
                   style={{
                     color: pathname === item.href ? 'var(--bet365-text-primary)' : 'var(--bet365-text-secondary)',
                     backgroundColor: pathname === item.href ? 'var(--bet365-primary-green)' : 'transparent',
                   }}
                   onMouseOver={(e) => {
                    if (pathname !== item.href) {
                      e.currentTarget.style.backgroundColor = 'var(--bet365-primary-green)';
                      e.currentTarget.style.color = 'var(--bet365-text-primary)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (pathname !== item.href) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--bet365-text-secondary)';
                    }
                  }}
                 >
                   {item.icon && <span className="mr-3 flex-shrink-0">{item.icon}</span>} {/* Icons will inherit color */}
                   {item.name}
                 </a>
            ))}
        </nav>

        <div className="mt-auto pt-4 border-t" style={{ borderColor: 'var(--bet365-border)' }}>
          <p className="text-xs text-center" style={{ color: 'var(--bet365-text-secondary)' }}>© 2025 Fattecentralen</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar / Header component will manage its own background, aiming for consistency */}
        <Header />

        {/* Scrollable Content Area - inherits body background (#1E1E1E) */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children ? children : null}
        </main>
      </div>
    </div>
  );
}