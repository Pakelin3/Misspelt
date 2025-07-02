import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Search, Github, Heart, Volume2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Link } from 'react-router-dom';

const baseURL = import.meta.env.VITE_BACKEND_URL_API;

function DictionaryPage() {
    const { theme } = useTheme();
    const [words, setWords] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalWordsCount, setTotalWordsCount] = useState(0);
    const wordsPerPage = 6;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedWord, setSelectedWord] = useState(null);
    const selectedWordRef = useRef(selectedWord);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef(null); 

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        selectedWordRef.current = selectedWord;
    }, [selectedWord]);

    const fetchWords = useCallback(async (page, currentSearchTerm, currentSelectedFilter, shouldResetSelectedWord = false) => {
        setLoading(true);
        setError(null);
        try {
            const typeParam = currentSelectedFilter !== "all" ? `&word_type=${currentSelectedFilter.toUpperCase().replace(' ', '_')}` : '';
            const searchParam = currentSearchTerm ? `&search=${currentSearchTerm}` : '';
            const response = await axios.get(`${baseURL}/words/?page=${page}&limit=${wordsPerPage}${typeParam}${searchParam}`);

            const fetchedWords = response.data.results || [];
            setWords(fetchedWords);
            setTotalWordsCount(response.data.count || 0);

            if (shouldResetSelectedWord || !selectedWordRef.current || !fetchedWords.some(word => word.id === selectedWordRef.current.id)) {
                setSelectedWord(fetchedWords.length > 0 ? fetchedWords[0] : null);
            }

        } catch (err) {
            console.error("Error fetching words:", err);
            setError("No se pudieron cargar las palabras. Inténtalo de nuevo más tarde.");
            setWords([]);
            setTotalWordsCount(0);
            setSelectedWord(null);
        } finally {
            setLoading(false);
        }
    }, [wordsPerPage, setSelectedWord, baseURL]);

    useEffect(() => {
        setCurrentPage(1);
        fetchWords(1, searchTerm, selectedFilter, true);
    }, [searchTerm, selectedFilter, fetchWords]);

    useEffect(() => {
        if (currentPage > 0) {
            fetchWords(currentPage, searchTerm, selectedFilter, false);
        }
    }, [currentPage, searchTerm, selectedFilter, fetchWords]);

    const totalPages = Math.ceil(totalWordsCount / wordsPerPage);

    const getSpanishWordType = (type) => {
        switch (type) {
            case 'PHRASAL_VERB':
                return 'Verbo frasal';
            case 'SLANG':
                return 'Jerga';
            case 'all':
                return 'Todos';
            default:
                return 'Desconocido';
        }
    };

    const handleFilterSelect = (filterType) => {
        setSelectedFilter(filterType);
        setIsFilterDropdownOpen(false);
    };

    const handleCardClick = (word) => {
        setSelectedWord(word);
    };

    return (
        <div className="min-h-screen bg-[var(--color-body-bg)] p-4">
            <div className="max-w-7xl min-h-max mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)] w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar jerga, verbo frasal o descripción..."
                            className={`w-full pl-10 pr-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:border-transparent
                                ${theme === 'light'
                                    ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                    : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                                }`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative" ref={filterDropdownRef}>
                        <button
                            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors cursor-pointer
                                ${theme === 'light'
                                    ? 'bg-neutral-200 text-[var(--color-text-main)] hover:bg-neutral-300'
                                    : 'bg-[var(--color-dark-bg-secondary)] text-[var(--color-dark-text-secondary)] hover:bg-[var(--color-dark-bg-tertiary)]'
                                }`}
                        >
                            <span>Filtros: {getSpanishWordType(selectedFilter)}</span>
                            <svg
                            className={`w-5 h-5 transition-transform duration-300 ${isFilterDropdownOpen ? 'rotate-180' : 'rotate-0'}
                                ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                            ></path>
                        </svg>
                        </button>

                        {isFilterDropdownOpen && (
                            <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 p-1
                                ${theme === 'light' ? 'bg-[var(--color-bg-card)]' : 'bg-[var(--color-dark-bg-secondary)]'}`}>
                                <div
                                    onClick={() => handleFilterSelect("SLANG")}
                                    className={`block px-4 py-2 text-sm cursor-pointer transition-colors rounded-t-lg
                                        ${selectedFilter === "SLANG"
                                            ? (theme === 'light' ? 'bg-[var(--color-accent-slangs)] text-white' : 'bg-[var(--color-accent-slangs)] text-white')
                                            : (theme === 'light' ? ' text-[var(--color-text-main)] hover:bg-[var(--color-accent-slangs)]/80 hover:text-white' :  'text-[var(--color-dark-text)]  hover:bg-[var(--color-accent-slangs)]/80')
                                        }`}>
                                    Jergas
                                </div>
                                <div
                                    onClick={() => handleFilterSelect("PHRASAL_VERB")}
                                    className={`block px-4 py-2 text-sm cursor-pointer transition-colors
                                        ${selectedFilter === "PHRASAL_VERB"
                                            ? (theme === 'light' ? 'bg-[var(--color-accent-phrasalverbs)] text-[var(--color-bg-body)]' : 'bg-[var(--color-accent-phrasalverbs)] text-black')
                                            : (theme === 'light' ? 'text-[var(--color-text-main)] hover:bg-[var(--color-accent-phrasalverbs)]' : 'text-[var(--color-dark-text)] hover:bg-[var(--color-accent-phrasalverbs)] hover:text-black')
                                        }`}>
                                    Verbos frasales
                                </div>
                                <div
                                    onClick={() => handleFilterSelect("all")}
                                    className={`block px-4 py-2 text-sm cursor-pointer transition-colors rounded-b-lg
                                        ${selectedFilter === "all"
                                            ? (theme === 'light' ? 'bg-neutral-300 text-[var(--color-bg-body)' : 'bg-neutral-700 text-white')
                                            : (theme === 'light' ? 'text-[var(--color-text-main)] hover:bg-neutral-200' : 'text-[var(--color-dark-text)] hover:bg-neutral-700')
                                        }`}>
                                    Todos
                                </div>
                            </div>
                        )}
                    </div>

                    <a href="https://github.com/pakelin3" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 justify-items-end bg-[var(--color-text)] text-[var(--color-bg-body)] px-4 py-2
                        rounded-full hover:bg-[var(--color-text-secondary)] transition-colors dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                        <Github className="w-4 h-4" />
                        GitHub
                    </a>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 shadow-2xl rounded-3xl p-6 bg-[var(--color-bg-card)]">
                        <div className={`rounded-3xl p-6 relative
                            ${theme === 'light' ? 'bg-teal-200' : 'bg-[var(--color-dark-bg-main)]'}`}>
                            {loading && (
                                <div className={`absolute inset-0 bg-opacity-75 min-h-max flex items-center justify-center rounded-3xl z-10
                                    ${theme === 'light' ? 'bg-[var(--color-bg-main)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
                                    <p className="text-[var(--color-text)] text-lg font-bold">Cargando palabras...</p>
                                </div>
                            )}

                            {error ? (
                                <p className="text-center text-red-700 text-lg">{error}</p>
                            ) : words.length === 0 && !loading ? (
                                <p className="text-center text-[var(--color-text-secondary)] text-lg">No se encontraron palabras con los filtros aplicados.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {words.map((word) => (
                                        <div
                                            key={word.id}
                                            className={`${theme === 'light' ? 'bg-[var(--color-bg-main)]' : 'bg-[var(--color-dark-bg-secondary)]'} rounded-2xl gap-4 p-4 cursor-pointer hover:shadow-lg transition-shadow justify-between flex flex-col`}
                                            onClick={() => handleCardClick(word)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <h3 className="text-xl font-bold text-[var(--color-text-main)] mb-1">{word.text}</h3>
                                                <span
                                                    className={`inline-block px-3 py-1 whitespace-pre rounded-full text-xs font-medium ${word.word_type === "PHRASAL_VERB"
                                                        ? "bg-[var(--color-accent-phrasalverbs)] text-[var(--color-bg-body)]"
                                                        : "bg-[var(--color-accent-slangs)] text-[var(--color-bg-body)]"
                                                        } dark:${word.word_type === "PHRASAL_VERB"
                                                            ? "bg-[var(--color-accent-phrasalverbs)] text-black"
                                                            : "bg-[var(--color-accent-slangs)] text-white"
                                                        }`}
                                                >
                                                    {getSpanishWordType(word.word_type)}
                                                </span>
                                            </div>
                                            <p className="text-[var(--color-text-secondary)] text-sm mb-4 italic">"{word.description}"</p>
                                            <div className="flex items-center justify-between">
                                                <button className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-[var(--color-bg-main)]' : 'hover:bg-[var(--color-dark-bg-tertiary)]'}`}>
                                                    <Heart className="w-5 h-5 text-[var(--color-text-secondary)] dark:text-gray-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {!loading && words.length > 0 && totalPages > 1 && (
                            <div className="flex justify-center items-center space-x-2 mt-6">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-full bg-[var(--color-bg-main)] text-[var(--color-text-main)] hover:bg-[var(--color-bg-secondary)]
                                        disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[var(--color-dark-bg-tertiary)] dark:text-[var(--color-dark-text)] dark:hover:bg-[var(--color-dark-border)]"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                                    <button
                                        key={pageNumber}
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={`px-4 py-2 rounded-full font-medium transition-colors
                                            ${currentPage === pageNumber
                                                ? (theme === 'light'
                                                    ? "bg-[var(--color-bg-secondary)] text-[var(--color-text)]"
                                                    : "bg-[var(--color-bg-secondary)] text-white")
                                                : (theme === 'light'
                                                    ? "bg-[var(--color-bg-main)] text-[var(--color-text-main)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-body-bg)]"
                                                    : "bg-[var(--color-dark-bg-secondary)] text-[var(--color-dark-text-secondary)] hover:bg-[var(--color-dark-bg-tertiary)]")
                                            }`}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-full bg-[var(--color-bg-main)] text-[var(--color-text-main)] hover:bg-[var(--color-bg-secondary)]
                                        disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[var(--color-dark-bg-tertiary)] dark:text-[var(--color-dark-text)] dark:hover:bg-[var(--color-dark-border)]"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        {selectedWord ? (
                            <div className="bg-[var(--color-bg-card)] flex flex-col justify-between shadow-2xl rounded-3xl p-6 sticky top-4 h-full">
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-[var(--color-text-main)]">{selectedWord.text}</h2>
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${selectedWord.word_type === "PHRASAL_VERB"
                                                ? "bg-[var(--color-accent-phrasalverbs)] text-[var(--color-bg-body)]"
                                                : "bg-[var(--color-accent-slangs)] text-[var(--color-bg-body)]"
                                                } dark:${selectedWord.word_type === "PHRASAL_VERB"
                                                    ? "bg-[var(--color-accent-phrasalverbs)] text-black"
                                                    : "bg-[var(--color-accent-slangs)] text-white"
                                                }`}
                                        >
                                            {getSpanishWordType(selectedWord.word_type)}
                                        </span>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2">Definición:</h3>
                                            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                                                {selectedWord.description}
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2">Ejemplos:</h3>
                                            <div className="space-y-3">
                                                {selectedWord.examples && selectedWord.examples.length > 0 ? (
                                                    selectedWord.examples.map((example, index) => (
                                                        <p key={index} className="text-[var(--color-text-secondary)] text-sm">
                                                            "{example}"
                                                        </p>
                                                    ))
                                                ) : (
                                                    <p className="text-[var(--color-text-secondary)] text-sm italic">No hay ejemplos disponibles.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2">Sustitutos:</h3>
                                            <div className="space-y-2">
                                                {selectedWord.substitutes && selectedWord.substitutes.length > 0 ? (
                                                    selectedWord.substitutes.map((substituteText, index) => (
                                                        <p key={index} className="text-[var(--color-text-secondary)] text-sm">
                                                            "{substituteText}"
                                                        </p>
                                                    ))
                                                ) : (
                                                    <p className="text-[var(--color-text-secondary)] text-sm italic">No hay sustitutos disponibles.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button className="flex flex-1 justify-center items-center gap-3 cursor-not-allowed bg-[var(--color-bg-tertiary)] text-white py-3 rounded-full
                                        font-semibold hover:bg-[var(--color-bg-tertiary)]/60 transition-colors text-center">
                                        <Volume2 className="w-4 h-4" />
                                        <span>Escuchar</span>
                                    </button>
                                    <Link
                                        to="/IA"
                                        className={`
                                            flex-1 cursor-pointer bg-[var(--color-bg-tertiary)] text-white py-3 rounded-full
                                            font-semibold hover:bg-[var(--color-bg-tertiary)]/60 transition-colors text-center flex justify-center items-center gap-2
                                        `}
                                    >Consultar I.A</Link>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[var(--color-bg-card)] rounded-3xl p-6 sticky top-4 text-center text-[var(--color-text-secondary)]">
                                <p>Selecciona una palabra para ver los detalles.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DictionaryPage;