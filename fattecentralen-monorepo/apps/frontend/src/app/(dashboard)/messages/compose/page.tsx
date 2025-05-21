// /app/(dashboard)/messages/compose/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send } from 'lucide-react';
import React from 'react';

// Dummy funktion til at simulere afsendelse af besked
// TODO: Erstat med faktisk API kald
const sendMessage = async (recipient: string, subject: string, body: string) => {
    console.log(`Sending message to ${recipient} with subject "${subject}" and body "${body}"`);
    // Simuler et API kald
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, messageId: Math.random().toString(36).substring(7) };
};

const ComposeMessagePage = ({ params }: { params?: { recipientUsername?: string } }) => {
    const [recipient, setRecipient] = React.useState(params?.recipientUsername || '');
    const [subject, setSubject] = React.useState(''); // Tilføjet for fuldstændighed, selvom det ikke var i gammel HTML
    const [body, setBody] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);
    const [sendStatus, setSendStatus] = React.useState<{ success: boolean; message: string } | null>(null);

    const pageTitle = params?.recipientUsername ? `Skriv til ${params.recipientUsername}` : "Ny Besked";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipient || !body) {
            setSendStatus({ success: false, message: "Modtager og besked må ikke være tomme." });
            return;
        }
        setIsSending(true);
        setSendStatus(null);
        try {
            // For nuværende bruger vi en tom subject-linje, da det ikke var i den gamle HTML.
            // Dette kan udvides senere.
            const result = await sendMessage(recipient, subject, body);
            if (result.success) {
                setSendStatus({ success: true, message: "Besked sendt!" });
                setRecipient(params?.recipientUsername || ''); // Nulstil kun hvis det ikke er en direkte besked
                setSubject('');
                setBody('');
                // TODO: Overvej at omdirigere til den sendte besked eller indbakken
                // For eksempel: router.push(`/messages/thread/${result.messageId}`);
                // eller router.push('/messages');
            } else {
                setSendStatus({ success: false, message: "Fejl ved afsendelse af besked." });
            }
        } catch (error) {
            setSendStatus({ success: false, message: "Der opstod en uventet fejl." });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <Card className="max-w-2xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center">
                        <Send className="mr-2 h-6 w-6" /> {pageTitle}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                                Modtager
                            </label>
                            <Input
                                id="recipient"
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder="Brugernavn på modtager"
                                disabled={!!params?.recipientUsername || isSending}
                                required
                                className="mt-1 block w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                                Emne (valgfrit)
                            </label>
                            <Input
                                id="subject"
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Indtast emne"
                                disabled={isSending}
                                className="mt-1 block w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                                Besked
                            </label>
                            <Textarea
                                id="body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Skriv din besked her..."
                                rows={8}
                                required
                                disabled={isSending}
                                className="mt-1 block w-full"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSending} className="bg-sky-600 hover:bg-sky-700">
                                {isSending ? "Sender..." : "Send Besked"}
                                <Send className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                        {sendStatus && (
                            <p className={`mt-4 text-sm ${sendStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                                {sendStatus.message}
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ComposeMessagePage;

// Vi eksporterer den samme komponent til brug i [recipientUsername]/page.tsx
// Dette er en måde at genbruge logikken på for begge routes.
// Next.js vil automatisk håndtere params for den dynamiske route.
export const ComposeMessageWithRecipientPage = ComposeMessagePage;
