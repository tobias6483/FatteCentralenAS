import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming path to your Card component

const SportsPage = () => {
  // Placeholder data for sports categories
  const sportsCategories = [
    { id: 1, name: 'Football', icon: '⚽' },
    { id: 2, name: 'Basketball', icon: '🏀' },
    { id: 3, name: 'Tennis', icon: '🎾' },
    { id: 4, name: 'eSports', icon: '🎮' },
    { id: 5, name: 'Horse Racing', icon: '🐎' },
  ];

  return (
    <div className="flex flex-col min-h-screen"> {/* Removed inline style for background and text color */}
      {/* Main Content Area will inherit background from DashboardLayout */}
      <main className="flex-grow container mx-auto p-4">
        {/* Title specific to sports page, can use Bet365 green */}
        <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: 'var(--bet365-primary-green)' }}>Live Sports Betting</h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar for Sports Categories */}
          <aside className="w-full md:w-1/4 p-4 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--bet365-bg-medium)'}}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--bet365-text-primary)'}}>Sportsgrene</h2>
            <nav>
              <ul>
                {sportsCategories.map((sport) => (
                  <li key={sport.id} className="mb-2">
                    <Link href={`/sports/${sport.name.toLowerCase().replace(/\s+/g, '-')}`} legacyBehavior>
                      <a
                        className="flex items-center p-2 rounded-md transition-colors"
                        style={{ color: 'var(--bet365-text-secondary)' }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bet365-primary-green)'; e.currentTarget.style.color = 'var(--bet365-bg-dark)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--bet365-text-secondary)'; }}
                      >
                        <span className="text-xl mr-3">{sport.icon}</span>
                        {sport.name}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main content for featured matches, odds, etc. */}
          <section className="w-full md:w-3/4">
            <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--bet365-bg-medium)'}}>
              <h2 className="text-3xl font-semibold mb-6" style={{ color: 'var(--bet365-text-primary)'}}>Featured Matches</h2>
              {/* Placeholder for actual match listings */}
              <Card style={{ backgroundColor: 'var(--bet365-bg-dark)', borderColor: 'var(--bet365-border)', color: 'var(--bet365-text-primary)' }}>
                <CardHeader>
                  <CardTitle style={{ color: 'var(--bet365-primary-green)'}}>Upcoming: Team A vs Team B</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{ color: 'var(--bet365-text-secondary)'}}>
                    Detailed odds and betting options will appear here.
                    This section will showcase ongoing or upcoming popular games with quick links to their betting markets.
                  </p>
                  <button
                    className="mt-4 text-white font-bold py-2 px-4 rounded transition-colors"
                    style={{ backgroundColor: 'var(--bet365-primary-green)'}}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#388E3C'} // Darker green on hover
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bet365-primary-green)'}
                  >
                    View Odds
                  </button>
                </CardContent>
              </Card>
              {/* Add more featured matches or live event components here */}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SportsPage;