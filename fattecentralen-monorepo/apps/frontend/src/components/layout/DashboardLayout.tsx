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
        {/* Placeholder for Sidebar/Navbar content */}
        <p>Sidebar/Navbar</p>
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