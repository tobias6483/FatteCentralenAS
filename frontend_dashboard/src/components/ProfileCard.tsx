"use client"; // This marks the component as a Client Component

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface UserStats {
  username: string;
  email: string;
  uid?: number; // Added UID
  invited_by?: string; // Added invited_by
  rank: string;
  avatar_url: string;
  last_login_relative: string;
}

const DEFAULT_AVATAR = '/default_avatar.png';

export default function ProfileCard() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const usernameToFetch = 'tobias'; // Using the username you provided

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        // The request goes to Next.js server, which proxies it to Flask
        // Using Next.js proxy, so relative path
        const response = await fetch(`/api/user/stats/${usernameToFetch}`, { redirect: 'manual', credentials: 'include' });
        
        if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
          // Explicitly check for redirect status codes
          console.error(`Fetch resulted in a redirect (status: ${response.status}) to: ${response.headers.get('Location')}. This usually means authentication failed for the API request.`);
          throw new Error(`Authentication redirect detected (status ${response.status}). Please ensure you are logged into the Flask app and cookies are being handled correctly.`);
        }

        if (!response.ok) {
          // Handle other non-ok statuses (4xx, 5xx)
          const errorData = await response.json().catch(() => ({ message: `Status: ${response.status} ${response.statusText}` }));
          throw new Error(`Failed to fetch user stats: ${errorData.message}`);
        }
        let data: UserStats = await response.json();
        // Add mock data for new fields for UI testing
        data = {
          ...data,
          uid: data.uid || 12345, // Add mock UID if not present
          email: data.email || 'tobias@example.com', // Ensure email is present
          invited_by: data.invited_by || 'Kong Hans' // Add mock invited_by if not present
        };
        setUserStats(data);
      } catch (err) {
        console.error("Error fetching user stats:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [usernameToFetch]); // Re-fetch if usernameToFetch changes (though it's hardcoded here)

  if (loading) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-semibold mb-2 text-[var(--foreground)]">Profile</h2>
        <p className="text-sm text-[var(--text-secondary)]">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-semibold mb-2 text-red-500">Profile Error</h2>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-semibold mb-2 text-[var(--foreground)]">Profile</h2>
        <p className="text-sm text-[var(--text-secondary)]">No profile data found.</p>
      </div>
    );
  }

  // Determine rank badge classes
  let rankClasses = 'px-2 py-0.5 text-xs font-semibold rounded-full';
  if (userStats.rank === 'System Admin') {
    rankClasses += ' bg-red-500 text-white'; // System Admin remains red
  } else if (userStats.rank === 'Grundlægger') {
    rankClasses += ' bg-blue-700 text-blue-100'; // Grundlægger to dark blue
  } else {
    rankClasses += ' bg-slate-600 text-slate-200';
  }

  return (
    <div className="flex items-center space-x-3 p-2"> {/* items-center for vertical alignment */}
      <Image
        src={userStats.avatar_url || DEFAULT_AVATAR}
        alt={`${userStats.username}'s avatar`}
        width={56} // Reverted to 56px for a bit more presence
        height={56}
        className="rounded-full object-cover border-2 border-white flex-shrink-0"
        priority
        unoptimized={userStats.avatar_url?.includes('http://localhost') || userStats.avatar_url?.includes('https://localhost')}
      />
      <div className="text-left flex-grow min-w-0 space-y-0.5"> {/* Added space-y-0.5 here */}
        <h2 className="text-base font-semibold text-[var(--foreground)] leading-tight truncate" title={userStats.username}>
          {userStats.username}
        </h2>
        <p className="text-xs text-[var(--text-secondary)] truncate" title={userStats.email}>
          {userStats.email}
        </p>
        {userStats.uid && (
          <p className="text-xs text-[var(--text-secondary)]">
            UID: {userStats.uid}
          </p>
        )}
        <p className="text-xs text-[var(--text-secondary)]">
          Rank: <span className={rankClasses}>{userStats.rank}</span>
        </p>
        {userStats.invited_by && (
          <p className="text-xs text-[var(--text-secondary)] truncate" title={userStats.invited_by}>
            Inviteret af: {userStats.invited_by}
          </p>
        )}
        {/* "Last seen" is removed */}
      </div>
    </div>
  );
}