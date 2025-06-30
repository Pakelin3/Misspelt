import React, { useState, useEffect, useCallback } from 'react';
import useAxios from '@/utils/useAxios';
import { useTheme } from '@/context/ThemeContext';
import { Plus, Edit, Trash2, Save, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import axios from 'axios';

function DictionaryAdminPanel() {
    const api = useAxios();
    const { theme } = useTheme();
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingWord, setEditingWord] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [formText, setFormText] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formWordType, setFormWordType] = useState('SLANG');
    const [formExamples, setFormExamples] = useState('');
    const [formDifficultyLevel, setFormDifficultyLevel] = useState(1);
    const [formTags, setFormTags] = useState('');

    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchWords = useCallback(async (page, limit) => {
        console.log("fetchWords called with page:", page, "limit:", limit);
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/words/?page=${page}&limit=${limit}`);
            console.log("API response count:", response.data.count, "results length:", response.data.results.length);
            setWords(response.data.results);
            setTotalRows(response.data.count);
        } catch (err) {
            console.error("Error fetching words:", err);
            if (axios.isCancel(err) || err.code === 'ECONNABORTED') {
                console.log("Request aborted, not setting error state for aborted requests.");
                // setError(null);
            } else {
                setError("No se pudieron cargar las palabras. Asegúrate de tener permisos de administrador.");
            }
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        console.log("useEffect triggered for page:", currentPage, "perPage:", perPage); 
        fetchWords(currentPage, perPage);
    }, [fetchWords, currentPage, perPage]);

    const handleNewWord = () => {
        setEditingWord(null);
        setFormText('');
        setFormDescription('');
        setFormWordType('SLANG');
        setFormExamples('');
        setFormDifficultyLevel(1);
        setFormTags('');
        setIsFormOpen(true);
    };

    const handleEditWord = (word) => {
        setEditingWord(word);
        setFormText(word.text);
        setFormDescription(word.description);
        setFormWordType(word.word_type);
        setFormExamples(JSON.stringify(word.examples, null, 2));
        setFormDifficultyLevel(word.difficulty_level);
        setFormTags(JSON.stringify(word.tags, null, 2));
        setIsFormOpen(true);
    };

    const handleDeleteWord = async (wordId) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--color-bg-tertiary)',
            cancelButtonColor: 'var(--color-bg-secondary)',
            confirmButtonText: 'Sí, ¡bórralo!',
            cancelButtonText: 'Cancelar',
            background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
            color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/words/${wordId}/`);
                Swal.fire({
                    title: '¡Borrado!',
                    text: 'La palabra ha sido eliminada.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                    color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                });
                setCurrentPage(1); 
                fetchWords(1, perPage); 
            } catch (err) {
                console.error("Error deleting word:", err);
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo eliminar la palabra.',
                    icon: 'error',
                    background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                    color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const wordData = {
                text: formText,
                description: formDescription,
                word_type: formWordType,
                examples: JSON.parse(formExamples || '[]'),
                difficulty_level: parseInt(formDifficultyLevel),
                tags: JSON.parse(formTags || '[]'),
            };

            if (editingWord) {
                await api.put(`/words/${editingWord.id}/`, wordData);
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'La palabra ha sido modificada.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                    color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                });
            } else {
                await api.post('/words/', wordData);
                Swal.fire({
                    title: '¡Creado!',
                    text: 'Nueva palabra añadida.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                    color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                });
            }
            setIsFormOpen(false);
            setCurrentPage(1); 
            fetchWords(1, perPage); 
        } catch (err) {
            console.error("Error saving word:", err.response?.data || err.message);
            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            Swal.fire({
                title: 'Error al guardar',
                text: `Hubo un problema: ${errorMessage}`,
                icon: 'error',
                background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
            });
        }
    };

    const getSpanishWordType = (type) => {
        switch (type) {
            case 'PHRASAL_VERB': return 'Verbo frasal';
            case 'SLANG': return 'Jerga';
            case 'NONE': return 'Ninguno';
            default: return 'Desconocido';
        }
    };

    const columns = [
        {
            name: 'Texto',
            selector: row => row.text,
            sortable: true,
            grow: 2,
            minWidth: '150px',
            cell: row => (
                <span className={theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}>{row.text}</span>
            )
        },
        {
            name: 'Tipo',
            selector: row => getSpanishWordType(row.word_type),
            sortable: true,
            grow: 1,
            minWidth: '120px',
            cell: row => (
                <span className={theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}>{getSpanishWordType(row.word_type)}</span>
            )
        },
        {
            name: 'Nivel',
            selector: row => row.difficulty_level,
            sortable: true,
            minWidth: '80px',
            cell: row => (
                <span className={theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}>{row.difficulty_level}</span>
            )
        },
        {
            name: 'Acciones',
            cell: row => (
                <div className="flex">
                    <button
                        onClick={() => handleEditWord(row)}
                        className={`text-[var(--color-accent-blue)] hover:text-[var(--color-bg-secondary)] mr-3`}
                        aria-label={`Editar ${row.text}`}
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleDeleteWord(row.id)}
                        className={`text-red-500 hover:text-red-700`}
                        aria-label={`Eliminar ${row.text}`}
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            width: '120px',
        },
    ];

    const customStyles = {
        header: {
            style: {
                minHeight: '56px',
                backgroundColor: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
            },
        },
        headRow: {
            style: {
                backgroundColor: theme === 'light' ? 'var(--color-bg-main)' : 'var(--color-dark-bg-tertiary)',
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
            },
        },
        headCells: {
            style: {
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                fontSize: '14px',
                fontWeight: 'bold',
            },
        },
        cells: {
            style: {
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                backgroundColor: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                '&:not(:last-of-type)': {
                    borderRightStyle: 'solid',
                    borderRightWidth: '1px',
                    borderRightColor: theme === 'light' ? 'var(--color-text-secondary)' : 'var(--color-dark-border)',
                },
            },
        },
        pagination: {
            style: {
                backgroundColor: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                borderTopStyle: 'solid',
                borderTopWidth: '1px',
                borderTopColor: theme === 'light' ? 'var(--color-text-secondary)' : 'var(--color-dark-border)',
            },
            pageButtonsStyle: {
                backgroundColor: theme === 'light' ? 'var(--color-bg-main)' : 'var(--color-dark-bg-tertiary)',
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                '&:hover': {
                    backgroundColor: theme === 'light' ? '#4ECDC4' : '#a0a0a0',
                },
                '&:disabled': {
                    opacity: 0.5,
                },
                '&:not(:disabled)': {
                    cursor: 'pointer',
                },
            },
        },
    };

    const handlePageChange = page => {
        console.log("onChangePage received page:", page);
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage, page) => {
        console.log("onChangeRowsPerPage received newPerPage:", newPerPage, "and page:", page);
        setPerPage(newPerPage);
        setCurrentPage(page);
    };

    const renderWordList = () => (
        <div className={`p-4 rounded-lg shadow-md
            ${theme === 'light' ? 'bg-[var(--color-bg-card)]' : 'bg-[var(--color-dark-bg-secondary)]'}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--color-text-main)]">Gestión de Palabras</h2>
                <button
                    onClick={handleNewWord}
                    className={`px-4 py-2 rounded-full flex items-center gap-2 font-semibold transition-colors whitespace-nowrap
                        ${theme === 'light'
                            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-body-bg)] hover:bg-[var(--color-bg-tertiary)]'
                            : 'bg-[var(--color-accent-blue)] text-white hover:bg-[var(--color-bg-tertiary)]'
                        }`}>
                    <Plus className="w-5 h-5" />
                    Nueva Palabra
                </button>
            </div>
            {error ? (
                <p className="text-red-500 text-center py-4">{error}</p>
            ) : (
                <DataTable
                    columns={columns}
                    data={words}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerPageChange}
                    progressPending={loading}
                    customStyles={customStyles}
                    noDataComponent={
                        <p className={theme === 'light' ? 'text-[var(--color-text-secondary)] py-4' : 'text-[var(--color-dark-text-secondary)] py-4'}>
                            No se encontraron palabras para mostrar.
                        </p>
                    }
                />
            )}
        </div>
    );

    const renderWordForm = () => (
        <div className={`p-4 rounded-lg shadow-md
            ${theme === 'light' ? 'bg-[var(--color-bg-card)]' : 'bg-[var(--color-dark-bg-secondary)]'}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--color-text-main)]">{editingWord ? 'Editar Palabra' : 'Crear Nueva Palabra'}</h2>
                <button
                    onClick={() => setIsFormOpen(false)}
                    className={`text-[var(--color-text-secondary)] hover:text-red-500`}
                >
                    <XCircle className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="text" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Texto:</label>
                    <input
                        type="text"
                        id="text"
                        value={formText}
                        onChange={(e) => setFormText(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Descripción:</label>
                    <textarea
                        id="description"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 h-24 resize-y
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        required
                    ></textarea>
                </div>

                <div>
                    <label htmlFor="wordType" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Tipo de Palabra:</label>
                    <select
                        id="wordType"
                        value={formWordType}
                        onChange={(e) => setFormWordType(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)] bg-white'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)] bg-[var(--color-dark-bg-tertiary)]'
                            }`}
                        required
                    >
                        <option value="SLANG">Jerga</option>
                        <option value="PHRASAL_VERB">Verbo Frasal</option>
                        <option value="NONE">Ninguno</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="difficultyLevel" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Nivel de Dificultad (1-5):</label>
                    <input
                        type="number"
                        id="difficultyLevel"
                        value={formDifficultyLevel}
                        onChange={(e) => setFormDifficultyLevel(e.target.value)}
                        min="1"
                        max="5"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="examples" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Ejemplos (JSON Array):</label>
                    <textarea
                        id="examples"
                        value={formExamples}
                        onChange={(e) => setFormExamples(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 h-24 resize-y
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        placeholder='Ej: ["Example 1", "Example 2"]'
                    ></textarea>
                </div>

                <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Tags (JSON Array):</label>
                    <textarea
                        id="tags"
                        value={formTags}
                        onChange={(e) => setFormTags(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 h-24 resize-y
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        placeholder='Ej: ["tag1", "tag2"]'
                    ></textarea>
                </div>

                <div className="flex gap-4 mt-6">
                    <button
                        type="submit"
                        className={`flex-1 px-4 py-2 rounded-full flex items-center justify-center gap-2 font-semibold transition-colors
                            ${theme === 'light'
                                ? 'bg-[var(--color-bg-secondary)] text-[var(--color-body-bg)] hover:bg-[var(--color-bg-tertiary)]'
                                : 'bg-[var(--color-accent-blue)] text-white hover:bg-[var(--color-bg-tertiary)]'
                            }`}>
                        <Save className="w-5 h-5" />
                        Guardar
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className={`flex-1 px-4 py-2 rounded-full flex items-center justify-center gap-2 font-semibold transition-colors
                            ${theme === 'light'
                                ? 'bg-gray-300 text-[var(--color-text-main)] hover:bg-gray-400'
                                : 'bg-[var(--color-dark-bg-tertiary)] text-[var(--color-dark-text)] hover:bg-gray-700'
                            }`}>
                        <XCircle className="w-5 h-5" />
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 sm:hidden">
                    {renderWordForm()}
                </div>
            )}

            <div className={`hidden sm:grid ${isFormOpen ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-6`}>
                <div className={`${isFormOpen ? '' : 'sm:col-span-1'}`}>
                    {renderWordList()}
                </div>
                {isFormOpen && (
                    <div className="sm:col-span-1">
                        {renderWordForm()}
                    </div>
                )}
            </div>

            <div className="sm:hidden">
                {!isFormOpen && renderWordList()}
            </div>
        </div>
    );
}

export default DictionaryAdminPanel;