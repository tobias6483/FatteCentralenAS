import React from 'react';

interface SessionInviteItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  statusType: 'neutral' | 'positive' | 'negative' | 'progress'; // For styling status
  href: string; // Link for the item
}

// Mock data - replace with actual data fetching later
const mockItems: SessionInviteItem[] = [
  {
    id: 'invite-1',
    title: 'Duel Invitation',
    subtitle: 'Fra: Kong Hans',
    status: 'Vs',
    statusType: 'neutral',
    href: '#',
  },
  {
    id: 'session-1',
    title: 'Aktiedyst #3',
    subtitle: 'Dag 277',
    status: 'in_progress',
    statusType: 'progress',
    href: '#',
  },
  {
    id: 'invite-2',
    title: 'Team Challenge',
    subtitle: 'Mod: De Glade Gutter',
    status: 'Afventer',
    statusType: 'neutral',
    href: '#',
  },
];

const getStatusClasses = (statusType: SessionInviteItem['statusType']): string => {
  switch (statusType) {
    case 'positive':
      return 'bg-green-500 text-white'; // Keep semantic green for positive
    case 'negative':
      return 'bg-red-500 text-white'; // Keep semantic red for negative
    case 'progress':
      return 'bg-[var(--secondary-accent)] text-white'; // Changed to secondary-accent (Turkish Green) for in-progress
    case 'neutral':
    default:
      return 'bg-slate-600 text-slate-200'; // Themed neutral badge
  }
};

export default function SessionsInvitesList() {
  if (mockItems.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">Ingen aktive sessioner eller invitationer.</p>;
  }

  return (
    <div className="space-y-3"> {/* Reduced spacing */}
      {mockItems.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className="flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg shadow-md transition-colors duration-150 ease-in-out" // Reduced padding
        >
          <div>
            <h3 className="font-semibold text-[var(--foreground)] text-sm">{item.title}</h3> {/* Reduced text size */}
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.subtitle}</p>
          </div>
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-full ${getStatusClasses(item.statusType)}`} // Slightly reduced padding for badge
          >
            {item.status}
          </span>
        </a>
      ))}
    </div>
  );
}