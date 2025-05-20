import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardLayout from '../DashboardLayout';

describe('DashboardLayout', () => {
  it('renders header, navbar, main content, and footer', () => {
    render(
      <DashboardLayout>
        <div>Test Children</div>
      </DashboardLayout>
    );

    // Check for header
    expect(screen.getByText('Header')).toBeInTheDocument();

    // Check for navbar/sidebar
    expect(screen.getByText('Sidebar/Navbar')).toBeInTheDocument();

    // Check for children content
    expect(screen.getByText('Test Children')).toBeInTheDocument();

    // Check for footer
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    const testMessage = 'This is a test child component';
    render(
      <DashboardLayout>
        <p>{testMessage}</p>
      </DashboardLayout>
    );
    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });
});
