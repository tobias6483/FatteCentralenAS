import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-800 text-white p-4">
        {/* Placeholder for Header content */}
        <p>Header</p>
      </header>
      <nav className="bg-gray-200 p-4">
        {/* Static Navigation Links */}
        <ul className="flex space-x-4">
          <li><a href="/" className="hover:text-gray-700">Home</a></li>
          <li><a href="/live-sports" className="hover:text-gray-700">Live Sports</a></li>
          <li><a href="/aktiedyst" className="hover:text-gray-700">Aktiedyst</a></li>
          <li><a href="/forum" className="hover:text-gray-700">Forum</a></li>
          <li><a href="/profile" className="hover:text-gray-700">Profile</a></li>
        </ul>
      </nav>
      <main className="flex-grow p-4">{children}</main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        {/* Placeholder for Footer content */}
        <p>Footer</p>
      </footer>
    </div>
  );
};

export default DashboardLayout;