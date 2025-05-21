'use client'; // Ensure this is a client component

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// Ikoner fra lucide-react
import { useAuthStore } from '@/stores/authStore'; // Import auth store
import {
  BarChart3,
  History as HistoryIcon,
  Home,
  LayoutGrid,
  ListOrdered,
  LogOut,
  Mail, // Added Mail icon for Beskeder
  MessageSquareText,
  ShieldCheck,
  Trophy,
  User,
  Users,
  Wallet2,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter

// Mock data
const mockUser = {
  username: 'SpilMaster',
  avatarUrl: '/placeholder-avatar.png',
  balance: '1.234,56 DKK',
  uid: 'user123',
  invitedBy: 'AdminBoss',
  isAdmin: true,
};

const mainNavLinks = [
  { href: '/dashboard', label: 'Home', icon: Home, id: 'nav-home', testId: 'sidebar-link-home' },
  { href: '/profile', label: 'Profil', icon: User, id: 'nav-profile', testId: 'sidebar-link-profile' },
  { href: '/game-area', label: 'Game Area', icon: LayoutGrid, id: 'nav-game-area', testId: 'sidebar-link-game-area' },
  { href: '/forum', label: 'Forum', icon: MessageSquareText, id: 'nav-forum', testId: 'sidebar-link-forum' },
  { href: '/messages', label: 'Beskeder', icon: Mail, id: 'nav-messages', testId: 'sidebar-link-messages' }, // Added Beskeder link
  // { href: '/messages', label: 'Beskeder', icon: Mail, id: 'nav-messages', badgeCount: 3 }, // Beskeder kan tilføjes senere
  { href: '/live-sports', label: 'Live Sports', icon: Trophy, id: 'nav-live-sports', testId: 'sidebar-link-livesports' },
  { href: '/aktiedyst', label: 'Aktiedyst', icon: BarChart3, id: 'nav-aktiedyst', testId: 'sidebar-link-aktiedyst' },
  { href: '/join-game', label: 'Join Game', icon: Users, id: 'nav-join-game', testId: 'sidebar-link-joingame' },
  { href: '/active-sessions', label: 'Active Sessions', icon: Zap, id: 'nav-active-sessions', testId: 'sidebar-link-activesessions' },
  { href: '/leaderboard', label: 'Leaderboard', icon: ListOrdered, id: 'nav-leaderboard', testId: 'sidebar-link-leaderboard' },
  { href: '/history', label: 'Historik', icon: HistoryIcon, id: 'nav-history', testId: 'sidebar-link-history' },
];

const adminNavLinks = [
  { href: '/admin', label: 'Admin Menu', icon: ShieldCheck, id: 'nav-admin-menu', testId: 'sidebar-link-adminmenu' },
];

const Sidebar = () => {
  const { user, logout } = useAuthStore(); // Get user and logout function from store
  const router = useRouter(); // Initialize router
  // Senere: Brug usePathname() fra next/navigation til at sætte active state
  const currentPath = '/dashboard'; // Mock current path

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login'); // Redirect to login page after logout
  };

  // Update mockUser to use actual user data if available
  const displayUser = {
    username: user?.displayName || mockUser.username,
    avatarUrl: user?.photoURL || mockUser.avatarUrl, // Assuming photoURL is available on Firebase user
    balance: mockUser.balance, // Balance needs to come from your backend/DB
    uid: user?.uid || mockUser.uid,
    invitedBy: mockUser.invitedBy, // This likely comes from your backend/DB
    isAdmin: mockUser.isAdmin, // This likely comes from your backend/DB
  };

  return (
    <aside
      className="hidden lg:flex flex-col w-64 bg-card border-r border-border fixed left-0 top-16 bottom-0 p-4 space-y-4 overflow-y-auto"
      data-testid="sidebar"
    >
      {/* User Info */}
      <div className="flex flex-col items-center text-center border-b border-border pb-4" data-testid="sidebar-user-info">
        <Avatar className="h-16 w-16 mb-2">
          <AvatarImage src={displayUser.avatarUrl} alt={`@${displayUser.username}`} />
          <AvatarFallback>{displayUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <p className="font-semibold text-lg" data-testid="sidebar-username">{displayUser.username}</p>
        <div className="text-sm text-muted-foreground flex items-center" data-testid="sidebar-balance">
          <Wallet2 className="h-4 w-4 mr-1" /> {displayUser.balance}
        </div>
        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
          <p data-testid="sidebar-uid">UID: {displayUser.uid}</p>
          <p data-testid="sidebar-invited-by">Inviteret af: {displayUser.invitedBy}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="grow">
        <ul className="space-y-1">
          {mainNavLinks.map((link) => (
            <li key={link.id}>
              <Button
                variant={currentPath === link.href ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                asChild
                data-testid={link.testId}
              >
                <Link href={link.href} id={link.id}>
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.label}
                  {/* Eksempel på badge (hvis relevant) */}
                  {/* {link.badgeCount && link.badgeCount > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {link.badgeCount}
                    </span>
                  )} */}
                </Link>
              </Button>
            </li>
          ))}
        </ul>

        {mockUser.isAdmin && (
          <>
            <hr className="my-3 border-border" />
            <ul className="space-y-1">
              {adminNavLinks.map((link) => (
                <li key={link.id}>
                  <Button
                    variant={currentPath.startsWith(link.href) ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    asChild
                    data-testid={link.testId}
                  >
                    <Link href={link.href} id={link.id}>
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* Logout Link */}
      <div>
        <hr className="my-3 border-border" />
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600! hover:bg-red-500/10!"
          data-testid="sidebar-logout-button"
          onClick={handleLogout} // Add onClick handler
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
