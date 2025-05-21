'use client'; // Ensure this is a client component

import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'; // Updated Sheet imports
import { useAuthStore } from '@/stores/authStore'; // Import auth store
import { Bell, Gamepad2, Menu, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import React from 'react';

const Header: React.FC = () => {
  const notificationsCount = 0; // This was correctly defined here already
  const { user, logout } = useAuthStore(); // Get user and logout function
  const router = useRouter(); // Initialize router

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login'); // Redirect to login page after logout
  };

  // Determine Avatar Fallback based on user state
  const getAvatarFallback = () => {
    if (user?.displayName) {
      const names = user.displayName.split(' ');
      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    return 'FC'; // Default fallback
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* The main container now handles horizontal padding (px-4 md:px-6) */}
      <div className="container mx-auto flex h-16 max-w-(--breakpoint-2xl) items-center justify-between px-4 md:px-6">
        {/* Left group */}
        <div className="flex items-center mr-auto"> {/* Added mr-auto to push this group left */}
          {/* Wrap Sheet component in a div that is hidden on medium screens and up - RESTORED */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                {/* Removed md:hidden from Button as parent div now handles responsive visibility */}
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs">
                <SheetHeader>
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                </SheetHeader>
                {/* Mobile Navigation Links */}
                <nav className="grid gap-4 p-4">
                  <Link href="/" className="text-lg font-medium hover:text-primary">Dashboard</Link>
                  <Link href="/live-sports" className="text-lg font-medium hover:text-primary">Live Sports</Link>
                  <Link href="/aktiedyst" className="text-lg font-medium hover:text-primary">Aktiedyst</Link>
                  <Link href="/forum" className="text-lg font-medium hover:text-primary">Forum</Link>
                  <Link href="/leaderboard" className="text-lg font-medium hover:text-primary">Leaderboard</Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          {/* Logo Link - should now be the first visible element in this div on md+ screens */}
          <Link href="/" className="flex items-center space-x-2"> {/* Removed blue outline */}
            <Gamepad2 className="h-6 w-6" />
            <span className="font-bold sm:inline-block">FatteCentralen</span>
          </Link>
          {/* Desktop Navigation Links - REMOVED as per request */}
          {/* <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/live-sports" className="hover:text-primary">Live Sports</Link>
            <Link href="/aktiedyst" className="hover:text-primary">Aktiedyst</Link>
            <Link href="/forum" className="hover:text-primary">Forum</Link>
            <Link href="/leaderboard" className="hover:text-primary">Leaderboard</Link>
          </nav> */}
        </div>

        {/* Right group: Ensure no inward-pushing margins/paddings.
            space-x-4 is for internal spacing of icons and is fine. */}
        <div className="flex items-center space-x-4">
          {/* Search Button */}
          <Button variant="ghost" size="icon" className="hover:bg-accent hover:text-accent-foreground transition-colors duration-150 ease-in-out active:scale-95">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Theme Toggle Button - ADDED HERE */}
          <ThemeToggleButton />

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-accent hover:text-accent-foreground transition-colors duration-150 ease-in-out active:scale-95">
                <Bell className="h-5 w-5" />
                {notificationsCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px]">
                    {notificationsCount > 9 ? '9+' : notificationsCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifikationer</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {notificationsCount === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">Ingen nye notifikationer.</p>
                ) : (
                  <>
                    {/* Sample notifications - will be replaced by dynamic data */}
                    <DropdownMenuItem className="p-3 cursor-pointer">
                      <div className="flex flex-col gap-1">
                        <p className="font-medium">Nyt svar i din tråd</p>
                        <p className="text-sm text-muted-foreground">Brugeren JohnDoe har svaret på din tråd "Spørgsmål om fodbold"</p>
                        <p className="text-xs text-muted-foreground">For 5 minutter siden</p>
                      </div>
                    </DropdownMenuItem>
                    {/* Add more sample notifications if needed for static layout */}
                  </>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary cursor-pointer" asChild>
                <Link href="/notifications">Se alle notifikationer</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent hover:text-accent-foreground transition-colors duration-150 ease-in-out active:scale-95">
                <Avatar>
                  {/* <AvatarImage src={user?.photoURL || "/placeholder-avatar.png"} alt="User Avatar" /> */}
                  <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.displayName || 'Min Konto'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/badges">Badges</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Indstillinger</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                Log ud
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
