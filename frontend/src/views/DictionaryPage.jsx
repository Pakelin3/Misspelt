import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAxios from "@/utils/useAxios";
import { PixelBookOpenIcon, PixelLockIcon, PixelSearchIcon, PixelChevronIcon } from '@/components/PixelIcons';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import OracleChatDictionary from "@/components/dictionary/OracleChatDictionary";
import WordSuggestionModal from "@/components/dictionary/WordSuggestionModal";
import WordDetailModal from "@/components/dictionary/WordDetailModal";
import { getTypeBadgeStyle, getTypeBadgeText } from "@/lib/wordTypes";



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
    const [isOracleOpen, setIsOracleOpen] = useState(false);
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

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
    const fetchWords = useCallback(async (page, currentSearchTerm, currentSelectedFilter, shouldResetSelectedWord = false, signal) => {
        setLoading(true);
        setError(null);
        try {
            const typeParam = currentSelectedFilter !== "all" ? `&word_type=${currentSelectedFilter.toUpperCase().replace(' ', '_')}` : '';
            const searchParam = currentSearchTerm ? `&search=${currentSearchTerm}` : '';
            const response = await api.get(`/words/?page=${page}&limit=${wordsPerPage}${typeParam}${searchParam}`, { signal });
            const fetchedWords = response.data.results || [];
            setWords(fetchedWords);
            setTotalWordsCount(response.data.count || 0);

            if (shouldResetSelectedWord || !selectedWordRef.current || !fetchedWords.some(word => word.id === selectedWordRef.current.id)) {
                if (shouldResetSelectedWord) setSelectedWord(null);
            }

        } catch (err) {
            // Una peticion cancelada no es un error que deba ver el usuario.
            if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
            console.error("Error fetching words:", err);
            setError("No pudimos cargar el diccionario. Revisa tu conexión e inténtalo de nuevo.");
            setWords([]);
            setTotalWordsCount(0);
        } finally {
            setLoading(false);
        }
    }, [wordsPerPage, api]);

    const startTutorial = useCallback(() => {
        const driverObj = driver({
            popoverClass: 'misspelt-driver-popover pixel-rendering',
            showProgress: true,
            animate: true,
            doneBtnText: '¡A Leer!',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            steps: [
                {
                    element: '#tutorial-dict-controls',
                    popover: {
                        title: 'Encuentra lo que buscas',
                        description: 'Usa la barra para buscar palabras específicas o el menú desplegable para filtrar tu colección por categorías (Jergas, Verbos Frasales, etc.).'
                    }
                },
                {
                    element: '#tutorial-dict-grid',
                    popover: {
                        title: 'Tu Biblioteca',
                        description: 'Aquí se registran todas las palabras. Las tarjetas iluminadas son las que ya dominas; las que están en gris y borrosas aún debes descubrirlas jugando.'
                    }
                },
                {
                    element: '#tutorial-dict-pagination',
                    popover: {
                        title: 'Navegación',
                        description: 'A medida que tu vocabulario crezca, usa estos controles para explorar todas las páginas de tu diccionario.'
                    }
                }
            ],
            onDestroyStarted: () => {
                localStorage.setItem('misspelt_has_seen_dictionary_tour', 'true');
                driverObj.destroy();
            }
        });

        driverObj.drive();
    }, []);

    useEffect(() => {
        if (!loading && !error) {
            const hasSeenTour = localStorage.getItem('misspelt_has_seen_dictionary_tour');
            if (!hasSeenTour) {
                // Pequeño retraso para dejar que React monte el grid completo primero
                setTimeout(() => {
                    startTutorial();
                }, 500);
            }
        }
    }, [loading, error, startTutorial]);

    // --- EFECTO DE BÚSQUEDA ---
    useEffect(() => {
        const controller = new AbortController();
        setCurrentPage(1);
        fetchWords(1, debouncedSearchTerm, selectedFilter, true, controller.signal);
        return () => controller.abort();
    }, [debouncedSearchTerm, selectedFilter, fetchWords]);

    useEffect(() => {
        if (currentPage <= 0) return;
        const controller = new AbortController();
        fetchWords(currentPage, debouncedSearchTerm, selectedFilter, false, controller.signal);
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, fetchWords]);


    const totalPages = Math.ceil(totalWordsCount / wordsPerPage);

    const openModal = (word) => {
        setSelectedWord(word);
        setIsModalOpen(true);
    };

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const filterOptions = [
        { id: "all", label: "TODO", activeClass: "bg-primary text-primary-foreground border-foreground", badgeClass: "text-foreground" },
        { id: "VOCABULARY", label: "VOCABULARIO", activeClass: "bg-word-verb text-primary-foreground border-foreground", badgeClass: "text-word-verb" },
        { id: "SLANG", label: "JERGAS", activeClass: "bg-word-slang text-accent-foreground border-foreground", badgeClass: "text-word-slang" },
        { id: "PHRASAL_VERB", label: "VERBOS FRASALES", activeClass: "bg-word-noun text-info-foreground border-foreground", badgeClass: "text-word-noun" },
        { id: "IDIOM", label: "MODISMOS", activeClass: "bg-word-adjective text-primary-foreground border-foreground", badgeClass: "text-word-adjective" }
    ];

    const currentFilterObj = filterOptions.find(f => f.id === selectedFilter) || filterOptions[0];

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">

            <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:py-12 mt-16">

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-card pixel-border mb-4">
                        <PixelBookOpenIcon className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-mono text-foreground mb-2">EL GRIMORIO</h1>
                    <p className="text-xl text-muted-foreground font-sans max-w-lg mx-auto">
                        Consulta tu colección de conocimientos adquiridos en la granja.
                    </p>
                </div>

                <div id="tutorial-dict-controls" className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-card/50 p-4 pixel-border">

                    <div className="relative w-full group">
                        <PixelSearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar palabra..."
                            className="w-full pl-10 pr-4 py-3 bg-background border-2 border-muted focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-sans text-xl placeholder:text-muted-foreground transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm !== debouncedSearchTerm && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <span className="block w-2 h-2 bg-primary rounded-full animate-ping"></span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsSuggestionModalOpen(true)}
                        className="px-6 py-3 bg-accent text-accent-foreground font-mono text-sm md:text-base font-bold whitespace-nowrap shadow-pixel-md hover:translate-y-[2px] transition-all border-2 border-transparent hover:border-foreground"
                    >
                        + SUGERIR PALABRA
                    </button>

                    <div className="relative min-w-[180px]">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`w-full flex items-center justify-between px-4 py-3 font-mono text-xs md:text-sm border-2 uppercase transition-all shadow-pixel-md ${currentFilterObj.activeClass}`}
                        >
                            <span className="font-bold">{currentFilterObj.label}</span>
                            <PixelChevronIcon className={`w-4 h-4 transition-transform duration-200 ${isFilterOpen ? '' : '-rotate-90'}`} />
                        </button>

                        {isFilterOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-foreground shadow-pixel-md z-20 flex flex-col animate-in slide-in-from-top-2 duration-200">
                                {filterOptions.map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => {
                                            setSelectedFilter(filter.id);
                                            setIsFilterOpen(false);
                                        }}
                                        className={`px-4 py-3 font-mono text-xs text-left uppercase hover:bg-muted transition-colors border-b-2 border-transparent hover:border-muted flex items-center gap-2
                                            ${selectedFilter === filter.id ? "bg-muted font-bold text-primary" : "text-foreground font-medium"}
                                        `}
                                    >
                                        <span className={`w-2 h-2 rounded-none inline-block ${filter.id === "all" ? "bg-primary" : `bg-current ${filter.badgeClass}`}`}></span>
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div id="tutorial-dict-grid" className="min-h-[400px]">
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
                        <div className="text-center p-12 bg-card pixel-border border-dashed space-y-3">
                            {debouncedSearchTerm || selectedFilter !== 'all' ? (
                                <>
                                    <p className="text-foreground font-sans text-2xl">Nada coincide con tu búsqueda.</p>
                                    <p className="text-muted-foreground font-sans text-lg">Prueba con otra palabra o quita los filtros.</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-foreground font-sans text-2xl">Tu diccionario está vacío por ahora.</p>
                                    <p className="text-muted-foreground font-sans text-lg">
                                        Juega una partida para descubrir tus primeras palabras.
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {words.map((word) => (
                                <button
                                    type="button"
                                    key={word.id}
                                    onClick={() => word.is_unlocked && openModal(word)}
                                    disabled={!word.is_unlocked}
                                    aria-label={word.is_unlocked
                                        ? `Ver la palabra ${word.text}`
                                        : `${word.text} — bloqueada. Descúbrela jugando para poder leerla.`}
                                    className={`
            group bg-card pixel-border p-5 text-left transition-transform relative overflow-hidden
            focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2
            ${word.is_unlocked
                                            ? 'cursor-pointer hover:-translate-y-1'
                                            : 'grayscale opacity-60 cursor-not-allowed'
                                        }
        `}
                                >
                                    <div className="absolute top-0 right-0 p-2">
                                        <span className={`text-3xs md:text-3xs font-mono px-1.5 py-0.5 md:px-2 md:py-1 border-2 font-bold shadow-pixel-sm ${getTypeBadgeStyle(word.word_type)}`}>
                                            {getTypeBadgeText(word.word_type)}
                                        </span>
                                    </div>

                                    <h3 className={`text-2xl font-mono text-foreground mt-4 mb-2 break-words transition-colors ${word.is_unlocked ? 'group-hover:text-primary' : ''}`}>
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
                                            <PixelBookOpenIcon aria-hidden="true" className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                        ) : (
                                            <PixelLockIcon aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {!loading && words.length > 0 && totalPages > 1 && (
                    <div id="tutorial-dict-pagination" className="flex justify-center items-center gap-4 mt-12">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-3 bg-card pixel-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                        >
                            <PixelChevronIcon className="w-6 h-6 rotate-90" />
                        </button>

                        <div className="px-6 py-3 bg-card pixel-border font-mono text-xs">
                            PÁGINA {currentPage} DE {totalPages}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-3 bg-card pixel-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                        >
                            <PixelChevronIcon className="w-6 h-6 -rotate-90" />
                        </button>
                    </div>
                )}
            </div>

            {isModalOpen && <WordDetailModal word={selectedWord} onClose={() => setIsModalOpen(false)} onOpenOracle={() => { setIsModalOpen(false); setIsOracleOpen(true); }} />}

            {isOracleOpen && <OracleChatDictionary word={selectedWord} onClose={() => setIsOracleOpen(false)} />}

            {isSuggestionModalOpen && <WordSuggestionModal onClose={() => setIsSuggestionModalOpen(false)} />}

            {/* Floating Tutorial Button */}
            <button
                onClick={startTutorial}
                className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-accent-foreground pixel-border flex items-center justify-center text-2xl hover:scale-110 transition-transform z-dropdown shadow-pixel-md hover:shadow-pixel-lg"
                title="Ver Tutorial de Nuevo"
            >
                <span className="font-mono text-3xl pb-1">?</span>
            </button>
        </div>
    );
}

export default DictionaryPage;
