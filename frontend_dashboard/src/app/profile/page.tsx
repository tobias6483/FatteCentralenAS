"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import {
  UserCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  TrophyIcon,
  ChartBarIcon,
  ListBulletIcon,
  TableCellsIcon, // For bet history table icon
} from '@heroicons/react/24/outline';

// Placeholder data - will be refined and likely fetched later
const userProfileData = {
  username: 'Tobias',
  email: 'system@system.fatte',
  oprettet: '25. Dec 0001, 00:00',
  sidstSet: '05/10/2025, 05:03 PM',
  uid: 'Grundlægger',
  avatarUrl: '/static/avatars/coke_0.png',
  bio: 'Systemets skaber og arkitekt. Velkommen!',
  level: 15,
  xp: 1234,
  xpMax: 2000,
  badges: [
    { id: 'b1', name: 'Guld Mærke', iconLetter: 'G' },
    { id: 'b2', name: 'Sølv Mærke', iconLetter: 'S' },
    { id: 'b3', name: 'Aktivist', iconLetter: 'A' },
  ],
  latestBets: [
    { id: 'bet1', tidspunkt: '04/28/2025, 10:00 AM', kampSession: 'FCK vs BIF', valg: 'FCK Vinder', indsats: '$50.00', resultat: 'Tabt', gevinstTab: '-$50.00', statusColor: 'text-red-400' },
  ],
  statsNogletal: [ // Ensured this name is used consistently
    { label: 'Saldo:', value: '2.000,00 kr.' },
    { label: 'Total Indsats:', value: '19.000,00 kr.' },
    { label: 'Total Tab:', value: '210,25 kr.' },
    { label: 'Total Gevinst:', value: '550,75 kr.' },
    { label: 'Wins / Losses:', value: '15 / 5' },
    { label: 'Antal Bets:', value: '0' },
    { label: 'Win Rate:', value: '0%' },
    { label: 'Netto Resultat:', value: '0,00 kr.' },
    { label: 'Største Tab (Indsats):', value: '50,00 kr.' },
    { label: 'Største Gevinst (Netto):', value: '180,50 kr.' },
  ],
  recentActivity: [
    { id: 'act1', description: 'Skrev i: Dette er en test', time: '08.05.2025, 15:18' },
    { id: 'act2', description: 'Skrev i: Største afkast opnået?', time: '03.05.2025, 15:21' },
    { id: 'act3', description: 'Skrev i: ETF vs. Indeksforeninger?', time: '03.05.2025, 13:28' },
    { id: 'act4', description: 'Bet placed: FCK vs BIF (FCK Vinder)', time: '28.04.2025, 10:00' },
  ]
};

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg shadow-md"> {/* Main container for section */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left text-[var(--foreground)] bg-slate-700 hover:bg-slate-600 rounded-t-lg transition-colors" // Header: bg-slate-700, p-3
      >
        <div className="flex items-center">
          {icon && <span className="mr-2.5 h-5 w-5 text-[var(--primary-accent)]">{icon}</span>} {/* Icon color */}
          <span className="font-semibold text-base">{title}</span> {/* Title: text-base font-semibold */}
        </div>
        {isOpen ? <ChevronUpIcon className="h-5 w-5 text-slate-400" /> : <ChevronDownIcon className="h-5 w-5 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-slate-600 bg-[var(--card-background)] rounded-b-lg"> {/* Content: bg-[var(--card-background)], p-4, border-slate-600 */}
          {children}
        </div>
      )}
    </div>
  );
};


export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'activity'>('stats');

  return (
    <div className="p-6 md:p-8 space-y-8"> {/* Increased overall padding and section spacing */}
      {/* Top Header Bar for "Din Profil" */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center">
          {/* Icon can be UserCircleIcon or similar from your original screenshot if preferred */}
          <UserCircleIcon className="h-7 w-7 mr-2.5 text-[var(--primary-accent)]" />
          Din Profil
        </h1>
        <div className="flex items-center space-x-2">
          <button className="px-3.5 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-[var(--text-secondary)] hover:text-[var(--foreground)] rounded-md transition-colors flex items-center"> {/* Consistent text colors for buttons */}
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            Forside
          </button>
          <button className="px-3.5 py-1.5 text-xs font-medium bg-[var(--primary-accent)] text-white rounded-md hover:opacity-90 transition-opacity flex items-center">
            <Cog6ToothIcon className="h-4 w-4 mr-1.5" />
            Indstillinger
          </button>
        </div>
      </div>

      {/* === NEW PROFILE HEADER === */}
      <div className="bg-[var(--card-background)] rounded-xl shadow-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
          {/* Avatar Section */}
          <div className="relative flex-shrink-0 mb-6 md:mb-0">
            <Image
              src={userProfileData.avatarUrl}
              alt={`${userProfileData.username}'s avatar`}
              width={144} // w-36
              height={144} // h-36
              className="rounded-full object-cover border-4 border-slate-700 shadow-lg"
            />
            <button
              title="Skift avatar"
              className="absolute bottom-1 right-1 bg-[var(--primary-accent)] hover:bg-opacity-80 text-white p-2 rounded-full shadow-md transition-all duration-200 ease-in-out transform hover:scale-110">
              <PencilSquareIcon className="w-5 h-5" />
            </button>
          </div>

          {/* User Info & Actions Section */}
          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-[var(--foreground)]">{userProfileData.username}</h2>
                <span className="inline-block mt-1 px-3 py-0.5 bg-[var(--primary-accent)] text-white text-xs font-semibold rounded-full shadow">
                  {userProfileData.uid}
                </span>
                <span className="ml-2 text-sm text-slate-400">Niveau {userProfileData.level}</span>
              </div>
              {/* Edit Profile Button - could be here or more prominent below */}
            </div>

            <p className="mt-3 text-slate-300 text-sm leading-relaxed max-w-xl">{userProfileData.bio}</p>
            
            <div className="mt-5 border-t border-slate-700 pt-5">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Brugerdetaljer</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                <div>
                  <dt className="text-slate-500">Email:</dt>
                  <dd className="text-slate-200">{userProfileData.email}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Oprettet:</dt>
                  <dd className="text-slate-200">{userProfileData.oprettet}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Sidst set:</dt>
                  <dd className="text-slate-200">{userProfileData.sidstSet}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
      {/* === END NEW PROFILE HEADER === */}

      {/* Remaining sections will be styled as distinct cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"> {/* Increased gap */}
        <CollapsibleSection title="Badges & Achievements" icon={<TrophyIcon />} defaultOpen={true}>
          {userProfileData.badges.length > 0 ? (
            <div className="flex flex-wrap gap-4 items-start"> {/* Use flex-wrap and gap for better spacing if badges wrap */}
              {userProfileData.badges.map(badge => (
                <div key={badge.id} className="flex flex-col items-center w-20" title={badge.name}> {/* Fixed width for each badge item for alignment */}
                  <div
                    className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-lg font-semibold text-white border-2 border-[var(--primary-accent)] shadow-md" // Slightly larger, added shadow
                    title={badge.name}
                  >
                    {badge.iconLetter}
                  </div>
                  <p className="text-xs mt-2 text-slate-400 text-center">{badge.name}</p> {/* Consistent secondary text color */}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[80px] text-slate-500"> {/* Enhanced "no badges" state */}
              <TrophyIcon className="w-10 h-10 mb-2" />
              <p className="text-sm">Ingen badges optjent endnu.</p>
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* Din Fremgang */}
      <CollapsibleSection title="Din Fremgang" icon={<ChartBarIcon />}>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between"> {/* items-baseline for better alignment if font sizes differ significantly */}
            <p className="text-lg font-semibold text-[var(--foreground)]">Niveau {userProfileData.level}</p>
            <p className="text-sm text-slate-400">{userProfileData.xp} / {userProfileData.xpMax} XP</p>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 relative shadow-inner"> {/* Taller bar, darker track, relative for text, inner shadow */}
            <div
              className="bg-[var(--primary-accent)] h-3 rounded-full flex items-center justify-center transition-all duration-500 ease-out" // Added transition
              style={{ width: `${(userProfileData.xp / userProfileData.xpMax) * 100}%` }}
            >
              {/* Show percentage if bar is wide enough */}
              {(userProfileData.xp / userProfileData.xpMax) * 100 >= 5 && ( // Show if 5% or more for visibility
                <span className="text-xs font-bold text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  {Math.round((userProfileData.xp / userProfileData.xpMax) * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Seneste Bets (1) */}
      <CollapsibleSection title="Seneste Bets (1)" icon={<TableCellsIcon />}>
        {userProfileData.latestBets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-300 uppercase bg-slate-700"> {/* Solid header, consistent with CollapsibleSection */}
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold text-left">Tidspunkt</th> {/* Ensure left align for first th */}
                  <th scope="col" className="px-4 py-3 font-semibold text-left">Kamp/Session</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-left">Valg</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Indsats</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-center">Resultat</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Gevinst/Tab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-[var(--card-background)]"> {/* Body background matches card content for seamless look */}
                {userProfileData.latestBets.map(bet => (
                  <tr key={bet.id} className="hover:bg-slate-700/50 align-middle">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-300">{bet.tidspunkt}</td>
                    <td className="px-4 py-3 text-[var(--foreground)]">{bet.kampSession}</td>
                    <td className="px-4 py-3 text-[var(--foreground)]">{bet.valg}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-[var(--foreground)]">{bet.indsats}</td>
                    <td className={`px-4 py-3 text-center font-semibold ${bet.statusColor}`}>
                        {bet.resultat}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${bet.statusColor}`}>{bet.gevinstTab}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
            <div className="flex flex-col items-center justify-center min-h-[100px] text-slate-500 py-4"> {/* Increased min-height */}
              <TableCellsIcon className="w-12 h-12 mb-3 text-slate-600" /> {/* Larger icon */}
              <p className="text-md font-medium">Ingen Nylige Bets</p>
              <p className="text-xs text-slate-400 mt-1">Placer et bet for at se det her.</p>
            </div>
        )}
      </CollapsibleSection>

      {/* Tabbed Section */}
      <div className="bg-[var(--card-background)] rounded-lg shadow-md">
        <div className="flex border-b border-slate-700">
          {([
            { key: 'stats', label: 'Statistik', icon: <ChartBarIcon /> },
            { key: 'history', label: 'Fuld Bets Historik (Filtrerbar)', icon: <TableCellsIcon /> },
            { key: 'activity', label: 'Seneste Aktivitet', icon: <ListBulletIcon /> },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.key
                  ? 'border-[var(--primary-accent)] text-[var(--primary-accent)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:border-slate-500'
                }`}
            >
              {tab.icon && <span className="mr-2 h-5 w-5">{tab.icon}</span>} {/* Simpler icon styling */}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-0"> {/* Outer container for tab panels, no padding here. CollapsibleSection provides p-4. */}
          {activeTab === 'stats' && (
            <div className="bg-slate-800 p-4 rounded-md text-sm"> {/* Nøgletal panel: darker bg, p-4, rounded. No margin needed due to parent padding. */}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5"> {/* Consistent gap */}
                {userProfileData.statsNogletal.map((stat: { label: string; value: string | number }, index: number) => (
                  <div key={index} className="flex justify-between py-1">
                    <dt className="text-slate-400">{stat.label}</dt>
                    <dd className="font-semibold text-[var(--foreground)] text-right">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {activeTab === 'history' && (
            <div className="bg-slate-800 p-4 rounded-md"> {/* History panel: darker bg, p-4, rounded. */}
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-3 space-y-3 sm:space-y-0 mb-4"> {/* Consistent mb-4 */}
                <div className="flex-grow">
                  <label htmlFor="dateFrom" className="block text-xs font-medium text-slate-400 mb-1">Fra dato</label>
                  <input type="date" id="dateFrom" className="w-full bg-slate-700 p-2.5 rounded-md text-sm text-[var(--foreground)] border border-slate-600 focus:ring-1 focus:ring-[var(--primary-accent)] focus:border-[var(--primary-accent)] shadow-sm" defaultValue="2025-01-01"/>
                </div>
                <div className="flex-grow">
                  <label htmlFor="dateTo" className="block text-xs font-medium text-slate-400 mb-1">Til dato</label>
                  <input type="date" id="dateTo" className="w-full bg-slate-700 p-2.5 rounded-md text-sm text-[var(--foreground)] border border-slate-600 focus:ring-1 focus:ring-[var(--primary-accent)] focus:border-[var(--primary-accent)] shadow-sm" defaultValue="2025-12-31"/>
                </div>
                <button className="px-6 py-2.5 text-sm font-medium bg-[var(--primary-accent)] text-white rounded-md hover:opacity-80 transition-opacity shadow-md"> {/* Enhanced button style */}
                  Filtrer
                </button>
              </div>
              {/* Placeholder for the actual bet history table */}
              <div className="min-h-[150px] flex items-center justify-center border border-dashed border-slate-600 rounded-md"> {/* Removed mt-3 */}
                <p className="text-slate-400">Fuld bet historik tabel kommer her...</p>
              </div>
            </div>
          )}
          {activeTab === 'activity' && (
            <div className="bg-slate-800 p-4 rounded-md"> {/* Activity panel: darker bg, p-4, rounded. */}
              {userProfileData.recentActivity.length > 0 ? (
                <ul className="space-y-2">
                  {userProfileData.recentActivity.map((activity) => (
                    <li key={activity.id} className="p-3.5 bg-slate-700 hover:bg-slate-600/70 rounded-lg text-sm flex items-center space-x-3 shadow"> {/* Increased padding, rounded-lg, shadow, space-x for icon */}
                      {/* Placeholder for activity type icon - assuming we might add it later */}
                      {/* <span className="flex-shrink-0 w-5 h-5 text-slate-500"><InformationCircleIcon/></span> */}
                      <span className="flex-grow text-[var(--foreground)]">{activity.description}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{activity.time}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="min-h-[100px] flex items-center justify-center border border-dashed border-slate-600 rounded-md">
                  <p className="text-slate-400">Ingen aktivitet at vise.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}