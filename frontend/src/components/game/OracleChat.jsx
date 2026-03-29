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
import useAxios from "@/utils/useAxios";

const LLM_API_KEY =
    import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEU;
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

const VOICE_IDS = {
    mage: "cjVigY5qzO86Huf0OWal", // Eric (Smooth, Trustworthy)
    warlock: "N2lVS1w4EtoT3dr4eOWO", // Callum (Husky Trickster)
    erudit: "JBFqnCBsd6RMkjVDRZzb", // George (Captivating Storyteller)
    farmer: "bIHbv24MWmeRgasZH58o", // Will (Relaxed Optimist)
};

export default function OracleChat({ characterId, results, onComplete, userName = "Jugador" }) {
    const api = useAxios();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(false);
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
                    ? "You are a wise but strict mage."
                    : characterId === "warlock"
                        ? "You are a deranged and sarcastic warlock who hates failure."
                        : characterId === "erudit"
                            ? "You are an arrogant librarian who knows everything."
                            : "You are an angry farmer with a hatred for pests (letters).";

            const hasMissed = missedWords.length > 0;
            const interactionRule = hasMissed
                ? "STRICT RULE 2: This is an interactive role-play chat. In your first message, explicitly mention the words the player failed. Then, construct a short, SIMPLE role-playing scenario where a problem arises involving those failed words. Ask the player what they would do or say next, challenging them to use the failed words correctly."
                : "STRICT RULE 2: This is an interactive role-play chat. In your first message, CONGRATULATE the player for a perfect game. Then, construct a short, SIMPLE role-playing scenario involving the words they got right. Present a basic situation and ask the player how they would react using those words.";

            const systemPrompt = `
You are the character "${characterId}" from the game Misspelt. ${characterLore}
The player has just finished a game.
Words they got right: [${correctTexts}].
Words they failed: [${missedTexts}].

STRICT RULE 1: You MUST communicate ENTIRELY in English, unless the player explicitly asks you to speak in another language.
${interactionRule}
STRICT RULE 3: IMPORTANT! Use very SIMPLE and BASIC English vocabulary (A2 to B1 level). Avoid complex metaphors, ancient words, or overly difficult grammar. Make your scenarios very easy to understand for an English learner if the player has a grammatical error, correct it in a simple and basic way.
STRICT RULE 4: Keep any response that you will give to the player in range of 0 to 300 characters.
STRICT RULE 5: NEVER use markdown format or asterisks for actions. Speak like a real person, in plain text.
STRICT RULE 6: The chat has a maximum of 5 turns. However, YOU CAN DECIDE TO END THE CONVERSATION EARLY if you are fully satisfied with the player's English response or if you are completely frustrated. To end the conversation, write your farewell text in English, and IMMEDIATELY AFTER INCLUDE a JSON object EXACTLY like this: {"evaluacion": {"feedback_general": "your critical and severe evaluation of their grammar, consistency, and creativity in Spanish", "calidad": 60, "consistencia": "Bad or Good"}}. Note: The feedback_general inside the JSON should be in Spanish to help the user understand their final score.
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
                            text: `You are the character ${characterId} from Misspelt. Follow the role.`,
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
                                    ? '\n[SYSTEM]: This is your LAST mandatory turn. Say goodbye to the player briefly in your character, evaluate their entire performance, and AFTER YOUR FAREWELL TEXT, SPACE, AND WRITE A JSON OBJECT EXACTLY WITH THIS STRUCTURE (without markdown \`\`\`json marks): \n{"evaluacion": {"feedback_general": "your brief evaluation", "calidad": 10, "consistencia": "Neutral"}}'
                                    : ""),
                        },
                    ],
                },
            ];

            let replyText = await callGeminiAPI(chatHistory);
            replyText = replyText.replace(/\*/g, '');

            let jsonStr = null;
            let chatMsg = replyText;

            try {
                const cleanReplyNoBlocks = replyText.replace(/```json/gi, '').replace(/```/g, '');
                const jsonMatch = cleanReplyNoBlocks.match(/\{[\s\S]*\}/);

                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                    chatMsg = cleanReplyNoBlocks.replace(jsonStr, '').trim();
                }
            } catch (e) {
                console.error("Error parseando regex:", e);
            }

            if (jsonStr || isLastTurn) {
                if (jsonStr) {
                    try {
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
                    } catch (e) {
                        console.error("Error parseando el JSON devuelto por la IA:", e);
                    }
                }

                onComplete({
                    evaluacion: {
                        feedback_general: replyText.substring(0, 150) + "...",
                        calidad: Math.floor(Math.random() * 40),
                        consistencia: "Inconsistente",
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
        const response = await api.post('/game/oracle-post-game/', { history });
        return response.data.response;
    };

    const playTTS = async (text, force = false) => {
        if ((!ttsEnabled && !force) || !ELEVENLABS_API_KEY) return;

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
                    <div className="w-12 h-12 border-2 border-background overflow-hidden pixel-rendering bg-muted bg-[url('/stone-pattern.png')] bg-cover flex items-center justify-center">
                        <SpriteAnimator
                            src={`/public/game/skins/${characterId}.png`}
                            frameWidth={12}
                            frameHeight={12}
                            frameCount={4}
                            fps={4}
                            scale={3}
                        />
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
                    <button
                        onClick={() => {
                            if (audioRef.current) {
                                audioRef.current.pause();
                                audioRef.current.src = "";
                            }
                            onComplete({
                                evaluacion: {
                                    feedback_general: "Conversación omitida.",
                                    calidad: 0,
                                    consistencia: "N/A",
                                },
                            });
                        }}
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
                            group relative max-w-[75%] p-3 border-2 text-sm md:text-base leading-relaxed
                            ${msg.role === "user"
                                    ? "bg-accent text-accent-foreground border-accent-foreground shadow-[-2px_2px_0_0_rgba(0,0,0,1)]"
                                    : "bg-background text-foreground border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)] pr-10"
                                }
                        `}
                        >
                            {msg.content}
                            {msg.role === "model" && ELEVENLABS_API_KEY && (
                                <button
                                    onClick={() => playTTS(msg.content, true)}
                                    className="absolute right-2 bottom-2 text-primary hover:text-primary/70 transition-colors"
                                    title="Reproducir Voz"
                                >
                                    <Volume2 size={16} />
                                </button>
                            )}
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
