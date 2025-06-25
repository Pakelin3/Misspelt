import React from 'react';
import { Bot, UserCircle2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

function MessageBubble({ message }) {
    const { theme } = useTheme();
    const isUser = message.sender === 'user';
    const bubbleClasses = isUser
        ? `${theme === 'light' ? 'bg-neutral-300 text-[var(--color-text)]' : 'bg-[var(--color-dark-bg-tertiary)] text-[var(--color-dark-text)]'} self-end rounded-br-none`
        : `${theme === 'light' ? 'text-[var(--color-text-main)]' : 'bg-[var(--color-dark-bg-secondary)] text-[var(--color-dark-text)]'} self-start rounded-bl-none`;

    return (
        <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start gap-3 p-4 rounded-xl max-w-[80%] ${bubbleClasses}`}>
                {!isUser && (
                    <div className="flex-shrink-0">
                        <Bot className={`w-7 h-7 ${theme === 'light' ? 'text-[var(--color-bg-secondary)]' : 'text-[var(--color-accent-green)]'}`} />
                    </div>
                )}
                <p className="text-base whitespace-pre-wrap">{message.text}</p>
                {isUser && (
                    <div className="flex-shrink-0">
                        <UserCircle2 className={`w-7 h-7 ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`} />    
                    </div>
                )}
            </div>
        </div>
    );
}

export default MessageBubble;