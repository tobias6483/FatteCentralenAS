import React from 'react';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageList from './MessageList';

// Dummy data for demonstration
const dummyMessages = [
    { id: 1, text: "Hej med dig! Hvordan går det?", senderId: "user2", senderName: "OtherUser123", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), isSender: false },
    { id: 2, text: "Hej! Det går godt, tak. Hvad med dig?", senderId: "user1", senderName: "CurrentUser", timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(), isSender: true },
    { id: 3, text: "Også fint her. Har du set den nye film?", senderId: "user2", senderName: "OtherUser123", timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), isSender: false },
    { id: 4, text: "Ja, den var fantastisk! Skal vi snakke om den?", senderId: "user1", senderName: "CurrentUser", timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), isSender: true },
    { id: 5, text: "Jep, helt sikkert! Spoiler alert dog... 😉", senderId: "user2", senderName: "OtherUser123", timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(), isSender: false },
];

interface ChatWindowProps {
    otherUserName: string;
    currentUserId: string; // Changed to string to match MessageListProps
    // Assuming conversations will be handled or fetched within MessageList or passed differently
    // For now, MessageList from your context seems to also take a 'messages' prop directly
}

const ChatWindow: React.FC<ChatWindowProps> = ({ otherUserName, currentUserId }) => {
    const handleBack = () => {
        console.log("Back button clicked");
        // Implement back navigation logic, e.g., router.back() or set a state
    };

    const handleSendMessage = (messageText: string) => {
        console.log("Sending message:", messageText);
        // TODO: Add logic to add the new message to the state and send to backend
        // Example (if dummyMessages were stateful):
        // const newMessage = {
        //   id: Date.now(), // or a UUID
        //   text: messageText,
        //   senderId: currentUserId,
        //   senderName: "CurrentUser", // Or fetch current user's name
        //   timestamp: new Date().toISOString(),
        //   isSender: true,
        // };
        // setMessages(prevMessages => [...prevMessages, newMessage]);
    };

    return (
        <div className="flex flex-col h-full max-h-screen bg-gray-900 text-white">
            <ChatHeader userName={otherUserName} onBackClick={handleBack} />
            <div className="flex-grow overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                {/* Assuming MessageList can take 'messages' and 'currentUserId' directly for displaying a single chat thread */}
                {/* If MessageList is primarily for conversation list, this part might need adjustment */}
                <MessageList messages={dummyMessages} currentUserId={currentUserId} conversations={[]} />
            </div>
            <MessageInput onSendMessage={handleSendMessage} />
        </div>
    );
};

export default ChatWindow;
