// /src/components/messages/MessageListItem.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ConversationSnippet, UserReference } from '@/types/messages';
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

    return (
        <Link href={`/messages/thread/${conversation.threadId}`} passHref>
            <div
                className={`flex items-center p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0
                    ${!conversation.isReadByCurrentUser ? 'bg-primary/10 font-semibold' : ''}`}
            >
                <Avatar className="h-10 w-10 mr-3 shrink-0">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grow overflow-hidden">
                    <div className="flex justify-between items-center">
                        <h3 className={`text-sm truncate ${!conversation.isReadByCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                            {displayName}
                        </h3>
                        <time className={`text-xs ${!conversation.isReadByCurrentUser ? 'text-primary/80' : 'text-muted-foreground'}`}>
                            {formatDate(conversation.lastMessageTimestamp)}
                        </time>
                    </div>
                    {conversation.subject && ( // Vis kun subject hvis det findes
                        <p className={`text-xs truncate ${!conversation.isReadByCurrentUser ? 'text-primary/90' : 'text-muted-foreground'}`}>
                            {conversation.subject}
                        </p>
                    )}
                    <p className={`text-xs truncate ${!conversation.isReadByCurrentUser ? 'text-primary/70' : 'text-muted-foreground/80'}`}>
                        {conversation.lastMessageSender?.id === currentUserId && 'Du: '}
                        {conversation.lastMessageSnippet}
                    </p>
                </div>
                {!conversation.isReadByCurrentUser && conversation.unreadCount > 0 && ( // Vis kun badge hvis der er ulæste beskeder
                    <div className="ml-2 shrink-0">
                        {/* Bruger default variant for Badge, eller en anden gyldig variant.
                            For en simpel prik, kan man style et div element direkte,
                            eller bruge en lille Badge med f.eks. variant="destructive" hvis det passer tematisk.
                            Her bruger vi en lille rød prik med destructive variant for ulæst markering.
                        */}
                        <Badge variant="destructive" className="h-2.5 w-2.5 p-0" />
                        {/* Alternativt, hvis du vil vise antal ulæste:
                        {conversation.unreadCount && conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 text-xs p-1">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </Badge>
                        )}
                        */}
                    </div>
                )}
            </div>
        </Link>
    );
};

export default MessageListItem;
