// /app/(dashboard)/messages/sent/page.tsx
"use client";

import MessageList from '@/components/messages/MessageList';
import { ConversationSnippet, UserReference } from '@/types/messages'; // Importer UserReference
import { Mail } from 'lucide-react';

// Definer en currentUser for denne side (eller importer hvis den er global)
const currentUser: UserReference = { id: "currentUser", username: "Current User", avatarUrl: "/placeholder-avatar.png" };

// Statiske eksempeldata for udbakken
// TODO: Erstat med faktiske data fra API
const staticSentConversations: ConversationSnippet[] = [
    {
        threadId: "thread_sent_1",
        participants: [currentUser, { id: "user_2", username: "ModtagerBruger1", avatarUrl: "/placeholder-avatar.png" }],
        otherParticipant: { // otherParticipant er stadig i typen, men participants er nu også påkrævet
            id: "user_2",
            username: "ModtagerBruger1",
            avatarUrl: "/placeholder-avatar.png",
        },
        lastMessage: {
            id: "msg_sent_1a",
            senderId: currentUser.id,
            body: "Hej ModtagerBruger1, her er den rapport du bad om.",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            isRead: true, // Antager modtager har læst den, eller irrelevant for udbakke visning
        },
        lastMessageTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lastMessageSnippet: "Hej ModtagerBruger1, her er den rapport du bad om.",
        isReadByCurrentUser: true, // Da current user er afsender, er tråden "læst"
        unreadCount: 0,
        subject: "Rapport tilsendt" // Tilføjet subject for fuldstændighed
    },
    {
        threadId: "thread_sent_2",
        participants: [currentUser, { id: "user_3", username: "KollegaJensen", avatarUrl: "/placeholder-avatar.png" }],
        otherParticipant: {
            id: "user_3",
            username: "KollegaJensen",
            avatarUrl: "/placeholder-avatar.png",
        },
        lastMessage: {
            id: "msg_sent_2a",
            senderId: currentUser.id,
            body: "Husk mødet i morgen kl. 10.",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            isRead: false,
        },
        lastMessageTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        lastMessageSnippet: "Husk mødet i morgen kl. 10.",
        isReadByCurrentUser: true,
        unreadCount: 0,
        subject: "Påmindelse om møde"
    },
    {
        threadId: "thread_sent_3",
        participants: [currentUser, { id: "user_4", username: "SupportTeam", avatarUrl: "/placeholder-avatar.png" }],
        otherParticipant: {
            id: "user_4",
            username: "SupportTeam",
            avatarUrl: "/placeholder-avatar.png",
        },
        lastMessage: {
            id: "msg_sent_3a",
            senderId: currentUser.id,
            body: "Jeg har et problem med min konto...",
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            isRead: true,
        },
        lastMessageTimestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        lastMessageSnippet: "Jeg har et problem med min konto...",
        isReadByCurrentUser: true,
        unreadCount: 0,
        subject: "Kontoproblem"
    },
];

const SentMessagesPage = () => {
    const currentUserIdToPass = currentUser.id; // Brug den definerede currentUser

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <h1 className="text-3xl font-semibold mb-6 flex items-center">
                <Mail className="mr-3 h-8 w-8 text-sky-600" /> Udbakke
            </h1>
            <MessageList
                conversations={staticSentConversations}
                currentUserId={currentUserIdToPass}
                listTitle="Sendte Beskeder"
                emptyStateMessage="Du har ikke sendt nogle beskeder endnu."
            />
        </div>
    );
};

export default SentMessagesPage;
