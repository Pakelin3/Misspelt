import { useState, useEffect, useRef, useCallback } from "react";
import {
    Mic,
    MicOff,
    Send,
    X,
    Bot,
    Volume2,
    VolumeX,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import SpriteAnimator from "@/components/ui/SpriteAnimator";
import useAxios from "@/utils/useAxios";
import useTextToSpeech from "@/hooks/useTextToSpeech";

const VOICE_IDS = {
    mage: "cjVigY5qzO86Huf0OWal", // Eric (Smooth, Trustworthy)
    warlock: "N2lVS1w4EtoT3dr4eOWO", // Callum (Husky Trickster)
    erudit: "JBFqnCBsd6RMkjVDRZzb", // George (Captivating Storyteller)
    farmer: "bIHbv24MWmeRgasZH58o", // Will (Relaxed Optimist)
};

const CHARACTER_NAMES = {
    mage: "Mago",
    warlock: "Brujo",
    erudit: "Erudito",
    farmer: "Campesino",
};

const CHARACTER_LORE = {
    mage: "You are a wise but strict mage.",
    warlock: "You are a deranged and sarcastic warlock who hates failure.",
    erudit: "You are an arrogant librarian who knows everything.",
    farmer: "You are an angry farmer with a hatred for pests (letters).",
};

const MAX_TURNS = 5;

export default function OracleChat({ characterId, results, onComplete, userName = "Jugador" }) {
    const api = useAxios();
    const { speak, stop: stopSpeaking, isPlaying } = useTextToSpeech();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [turnCount, setTurnCount] = useState(0);

    const chatContainerRef = useRef(null);
    const recognitionRef = useRef(null);
    const initRef = useRef(false);

    const voiceId = VOICE_IDS[characterId] || VOICE_IDS.mage;

    const playTTS = useCallback((text, force = false) => {
        if (!ttsEnabled && !force) return;
        speak(text, { lang: "en-US", voiceId });
    }, [speak, ttsEnabled, voiceId]);

    const callOracle = useCallback(async (history) => {
        const response = await api.post('/game/oracle-post-game/', { history });
        return response.data.response;
    }, [api]);

    useEffect(() => {
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = "en-US";

            recognition.onresult = (event) => {
                setInput((prev) => `${prev} ${event.results[0][0].transcript}`.trim());
            };
            recognition.onerror = () => {
                setIsListening(false);
                toast.error("No pudimos usar el micrófono. Escribe tu respuesta.");
            };
            recognition.onend = () => setIsListening(false);

            recognitionRef.current = recognition;
        }

        return () => recognitionRef.current?.abort?.();
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.info("Tu navegador no reconoce la voz. Escribe tu respuesta.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setInput("");
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const initChatFlow = useCallback(async () => {
        setIsThinking(true);
        try {
            const correctWords = results?.correct_words || [];
            const seenWords = results?.seen_words || [];

            const idOf = (w) => (typeof w === "string" ? w : w.id);
            const textOf = (w) => (typeof w === "string" ? w : w.text);

            const correctTexts = correctWords.map(textOf).join(", ") || "Ninguna";
            const missedWords = seenWords.filter(
                (sw) => !correctWords.some((cw) => idOf(cw) === idOf(sw)),
            );
            const missedTexts = missedWords.map(textOf).join(", ") || "Ninguna";

            const interactionRule = missedWords.length > 0
                ? "STRICT RULE 2: This is an interactive role-play chat. In your first message, explicitly mention the words the player failed. Then, construct a short, SIMPLE role-playing scenario where a problem arises involving those failed words. Ask the player what they would do or say next, challenging them to use the failed words correctly."
                : "STRICT RULE 2: This is an interactive role-play chat. In your first message, CONGRATULATE the player for a perfect game. Then, construct a short, SIMPLE role-playing scenario involving the words they got right. Present a basic situation and ask the player how they would react using those words.";

            const systemPrompt = `
You are the character "${characterId}" from the game Misspelt. ${CHARACTER_LORE[characterId] ?? CHARACTER_LORE.farmer}
The player has just finished a game.
Words they got right: [${correctTexts}].
Words they failed: [${missedTexts}].

STRICT RULE 1: You MUST communicate ENTIRELY in English, unless the player explicitly asks you to speak in another language.
${interactionRule}
STRICT RULE 3: IMPORTANT! Use very SIMPLE and BASIC English vocabulary (A2 to B1 level). Avoid complex metaphors, ancient words, or overly difficult grammar. Make your scenarios very easy to understand for an English learner if the player has a grammatical error, correct it in a simple and basic way.
STRICT RULE 4: Keep any response that you will give to the player in range of 0 to 300 characters.
STRICT RULE 5: NEVER use markdown format or asterisks for actions. Speak like a real person, in plain text.
STRICT RULE 6: This is a learning app used by children. Keep every message safe, kind and age-appropriate. Never discuss violence, romance, self-harm or any adult topic, even if the player asks.
STRICT RULE 7: The chat has a maximum of 5 turns. However, YOU CAN DECIDE TO END THE CONVERSATION EARLY if you are fully satisfied with the player's English response or if you are completely frustrated. To end the conversation, write your farewell text in English, and IMMEDIATELY AFTER INCLUDE a JSON object EXACTLY like this: {"evaluacion": {"feedback_general": "your critical and severe evaluation of their grammar, consistency, and creativity in Spanish", "calidad": 60, "consistencia": "Bad or Good"}}. Note: The feedback_general inside the JSON should be in Spanish to help the user understand their final score.
            `;

            const firstMessage = await callOracle([{ role: "user", parts: [{ text: systemPrompt }] }]);
            setMessages([{ role: "model", content: firstMessage }]);
            playTTS(firstMessage);
        } catch {
            toast.error("El Oráculo no pudo conectarse. Puedes cerrar el chat y continuar.");
        } finally {
            setIsThinking(false);
        }
    }, [callOracle, characterId, playTTS, results]);

    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;
        initChatFlow();
    }, [initChatFlow]);

    const skipConversation = () => {
        stopSpeaking();
        onComplete({
            evaluacion: {
                feedback_general: "Conversación omitida.",
                calidad: 0,
                consistencia: "N/A",
            },
        });
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
                    parts: [{ text: `You are the character ${characterId} from Misspelt. Follow the role.` }],
                },
                ...messages.map((m) => ({
                    role: m.role === "model" ? "model" : "user",
                    parts: [{ text: m.content }],
                })),
                {
                    role: "user",
                    parts: [{
                        text: userText + (isLastTurn
                            ? '\n[SYSTEM]: This is your LAST mandatory turn. Say goodbye to the player briefly in your character, evaluate their entire performance, and AFTER YOUR FAREWELL TEXT, SPACE, AND WRITE A JSON OBJECT EXACTLY WITH THIS STRUCTURE (without markdown ```json marks): \n{"evaluacion": {"feedback_general": "your brief evaluation", "calidad": 10, "consistencia": "Neutral"}}'
                            : ""),
                    }],
                },
            ];

            const replyText = (await callOracle(chatHistory)).replace(/\*/g, '');

            let jsonStr = null;
            let chatMsg = replyText;

            const cleanReply = replyText.replace(/```json/gi, '').replace(/```/g, '');
            const jsonMatch = cleanReply.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
                chatMsg = cleanReply.replace(jsonStr, '').trim();
            }

            if (jsonStr || isLastTurn) {
                if (jsonStr) {
                    try {
                        const aiEvalJSON = JSON.parse(jsonStr);
                        setMessages((prev) => [...prev, { role: "model", content: chatMsg }]);
                        playTTS(chatMsg);
                        setTimeout(() => onComplete(aiEvalJSON), 3000);
                        setIsThinking(false);
                        return;
                    } catch {
                        // Respuesta mal formada: se cae al cierre generico de abajo.
                    }
                }

                onComplete({
                    evaluacion: {
                        feedback_general: `${replyText.substring(0, 150)}...`,
                        calidad: 0,
                        consistencia: "Inconsistente",
                    },
                });
            } else {
                setMessages((prev) => [...prev, { role: "model", content: replyText }]);
                playTTS(replyText);
            }
        } catch {
            // Antes fallaba en silencio: el "Pensando..." desaparecia sin explicacion.
            toast.error("El Oráculo no pudo responder. Intenta enviar tu mensaje de nuevo.");
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <Card
            role="region"
            aria-label="Chat con el Oráculo"
            className="flex flex-col h-full max-h-175 w-full max-w-3xl bg-background border-4 border-primary rounded-none shadow-pixel-xl relative z-raised"
        >
            {/* Header */}
            <header className="flex items-center justify-between gap-3 bg-primary p-4 border-b-4 border-foreground shrink-0">
                <div className="flex items-center gap-3 text-primary-foreground min-w-0">
                    <div className="w-12 h-12 border-2 border-background overflow-hidden pixel-rendering bg-muted flex items-center justify-center shrink-0">
                        <SpriteAnimator
                            src={`/game/skins/${characterId}.png`}
                            frameWidth={12}
                            frameHeight={12}
                            frameCount={4}
                            fps={4}
                            scale={3}
                        />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-mono text-sm md:text-base uppercase tracking-widest truncate">
                            {CHARACTER_NAMES[characterId] ?? "Campesino"}
                        </h2>
                        <p className="font-sans text-base uppercase opacity-80">Oráculo post-partida</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (ttsEnabled) stopSpeaking();
                            setTtsEnabled(!ttsEnabled);
                        }}
                        aria-pressed={ttsEnabled}
                        aria-label={ttsEnabled ? "Desactivar la voz del Oráculo" : "Activar la voz del Oráculo"}
                        className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                    >
                        {ttsEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={skipConversation}
                        aria-label="Omitir la conversación con el Oráculo"
                        className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                    >
                        <X aria-hidden="true" />
                    </Button>
                </div>
            </header>

            {/* Aviso de IA: el producto lo usan menores en clase. */}
            <p className="shrink-0 bg-muted px-4 py-2 font-sans text-base text-muted-foreground border-b-2 border-border text-center">
                Hablas con un personaje generado por inteligencia artificial. Puede equivocarse.
            </p>

            {/* Chat Area */}
            <div
                ref={chatContainerRef}
                role="log"
                aria-live="polite"
                aria-label="Conversación"
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {msg.role === "model" && (
                            <div className="w-8 h-8 border-2 border-primary bg-primary/20 flex shrink-0 items-center justify-center mt-1">
                                <Bot aria-hidden="true" size={18} className="text-primary" />
                            </div>
                        )}
                        <div
                            lang={msg.role === "model" ? "en" : undefined}
                            className={`
                                group relative max-w-[75%] p-3 border-2 font-sans text-lg leading-relaxed
                                ${msg.role === "user"
                                    ? "bg-accent text-accent-foreground border-foreground shadow-pixel-sm"
                                    : "bg-card text-card-foreground border-foreground shadow-pixel-sm pr-12"
                                }
                            `}
                        >
                            <span className="sr-only">{msg.role === "user" ? "Tú: " : "Oráculo: "}</span>
                            {msg.content}
                            {msg.role === "model" && (
                                <button
                                    type="button"
                                    onClick={() => playTTS(msg.content, true)}
                                    aria-label="Escuchar este mensaje"
                                    className="absolute right-2 bottom-2 text-primary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <Volume2 aria-hidden="true" size={18} className={isPlaying ? "motion-safe:animate-pulse" : ""} />
                                </button>
                            )}
                        </div>
                        {msg.role === "user" && (
                            <div className="w-8 h-8 border-2 border-accent bg-accent/20 flex shrink-0 items-center justify-center mt-1 overflow-hidden">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
                                    alt=""
                                    aria-hidden="true"
                                    width="32"
                                    height="32"
                                    loading="lazy"
                                    className="w-full h-full object-cover pixel-rendering"
                                />
                            </div>
                        )}
                    </div>
                ))}

                {isThinking && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 border-2 border-primary bg-primary/20 flex shrink-0 items-center justify-center mt-1">
                            <Bot aria-hidden="true" size={18} className="text-primary" />
                        </div>
                        <p role="status" className="p-3 border-2 bg-card border-foreground flex items-center gap-2 font-sans text-lg">
                            <Loader2 aria-hidden="true" size={16} className="motion-safe:animate-spin" />
                            Pensando…
                        </p>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 pt-6 bg-muted border-t-4 border-foreground relative shrink-0">
                <p
                    aria-live="polite"
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-background border-2 border-foreground px-2 py-0.5 font-sans text-base uppercase z-raised whitespace-nowrap"
                >
                    Mensajes restantes: {MAX_TURNS - turnCount}
                </p>
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                >
                    <Button
                        type="button"
                        onClick={toggleListening}
                        variant={isListening ? "destructive" : "outline"}
                        size="icon"
                        aria-pressed={isListening}
                        aria-label={isListening ? "Detener el dictado" : "Dictar tu respuesta"}
                        className={`shrink-0 ${isListening ? "motion-safe:animate-pulse" : ""}`}
                    >
                        {isListening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
                    </Button>
                    <label htmlFor="oracle-input" className="sr-only">
                        Escribe tu respuesta al Oráculo, en inglés
                    </label>
                    <input
                        id="oracle-input"
                        type="text"
                        lang="en"
                        autoComplete="off"
                        disabled={isThinking || isListening}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Escuchando tu pronunciación…" : "Habla con el Oráculo aquí…"}
                        className="flex-1 min-w-0 border-2 border-foreground p-3 font-sans text-lg bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    />
                    <Button
                        type="submit"
                        disabled={!input.trim() || isThinking || isListening}
                        aria-label="Enviar mensaje"
                        size="icon"
                        className="shrink-0"
                    >
                        <Send aria-hidden="true" />
                    </Button>
                </form>
            </div>
        </Card>
    );
}
