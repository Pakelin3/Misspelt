import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Volume2, ChevronLeft, ChevronRight, X, BookOpen, Lock } from 'lucide-react';
import useAxios from "@/utils/useAxios";
import Navbar from "@/components/Navbar";
import { BookIcon } from '@/components/PixelIcons';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';


export const getTypeBadgeStyle = (type) => {
    switch (type) {
        case 'SLANG': return 'bg-yellow-100 text-yellow-800 border-yellow-800';
        case 'PHRASAL_VERB': return 'bg-blue-100 text-blue-800 border-blue-800';
        case 'IDIOM': return 'bg-purple-100 text-purple-800 border-purple-800';
        case 'VOCABULARY': return 'bg-emerald-100 text-emerald-800 border-emerald-800';
        default: return 'bg-gray-100 text-gray-800 border-gray-800';
    }
};

export const getTypeBadgeText = (type) => {
    switch (type) {
        case 'SLANG': return 'SLANG';
        case 'PHRASAL_VERB': return 'PHRASAL VERB';
        case 'IDIOM': return 'IDIOM';
        case 'VOCABULARY': return 'VOCABULARIO';
        default: return 'PALABRA';
    }
};

function DictionaryPage() {
    // Estados
    const [words, setWords] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalWordsCount, setTotalWordsCount] = useState(0);
    const wordsPerPage = 9;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filtros y Búsqueda
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    // Modal
    const [selectedWord, setSelectedWord] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const selectedWordRef = useRef(selectedWord);
    const api = useAxios();
    useEffect(() => {
        selectedWordRef.current = selectedWord;
    }, [selectedWord]);

    // --- EFECTO DEBOUNCE ---
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    // --- LÓGICA DE FETCH ---
    const fetchWords = useCallback(async (page, currentSearchTerm, currentSelectedFilter, shouldResetSelectedWord = false) => {
        setLoading(true);
        setError(null);
        try {
            const typeParam = currentSelectedFilter !== "all" ? `&word_type=${currentSelectedFilter.toUpperCase().replace(' ', '_')}` : '';
            const searchParam = currentSearchTerm ? `&search=${currentSearchTerm}` : '';
            const response = await api.get(`/words/?page=${page}&limit=${wordsPerPage}${typeParam}${searchParam}`);
            const fetchedWords = response.data.results || [];
            setWords(fetchedWords);
            setTotalWordsCount(response.data.count || 0);

            if (shouldResetSelectedWord || !selectedWordRef.current || !fetchedWords.some(word => word.id === selectedWordRef.current.id)) {
                if (shouldResetSelectedWord) setSelectedWord(null);
            }

        } catch (err) {
            console.error("Error fetching words:", err);
            setError("No se pudo conectar con la biblioteca.");
            setWords([]);
            setTotalWordsCount(0);
        } finally {
            setLoading(false);
        }
    }, [wordsPerPage]);

    // --- EFECTO DE BÚSQUEDA ---
    useEffect(() => {
        setCurrentPage(1);
        fetchWords(1, debouncedSearchTerm, selectedFilter, true);
    }, [debouncedSearchTerm, selectedFilter, fetchWords]);

    useEffect(() => {
        if (currentPage > 0) {
            fetchWords(currentPage, debouncedSearchTerm, selectedFilter, false);
        }
    }, [currentPage, fetchWords]);


    const totalPages = Math.ceil(totalWordsCount / wordsPerPage);

    const openModal = (word) => {
        setSelectedWord(word);
        setIsModalOpen(true);
    };



    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <Navbar />

            <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:py-12 mt-16">

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-card pixel-border mb-4">
                        <BookIcon className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-mono text-foreground mb-2">GRAN DICCIONARIO</h1>
                    <p className="text-xl text-muted-foreground font-sans max-w-lg mx-auto">
                        Consulta tu colección de conocimientos adquiridos en la granja.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-card/50 p-4 pixel-border">

                    <div className="relative w-full md:max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar palabra..."
                            className="w-full pl-10 pr-4 py-3 bg-background border-2 border-muted focus:border-primary focus:outline-none font-sans text-xl placeholder:text-muted-foreground transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm !== debouncedSearchTerm && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <span className="block w-2 h-2 bg-primary rounded-full animate-ping"></span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                        {[
                            { id: "all", label: "TODO" },
                            { id: "SLANG", label: "JERGA" },
                            { id: "PHRASAL_VERB", label: "VERBOS" }
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setSelectedFilter(filter.id)}
                                className={`px-4 py-2 font-mono text-[10px] transition-all
                                    ${selectedFilter === filter.id
                                        ? "bg-primary text-primary-foreground pixel-border-primary"
                                        : "bg-background text-foreground border-2 border-transparent hover:bg-muted hover:border-muted"
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
                            <p className="font-mono text-xs text-muted-foreground animate-pulse">CARGANDO LIBROS...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center p-8 bg-destructive/10 pixel-border border-destructive">
                            <p className="text-destructive font-mono text-xs mb-2">ERROR DE CONEXIÓN</p>
                            <p className="text-foreground font-sans text-xl">{error}</p>
                        </div>
                    ) : words.length === 0 ? (
                        <div className="text-center p-12 bg-card pixel-border border-dashed">
                            <p className="text-muted-foreground font-sans text-2xl">No se encontraron resultados.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {words.map((word) => (
                                <div
                                    key={word.id}
                                    onClick={() => word.is_unlocked && openModal(word)}

                                    className={`
            group bg-card pixel-border p-5 transition-transform relative overflow-hidden
            ${word.is_unlocked
                                            ? 'cursor-pointer hover:-translate-y-1'
                                            : 'grayscale opacity-60 cursor-not-allowed'
                                        }
        `}
                                >
                                    <div className="absolute top-0 right-0 p-2">
                                        <span className={`text-[8px] md:text-[9px] font-mono px-1.5 py-0.5 md:px-2 md:py-1 border-2 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${getTypeBadgeStyle(word.word_type)}`}>
                                            {getTypeBadgeText(word.word_type)}
                                        </span>
                                    </div>

                                    <h3 className={`text-2xl font-mono text-foreground mt-3 mb-2 break-words transition-colors ${word.is_unlocked ? 'group-hover:text-primary' : ''}`}>
                                        {word.text}
                                    </h3>
                                    <p className={`text-lg text-muted-foreground font-sans line-clamp-2 leading-tight mb-4 ${!word.is_unlocked ? 'blur-[3px] select-none' : ''}`}>
                                        "{word.definition}"
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-muted">
                                        <span className="text-xs font-mono text-muted-foreground opacity-50">
                                            {word.is_unlocked ? "CLICK PARA VER" : "BLOQUEADO"}
                                        </span>


                                        {word.is_unlocked ? (
                                            <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                        ) : (
                                            <Lock className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!loading && words.length > 0 && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-12">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-3 bg-card pixel-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        <div className="px-6 py-3 bg-card pixel-border font-mono text-xs">
                            PÁGINA {currentPage} DE {totalPages}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-3 bg-card pixel-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </div>

            {isModalOpen && <WordDetailModal word={selectedWord} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
}

export default DictionaryPage;


const WordDetailModal = ({ word, onClose }) => {

    const [voices, setVoices] = useState([]);
    const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

    useEffect(() => {
        const updateVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };

        updateVoices();

        window.speechSynthesis.onvoiceschanged = updateVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    if (!word) return null;

    const playPronunciation = async (text) => {
        console.log("🔊 Solicitando audio a IA (ElevenLabs SDK):", text);

        try {
            const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
            if (!apiKey) {
                throw new Error("API Key no encontrada");
            }

            const elevenlabs = new ElevenLabsClient({
                apiKey: apiKey
            });

            // ID de voz por defecto (Rachel), puedes cambiarlo en ElevenLabs
            const voiceId = "21m00Tcm4TlvDq8ikWAM";

            const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
                text: text,
                model_id: "eleven_multilingual_v2", // Actualizado a v2 según el doc
                output_format: "mp3_44100_128",
            });

            const chunks = [];
            for await (const chunk of audioStream) {
                chunks.push(chunk);
            }
            const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.playbackRate = 0.55;
            audio.onplay = () => console.log("▶️ Reproduciendo IA de ElevenLabs SDK...");
            audio.onended = () => {
                console.log("⏹️ Audio finalizado.");
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();

        } catch (error) {
            console.error("❌ Error en ElevenLabs TTS, activando Plan B (Nativo):", error);

            // ==========================================
            // FALLBACK: API Nativa si ElevenLabs falla
            // ==========================================
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'en-US';
                utterance.rate = 0.85;

                const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
                const englishVoice = availableVoices.find(v => v.lang === 'en-US') || availableVoices.find(v => v.lang.includes('en'));
                if (englishVoice) utterance.voice = englishVoice;

                window.currentUtterance = utterance;
                utterance.onend = () => delete window.currentUtterance;

                window.speechSynthesis.speak(utterance);
            }
        }
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div
                className="relative bg-card pixel-border p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
                >
                    <X className="w-8 h-8" />
                </button>

                <div className="flex items-center justify-between gap-2 mb-6 border-b-4 border-muted pb-4">
                    <h2 className="text-3xl md:text-4xl font-mono text-foreground">{word.text}</h2>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-[10px] mr-8 rounded-none font-mono border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase font-bold ${getTypeBadgeStyle(word.word_type)}`}>
                            {getTypeBadgeText(word.word_type)}
                        </span>
                    </div>
                </div>

                <div className="space-y-6 font-sans text-xl">
                    <div className="bg-background p-4 border-2 border-dashed border-muted rounded-sm">
                        <h3 className="font-mono text-xs text-accent mb-2 uppercase">Definición</h3>
                        <p className="text-foreground leading-relaxed">
                            {word.definition}
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-mono text-xs text-accent uppercase">Ejemplos de Uso</h3>
                            {word.examples && word.examples.length > 1 && (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setCurrentExampleIndex(prev => prev > 0 ? prev - 1 : word.examples.length - 1)}
                                        className="flex items-center gap-3 bg-card text-foreground p-1 hover:bg-primary hover:text-primary-foreground font-mono text-sm pixel-border pixel-btn no-underline"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="font-mono text-xs text-muted-foreground w-8 text-center">
                                        {currentExampleIndex + 1}/{word.examples.length}
                                    </span>
                                    <button
                                        onClick={() => setCurrentExampleIndex(prev => prev < word.examples.length - 1 ? prev + 1 : 0)}
                                        className="flex items-center gap-3 bg-card text-foreground p-1 hover:bg-primary hover:text-primary-foreground font-mono text-sm pixel-border pixel-btn no-underline"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 min-h-[80px] flex items-center justify-center bg-muted/20 p-4 border-2 border-dashed border-muted rounded-sm">
                            {word.examples && word.examples.length > 0 ? (
                                <div className="text-sm w-full animate-in fade-in zoom-in-95 duration-300" key={currentExampleIndex}>
                                    {typeof word.examples[currentExampleIndex] === 'object' ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                🇺🇸
                                                <p className="text-gray-800 text-base leading-relaxed"> {word.examples[currentExampleIndex].en}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                🇻🇪
                                                <p className="text-gray-500 italic text-base leading-relaxed"> {word.examples[currentExampleIndex].es}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-gray-600 text-lg leading-relaxed">{word.examples[currentExampleIndex]}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No hay ejemplos disponibles para esta palabra.</p>
                            )}
                        </div>
                    </div>

                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-4 border-t-4 border-muted">
                    <button
                        onClick={() => playPronunciation(word.text)}
                        className="flex items-center gap-2 p-2 bg-muted/50 hover:bg-primary hover:text-primary-foreground border-2 border-foreground transition-colors pixel-btn"
                        title="Escuchar pronunciación">
                        <Volume2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        PRONUNCIACIÓN
                    </button>

                    <button className="flex-1 flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3 font-mono text-xs pixel-btn pixel-border-accent hover:brightness-110">
                        CONSULTAR A LA I.A.
                    </button>
                </div>
            </div>
        </div>
    );
};