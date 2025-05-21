// /src/types/messages.ts

/**
 * Represents a summary of a user, often used for sender/recipient information
 * within message contexts.
 */
export interface UserReference {
    id: string; // Or number, depending on your backend's user ID type
    username: string;
    avatarUrl?: string; // Optional URL to the user's avatar image
    isOnline?: boolean; // Optional: Indicates if the user is currently online
}

// Tilføjet for at matche brugen i MessageThreadPage, selvom UserReference er meget ens.
// Overvej at konsolidere til kun UserReference hvis de er identiske i funktion.
export interface MessageParticipant extends UserReference { }

/**
 * Represents a single message within a conversation thread.
 */
export interface Message {
    id: string; // Or number, unique identifier for the message
    threadId: string; // Or number, identifier for the conversation thread this message belongs to
    sender: UserReference; // The user who sent the message
    body: string; // The raw content of the message (e.g., Markdown)
    bodyHtml?: string; // Optional: Rendered HTML of the message body
    timestamp: string; // ISO date string representing when the message was sent
    isRead: boolean; // Flyttet hertil for at matche brugen i MessageThreadPage dummy data
}

/**
 * Represents a snippet of a conversation, used for display in lists like inbox or sent items.
 * Opdateret for at matche den faktiske brug i MessageList/MessageListItem
 */
export interface ConversationSnippet {
    threadId: string;
    participants: UserReference[]; // Tilføjet for at getOtherParticipant kan virke
    otherParticipant?: UserReference; // Beholdes som valgfri, hvis den stadig bruges direkte nogle steder
    lastMessage: { // Dette var den struktur jeg introducerede tidligere, men MessageListItem bruger separate felter
        id: string;
        senderId: string;
        body: string;
        timestamp: string;
        isRead: boolean;
    };
    // Felter som MessageListItem forventer direkte på ConversationSnippet:
    subject?: string; // Gør valgfri hvis ikke alle samtaler har et emne
    lastMessageTimestamp: string;
    lastMessageSender?: UserReference;
    lastMessageSnippet: string;
    isReadByCurrentUser: boolean;
    unreadCount: number; // Antal ulæste beskeder for den nuværende bruger i denne tråd
}


/**
 * Represents a full conversation thread, including all its messages.
 */
export interface ConversationThread {
    threadId: string; // Or number, unique identifier for the conversation thread
    subject?: string; // Gør subject valgfrit, da det ikke altid er til stede
    participants: UserReference[]; // List of users involved in the conversation
    messages: Message[]; // An array of all messages in this thread, typically sorted by timestamp
}

// Example of how you might represent a user in the application globally
// This could live in a more general types file like src/types/user.ts
export interface UserProfile extends UserReference {
    email?: string; // Only if needed and privacy allows
    registrationDate?: string;
    lastLogin?: string;
    // ... other profile details
}
