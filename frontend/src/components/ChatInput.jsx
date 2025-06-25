import React, { useState, useRef, useEffect } from 'react';
import { Plus, Video, Search, Image, SendHorizonal } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

function ChatInput({ onSendMessage }) {
    const { theme } = useTheme();
    const [inputText, setInputText] = useState('');
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [inputText]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputText.trim()) {
            onSendMessage(inputText);
            setInputText('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form className={`flex flex-col rounded-2xl p-2 w-full shadow-lg border
            ${theme === 'light' ? 'bg-[var(--color-bg-card)] border-[var(--color-text-secondary)]' : 'bg-[var(--color-dark-bg-secondary)] border-[var(--color-dark-border)]'}
        `}>
            <div className="flex items-end w-full"> 
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Escribe un mensaje"
                    className={`flex-1 bg-transparent ml-4 border-none outline-none resize-none max-h-32 custom-scrollbar text-base
                        ${theme === 'light' ? 'text-[var(--color-text-main)] placeholder-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text)] placeholder-[var(--color-dark-text-secondary)]'}
                    `} 
                    style={{ scrollbarWidth: 'thin' }}
                />

                <button
                    type="submit"
                    className={`p-2 ml-2 mb-1 rounded-full transition-colors focus:outline-none flex-shrink-0
                        ${inputText.trim()
                            ? 'bg-[var(--color-accent-blue)] hover:bg-blue-600 text-white' // ! Activo
                            : 'hidden cursor-not-allowed' // ! Inactivo
                        }`}
                    disabled={!inputText.trim()}
                >
                    <SendHorizonal className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center w-full mt-2 pl-2"> 
                <button type="button" className={`p-2 rounded-full mr-1.5 focus:outline-none
                    ${theme === 'light' ? 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-main)]' : 'text-[var(--color-dark-text)] hover:bg-[var(--color-dark-bg-tertiary)]'}`}>
                    <Plus className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                    <button type="button" className={`p-2 rounded-full cursor-not-allowed focus:outline-none
                        ${theme === 'light' ? 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-main)]' : 'text-[var(--color-dark-text-secondary)] hover:bg-[var(--color-dark-bg-tertiary)]'}`} title="Video (deshabilitado)">
                        <Video className="w-5 h-5" />
                    </button>
                    <button type="button" className={`p-2 rounded-full cursor-not-allowed focus:outline-none
                        ${theme === 'light' ? 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-main)]' : 'text-[var(--color-dark-text-secondary)] hover:bg-[var(--color-dark-bg-tertiary)]'}`} title="Deep Research (deshabilitado)">
                        <Search className="w-5 h-5" />
                    </button>
                    <button type="button" className={`p-2 rounded-full cursor-not-allowed focus:outline-none
                        ${theme === 'light' ? 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-main)]' : 'text-[var(--color-dark-text-secondary)] hover:bg-[var(--color-dark-bg-tertiary)]'}`} title="Canvas (deshabilitado)">
                        <Image className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </form>
    );
}

export default ChatInput;