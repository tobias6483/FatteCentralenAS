import React from 'react';

interface QuickLinkItem {
  id: string;
  label: string;
  href: string;
  bgColor: string;
  hoverBgColor: string;
  textColor: string;
  icon?: React.ReactNode; // Optional icon
}

const links: QuickLinkItem[] = [
  {
    id: 'start-spil',
    label: 'Start Spil',
    href: '#', // Placeholder
    bgColor: 'bg-sky-500', // Nice light blue
    hoverBgColor: 'hover:bg-sky-600', // Darker light blue for hover
    textColor: 'text-white',
  },
  {
    id: 'indbetal',
    label: 'Indbetal',
    href: '#', // Placeholder
    bgColor: 'bg-[var(--secondary-accent)]', // Use theme secondary accent
    hoverBgColor: 'hover:bg-teal-600', // Darken secondary accent (assuming teal-500 -> teal-600)
    textColor: 'text-white',
  },
  {
    id: 'rediger-profil',
    label: 'Rediger Profil',
    href: '/profile', // Link to the new profile page
    bgColor: 'bg-slate-600', // Neutral button style
    hoverBgColor: 'hover:bg-slate-500',
    textColor: 'text-slate-100', // Light text for dark neutral button
  },
];

export default function QuickLinks() {
  return (
    <div className="space-y-3"> {/* Reduced spacing */}
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          className={`block w-full ${link.bgColor} ${link.textColor} ${link.hoverBgColor} font-semibold py-2.5 px-4 rounded-lg text-center transition-colors duration-150 ease-in-out shadow-lg hover:shadow-xl text-sm`} // Reduced padding and font size
        >
          {link.icon && <span className="mr-2 align-middle">{link.icon}</span>} {/* Ensure icon aligns well */}
          {link.label}
        </a>
      ))}
    </div>
  );
}