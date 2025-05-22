// /src/components/messages/MessageList.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // Added
import { ConversationSnippet } from '@/types/messages';
import { Mail, Search } from 'lucide-react'; // Added Search
import React, { useEffect, useMemo, useRef, useState } from 'react'; // Added useState, useMemo, useRef, useEffect
import MessageBubble, { Message } from './MessageBubble'; // Assuming Message interface is exported from MessageBubble
import MessageListItem from './MessageListItem';

interface MessageListProps {
    conversations: ConversationSnippet[];
    currentUserId: string;
    listTitle?: string; // e.g., "Indbakke" or "Udbakke"
    emptyStateMessage?: string;
    messages: Message[]; // Added messages prop
}

const MessageList: React.FC<MessageListProps> = ({
    conversations,
    currentUserId,
    listTitle = "Beskeder",
    emptyStateMessage = "Du har ingen beskeder her.",
    messages // Destructure messages prop
}) => {
    const [searchTerm, setSearchTerm] = useState(''); // Added
    const endOfMessagesRef = useRef<null | HTMLDivElement>(null);

    const filteredConversations = useMemo(() => { // Added
        if (!searchTerm) return conversations;
        return conversations.filter(convo =>
            convo.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            convo.lastMessageSnippet?.toLowerCase().includes(searchTerm.toLowerCase()) || // Corrected to lastMessageSnippet
            convo.participants.some(p => p.username?.toLowerCase().includes(searchTerm.toLowerCase())) // Corrected to p.username
        );
    }, [conversations, searchTerm]);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <Card className="shadow-lg flex flex-col h-full">
            <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-xl">
                        <Mail className="mr-2 h-5 w-5" /> {listTitle}
                    </CardTitle>
                    {/* Placeholder for bulk actions - to be implemented later */}
                    {/* <Button variant="outline" size="sm">Massehandlinger</Button> */}
                </div>
                <div className="mt-4 relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Søg i beskeder..."
                        className="pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-grow overflow-y-auto">
                {filteredConversations && filteredConversations.length > 0 ? (
                    <div className="divide-y divide-border">
                        {filteredConversations.map((convo) => (
                            <MessageListItem
                                key={convo.threadId}
                                conversation={convo}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                        <Mail className="mx-auto h-16 w-16 text-gray-400 mb-4" strokeWidth={1.2} />
                        <h3 className="text-lg font-semibold mb-1">{searchTerm ? "Ingen resultater" : "Tom indbakke"}</h3>
                        <p className="text-sm">
                            {searchTerm
                                ? `Din søgning "${searchTerm}" gav ingen resultater.`
                                : emptyStateMessage}
                        </p>
                    </div>
                )}
                {/* Messages section - assuming this is where messages should be displayed */}
                <div className="space-y-4">
                    {messages && messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={{
                                ...msg,
                                isSender: msg.senderId === currentUserId // Replace 'CurrentUser' with actual current user identifier logic
                                // or pass senderId and compare: msg.senderId === currentUserId
                            }}
                        />
                    ))}
                    <div ref={endOfMessagesRef} />
                </div>
            </CardContent>
        </Card>
    );
};

export default MessageList;
