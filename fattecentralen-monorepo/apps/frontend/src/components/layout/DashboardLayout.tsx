import React from 'react';
// import Footer from './Footer'; // Updated import
import Header from './Header'; // Updated import
import Sidebar from './Sidebar'; // Updated import

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 lg:ml-64 lg:pt-20">
          {/* Main content goes here */}
          {children}
        </main>
      </div>
      {/* <Footer /> */}
    </div>
  );
};

export default DashboardLayout;
