// /app/(dashboard)/messages/page.tsx
"use client";

import MessageList from '@/components/messages/MessageList';
import { Button } from '@/components/ui/button';
import { ConversationSnippet, UserReference } from '@/types/messages';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

// Statiske eksempeldata for indbakken
// TODO: Erstat med faktiske data fra API
const currentUser: UserReference = { id: "user_A", username: "CurrentUser", avatarUrl: "/placeholder-avatar.png" };
const otherUser1: UserReference = { id: "user_B", username: "Alice", avatarUrl: "/placeholder-avatar.png" };
const otherUser2: UserReference = { id: "user_C", username: "Bob", avatarUrl: "/placeholder-avatar.png" };
const otherUser3: UserReference = { id: "user_D", username: "Charlie", avatarUrl: "/placeholder-avatar.png" };
const otherUser4: UserReference = { id: "user_E", username: "Diana", avatarUrl: "/placeholder-avatar.png" };

const staticInboxConversations: ConversationSnippet[] = [
    {
        threadId: "thread_inbox_1",
        participants: [currentUser, otherUser1],
        // otherParticipant: otherUser1, // Kan udledes eller beholdes for bekvemmelighed
        subject: "Angående vores projektmøde i morgen",
        lastMessage: { // Dette felt er nu en del af typen, men MessageListItem bruger de separate felter nedenfor
            id: "msg_inbox_1a",
            senderId: otherUser1.id,
            body: "Hej TestBruger, jeg ville bare lige høre om mødet kl. 10 stadig passer dig?",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            isRead: false, // Set fra currentUser's perspektiv
        },
        lastMessageTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lastMessageSender: otherUser1,
        lastMessageSnippet: "Hej TestBruger, jeg ville bare lige høre om mødet kl. 10 stadig passer dig?",
        isReadByCurrentUser: false,
        unreadCount: 1,
    },
    {
        threadId: "thread_inbox_2",
        participants: [currentUser, otherUser2],
        subject: "Fodboldbilletter til på lørdag?",
        lastMessage: {
            id: "msg_inbox_2a",
            senderId: otherUser2.id,
            body: "Du Ja, det lyder fedt! Jeg er klar.",
            timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
            isRead: true,
        },
        lastMessageTimestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        lastMessageSender: otherUser2,
        lastMessageSnippet: "Du Ja, det lyder fedt! Jeg er klar.",
        isReadByCurrentUser: true,
        unreadCount: 0,
    },
    {
        threadId: "thread_inbox_3",
        participants: [currentUser, otherUser3],
        subject: "Hjælp til kodningsopgave",
        lastMessage: {
            id: "msg_inbox_3a",
            senderId: otherUser3.id,
            body: "Jeg sidder fast med en bug, har du tid til at kigge på den?",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            isRead: false,
        },
        lastMessageTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastMessageSender: otherUser3,
        lastMessageSnippet: "Jeg sidder fast med en bug, har du tid til at kigge på den?",
        isReadByCurrentUser: false,
        unreadCount: 3,
    },
    {
        threadId: "thread_inbox_4",
        participants: [currentUser, otherUser4],
        subject: "Weekendplaner - hvad siger du til en tur i biffen?",
        lastMessage: {
            id: "msg_inbox_4a",
            senderId: otherUser4.id,
            body: "Kunne være hyggeligt! Hvilken film tænker du på? Jeg er åben for forslag. :)",
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            isRead: true,
        },
        lastMessageTimestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        lastMessageSender: otherUser4,
        lastMessageSnippet: "Kunne være hyggeligt! Hvilken film tænker du på? Jeg er åben for forslag. :)",
        isReadByCurrentUser: true,
        unreadCount: 0,
    },
];

const InboxPage = () => {
    const currentUserId = currentUser.id; // Antag at den nuværende brugers ID er "user_A"

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold">Indbakke</h1>
                <Link href="/messages/compose" passHref>
                    <Button variant="default" className="bg-sky-600 hover:bg-sky-700">
                        <PlusCircle className="mr-2 h-5 w-5" /> Skriv Ny Besked
                    </Button>
                </Link>
            </div>
            <MessageList
                conversations={staticInboxConversations}
                currentUserId={currentUserId}
                listTitle="Alle Samtaler"
                emptyStateMessage="Din indbakke er tom."
            />
        </div>
    );
};

export default InboxPage;
