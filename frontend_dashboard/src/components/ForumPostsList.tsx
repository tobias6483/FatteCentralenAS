import React from 'react';
import Image from 'next/image';

interface ForumPostItem {
  id: string;
  title: string;
  author: string;
  timeAgo: string;
  avatarUrl: string; // URL to the author's avatar
  href: string; // Link to the forum post
}

// Mock data - replace with actual data fetching later
const mockPosts: ForumPostItem[] = [
  {
    id: 'post-1',
    title: 'Dette er en test',
    author: 'admin',
    timeAgo: 'i går',
    avatarUrl: '/static/avatars/admin_fallback_f4f3aabd.png', // Example path, adjust as needed
    href: '#',
  },
  {
    id: 'post-2',
    title: 'Dette er en test',
    author: 'thomas',
    timeAgo: 'i går',
    avatarUrl: '/static/avatars/thomas_2.png', // Example path
    href: '#',
  },
  {
    id: 'post-3',
    title: 'Dette er en test',
    author: 'tobias',
    timeAgo: 'for 2 dage siden',
    avatarUrl: '/static/avatars/tobias_fallback_02c31e69.png', // Example path
    href: '#',
  },
];

const DEFAULT_AVATAR = '/static/avatars/default_avatar.png'; // Fallback avatar

export default function ForumPostsList() {
  if (mockPosts.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">Ingen nye forumindlæg.</p>;
  }

  return (
    <div className="space-y-3"> {/* Reduced spacing between items */}
      {mockPosts.map((post) => (
        <a
          key={post.id}
          href={post.href}
          className="flex items-start p-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg shadow-md transition-colors duration-150 ease-in-out" // Reduced padding
        >
          <div className="flex-shrink-0 mr-4"> {/* Increased margin for avatar */}
            <Image
              src={post.avatarUrl || DEFAULT_AVATAR}
              alt={`${post.author}'s avatar`}
              width={32} // Reduced avatar size
              height={32}
              className="rounded-full object-cover border-2 border-zinc-600" // Changed border to zinc
              unoptimized={post.avatarUrl?.includes('http://localhost') || post.avatarUrl?.includes('https://localhost')}
            />
          </div>
          <div className="flex-grow">
            <h3 className="font-medium text-[var(--foreground)] text-sm leading-snug">{post.title}</h3> {/* Reduced text size */}
            <p className="text-xs text-[var(--text-secondary)] mt-0.5"> {/* Added small top margin */}
              af <span className="font-semibold text-[var(--foreground)]">{post.author}</span> - {post.timeAgo}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}