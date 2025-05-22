import React, { useState } from 'react';

// Assuming you'll use an icon library like Heroicons
// import { PaperClipIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface MessageInputProps {
    onSendMessage: (messageText: string) => void;
    // onAttachFile?: () => void; // Optional: if you want to handle file attachments
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center p-3 bg-gray-800 border-t border-gray-700">
            {/* Attachment Button - Placeholder Icon */}
            <button
                type="button"
                // onClick={onAttachFile}
                className="p-2 mr-2 text-gray-400 hover:text-white focus:outline-none rounded-full hover:bg-gray-700"
                aria-label="Vedhæft fil"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.687 7.687a1.5 1.5 0 002.121 2.121l7.687-7.687a1.5 1.5 0 00-2.121-2.121z" />
                </svg>
            </button>

            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Skriv en besked..."
                className="flex-grow p-3 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm"
            />

            {/* Send Button - Placeholder Icon */}
            <button
                type="submit"
                disabled={!message.trim()}
                className="p-2 ml-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
                aria-label="Send besked"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
            </button>
        </form>
    );
};

export default MessageInput;
