import { PuzzlePieceIcon, BellIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Header() {
  return (
    <header
      className="p-3 shadow-md"
      style={{ backgroundColor: 'var(--chrome-bg-very-dark)', color: 'var(--bet365-text-secondary)' }} // Default text: secondary
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="w-1/12">
          {/* Placeholder */}
        </div>

        <div className="flex-grow flex justify-center px-4 md:px-2">
          <input
            type="search"
            placeholder="Søg efter profiler..."
            className="w-full max-w-sm px-4 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--bet365-primary-green)] placeholder-[var(--bet365-text-secondary)]"
            style={{
              backgroundColor: 'var(--bet365-bg-medium)', // A slightly lighter dark green/grey from Bet365 palette
              color: 'var(--bet365-text-primary)', // Bright text for input
              borderColor: 'var(--bet365-border)',
            }}
          />
        </div>

        <div className="flex items-center justify-end space-x-3">
          <Link href="/sports" legacyBehavior>
            <a
              className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap"
              style={{ backgroundColor: 'var(--bet365-primary-green)', color: 'var(--bet365-text-primary)' }} // Bright text on green button
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#388E3C'} // Darker green on hover
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bet365-primary-green)'}
            >
              Live Sports
            </a>
          </Link>
          <Link href="/aktiedyst" legacyBehavior>
            <a
              className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap"
              style={{ backgroundColor: 'var(--bet365-primary-green)', color: 'var(--bet365-text-primary)' }} // Bright text on green button
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#388E3C'} // Darker green on hover
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bet365-primary-green)'}
            >
              Aktiedysten
            </a>
          </Link>
          <button
            className="p-2 rounded-full transition-colors"
            title="Notifikationer"
            style={{ color: 'var(--bet365-text-secondary)' }} // Icon color
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bet365-bg-medium)'; e.currentTarget.style.color = 'var(--bet365-text-primary)';}}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--bet365-text-secondary)';}}
          >
            <BellIcon className="h-6 w-6" />
          </button>
          <div className="relative">
            <button
              className="flex items-center space-x-2 p-1 rounded-full transition-colors"
              title="Min Profil"
              style={{ color: 'var(--bet365-text-secondary)' }} // Default text/icon color
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bet365-bg-medium)'; e.currentTarget.style.color = 'var(--bet365-text-primary)';}}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--bet365-text-secondary)';}}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: 'var(--bet365-primary-green)', color: 'var(--bet365-text-primary)' }} // Avatar with green bg, bright text
              >
                T
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--bet365-text-primary)' }}>Tobias</span> {/* Username text bright */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                // Dropdown arrow color can be secondary
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Dropdown menu (hidden by default) would go here */}
          </div>
        </div>
      </div>
    </header>
  );
}