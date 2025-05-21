// /src/components/messages/MessageList.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConversationSnippet } from '@/types/messages';
import { Mail } from 'lucide-react';
import React from 'react';
import MessageListItem from './MessageListItem';

interface MessageListProps {
    conversations: ConversationSnippet[];
    currentUserId: string;
    listTitle?: string; // e.g., "Indbakke" or "Udbakke"
    emptyStateMessage?: string;
}

const MessageList: React.FC<MessageListProps> = ({
    conversations,
    currentUserId,
    listTitle = "Beskeder",
    emptyStateMessage = "Du har ingen beskeder her."
}) => {
    return (
        <Card className="shadow-lg">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl">
                    <Mail className="mr-2 h-5 w-5" /> {listTitle}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {conversations && conversations.length > 0 ? (
                    <div className="divide-y divide-border">
                        {conversations.map((convo) => (
                            <MessageListItem
                                key={convo.threadId}
                                conversation={convo}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center text-muted-foreground">
                        <Mail className="mx-auto h-12 w-12 text-gray-400 mb-3" strokeWidth={1.5} />
                        <p>{emptyStateMessage}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MessageList;
