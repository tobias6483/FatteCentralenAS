"use client";

import { useEffect, useState } from 'react';
import {
  CurrencyDollarIcon,
  TrophyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CircleStackIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic'; // Import dynamic

const BalanceChart = dynamic(() => import('@/components/BalanceChart'), {
  ssr: false, // Disable server-side rendering for this component
  loading: () => <p className="text-[var(--text-secondary)]">Loading chart...</p> // Optional loading state
});
import DashboardLayout from '@/components/DashboardLayout'; // Import DashboardLayout
import ProfileCard from '@/components/ProfileCard'; // Import ProfileCard
import ForumPostsList from '@/components/ForumPostsList'; // Import ForumPostsList
import SessionsInvitesList from '@/components/SessionsInvitesList'; // Import SessionsInvitesList
import QuickLinks from '@/components/QuickLinks'; // Import QuickLinks
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface User {
  id?: number;
  username?: string;
  email?: string;
  avatar_url?: string;
}

interface UserStats extends User { // Now User is correctly defined
  balance?: number;
  wins?: number;
  losses?: number;
  largest_win?: number;
  largest_loss?: number;
  net_profit_loss?: number;
  total_staked?: number;
  // Add other stats fields you expect from your API
}

interface Activity {
  id: string;
  type: string;
  description: string;
  amount: number | null;
  timestamp: string | null;
  icon: string;
  iconColor: string;
  link?: string;
}

export default function DashboardPage() {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [balanceHistoryData, setBalanceHistoryData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [isLoadingBalanceHistory, setIsLoadingBalanceHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balanceHistoryError, setBalanceHistoryError] = useState<string | null>(null);
  
  // Assuming the dashboard is for the currently logged-in user,
  // we'll get the username from the session_check.
  // If you need to fetch for a specific username passed as a prop or from URL, adjust this.

  useEffect(() => {
    console.log("Page.tsx: Checking authentication status...");
    setIsLoading(true);
    setError(null);

    const performLoginRedirect = () => {
      window.location.href = `http://localhost:5000/auth/login?next=${encodeURIComponent(window.location.href)}`;
    };

    fetch('/api/auth/session_check', { credentials: 'include' })
      .then(response => {
        console.log("Page.tsx - Session Check Response Status:", response.status);
        console.log("Page.tsx - Session Check Response OK:", response.ok);
        console.log("Page.tsx - Session Check Response URL:", response.url);
        if (response.ok) {
          return response.json();
        } else {
          console.log("Page.tsx - Session Check failed, redirecting to Flask login.");
          performLoginRedirect();
          return Promise.reject(new Error('Session check failed, redirecting.'));
        }
      })
      .then(data => {
        if (data && data.authenticated && data.user) {
          console.log("Page.tsx - Session Check successful:", data.user);
          setSessionUser(data.user);
          const usernameToFetch = data.user.username;

          if (usernameToFetch) {
            console.log("Page.tsx: Fetching user stats for", usernameToFetch);
            return fetch(`/api/user/stats/${usernameToFetch}`, { credentials: 'include' });
          } else {
            return Promise.reject(new Error('Username not available from session check.'));
          }
        } else {
          console.log("Page.tsx - Session Check returned not authenticated or no user data, redirecting.");
          performLoginRedirect();
          return Promise.reject(new Error('Not authenticated or no user data.'));
        }
      })
      .then(statsResponse => {
        // This block is only reached if the previous .then didn't reject
        if (!statsResponse) return Promise.reject(new Error('No stats response.')); // Should not happen if usernameToFetch was valid

        console.log("Page.tsx - User Stats Response Status:", statsResponse.status);
        console.log("Page.tsx - User Stats Response OK:", statsResponse.ok);
        console.log("Page.tsx - User Stats Response URL:", statsResponse.url);
        if (statsResponse.ok) {
          return statsResponse.json();
        } else {
           // Handle cases where stats fetch might fail even if session is ok (e.g. user not found for stats)
          console.error("Page.tsx - Failed to fetch user stats, status:", statsResponse.status);
          setError(`Failed to load user statistics (status: ${statsResponse.status}).`);
          setIsLoading(false);
          return Promise.reject(new Error(`Stats fetch failed with status ${statsResponse.status}`));
        }
      })
      .then(statsData => {
        console.log("Page.tsx - User Stats Data:", statsData);
        setUserStats(statsData);
        // setIsLoading(false); // Defer this until all initial loads are done

        // Now fetch recent activity if username is available from sessionUser (which should be set if statsData was fetched)
        const usernameForActivity = sessionUser?.username;
        if (usernameForActivity) {
          console.log("Page.tsx: Fetching recent activity for", usernameForActivity);
          setIsLoadingActivity(true);
          return fetch(`/api/user/recent_activity/${usernameForActivity}?limit=5`, { credentials: 'include' });
        }
        // If no username, we can't fetch activity; proceed to finally block.
        return Promise.resolve(null); // Resolve with null to continue the chain gracefully
      })
      .then(activityResponse => {
        if (!activityResponse) { // This happens if usernameForActivity was null
          setIsLoadingActivity(false); // No activity to load
          return null; // Skip parsing
        }
        console.log("Page.tsx - Recent Activity Response Status:", activityResponse.status);
        console.log("Page.tsx - Recent Activity Response OK:", activityResponse.ok);
        if (activityResponse.ok) {
          return activityResponse.json();
        }
        // If activity fetch fails, set specific error or just log, don't overwrite main error if stats were fine
        console.error(`Page.tsx - Failed to load recent activity (status: ${activityResponse.status})`);
        setRecentActivity([]); // Clear or set to empty
        setIsLoadingActivity(false);
        return Promise.reject(new Error(`Activity fetch failed with status ${activityResponse.status}`));
      })
      .then(activityData => {
        if (activityData) { // Check if activityData is not null (from the Promise.resolve(null) path)
          console.log("Page.tsx - Recent Activity Data:", activityData);
          setRecentActivity(activityData.activities || []);
        }
        // After activity, fetch balance history
        const usernameForHistory = sessionUser?.username;
        if (usernameForHistory) {
          console.log("Page.tsx: Fetching balance history for", usernameForHistory);
          setIsLoadingBalanceHistory(true);
          setBalanceHistoryError(null); // Clear previous history error
          return fetch(`/api/user/${usernameForHistory}/balance_history?days=7`, { credentials: 'include' });
        }
        // If no username (e.g., sessionUser not set yet, though unlikely if previous steps succeeded), skip history fetch
        setIsLoadingBalanceHistory(false); // Mark history as not loading if skipped
        return Promise.resolve(null);
      })
      .then(historyResponse => {
        if (!historyResponse) { // Path if history fetch was skipped
          return null;
        }
        console.log("Page.tsx - Balance History Response Status:", historyResponse.status);
        if (historyResponse.ok) {
          return historyResponse.json();
        }
        const errorMsg = `Failed to load balance history (status: ${historyResponse.status})`;
        console.error("Page.tsx - " + errorMsg);
        setBalanceHistoryError(errorMsg);
        return Promise.reject(new Error(errorMsg)); // Propagate error to main catch
      })
      .then(historyData => {
        if (historyData) {
          console.log("Page.tsx - Balance History Data:", historyData);
          setBalanceHistoryData({ labels: historyData.labels || [], data: historyData.data || [] });
        }
        // If historyData is null (because fetch was skipped), do nothing.
      })
      .catch(err => {
        console.error("Page.tsx - Error in data fetching chain (after stats/activity):", err.message);
        // Avoid overwriting a more specific session/stats error if this is just an activity/history error
        if (err.message !== 'Session check failed, redirecting.' &&
            err.message !== 'Not authenticated or no user data.' &&
            !err.message.startsWith('Stats fetch failed') &&
            !err.message.startsWith('Activity fetch failed') && // Don't overwrite activity fetch error
            !error // Only set general error if no specific one is already set from previous steps
            ) {
          setError(err.message || "An error occurred loading dashboard components.");
        }
      })
      .finally(() => {
        setIsLoading(false);
        setIsLoadingActivity(false);
        setIsLoadingBalanceHistory(false); // Ensure this is always set
      });
  }, [sessionUser?.username]); // Re-run if sessionUser.username changes

  if (isLoading && !error) { // Show loading only if no error has occurred yet
    return (
      <div className="text-[var(--foreground)]">
        <h1 className="text-2xl font-bold mb-4 text-[var(--foreground)]">Dashboard</h1>
        <p className="text-[var(--text-secondary)]">Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-[var(--foreground)] p-6">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Dashboard Error</h1>
        <p className="text-[var(--text-secondary)]">Could not load dashboard: {error}</p>
        <p className="text-[var(--text-secondary)]">You might need to <a href={`http://localhost:5000/auth/login?next=${encodeURIComponent(window.location.href)}`} className="text-[var(--primary-accent)] hover:underline">log in again</a>.</p>
      </div>
    );
  }

  if (!sessionUser || !userStats) {
    return (
        <div className="text-[var(--foreground)] p-6">
            <h1 className="text-2xl font-bold mb-4 text-[var(--foreground)]">Dashboard</h1>
            <p className="text-[var(--text-secondary)]">Preparing your dashboard...</p>
        </div>
    );
  }

  return (
    <DashboardLayout
      profileCard={<ProfileCard />}
    >
      {/* Main content for the dashboard page */}
      <div className="space-y-8"> {/* Increased default spacing */}
        {/* Welcome Message Removed */}
        {/* <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--foreground)]">
            Velkommen, {sessionUser.username || 'User'}!
          </h1>
          <p className="text-lg text-[var(--text-secondary)] mt-1">Her handler det om skills, målrettethed... og måske lidt held! Vis os dit talent!</p>
        </div> */}

        {/* Stats Grid - This will now be at the top */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {/* Saldo Card */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center space-x-2 space-y-0 pb-2">
              <CurrencyDollarIcon className="h-6 w-6 text-[var(--text-secondary)]" />
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">SALDO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-[var(--foreground)]">
                {userStats.balance?.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' }) || 'N/A'}
              </div>
            </CardContent>
          </Card>
          {/* Wins/Losses Card */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center space-x-2 space-y-0 pb-2"> {/* Adjusted for icon next to title */}
              <TrophyIcon className="h-6 w-6 text-[var(--secondary-accent)]" />
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">WINS / LOSSES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                <span className="text-green-500">{userStats.wins ?? 0}</span>
                <span className="text-[var(--text-secondary)]"> / </span>
                <span className="text-red-500">{userStats.losses ?? 0}</span>
              </div>
              {(userStats.wins !== undefined && userStats.losses !== undefined && (userStats.wins + userStats.losses > 0)) && (
                <p className="text-xs text-muted-foreground pt-1">
                  {((userStats.wins / (userStats.wins + userStats.losses)) * 100).toFixed(1)}% Win Rate
                </p>
              )}
            </CardContent>
          </Card>
          {/* Største Gevinst Card */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center space-x-2 space-y-0 pb-2">
              <ArrowUpIcon className="h-6 w-6 text-green-500" />
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">STØRSTE GEVINST</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-green-500">
                {userStats.largest_win?.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' }) || 'N/A'}
              </div>
            </CardContent>
          </Card>
          {/* Største Tab Card */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center space-x-2 space-y-0 pb-2">
              <ArrowDownIcon className="h-6 w-6 text-red-500" />
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">STØRSTE TAB</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-red-500">
                {userStats.largest_loss?.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' }) || 'N/A'}
              </div>
            </CardContent>
          </Card>
          {/* Netto +/- Card */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center space-x-2 space-y-0 pb-2">
              {(userStats.net_profit_loss ?? 0) >= 0 ? (
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-500" />
              )}
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">NETTO +/-</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-semibold ${ (userStats.net_profit_loss ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {userStats.net_profit_loss?.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' }) || 'N/A'}
              </div>
            </CardContent>
          </Card>
          {/* Total Indsats Card */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center space-x-2 space-y-0 pb-2">
              <CircleStackIcon className="h-6 w-6 text-[var(--text-secondary)]" />
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">TOTAL INDSATS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-[var(--foreground)]">
                {userStats.total_staked?.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' }) || 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>
 
        {/* Main content area for chart, recent activity etc. */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-[var(--foreground)]">Saldo Udvikling (Sidste 7 dage)</CardTitle>
            </CardHeader>
            <CardContent>
              <BalanceChart chartData={balanceHistoryData || { labels: [], data: [] }} isLoading={isLoadingBalanceHistory} error={balanceHistoryError} />
            </CardContent>
          </Card>
 
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-[var(--foreground)]">Seneste Aktivitet</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingActivity ? (
                <p className="text-[var(--text-secondary)]">Indlæser aktivitet...</p>
              ) : recentActivity.length > 0 ? (
                <ul className="space-y-3"> {/* Increased spacing */}
                  {recentActivity.map((activity) => (
                    <li key={activity.id} className="flex items-center p-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"> {/* Changed to zinc */}
                      <div className="mr-3">
                        {activity.type === 'win' && <ArrowUpCircleIcon className="h-6 w-6 text-green-500" />}
                        {activity.type === 'loss' && <ArrowDownCircleIcon className="h-6 w-6 text-red-500" />}
                        {activity.type !== 'win' && activity.type !== 'loss' && <InformationCircleIcon className="h-6 w-6 text-[var(--secondary-accent)]" />}
                      </div>
                      <div className="flex-grow">
                        <p className="text-[var(--foreground)]">{activity.description}</p>
                        {activity.timestamp && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{new Date(activity.timestamp).toLocaleString('da-DK')}</p>}
                      </div>
                      {activity.amount !== null && typeof activity.amount !== 'undefined' && (
                        <span className={`font-semibold ${activity.type === 'win' ? 'text-green-500' : activity.type === 'loss' ? 'text-red-500' : 'text-[var(--foreground)]'}`}>
                          {activity.type === 'win' ? '+' : activity.type === 'loss' ? '-' : ''}{Math.abs(activity.amount).toLocaleString('da-DK', { style: 'currency', currency: 'DKK', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[var(--text-secondary)]">Ingen nylig aktivitet fundet.</p>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Row for Forum, Sessions, and Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-[var(--foreground)]">Nyt fra Forum</CardTitle>
            </CardHeader>
            <CardContent>
              <ForumPostsList />
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-[var(--foreground)]">Sessions & Invites</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionsInvitesList />
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-[var(--foreground)]">Hurtige Links</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickLinks />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
