import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout"; // Import DashboardLayout

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fattecentralen Dashboard", // Updated title
  description: "User dashboard for Fattecentralen", // Optional: Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark"> {/* Apply the .dark class to enable dark theme CSS variables */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        // Removed flex, flex-col from body. DashboardLayout will handle its own h-screen.
        // The body will use var(--background) from globals.css, which should be dark.
      >
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
