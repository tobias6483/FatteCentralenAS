import React from 'react';

// Assuming you'll use an icon library like Heroicons
// For example, if using Heroicons (install with `npm install @heroicons/react` or `yarn add @heroicons/react`)
// import { ArrowLeftIcon } from '@heroicons/react/24/solid';

interface ChatHeaderProps {
    userName: string;
    onBackClick?: () => void; // Optional: if you want to handle back navigation
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ userName, onBackClick }) => {
    return (
        <div className="flex items-center p-4 bg-gray-800 border-b border-gray-700">
            {onBackClick && (
                <button
                    onClick={onBackClick}
                    className="mr-3 p-1 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    aria-label="Tilbage"
                >
                    {/* Placeholder for back arrow icon - e.g., Heroicons ArrowLeftIcon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                </button>
            )}
            <h1 className="text-xl font-semibold text-white">{userName}</h1>
            {/* You can add other elements here, like online status indicator or a menu button */}
        </div>
    );
};

export default ChatHeader;
