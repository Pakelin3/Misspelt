import React, { useState, useRef, useEffect } from 'react';
import useAxios from "@/utils/useAxios";
import { Loader2, X, Bot } from "lucide-react";

export default function OracleChatDictionary({ word, onClose }) {
    // Phases: 'INITIAL' | 'LOADING' | 'ANSWERED_BASE' | 'ANSWERED_EXAMPLES'
    const [chatPhase, setChatPhase] = useState("INITIAL");
    const [messages, setMessages] = useState([
        { role: 'assistant', text: `Saludos aventurero. Soy el Oráculo del Granero. ¿Qué deseas saber sobre la palabra "${word.text}"?` }
    ]);
    const api = useAxios();
    const chatContainerRef = useRef(null);

    const INITIAL_OPTIONS = [
        { type: 'WHAT', label: 'El Qué', desc: 'Significado directo' },
        { type: 'WHY', label: 'El Porqué', desc: 'Lógica o etimología' },
        { type: 'HOW', label: 'El Cómo', desc: 'Estructura y uso' },
        { type: 'WHEN', label: 'El Cuándo', desc: 'Contexto social' }
    ];

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleOptionSelect = async (optionType, label) => {
        if (optionType === 'TEST') {
            // Acción final: Cerrar modal (El juego/quiz real se implementaría más adelante)
            // Aquí cerramos el oráculo invitando a jugar.
            onClose();
            return;
        }

        setMessages(prev => [...prev, { role: 'user', text: label }]);
        setChatPhase("LOADING");

        try {
            const response = await api.post('/game/oracle/', {
                word_id: word.id,
                question_type: optionType
            });

            const oracleText = response.data.response || "Mmm... la magia parece estar confusa en este momento.";

            setMessages(prev => [...prev, { role: 'assistant', text: oracleText }]);

            if (optionType === 'EXAMPLES') {
                setChatPhase("ANSWERED_EXAMPLES");
            } else {
                setChatPhase("ANSWERED_BASE");
            }
        } catch (error) {
            console.error("Error consultando al oráculo:", error);
            setMessages(prev => [...prev, { role: 'assistant', text: "Lo siento, mis visiones están nubladas. Intenta de nuevo más tarde." }]);
            setChatPhase(optionType === 'EXAMPLES' ? "ANSWERED_BASE" : "INITIAL");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[60] p-4" onClick={onClose}>
            <div
                className="relative bg-card pixel-border p-0 md:p-0 max-w-3xl w-full h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between bg-primary p-4 border-b-4 border-foreground shrink-0">
                    <div className="flex items-center gap-3 text-primary-foreground">
                        <div className="w-12 h-12 border-2 border-background overflow-hidden bg-muted flex items-center justify-center">
                            <Bot size={28} className="text-foreground" />
                        </div>
                        <div>
                            <h2 className="font-mono text-xl uppercase tracking-widest font-black text-white">EL ORÁCULO</h2>
                            <p className="text-xs uppercase font-bold text-white/80 font-mono">
                                Explorando: {word.text}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 border-2 text-primary-foreground border-transparent hover:bg-background hover:text-foreground transition-colors"
                        title="Cerrar Oráculo"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Chat Flow */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[url('/grid-pattern.svg')] bg-repeat bg-opacity-10 custom-scrollbar"
                >
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-10 h-10 rounded-none border-2 border-primary bg-primary/20 flex shrink-0 items-center justify-center mt-1">
                                    <Bot size={20} className="text-primary" />
                                </div>
                            )}
                            <div className={`
                                relative max-w-[85%] p-4 border-4 text-sm md:text-base leading-relaxed font-sans
                                ${msg.role === 'user'
                                    ? 'bg-accent text-accent-foreground border-accent-foreground shadow-[-4px_4px_0_0_rgba(0,0,0,1)] text-right'
                                    : 'bg-background text-foreground border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)]'
                                }
                            `}>
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {chatPhase === 'LOADING' && (
                        <div className="flex gap-3 justify-start animate-in fade-in duration-300">
                            <div className="w-10 h-10 rounded-none border-2 border-primary bg-primary/20 flex shrink-0 items-center justify-center mt-1">
                                <Bot size={20} className="text-primary" />
                            </div>
                            <div className="p-4 border-4 bg-background border-foreground flex items-center gap-3 font-mono text-sm shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-muted-foreground">
                                <Loader2 size={18} className="animate-spin text-primary" />
                                BUCANDO RESPUESTA EN LOS ASTROS...
                            </div>
                        </div>
                    )}
                </div>

                {/* Options Panel (Bottom) */}
                <div className="p-4 bg-muted border-t-4 border-foreground shrink-0 min-h-[140px] flex items-center justify-center">
                    {chatPhase === 'INITIAL' && (
                        <div className="grid grid-cols-2 gap-3 w-full animate-in slide-in-from-bottom-2 duration-300">
                            {INITIAL_OPTIONS.map((opt) => (
                                <button
                                    key={opt.type}
                                    onClick={() => handleOptionSelect(opt.type, opt.label)}
                                    className="flex flex-col items-center justify-center p-3 bg-card pixel-border border-4 border-foreground hover:bg-primary hover:text-primary-foreground hover:border-foreground transition-all group font-mono shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none"
                                >
                                    <span className="font-bold text-lg">{opt.label}</span>
                                    <span className="text-xs text-muted-foreground group-hover:text-primary-foreground/80 mt-1">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {chatPhase === 'ANSWERED_BASE' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full animate-in slide-in-from-bottom-2 duration-300">
                            <button
                                onClick={() => handleOptionSelect('EXAMPLES', 'Mostrar Ejemplos')}
                                className="py-4 bg-secondary text-secondary-foreground pixel-border border-4 border-foreground hover:brightness-110 font-mono text-base shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1"
                            >
                                MOSTRAR EJEMPLOS
                            </button>
                            <button
                                onClick={() => handleOptionSelect('TEST', 'Poner a Prueba')}
                                className="py-4 bg-accent text-accent-foreground pixel-border border-4 border-foreground hover:brightness-110 font-mono text-base shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1"
                            >
                                PONER A PRUEBA
                            </button>
                        </div>
                    )}

                    {chatPhase === 'ANSWERED_EXAMPLES' && (
                        <div className="w-full flex justify-center animate-in slide-in-from-bottom-2 duration-300">
                            <button
                                onClick={() => handleOptionSelect('TEST', 'Poner a Prueba')}
                                className="w-full max-w-sm py-4 bg-accent text-accent-foreground pixel-border border-4 border-foreground hover:brightness-110 font-mono text-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1"
                            >
                                ¡MANDARME AL QUIZ!
                            </button>
                        </div>
                    )}

                    {chatPhase === 'LOADING' && (
                        <div className="font-mono text-muted-foreground animate-pulse text-sm text-center">
                            ESPERANDO A LOS ASTROS...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
