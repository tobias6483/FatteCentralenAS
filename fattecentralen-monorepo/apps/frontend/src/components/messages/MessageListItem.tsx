// /src/components/messages/MessageListItem.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Added Button
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'; // Added DropdownMenu
import { ConversationSnippet, UserReference } from '@/types/messages';
import { MoreVertical } from 'lucide-react'; // Added MoreVertical
import Link from 'next/link';
import React from 'react';

interface MessageListItemProps {
    conversation: ConversationSnippet;
    currentUserId: string; // To determine the 'other' participant and read status relevance
}

const formatDate = (dateString: string, relative = true) => {
    const date = new Date(dateString);
    if (relative) {
        const now = new Date();
        const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);
        const weeks = Math.round(days / 7);
        const months = Math.round(days / 30.44); // Average days in month
        const years = Math.round(days / 365.25); // Account for leap years

        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        if (weeks < 5) return `${weeks}w ago`; // Up to 4 weeks
        if (months < 12) return date.toLocaleDateString('da-DK', { month: 'short', day: 'numeric' });
        return date.toLocaleDateString('da-DK', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('da-DK', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getOtherParticipant = (participants: UserReference[], currentUserId: string): UserReference | undefined => {
    return participants.find(p => p.id !== currentUserId);
};

const MessageListItem: React.FC<MessageListItemProps> = ({ conversation, currentUserId }) => {
    const otherParticipant = getOtherParticipant(conversation.participants, currentUserId);
    const displayName = otherParticipant?.username || 'Ukendt Bruger';
    const avatarUrl = otherParticipant?.avatarUrl;
    const avatarFallback = displayName.substring(0, 2).toUpperCase();

    // Handler functions for dropdown menu items
    const handleMarkAsUnread = () => {
        // TODO: Implement API call to mark as unread
        console.log(`Marking conversation ${conversation.threadId} as unread`);
        alert(`Markér som ulæst: ${conversation.threadId} (funktion ikke implementeret)`);
    };

    const handleArchive = () => {
        // TODO: Implement API call to archive
        console.log(`Archiving conversation ${conversation.threadId}`);
        alert(`Arkivér: ${conversation.threadId} (funktion ikke implementeret)`);
    };

    const handleDelete = () => {
        // TODO: Implement API call to delete
        if (window.confirm("Er du sikker på, at du vil slette denne samtale permanent?")) {
            console.log(`Deleting conversation ${conversation.threadId}`);
            alert(`Slet samtale: ${conversation.threadId} (funktion ikke implementeret)`);
        }
    };

    return (
        <div className={`flex items-center p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 group relative transition-colors duration-150 ease-in-out`}>
            <Link href={`/messages/thread/${conversation.threadId}`} passHref className="flex items-center grow overflow-hidden">
                <Avatar className="h-10 w-10 mr-3 shrink-0">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grow overflow-hidden">
                    <div className="flex justify-between items-center">
                        <h3 className={`text-sm truncate ${!conversation.isReadByCurrentUser ? 'text-foreground font-semibold' : 'text-foreground'}`}>
                            {displayName}
                        </h3>
                        <time className={`text-xs mr-2 ${!conversation.isReadByCurrentUser ? 'text-foreground/80 font-medium' : 'text-muted-foreground'}`}>
                            {formatDate(conversation.lastMessageTimestamp)}
                        </time>
                    </div>
                    {conversation.subject && (
                        <p className={`text-xs truncate ${!conversation.isReadByCurrentUser ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                            {conversation.subject}
                        </p>
                    )}
                    <p className={`text-xs truncate ${!conversation.isReadByCurrentUser ? 'text-foreground/90' : 'text-muted-foreground/80'}`}>
                        {conversation.lastMessageSender?.id === currentUserId && 'Du: '}
                        {conversation.lastMessageSnippet}
                    </p>
                </div>
            </Link>
            <div className="flex items-center shrink-0 ml-2 space-x-2">
                {!conversation.isReadByCurrentUser && conversation.unreadCount > 0 && (
                    <Badge variant="default" className="h-5 min-w-[1.25rem] text-xs p-1 flex items-center justify-center">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </Badge>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Flere valgmuligheder</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={handleMarkAsUnread}>Markér som ulæst</DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleArchive}>Arkivér</DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleDelete} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">Slet samtale</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default MessageListItem;
