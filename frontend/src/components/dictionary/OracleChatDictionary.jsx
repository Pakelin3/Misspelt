import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Bot } from "lucide-react";
import useAxios from "@/utils/useAxios";
import AuthContext from '@/context/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

const INITIAL_OPTIONS = [
    { type: 'WHAT', label: 'El Qué', desc: 'Significado directo' },
    { type: 'WHY', label: 'El Porqué', desc: 'Lógica o etimología' },
    { type: 'HOW', label: 'El Cómo', desc: 'Estructura y uso' },
    { type: 'WHEN', label: 'El Cuándo', desc: 'Contexto social' },
];

export default function OracleChatDictionary({ word, onClose }) {
    // Phases: 'INITIAL' | 'LOADING' | 'ANSWERED_BASE' | 'ANSWERED_EXAMPLES'
    const [chatPhase, setChatPhase] = useState("INITIAL");
    const [messages, setMessages] = useState([
        { role: 'assistant', text: `Saludos aventurero. Soy el Oráculo del Granero. ¿Qué deseas saber sobre la palabra "${word.text}"?` },
    ]);

    const api = useAxios();
    const chatContainerRef = useRef(null);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, chatPhase]);

    const handleOptionSelect = async (optionType, label) => {
        if (optionType === 'TEST') {
            onClose();
            navigate('/quiz', { state: { selectedWord: word } });
            return;
        }

        setMessages((prev) => [...prev, { role: 'user', text: label }]);
        setChatPhase("LOADING");

        try {
            const response = await api.post('/game/oracle/', {
                word_id: word.id,
                question_type: optionType,
            });

            const oracleText = response.data.response || "Mmm... la magia parece estar confusa en este momento.";
            setMessages((prev) => [...prev, { role: 'assistant', text: oracleText }]);
            setChatPhase(optionType === 'EXAMPLES' ? "ANSWERED_EXAMPLES" : "ANSWERED_BASE");
        } catch (error) {
            console.error("Error consultando al oráculo:", error);
            setMessages((prev) => [...prev, {
                role: 'assistant',
                text: "No pude responder ahora mismo. Vuelve a intentarlo en unos segundos.",
            }]);
            setChatPhase(optionType === 'EXAMPLES' ? "ANSWERED_BASE" : "INITIAL");
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl h-[80dvh] flex flex-col p-0 md:p-0 overflow-hidden" showCloseButton={false}>
                {/* Header */}
                <DialogHeader className="flex-row items-center justify-between gap-3 bg-primary p-4 border-b-4 border-foreground border-none mb-0 pr-4 shrink-0">
                    <div className="flex items-center gap-3 text-primary-foreground min-w-0">
                        <div className="w-12 h-12 border-2 border-background bg-muted flex items-center justify-center shrink-0">
                            <Bot aria-hidden="true" size={28} className="text-foreground" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-primary-foreground text-base md:text-xl tracking-widest">
                                El Oráculo
                            </DialogTitle>
                            <DialogDescription className="text-primary-foreground/80 font-sans text-base">
                                Explorando: <span lang="en">{word.text}</span>
                            </DialogDescription>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Cerrar el Oráculo"
                        className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground shrink-0"
                    >
                        <span aria-hidden="true" className="font-mono text-base">✕</span>
                    </Button>
                </DialogHeader>

                {/* Aviso de IA: el producto lo usan menores en clase. */}
                <p className="shrink-0 bg-muted px-4 py-2 font-sans text-base text-muted-foreground border-b-2 border-border text-center">
                    Las respuestas las genera una inteligencia artificial y pueden contener errores.
                </p>

                {/* Chat Flow */}
                <div
                    ref={chatContainerRef}
                    role="log"
                    aria-live="polite"
                    aria-label="Respuestas del Oráculo"
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
                >
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-10 h-10 border-2 border-primary bg-primary/20 flex shrink-0 items-center justify-center mt-1">
                                    <Bot aria-hidden="true" size={20} className="text-primary" />
                                </div>
                            )}
                            <div className={`
                                relative max-w-[85%] p-4 border-4 text-lg leading-relaxed font-sans
                                ${msg.role === 'user'
                                    ? 'bg-accent text-accent-foreground border-foreground shadow-pixel-md-left text-right'
                                    : 'bg-background text-foreground border-foreground shadow-pixel-md'
                                }
                            `}>
                                <span className="sr-only">{msg.role === 'user' ? 'Tú: ' : 'Oráculo: '}</span>
                                {msg.text}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-10 h-10 border-2 border-accent bg-accent/20 flex shrink-0 items-center justify-center mt-1 overflow-hidden shadow-pixel-sm-left">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'Aventurero')}&background=random`}
                                        alt=""
                                        aria-hidden="true"
                                        width="40"
                                        height="40"
                                        loading="lazy"
                                        className="w-full h-full object-cover pixel-rendering"
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    {chatPhase === 'LOADING' && (
                        <div className="flex gap-3 justify-start motion-safe:animate-in motion-safe:fade-in duration-300">
                            <div className="w-10 h-10 border-2 border-primary bg-primary/20 flex shrink-0 items-center justify-center mt-1">
                                <Bot aria-hidden="true" size={20} className="text-primary" />
                            </div>
                            <p role="status" className="p-4 border-4 bg-background border-foreground flex items-center gap-3 font-sans text-lg shadow-pixel-md text-muted-foreground">
                                <Loader2 aria-hidden="true" size={18} className="motion-safe:animate-spin text-primary" />
                                Consultando al Oráculo…
                            </p>
                        </div>
                    )}
                </div>

                {/* Options Panel (Bottom) */}
                <div className="p-4 bg-muted border-t-4 border-foreground shrink-0 min-h-35 flex items-center justify-center">
                    {chatPhase === 'INITIAL' && (
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 w-full">
                            {INITIAL_OPTIONS.map((opt) => (
                                <button
                                    type="button"
                                    key={opt.type}
                                    onClick={() => handleOptionSelect(opt.type, opt.label)}
                                    className="flex min-h-16 flex-col items-center justify-center p-3 bg-card pixel-border border-4 border-foreground hover:bg-primary hover:text-primary-foreground transition-all group font-mono shadow-pixel-md pixel-btn focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <span className="text-2xs md:text-xs">{opt.label}</span>
                                    <span className="font-sans text-base text-muted-foreground group-hover:text-primary-foreground/80 mt-1">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {chatPhase === 'ANSWERED_BASE' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <Button variant="secondary" size="lg" onClick={() => handleOptionSelect('EXAMPLES', 'Mostrar ejemplos')}>
                                Mostrar ejemplos
                            </Button>
                            {/* El salto al quiz saca al usuario del contexto de la palabra,
                                asi que el texto avisa de que se va a otra pantalla. */}
                            <Button variant="accent" size="lg" onClick={() => handleOptionSelect('TEST', 'Practicar en el quiz')}>
                                Practicar esta palabra
                            </Button>
                        </div>
                    )}

                    {chatPhase === 'ANSWERED_EXAMPLES' && (
                        <div className="w-full flex flex-col items-center gap-3">
                            <Button variant="accent" size="lg" className="w-full max-w-sm" onClick={() => handleOptionSelect('TEST', 'Practicar en el quiz')}>
                                Practicar esta palabra
                            </Button>
                            <Button variant="link" onClick={onClose}>
                                Volver al diccionario
                            </Button>
                        </div>
                    )}

                    {chatPhase === 'LOADING' && (
                        <p className="font-sans text-lg text-muted-foreground text-center">
                            Un momento…
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
