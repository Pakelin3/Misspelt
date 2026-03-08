import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Mic,
    MicOff,
    Send,
    X,
    User as UserIcon,
    Bot,
    Volume2,
    VolumeX,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import SpriteAnimator from "@/components/ui/SpriteAnimator";

const LLM_API_KEY =
    import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEU;
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

const VOICE_IDS = {
    mage: "GBv7mTt0atIp3Br8iCZE", // Thomas
    warlock: "ErXwobaYiN019PkySvjV", // Antoni
    erudit: "21m00Tcm4TlvDq8ikWAM", // Rachel
    farmer: "TxGEqnHWrfWFTfGW9XjX", // Josh
};

export default function OracleChat({ characterId, results, onComplete, userName = "Jugador" }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(true);
    const [turnCount, setTurnCount] = useState(0);

    const chatContainerRef = useRef(null);
    const recognitionRef = useRef(null);
    const audioRef = useRef(new Audio());
    const initRef = useRef(false);

    const MAX_TURNS = 5;

    useEffect(() => {
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
            const SpeechRecognition =
                window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = "en-US";

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput((prev) => prev + " " + transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setInput("");
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!initRef.current) {
            initRef.current = true;
            initChatFlow();
        }

        return () => {
            if (audio) {
                audio.pause();
                audio.src = "";
            }
        };
    }, []);

    const initChatFlow = async () => {
        setIsThinking(true);
        try {
            const correctWords = results?.correct_words || [];
            const seenWords = results?.seen_words || [];

            const correctTexts =
                correctWords
                    .map((w) => (typeof w === "string" ? w : w.text))
                    .join(", ") || "Ninguna";
            const missedWords = seenWords.filter(
                (sw) =>
                    !correctWords.some(
                        (cw) =>
                            (typeof cw === "string" ? cw : cw.id) ===
                            (typeof sw === "string" ? sw : sw.id),
                    ),
            );
            const missedTexts =
                missedWords
                    .map((w) => (typeof w === "string" ? w : w.text))
                    .join(", ") || "Ninguna";

            const characterLore =
                characterId === "mage"
                    ? "Eres un mago sabio pero estricto."
                    : characterId === "warlock"
                        ? "Eres un brujo desquiciado y sarcástico que odia el fracaso."
                        : characterId === "erudit"
                            ? "Eres un bibliotecario arrogante que todo lo sabe."
                            : "Eres un campesino enojado con las plagas (letras).";

            const systemPrompt = `
Eres el personaje "${characterId}" del juego Misspelt. ${characterLore}
El jugador acaba de terminar una partida. 
Palabras que acertó: [${correctTexts}]. 
Palabras que falló: [${missedTexts}].

REGLA ESTRICTA 1: Solo te puedes comunicar en inglés.
REGLA ESTRICTA 2: Este es un chat interactivo. Para empezar, crea un escenario corto de rol presentándote y ES OBLIGATORIO que en tu primer mensaje le digas al jugador explícitamente cuáles fueron las palabras que falló (Menciónalas claramente). Luego, pídele al jugador que cree UNA ÚNICA oración en inglés que contenga una de esas palabras que falló. 
REGLA ESTRICTA 3: Mantén tus respuestas extremadamente cortas (máximo 3 líneas).
REGLA ESTRICTA 4: NUNCA uses formato markdown, ni asteriscos para acciones (ej. *suspira*). Habla como una persona real, en texto plano.
            `;

            const firstMessage = await callGeminiAPI([
                { role: "user", parts: [{ text: systemPrompt }] },
            ]);

            setMessages([{ role: "model", content: firstMessage }]);
            playTTS(firstMessage);
        } catch (error) {
            console.error(error);
            toast.error("El oráculo no ha podido conectarse con la trama mágica.");
        } finally {
            setIsThinking(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isThinking) return;

        const userText = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userText }]);
        setIsThinking(true);

        const isLastTurn = turnCount >= MAX_TURNS - 1;
        setTurnCount((prev) => prev + 1);

        try {
            const chatHistory = [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Eres el personaje ${characterId} de Misspelt. Sigue el rol.`,
                        },
                    ],
                },
                ...messages.map((m) => ({
                    role: m.role === "model" ? "model" : "user",
                    parts: [{ text: m.content }],
                })),
                {
                    role: "user",
                    parts: [
                        {
                            text:
                                userText +
                                (isLastTurn
                                    ? '\n[SISTEMA]: Este es tu ÚLTIMO turno obligatorio. Despídete del jugador brevemente en tu personaje, evalúa toda su actuación, y LUEGO DE TU TEXTO DE DESPEDIDA, ESPACIO, Y ESCRIBE UN OBJETO JSON EXACTAMENTE CON ESTA ESTRUCTURA (sin marcas markdown de \`\`\`json): \n{"evaluacion": {"feedback_general": "tu evaluación breve", "calidad": 85, "consistencia": "Buena"}}'
                                    : ""),
                        },
                    ],
                },
            ];

            let replyText = await callGeminiAPI(chatHistory);
            replyText = replyText.replace(/\*/g, '');

            if (isLastTurn) {
                try {
                    const cleanReplyNoBlocks = replyText.replace(/```json/gi, '').replace(/```/g, '');
                    const jsonMatch = cleanReplyNoBlocks.match(/\{[\s\S]*\}/);

                    if (jsonMatch) {
                        const jsonStr = jsonMatch[0];
                        const chatMsg = cleanReplyNoBlocks.replace(jsonStr, '').trim();

                        const aiEvalJSON = JSON.parse(jsonStr);

                        setMessages((prev) => [
                            ...prev,
                            { role: "model", content: chatMsg },
                        ]);
                        await playTTS(chatMsg);

                        setTimeout(() => {
                            onComplete(aiEvalJSON);
                        }, 3000);

                        setIsThinking(false);
                        return;
                    }
                } catch (e) {
                    console.error("Error parseando el JSON devuelto por la IA:", e);
                }

                // Fallback si no mandó un JSON válido
                onComplete({
                    evaluacion: {
                        feedback_general: replyText.substring(0, 150) + "...",
                        calidad: 0,
                        consistencia: "Desconocida",
                    },
                });
            } else {
                setMessages((prev) => [...prev, { role: "model", content: replyText }]);
                playTTS(replyText);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsThinking(false);
        }
    };

    const callGeminiAPI = async (history) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: history }),
        });

        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        return rawText.replace(/\*/g, '');
    };

    const playTTS = async (text) => {
        if (!ttsEnabled || !ELEVENLABS_API_KEY) return;

        try {
            const voiceId = VOICE_IDS[characterId] || VOICE_IDS["mage"];
            const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": ELEVENLABS_API_KEY,
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
                }),
            });

            if (!response.ok) throw new Error("TTS Error");

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            audioRef.current.pause();
            audioRef.current.src = audioUrl;
            audioRef.current.play();
        } catch (err) {
            console.error("No se pudo reproducir TTS:", err);
        }
    };

    return (
        <Card className="flex flex-col h-[700px] w-full max-w-3xl bg-background border-4 border-primary rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative z-50">
            {/* Header */}
            <div className="flex items-center justify-between bg-primary p-4 border-b-4 border-foreground">
                <div className="flex items-center gap-3 text-primary-foreground">
                    <div className="w-12 h-12 border-2 border-background overflow-hidden pixel-rendering bg-muted bg-[url('/stone-pattern.png')] bg-cover flex items-end justify-center">
                        <div className="scale-[2.5] origin-bottom pb-2">
                            <SpriteAnimator
                                spriteSheet={`/game/skins/${characterId}.png`}
                                frameWidth={16}
                                frameHeight={16}
                                fps={6}
                                scale={1}
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="font-black text-xl uppercase tracking-widest">
                            {characterId === "mage"
                                ? "Mago"
                                : characterId === "warlock"
                                    ? "Brujo"
                                    : characterId === "erudit"
                                        ? "Erudito"
                                        : "Campesino"}
                        </h2>
                        <p className="text-xs uppercase font-bold opacity-80">
                            Oráculo Post-Partida
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTtsEnabled(!ttsEnabled)}
                        className="p-2 border-2 text-primary-foreground border-transparent hover:border-background transition-colors"
                        title={ttsEnabled ? "Voz Activada" : "Voz Desactivada"}
                    >
                        {ttsEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                    </button>
                    {/* Botón de skip directo por si el usuario se desespera */}
                    <button
                        onClick={() =>
                            onComplete({
                                evaluacion: {
                                    feedback_general: "Conversación omitida.",
                                    calidad: 0,
                                    consistencia: "N/A",
                                },
                            })
                        }
                        className="p-2 border-2 text-primary-foreground border-transparent hover:bg-background hover:text-foreground transition-colors"
                        title="Omitir Oráculo"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('/grid-pattern.svg')] bg-repeat bg-opacity-20"
            >
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {msg.role === "model" && (
                            <div className="w-8 h-8 rounded-none border-2 border-primary bg-primary/20 flex shrink-0 items-center justify-center mt-1">
                                <Bot size={18} className="text-primary" />
                            </div>
                        )}
                        <div
                            className={`
                            max-w-[75%] p-3 border-2 text-sm md:text-base leading-relaxed
                            ${msg.role === "user"
                                    ? "bg-accent text-accent-foreground border-accent-foreground shadow-[-2px_2px_0_0_rgba(0,0,0,1)]"
                                    : "bg-background text-foreground border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                                }
                        `}
                        >
                            {msg.content}
                        </div>
                        {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-none border-2 border-accent bg-accent/20 flex shrink-0 items-center justify-center mt-1 overflow-hidden">
                                <img src={`https://ui-avatars.com/api/?name=${userName}&background=random`} alt="User" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                ))}

                {isThinking && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-none border-2 border-primary bg-primary/20 flex shrink-0 items-center justify-center mt-1">
                            <Bot size={18} className="text-primary" />
                        </div>
                        <div className="p-3 border-2 bg-background border-foreground flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" /> Pensando...
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-muted border-t-4 border-foreground relative">
                <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 bg-background border-2 border-foreground px-2 py-0.5 text-[14px] font-bold uppercase z-10">
                    Mensajes Restantes: {MAX_TURNS - turnCount}
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={toggleListening}
                        variant="outline"
                        size="icon"
                        className={`shrink-0 border-2 rounded-none h-12 w-12 ${isListening ? "bg-red-500 text-white border-red-700 animate-pulse" : "border-foreground hover:bg-background"}`}
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </Button>
                    <input
                        type="text"
                        disabled={isThinking || isListening}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder={
                            isListening
                                ? "Escuchando tu pronunciación..."
                                : "Habla con el Oráculo aquí..."
                        }
                        className="flex-1 border-2 border-foreground p-3 text-sm bg-background font-sans focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                    />
                    <Button
                        disabled={!input.trim() || isThinking || isListening}
                        onClick={handleSend}
                        className="shrink-0 rounded-none h-12 px-6 pixel-btn bg-primary text-primary-foreground border-2 border-transparent shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:translate-y-[2px] disabled:shadow-none transition-all"
                    >
                        <Send size={18} />
                    </Button>
                </div>
            </div>
        </Card>
    );
}
