import React from 'react';

export interface Message {
    id: string | number;
    text: string;
    senderId: string | number; // Changed from senderName for better identification
    senderName: string;
    timestamp: string;
    isSender: boolean;
}

interface MessageBubbleProps {
    message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const { text, isSender, timestamp, senderName } = message;

    // Base classes for all bubbles
    const bubbleBaseClasses = "p-3 max-w-xs md:max-w-md lg:max-w-lg break-words";

    // Conditional classes for sender vs. receiver
    const senderClasses = "bg-blue-600 text-white rounded-t-xl rounded-bl-xl";
    const receiverClasses = "bg-gray-700 text-gray-100 rounded-t-xl rounded-br-xl";

    // Alignment for the bubble container
    const alignmentClasses = isSender ? "flex justify-end" : "flex justify-start";

    // Simple time formatting (can be improved with a library like date-fns)
    const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={`mb-3 ${alignmentClasses}`}>
            <div className={`${bubbleBaseClasses} ${isSender ? senderClasses : receiverClasses}`}>
                {!isSender && (
                    <p className="text-xs font-semibold text-purple-400 mb-1">{senderName}</p>
                )}
                <p className="text-sm">{text}</p>
                <p className={`text-xs mt-1 ${isSender ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                    {formattedTime}
                </p>
            </div>
        </div>
    );
};

export default MessageBubble;
