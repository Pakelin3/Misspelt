import React, { useState, useEffect, useCallback, useRef } from 'react'; // Importamos useRef
import axios from 'axios';
import { Search, Github, Heart, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';

const baseURL = "http://127.0.0.1:8000/api";

function DictionaryPage() {
    // Estados para los datos y la paginación
    const [words, setWords] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalWordsCount, setTotalWordsCount] = useState(0);
    const wordsPerPage = 6;

    // Estados para carga y errores
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para filtro y búsqueda
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Estado para la palabra seleccionada en el sidebar
    const [selectedWord, setSelectedWord] = useState(null);
    // **NUEVO**: Ref para almacenar el valor más reciente de selectedWord
    const selectedWordRef = useRef(selectedWord);

    // **NUEVO**: useEffect para mantener el ref actualizado con el estado
    useEffect(() => {
        selectedWordRef.current = selectedWord;
    }, [selectedWord]);


    // Función para obtener las palabras de la API con paginación, búsqueda y filtro
    // **CAMBIO**: selectedWord YA NO es una dependencia de useCallback.
    // Accedemos a su valor a través de selectedWordRef.current
    const fetchWords = useCallback(async (page, currentSearchTerm, currentSelectedFilter) => {
        setLoading(true);
        setError(null);
        try {
            const typeParam = currentSelectedFilter !== "all" ? `&word_type=${currentSelectedFilter.toUpperCase().replace(' ', '_')}` : '';
            const searchParam = currentSearchTerm ? `&search=${currentSearchTerm}` : '';
            const response = await axios.get(`${baseURL}/words/?page=${page}&limit=${wordsPerPage}${typeParam}${searchParam}`);

            const fetchedWords = response.data.results || [];
            setWords(fetchedWords);
            setTotalWordsCount(response.data.count || 0);

            // **CAMBIO**: Usamos selectedWordRef.current para la lógica
            const currentSelectedWordAtCallTime = selectedWordRef.current;

            if (page === 1 && fetchedWords.length > 0) {
                // Si es la primera página y hay palabras, selecciona la primera.
                setSelectedWord(fetchedWords[0]);
            } else if (currentSelectedWordAtCallTime) {
                // Si ya había una palabra seleccionada, verifica si sigue en la lista actual.
                const currentWordStillExists = fetchedWords.some(word => word.id === currentSelectedWordAtCallTime.id);
                if (!currentWordStillExists) {
                    // Si no está, selecciona la primera de la nueva lista o null si no hay ninguna.
                    setSelectedWord(fetchedWords.length > 0 ? fetchedWords[0] : null);
                }
                // Si currentWordStillExists es true, no hacemos nada, la palabra seleccionada permanece.
            } else if (fetchedWords.length > 0) {
                // Si no había palabra seleccionada y hay nuevas palabras, selecciona la primera.
                setSelectedWord(fetchedWords[0]);
            } else {
                // Si no hay palabras, deselecciona.
                setSelectedWord(null);
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
    }, [wordsPerPage, setSelectedWord]); // **CAMBIO**: selectedWord REMOVED, setSelectedWord (setter) ADDED (es una función estable)


    // Efecto para la carga inicial y para cuando cambian los filtros/término de búsqueda
    // Resetea la página a 1 y vuelve a cargar las palabras
    useEffect(() => {
        setCurrentPage(1); // Siempre resetear a la página 1 en un nuevo filtro/búsqueda
        // **fetchWords es ahora una función estable, por lo que no causará re-renderizados innecesarios aquí**
        fetchWords(1, searchTerm, selectedFilter);
    }, [searchTerm, selectedFilter, fetchWords]);

    // Efecto para cargar nuevas palabras cuando la página actual cambia (por los controles de paginación)
    useEffect(() => {
        if (currentPage > 0) {
            // **fetchWords es ahora una función estable, por lo que no causará re-renderizados innecesarios aquí**
            fetchWords(currentPage, searchTerm, selectedFilter);
        }
    }, [currentPage, searchTerm, selectedFilter, fetchWords]);


    // Calcula el número total de páginas
    const totalPages = Math.ceil(totalWordsCount / wordsPerPage);

    // Función para mapear el tipo de palabra a texto en español
    const getSpanishWordType = (type) => {
        switch (type) {
            case 'PHRASAL_VERB':
                return 'Verbo frasal';
            case 'SLANG':
                return 'Jerga';
            default:
                return 'Desconocido';
        }
    };

    const handleCardClick = (word) => {
        setSelectedWord(word);
    };

    return (
        <div className="min-h-screen bg-white p-4">
            <div className="max-w-7xl min-h-max mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar jerga, verbo frasal o descripción..."
                            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-medium">Filtros:</span>
                        <button
                            onClick={() => setSelectedFilter("SLANG")}
                            className={`px-4 py-2 rounded-full font-medium transition-colors ${selectedFilter === "SLANG"
                                ? "bg-teal-100 text-teal-700"
                                : "bg-white text-gray-600 hover:bg-teal-100"
                                }`}
                        >
                            Jergas
                        </button>
                        <button
                            onClick={() => setSelectedFilter("PHRASAL_VERB")}
                            className={`px-4 py-2 rounded-full font-medium transition-colors ${selectedFilter === "PHRASAL_VERB"
                                ? "bg-red-200 text-pink-700"
                                : "bg-white text-gray-600 hover:bg-red-200"
                                }`}
                        >
                            Verbos frasales
                        </button>
                        <button
                            onClick={() => setSelectedFilter("all")}
                            className={`px-4 py-2 rounded-full font-medium transition-colors ${selectedFilter === "all"
                                ? "bg-gray-800 text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            Todos
                        </button>
                    </div>

                    <button className="flex items-center gap-2 justify-items-end bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors">
                        <Github className="w-4 h-4" />
                        GitHub
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Contenido principal - cartas */}
                    <div className="lg:col-span-2">
                        <div className="bg-teal-400 rounded-3xl p-6 relative">
                            {loading && (
                                <div className="absolute inset-0 bg-teal-400 bg-opacity-75 flex items-center justify-center rounded-3xl z-10">
                                    <p className="text-white text-lg font-bold">Cargando palabras...</p>
                                </div>
                            )}

                            {error ? (
                                <p className="text-center text-red-700 text-lg">{error}</p>
                            ) : words.length === 0 && !loading ? (
                                <p className="text-center text-white text-lg">No se encontraron palabras con los filtros aplicados.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {words.map((word) => (
                                        <div
                                            key={word.id}
                                            className="bg-white rounded-2xl gap-4 p-4 cursor-pointer hover:shadow-lg transition-shadow justify-between flex flex-col"
                                            onClick={() => handleCardClick(word)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <h3 className="text-xl font-bold text-gray-800 mb-1">{word.text}</h3>
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${word.word_type === "PHRASAL_VERB"
                                                        ? "bg-red-200 text-pink-700"
                                                        : "bg-teal-100 text-teal-700"
                                                        }`}
                                                >
                                                    {getSpanishWordType(word.word_type)}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-4 italic">"{word.description}"</p>
                                            <div className="flex items-center justify-between">
                                                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                                    <Heart className="w-5 h-5 text-gray-400" />
                                                </button>

                                                <div className="flex gap-2">
                                                    <button className="bg-pink-500 cursor-not-allowed text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-600 transition-colors flex items-center gap-1">
                                                        <Volume2 className="w-4 h-4" />
                                                        Escuchar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Controles de paginación */}
                        {!loading && words.length > 0 && totalPages > 1 && (
                            <div className="flex justify-center items-center space-x-2 mt-6">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                                    <button
                                        key={pageNumber}
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={`px-4 py-2 rounded-full font-medium transition-colors ${currentPage === pageNumber
                                            ? "bg-gray-800 text-white"
                                            : "bg-white text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - vista detallada */}
                    <div className="lg:col-span-1">
                        {selectedWord ? (
                            <div className="bg-gray-200 rounded-3xl p-6 sticky top-4">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedWord.text}</h2>
                                    <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                                        {getSpanishWordType(selectedWord.word_type)}
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Definición:</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {selectedWord.description}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Ejemplos:</h3>
                                        <div className="space-y-3">
                                            {selectedWord.examples && selectedWord.examples.length > 0 ? (
                                                selectedWord.examples.map((example, index) => (
                                                    <p key={index} className="text-gray-600 text-sm">
                                                        "{example}"
                                                    </p>
                                                ))
                                            ) : (
                                                <p className="text-gray-600 text-sm italic">No hay ejemplos disponibles.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Sustitutos:</h3>
                                        <div className="space-y-2">
                                            {selectedWord.substitutes && selectedWord.substitutes.length > 0 ? (
                                                selectedWord.substitutes.map((substituteText, index) => (
                                                    <p key={index} className="text-gray-600 text-sm">
                                                        "{substituteText}"
                                                    </p>
                                                ))
                                            ) : (
                                                <p className="text-gray-600 text-sm italic">No hay sustitutos disponibles.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button className="flex-1 cursor-not-allowed bg-pink-500 text-white py-3 rounded-full font-semibold hover:bg-pink-600 transition-colors">
                                        Practicar
                                    </button>
                                    <button className="flex-1 cursor-not-allowed bg-pink-500 text-white py-3 rounded-full font-semibold hover:bg-pink-600 transition-colors">
                                        Consultar I.A
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-6 sticky top-4 text-center text-gray-500">
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