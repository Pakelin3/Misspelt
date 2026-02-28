import React, { useState, useEffect, useCallback } from 'react';
import useAxios from '@/utils/useAxios';
import { Plus, Edit, Trash2, Save, X, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Componentes UI Propios
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function DictionaryAdminPanel() {
    const api = useAxios();

    // Estados de datos
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);

    // Paginación y Filtros
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 10;

    // Estado del Formulario
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [editingWord, setEditingWord] = useState(null);
    const [formData, setFormData] = useState({
        text: '',
        translation: '',
        definition: '',
        word_type: 'SLANG',
        difficulty_level: 1,
        examples: [{ en: '', es: '' }],
        tags: ''
    });

    // --- FETCH DATA ---
    const fetchWords = useCallback(async () => {
        setLoading(true);
        try {
            const searchParam = searchTerm ? `&search=${searchTerm}` : '';
            const response = await api.get(`/words/?page=${page}&limit=${itemsPerPage}${searchParam}`);

            setWords(response.data.results || []);
            // Calcular total de páginas basado en el count (asumiendo que tu API devuelve 'count')
            const totalCount = response.data.count || 0;
            setTotalPages(Math.ceil(totalCount / itemsPerPage));
        } catch (err) {
            console.error("Error fetching words:", err);
            toast.error("Error", { description: "No se pudo cargar el diccionario." });
        } finally {
            setLoading(false);
        }
    }, [api, page, searchTerm]);

    useEffect(() => {
        // Debounce para la búsqueda
        const timer = setTimeout(() => {
            fetchWords();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchWords]);

    // --- MANEJADORES DEL FORMULARIO ---
    const handleOpenForm = (word = null) => {
        if (word) {
            setEditingWord(word);
            setFormData({
                text: word.text || '',
                translation: word.translation || '',
                definition: word.definition || '',
                word_type: word.word_type || 'SLANG',
                difficulty_level: word.difficulty_level || 1,
                examples: word.examples && word.examples.length > 0 ? word.examples : [{ en: '', es: '' }],
                tags: word.tags || ''
            });
        } else {
            setEditingWord(null);
            setFormData({
                text: '',
                translation: '',
                definition: '',
                word_type: 'SLANG',
                difficulty_level: 1,
                examples: [{ en: '', es: '' }],
                tags: ''
            });
        }
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Filtrar ejemplos vacíos
            const validExamples = formData.examples.filter(ex => ex.en.trim() !== '' || ex.es.trim() !== '');

            const payload = {
                ...formData,
                examples: validExamples,
                tags: formData.tags, // String directamente al CharField
                difficulty_level: parseInt(formData.difficulty_level)
            };

            if (editingWord) {
                await api.put(`/words/${editingWord.id}/`, payload);
                toast.success('¡Actualizado!');
            } else {
                await api.post('/words/', payload);
                toast.success('¡Creado!');
            }
            setIsFormOpen(false);
            fetchWords();
        } catch (err) {
            console.error(err);
            toast.error('Error', { description: 'No se pudo guardar la palabra.' });
        }
    };

    const handleDelete = async (id) => {
        toast('¿ELIMINAR?', {
            description: "Esta acción es destructiva e irreversible.",
            action: {
                label: 'Sí, borrar',
                onClick: async () => {
                    try {
                        await api.delete(`/words/${id}/`);
                        fetchWords();
                        toast.success('Borrado');
                    } catch {
                        toast.error('Error', { description: 'No se pudo eliminar.' });
                    }
                }
            },
            cancel: {
                label: 'Cancelar',
            },
            duration: 10000,
        });
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        const formData = new FormData();
        formData.append('file', uploadFile);

        try {
            const response = await api.post('/words/import_csv/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('¡Importación Exitosa!', { description: response.data.message });
            setIsUploadOpen(false);
            setUploadFile(null);
            fetchWords();
        } catch (err) {
            console.error(err);
            let errorMessage = 'Error al subir el archivo.';
            if (err.response && err.response.data) {
                if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
                    errorMessage = err.response.data.errors.join(' | ');
                } else if (err.response.data.error) {
                    errorMessage = err.response.data.error;
                }
            }
            toast.error('Error de Importación', { description: errorMessage });
        }
    };

    // --- MANEJADORES DE EJEMPLOS DINÁMICOS ---
    const handleAddExample = () => {
        setFormData({
            ...formData,
            examples: [...formData.examples, { en: '', es: '' }]
        });
    };

    const handleRemoveExample = (index) => {
        const newExamples = formData.examples.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            examples: newExamples.length > 0 ? newExamples : [{ en: '', es: '' }]
        });
    };

    const handleExampleChange = (index, field, value) => {
        const newExamples = [...formData.examples];
        newExamples[index][field] = value;
        setFormData({ ...formData, examples: newExamples });
    };

    // --- HELPER PARA TIPOS ---
    const getTypeBadgeStyle = (type) => {
        switch (type) {
            case 'SLANG': return 'bg-yellow-100 text-yellow-800 border-yellow-800';
            case 'PHRASAL_VERB': return 'bg-blue-100 text-blue-800 border-blue-800';
            case 'IDIOM': return 'bg-purple-100 text-purple-800 border-purple-800';
            case 'VOCABULARY': return 'bg-emerald-100 text-emerald-800 border-emerald-800';
            default: return 'bg-gray-100 text-gray-800 border-gray-800';
        }
    };

    return (
        <div className="space-y-6 font-mono">
            {/* --- TOP BAR --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 border-4 border-foreground shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tighter">
                        Diccionario
                    </h2>
                    <p className="text-xs text-muted-foreground">Gestión de vocabulario del juego</p>
                </div>

                <div className="flex w-full sm:w-auto gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar palabra..."
                            className="pl-8 h-10 border-2 border-foreground rounded-none focus:ring-0 focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <Button onClick={() => handleOpenForm()} className="pixel-btn h-10 border-2 border-foreground rounded-none bg-primary text-primary-foreground transition-transform">
                        <Plus className="w-4 h-4 mr-2" />
                        NUEVA
                    </Button>
                    <Button
                        onClick={() => setIsUploadOpen(true)}
                        className="pixel-btn h-10 border-2 border-foreground hover:bg-a rounded-none bg-accent text-accent-foreground transition-transform"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        IMPORTAR CSV
                    </Button>
                </div>
            </div>

            {/* --- TABLA PIXELADA --- */}
            <div className="bg-card border-4 border-foreground overflow-hidden relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-xs font-bold animate-pulse">CARGANDO DATOS...</span>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted text-muted-foreground border-b-4 border-foreground uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-bold border-r-2 border-foreground/20">Palabra</th>
                                <th className="p-4 font-bold border-r-2 border-foreground/20 w-32">Tipo</th>
                                <th className="p-4 font-bold border-r-2 border-foreground/20 w-24 text-center">Nivel</th>
                                <th className="p-4 font-bold w-32 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-foreground/10">
                            {words.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-muted-foreground italic">
                                        No se encontraron palabras.
                                    </td>
                                </tr>
                            ) : (
                                words.map((word) => (
                                    <tr key={word.id} className="hover:bg-muted/50 transition-colors group">
                                        <td className="p-4 border-r-2 border-foreground/10">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-base">{word.text}</span>
                                                {word.translation && <span className="text-xs bg-muted px-1 py-0.5 border border-foreground/20">{word.translation}</span>}
                                            </div>
                                            <div className="text-xs text-muted-foreground line-clamp-1">{word.definition}</div>
                                        </td>
                                        <td className="p-4 border-r-2 border-foreground/10">
                                            <span className={`px-2 py-1 text-[10px] font-bold border-2 rounded-none ${getTypeBadgeStyle(word.word_type)}`}>
                                                {word.word_type === 'PHRASAL_VERB' ? 'P. VERB' : word.word_type}
                                            </span>
                                        </td>
                                        <td className="p-4 border-r-2 border-foreground/10 text-center">
                                            <div className="inline-flex gap-0.5 flex-wrap w-20 justify-center">
                                                {[...Array(10)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-1.5 h-1.5 border border-foreground ${i < word.difficulty_level ? 'bg-primary' : 'bg-transparent'}`}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenForm(word)}
                                                    className="p-2 hover:bg-blue-100 border-2 border-transparent hover:border-blue-500 transition-all text-blue-600"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(word.id)}
                                                    className="p-2 hover:bg-red-100 border-2 border-transparent hover:border-red-500 transition-all text-red-600"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- PAGINACIÓN --- */}
            <div className="flex justify-between items-center bg-card border-4 border-foreground p-2">
                <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="h-8 text-xs border-2 border-foreground rounded-none pixel-btn disabled:opacity-50"
                >
                    ANTERIOR
                </Button>
                <span className="text-xs font-bold">
                    PÁGINA {page} DE {totalPages || 1}
                </span>
                <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="h-8 text-xs border-2 border-foreground rounded-none pixel-btn disabled:opacity-50"
                >
                    SIGUIENTE
                </Button>
            </div>

            {/* --- MODAL DE FORMULARIO (Pixel Style) --- */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-lg border-4 border-foreground shadow-2xl relative animate-in zoom-in-95 duration-200">
                        {/* Header del Modal */}
                        <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center border-b-4 border-foreground">
                            <h3 className="font-bold text-lg uppercase flex items-center gap-2">
                                {editingWord ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                {editingWord ? 'Editar Palabra' : 'Nueva Palabra'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="hover:bg-red-500 hover:text-white p-1 transition-colors border-2 border-transparent hover:border-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body del Modal */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase">Palabra</label>
                                    <Input
                                        required
                                        value={formData.text}
                                        onChange={e => setFormData({ ...formData, text: e.target.value })}
                                        className="border-2 border-foreground rounded-none focus:ring-0 focus:border-primary bg-background"
                                        placeholder="Ej: Break down"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase">Traducción</label>
                                    <Input
                                        value={formData.translation}
                                        onChange={e => setFormData({ ...formData, translation: e.target.value })}
                                        className="border-2 border-foreground rounded-none focus:ring-0 focus:border-primary bg-background"
                                        placeholder="Ej: Descomponerse"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase">Tipo</label>
                                    <select
                                        className="w-full h-10 px-3 bg-background border-2 border-foreground rounded-none focus:outline-none focus:border-primary text-sm"
                                        value={formData.word_type}
                                        onChange={e => setFormData({ ...formData, word_type: e.target.value })}
                                    >
                                        <option value="SLANG">Slang (Jerga)</option>
                                        <option value="PHRASAL_VERB">Phrasal Verb</option>
                                        <option value="IDIOM">Idiom (Modismo)</option>
                                        <option value="VOCABULARY">Vocabulary</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase">Tags (Separados por coma)</label>
                                    <Input
                                        value={formData.tags}
                                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                        className="border-2 border-foreground rounded-none focus:ring-0 focus:border-primary bg-background"
                                        placeholder="Ej: travel, emergency"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase">Definición (En inglés)</label>
                                <textarea
                                    required
                                    className="w-full p-3 bg-background border-2 border-foreground rounded-none focus:outline-none focus:border-primary text-sm min-h-[80px]"
                                    value={formData.definition}
                                    onChange={e => setFormData({ ...formData, definition: e.target.value })}
                                    placeholder="Ej: To stop functioning (for a machine or vehicle)."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase">Nivel Dificultad ({formData.difficulty_level})</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="1"
                                    className="w-full accent-primary h-2 bg-muted rounded-none appearance-none cursor-pointer border border-foreground"
                                    value={formData.difficulty_level}
                                    onChange={e => setFormData({ ...formData, difficulty_level: e.target.value })}
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground px-1 font-sans">
                                    <span>Principiante (1)</span>
                                    <span>Experto (10)</span>
                                </div>
                            </div>

                            <div className="space-y-3 p-4 bg-muted/20 border-2 border-foreground">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold uppercase">Ejemplos de Uso</label>
                                    <Button
                                        type="button"
                                        onClick={handleAddExample}
                                        className="h-6 px-2 py-0 text-[10px] rounded-none bg-primary text-primary-foreground pixel-btn border-2 border-primary"
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> OTRO EJEMPLO
                                    </Button>
                                </div>

                                {formData.examples.map((example, index) => (
                                    <div key={index} className="flex gap-2 items-start relative bg-background p-3 border-2 border-foreground/30">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                className="w-full p-2 bg-transparent border-b-2 border-foreground/20 focus:outline-none focus:border-primary text-sm font-sans placeholder:italic"
                                                placeholder="Ejemplo en inglés (e.g. The car broke down.)"
                                                value={example.en}
                                                onChange={(e) => handleExampleChange(index, 'en', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className="w-full p-2 bg-transparent border-b-2 border-foreground/20 focus:outline-none focus:border-primary text-sm font-sans placeholder:italic text-muted-foreground"
                                                placeholder="Traducción en español (e.g. El coche se descompuso.)"
                                                value={example.es}
                                                onChange={(e) => handleExampleChange(index, 'es', e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExample(index)}
                                            className="p-2 text-destructive hover:bg-destructive/10 border-2 border-transparent hover:border-destructive transition-colors shrink-0 mt-2"
                                            title="Eliminar Ejemplo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <p className="text-[10px] text-muted-foreground italic">
                                    * Los ejemplos que dejes en blanco serán ignorados.
                                </p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="flex-1 border-2 border-foreground rounded-none pixel-btn">
                                    CANCELAR
                                </Button>
                                <Button type="submit" className="flex-1 border-2 border-foreground rounded-none pixel-btn bg-primary text-primary-foreground">
                                    <Save className="w-4 h-4 mr-2" />
                                    GUARDAR
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DictionaryAdminPanel;