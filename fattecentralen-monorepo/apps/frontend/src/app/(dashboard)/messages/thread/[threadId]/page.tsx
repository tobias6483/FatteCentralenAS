// /app/(dashboard)/messages/thread/[threadId]/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Message, MessageParticipant } from '@/types/messages'; // Importer UserReference
import { ArrowLeft, Paperclip, Send } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';


// Statiske eksempeldata for en beskedtråd
// TODO: Erstat med faktiske data fra API baseret på threadId
const dummyCurrentUserId = "user_A"; // Den bruger der ser tråden

const getDummyThreadData = (threadId: string): {
    participants: MessageParticipant[];
    messages: Message[];
    otherParticipant: MessageParticipant;
} | null => {
    const userA: MessageParticipant = { id: "user_A", username: "CurrentUser", avatarUrl: "/placeholder-avatar.png" };
    const userB: MessageParticipant = { id: "user_B", username: "OtherUser123", avatarUrl: "/placeholder-avatar.png" };
    const userC: MessageParticipant = { id: "user_C", username: "SupportGuru", avatarUrl: "/placeholder-avatar.png" };

    const threads: { [key: string]: { participants: MessageParticipant[], messages: Message[] } } = {
        "thread_1": {
            participants: [userA, userB],
            messages: [
                { id: "msg1", threadId: "thread_1", sender: userB, body: "Hej CurrentUser, hvordan går det?", timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), isRead: true },
                { id: "msg2", threadId: "thread_1", sender: userA, body: "Hej OtherUser123! Det går godt, tak. Hvad med dig?", timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(), isRead: true },
                { id: "msg3", threadId: "thread_1", sender: userB, body: "Også fint her. Arbejder på det nye projekt.", timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), isRead: true },
                { id: "msg4", threadId: "thread_1", sender: userA, body: "Spændende! Lad mig vide hvis du har brug for hjælp.", timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), isRead: false },
            ]
        },
        "thread_inbox_1": {
            participants: [userA, userB],
            messages: [
                { id: "msg_inbox_1a", threadId: "thread_inbox_1", sender: userB, body: "Hej, har du set den nye opgave?", timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), isRead: true },
                { id: "msg_inbox_1b", threadId: "thread_inbox_1", sender: userA, body: "Ja, jeg kigger på den nu.", timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(), isRead: true },
            ]
        },
        "thread_sent_1": {
            participants: [userA, userC],
            messages: [
                { id: "msg_sent_1a", threadId: "thread_sent_1", sender: userA, body: "Hej ModtagerBruger1, her er den rapport du bad om.", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), isRead: true },
            ]
        }
    };

    const thread = threads[threadId];
    if (!thread) return null;

    const otherParticipant = thread.participants.find(p => p.id !== dummyCurrentUserId);
    if (!otherParticipant) return null;

    return { ...thread, otherParticipant };
};

// Dummy funktion til at sende svar
// TODO: Erstat med faktisk API kald
const sendReply = async (threadId: string, senderId: string, body: string): Promise<Message> => {
    console.log(`Replying in thread ${threadId} from ${senderId} with body "${body}"`);
    await new Promise(resolve => setTimeout(resolve, 500));
    // Find sender UserReference baseret på senderId (dummy implementering)
    const senderUser = getDummyThreadData(threadId)?.participants.find(p => p.id === senderId) ||
        { id: senderId, username: "UnknownSender", avatarUrl: "/placeholder-avatar.png" };
    return {
        id: `msg_${Math.random().toString(36).substring(7)}`,
        threadId,
        sender: senderUser, // Brug UserReference objekt her
        body,
        timestamp: new Date().toISOString(),
        isRead: false,
    };
};

const MessageThreadPage = () => {
    const params = useParams();
    const router = useRouter();
    const threadId = typeof params.threadId === 'string' ? params.threadId : '';

    const [threadData, setThreadData] = useState<ReturnType<typeof getDummyThreadData>>(null);
    const [newMessageBody, setNewMessageBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (threadId) {
            const data = getDummyThreadData(threadId);
            setThreadData(data);
        }
    }, [threadId]);

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessageBody.trim() || !threadData) return;

        setIsSending(true);
        try {
            const replyMessage = await sendReply(threadId, dummyCurrentUserId, newMessageBody.trim());
            setThreadData(prevData => {
                if (!prevData) return null;
                return {
                    ...prevData,
                    messages: [...prevData.messages, replyMessage],
                };
            });
            setNewMessageBody('');
        } catch (error) {
            console.error("Failed to send reply:", error);
        } finally {
            setIsSending(false);
        }
    };

    if (!threadData) {
        return (
            <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                <p className="text-xl text-muted-foreground">Indlæser beskedtråd...</p>
                <Link href="/messages" className="mt-6">
                    <Button variant="outline" size="lg"><ArrowLeft className="mr-2 h-5 w-5" /> Tilbage til Indbakke</Button>
                </Link>
            </div>
        );
    }

    const { messages, otherParticipant } = threadData;

    return (
        <div className="container mx-auto px-4 md:px-6 flex flex-col h-[calc(100vh-80px)] max-h-[900px]"> {/* Removed py-6 */}
            <Card className="flex flex-col grow shadow-xl rounded-lg overflow-hidden">
                <CardHeader className="border-b p-4 sticky top-0 bg-card z-10 rounded-t-lg">
                    <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-1 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <CardTitle className="text-lg font-semibold">{otherParticipant.username}</CardTitle>
                            {/* Optional: Add a subtitle for online status or last seen */}
                            {/* <p className="text-xs text-muted-foreground">Online</p> */}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-grow overflow-y-auto p-3 md:p-4 space-y-4 bg-white"> {/* Reduced padding */}
                    {messages.map((msg) => {
                        const isCurrentUserSender = msg.sender.id === dummyCurrentUserId;

                        return (
                            <div
                                key={msg.id}
                                className={`flex items-end space-x-2 ${isCurrentUserSender ? 'justify-end ml-auto' : 'justify-start mr-auto'}`}
                                style={{ maxWidth: '75%' }}
                            >
                                <div
                                    className={`flex flex-col ${isCurrentUserSender ? 'items-end' : 'items-start'}`}
                                >
                                    <div
                                        className={`py-2 px-3.5 shadow-sm ${isCurrentUserSender ? 'bg-blue-500 text-white rounded-[22px] rounded-br-lg' : 'bg-gray-200 text-gray-800 rounded-[22px] rounded-bl-lg'}`} /* Adjusted rounding */
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                                    </div>
                                    <p className={`text-xs mt-1 px-1 ${isCurrentUserSender ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                {/* Avatar removed from here */}
                            </div>
                        );
                    })}
                </CardContent>

                <CardFooter className="border-t p-3 md:p-4 bg-card sticky bottom-0 z-10 rounded-b-lg">
                    <form onSubmit={handleReplySubmit} className="flex w-full items-center space-x-2">
                        <Button variant="ghost" size="icon" type="button" className="text-white hover:text-gray-300" disabled> {/* Changed text color for paperclip icon */}
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <Textarea
                            value={newMessageBody}
                            onChange={(e) => setNewMessageBody(e.target.value)}
                            placeholder="Skriv en besked..."
                            className="grow resize-none rounded-full py-2.5 px-4 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:ring-offset-0"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleReplySubmit(e as any); // Consider a cleaner way to handle form submission
                                }
                            }}
                            disabled={isSending}
                        />
                        <Button type="submit" size="icon" disabled={isSending || !newMessageBody.trim()} className="rounded-full bg-blue-500 hover:bg-blue-600 text-white shrink-0 w-10 h-10 flex items-center justify-center">
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
};

export default MessageThreadPage;
