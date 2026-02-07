import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Search, Volume2, ChevronLeft, ChevronRight, X, BookOpen } from 'lucide-react';
import Navbar from "@/components/Navbar";
import { BookIcon } from '@/components/PixelIcons';

const baseURL = import.meta.env.VITE_BACKEND_URL_API;

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
    
    // Este estado solo cambiará cuando el usuario deje de escribir
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(""); 
    
    // Modal
    const [selectedWord, setSelectedWord] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const selectedWordRef = useRef(selectedWord);

    useEffect(() => {
        selectedWordRef.current = selectedWord;
    }, [selectedWord]);

    // --- EFECTO DEBOUNCE (La Magia) ---
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms de espera (medio segundo)

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
            // Usamos el término ya procesado (o el que pasemos por argumento)
            const searchParam = currentSearchTerm ? `&search=${currentSearchTerm}` : '';
            const response = await axios.get(`${baseURL}/words/?page=${page}&limit=${wordsPerPage}${typeParam}${searchParam}`);
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
    }, [wordsPerPage, baseURL]);

    // --- EFECTO DE BÚSQUEDA ---
    // OJO: Ahora dependemos de 'debouncedSearchTerm', NO de 'searchTerm'
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

    // Helpers UI
    const getSpanishWordType = (type) => {
        switch (type) {
            case 'PHRASAL_VERB': return 'Phrasal Verb';
            case 'SLANG': return 'Slang';
            default: return 'Palabra';
        }
    };

    const handleCardClick = (word) => {
        setSelectedWord(word);
        setIsModalOpen(true);
    };

    // --- COMPONENTE MODAL INTERNO ---
    const WordDetailModal = () => {
        if (!selectedWord) return null;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                <div 
                    className="relative bg-card pixel-border p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <div className="flex flex-col gap-2 mb-6 border-b-4 border-muted pb-4">
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-[10px] font-mono text-primary-foreground bg-primary pixel-border-primary rounded-sm uppercase`}>
                                {getSpanishWordType(selectedWord.word_type)}
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-mono text-foreground">{selectedWord.text}</h2>
                    </div>

                    <div className="space-y-6 font-sans text-xl">
                        <div className="bg-background p-4 border-2 border-dashed border-muted rounded-sm">
                            <h3 className="font-mono text-xs text-accent mb-2 uppercase">Definición</h3>
                            <p className="text-foreground leading-relaxed">
                                {selectedWord.description}
                            </p>
                        </div>

                        <div>
                            <h3 className="font-mono text-xs text-accent mb-2 uppercase">Ejemplos de Uso</h3>
                            <div className="space-y-2">
                                {selectedWord.examples && selectedWord.examples.length > 0 ? (
                                    selectedWord.examples.map((example, index) => (
                                        <div key={index} className="flex gap-2 text-muted-foreground italic">
                                            <span className="not-italic">example {index + 1}:</span>
                                            <p>"{example}"</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground italic">No hay ejemplos registrados.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-4 border-t-4 border-muted">
                        <button className="flex-1 flex items-center justify-center gap-2 bg-muted text-muted-foreground py-3 font-mono text-xs cursor-not-allowed pixel-border opacity-70">
                            <Volume2 className="w-4 h-4" />
                            PRONUNCIACIÓN
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3 font-mono text-xs pixel-btn pixel-border-accent hover:brightness-110">
                            {/* Nota: Asegúrate de importar BrainIcon si lo usas aquí, o usa otro icono */}
                            CONSULTAR A LA I.A.
                        </button>
                    </div>
                </div>
            </div>
        );
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
                    
                    {/* INPUT DE BÚSQUEDA */}
                    <div className="relative w-full md:max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar palabra..."
                            className="w-full pl-10 pr-4 py-3 bg-background border-2 border-muted focus:border-primary focus:outline-none font-sans text-xl placeholder:text-muted-foreground transition-colors"
                            value={searchTerm}
                            // Aquí actualizamos el estado inmediato (visual)
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {/* Indicador visual de carga mientras escribes (opcional) */}
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
                                    onClick={() => handleCardClick(word)}
                                    className="group bg-card pixel-border p-5 cursor-pointer hover:-translate-y-1 transition-transform relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-2">
                                        <span className={`text-[8px] font-mono px-2 py-1 border border-foreground/20 
                                            ${word.word_type === "PHRASAL_VERB" ? "bg-accent/20 text-accent-foreground" : "bg-secondary/30 text-secondary-foreground"}`}>
                                            {word.word_type === "SLANG" ? "SLG" : "VB"}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-mono text-foreground mb-2 group-hover:text-primary transition-colors">
                                        {word.text}
                                    </h3>
                                    
                                    <p className="text-lg text-muted-foreground font-sans line-clamp-2 leading-tight mb-4">
                                        "{word.description}"
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-muted">
                                        <span className="text-xs font-mono text-muted-foreground opacity-50">CLICK PARA VER</span>
                                        <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
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

            {isModalOpen && <WordDetailModal />}
        </div>
    );
}

export default DictionaryPage;