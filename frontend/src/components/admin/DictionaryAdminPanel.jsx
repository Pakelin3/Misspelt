import React, { useState, useEffect, useCallback } from 'react';
import useAxios from '@/utils/useAxios';
import { Plus, Edit, Trash2, Save, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';

function DictionaryAdminPanel() {
    const api = useAxios();
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 10;
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [editingWord, setEditingWord] = useState(null);
    const [wordToDelete, setWordToDelete] = useState(null);
    const [formData, setFormData] = useState({
        text: '',
        translation: '',
        definition: '',
        word_type: 'SLANG',
        difficulty_level: 1,
        examples: [{ en: '', es: '' }],
        tags: ''
    });

    const fetchWords = useCallback(async () => {
        setLoading(true);
        try {
            const searchParam = searchTerm ? `&search=${searchTerm}` : '';
            const response = await api.get(`/words/?page=${page}&limit=${itemsPerPage}${searchParam}`);

            setWords(response.data.results || []);
            const totalCount = response.data.count || 0;
            setTotalPages(Math.ceil(totalCount / itemsPerPage));
        } catch (err) {
            console.error("Error fetching words:", err);
            toast.error("No se pudo cargar el diccionario", { description: "Revisa tu conexión y vuelve a intentarlo." });
        } finally {
            setLoading(false);
        }
    }, [api, page, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchWords();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchWords]);

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
            const validExamples = formData.examples.filter(ex => ex.en.trim() !== '' || ex.es.trim() !== '');

            const payload = {
                ...formData,
                examples: validExamples,
                tags: formData.tags,
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
            toast.error('No se pudo guardar la palabra', { description: 'Revisa que todos los campos obligatorios estén completos y vuelve a intentarlo.' });
        }
    };

    const handleConfirmDelete = async () => {
        if (!wordToDelete) return;
        try {
            await api.delete(`/words/${wordToDelete.id}/`);
            setWordToDelete(null);
            fetchWords();
            toast.success('Palabra borrada');
        } catch {
            toast.error('No se pudo eliminar la palabra', { description: 'Inténtalo de nuevo en unos segundos.' });
        }
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
            toast.error('No se pudo importar el CSV', {
                description: 'Revisa que el archivo tenga las columnas exactas indicadas abajo y que no contenga filas vacías.'
            });
        }
    };

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

    const getTypeBadgeStyle = (type) => {
        switch (type) {
            case 'SLANG': return 'bg-word-slang/15 text-word-slang border-word-slang';
            case 'PHRASAL_VERB': return 'bg-word-noun/15 text-word-noun border-word-noun';
            case 'IDIOM': return 'bg-word-idiom/15 text-word-idiom border-word-idiom';
            case 'VOCABULARY': return 'bg-word-verb/15 text-word-verb border-word-verb';
            default: return 'bg-muted text-muted-foreground border-foreground';
        }
    };

    const CSV_COLUMNS = [
        { name: 'word', label: 'Palabra' },
        { name: 'translation', label: 'Traducción' },
        { name: 'word_type', label: 'Tipo (SLANG, PHRASAL_VERB, IDIOM, VOCABULARY)' },
        { name: 'difficulty_level', label: 'Nivel de dificultad (1-10)' },
        { name: 'definition', label: 'Definición en inglés' },
        { name: 'tags', label: 'Etiquetas separadas por coma' },
        { name: 'ex1_en', label: 'Ejemplo 1 en inglés' },
        { name: 'ex1_es', label: 'Ejemplo 1 en español' },
        { name: 'ex2_en', label: 'Ejemplo 2 en inglés' },
        { name: 'ex2_es', label: 'Ejemplo 2 en español' },
    ];

    return (
        <div className="space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 border-4 border-foreground shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tighter">
                        Diccionario
                    </h2>
                    <p className="text-xs text-muted-foreground">Gestión de vocabulario del juego</p>
                </div>

                <div className="flex w-full sm:w-auto gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <label htmlFor="word-search" className="sr-only">Buscar palabra</label>
                        <Input
                            id="word-search"
                            placeholder="Buscar palabra..."
                            className="pl-8 h-10 border-2 border-foreground rounded-none focus:ring-0 focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <Button onClick={() => handleOpenForm()}>
                        <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                        NUEVA
                    </Button>
                    <Button
                        variant="accent"
                        onClick={() => setIsUploadOpen(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                        IMPORTAR CSV
                    </Button>
                </div>
            </div>

            <div className="bg-card border-4 border-foreground overflow-hidden relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-raised flex items-center justify-center" role="status" aria-live="polite">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
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
                                            <span className={`px-2 py-1 text-2xs font-bold border-2 rounded-none ${getTypeBadgeStyle(word.word_type)}`}>
                                                {word.word_type === 'PHRASAL_VERB' ? 'P. VERB' : word.word_type}
                                            </span>
                                        </td>
                                        <td className="p-4 border-r-2 border-foreground/10 text-center">
                                            <div className="inline-flex gap-0.5 flex-wrap w-20 justify-center">
                                                {[...Array(10)].map((_, i) => (
                                                    <div
                                                        key={`diff-${word.id}-${i}`}
                                                        className={`w-1.5 h-1.5 border border-foreground ${i < word.difficulty_level ? 'bg-primary' : 'bg-transparent'}`}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenForm(word)}
                                                    className="text-info hover:bg-info/10"
                                                    aria-label={`Editar la palabra ${word.text}`}
                                                >
                                                    <Edit className="w-5 h-5" aria-hidden="true" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setWordToDelete(word)}
                                                    className="text-destructive hover:bg-destructive/10"
                                                    aria-label={`Eliminar la palabra ${word.text}`}
                                                >
                                                    <Trash2 className="w-5 h-5" aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-between items-center bg-card border-4 border-foreground p-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                >
                    ANTERIOR
                </Button>
                <span className="text-xs font-bold">
                    PÁGINA {page} DE {totalPages || 1}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                >
                    SIGUIENTE
                </Button>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingWord ? <Edit className="w-5 h-5" aria-hidden="true" /> : <Plus className="w-5 h-5" aria-hidden="true" />}
                            {editingWord ? 'Editar Palabra' : 'Nueva Palabra'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="word-text" className="text-xs font-bold uppercase">Palabra</label>
                                <Input
                                    id="word-text"
                                    required
                                    value={formData.text}
                                    onChange={e => setFormData({ ...formData, text: e.target.value })}
                                    className="border-2 border-foreground rounded-none focus:ring-0 focus:border-primary bg-background"
                                    placeholder="Ej: Break down"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="word-translation" className="text-xs font-bold uppercase">Traducción</label>
                                <Input
                                    id="word-translation"
                                    value={formData.translation}
                                    onChange={e => setFormData({ ...formData, translation: e.target.value })}
                                    className="border-2 border-foreground rounded-none focus:ring-0 focus:border-primary bg-background"
                                    placeholder="Ej: Descomponerse"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="word-type" className="text-xs font-bold uppercase">Tipo</label>
                                <select
                                    id="word-type"
                                    className="w-full h-10 px-3 bg-background border-2 border-foreground rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary text-sm"
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
                                <label htmlFor="word-tags" className="text-xs font-bold uppercase">Tags (Separados por coma)</label>
                                <Input
                                    id="word-tags"
                                    value={formData.tags}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    className="border-2 border-foreground rounded-none focus:ring-0 focus:border-primary bg-background"
                                    placeholder="Ej: travel, emergency"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="word-definition" className="text-xs font-bold uppercase">Definición (En inglés)</label>
                            <textarea
                                id="word-definition"
                                required
                                className="w-full p-3 bg-background border-2 border-foreground rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary text-sm min-h-[80px]"
                                value={formData.definition}
                                onChange={e => setFormData({ ...formData, definition: e.target.value })}
                                placeholder="Ej: To stop functioning (for a machine or vehicle)."
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="word-difficulty" className="text-xs font-bold uppercase">Nivel Dificultad ({formData.difficulty_level})</label>
                            <input
                                id="word-difficulty"
                                type="range"
                                min="1"
                                max="10"
                                step="1"
                                className="w-full accent-primary h-2 bg-muted rounded-none appearance-none cursor-pointer border border-foreground"
                                value={formData.difficulty_level}
                                onChange={e => setFormData({ ...formData, difficulty_level: e.target.value })}
                            />
                            <div className="flex justify-between text-2xs text-muted-foreground px-1 font-sans">
                                <span>Principiante (1)</span>
                                <span>Experto (10)</span>
                            </div>
                        </div>

                        <div className="space-y-3 p-4 bg-muted/20 border-2 border-foreground">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase">Ejemplos de Uso</span>
                                <Button
                                    type="button"
                                    size="xs"
                                    onClick={handleAddExample}
                                >
                                    <Plus className="w-3 h-3 mr-1" aria-hidden="true" /> OTRO EJEMPLO
                                </Button>
                            </div>

                            {formData.examples.map((example, index) => (
                                <div key={`example-input-${index}`} className="flex gap-2 items-start relative bg-background p-3 border-2 border-foreground/30">
                                    <div className="flex-1 space-y-2">
                                        <label htmlFor={`example-en-${index}`} className="sr-only">Ejemplo {index + 1} en inglés</label>
                                        <input
                                            id={`example-en-${index}`}
                                            type="text"
                                            className="w-full p-2 bg-transparent border-b-2 border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary text-sm font-sans placeholder:italic"
                                            placeholder="Ejemplo en inglés (e.g. The car broke down.)"
                                            value={example.en}
                                            onChange={(e) => handleExampleChange(index, 'en', e.target.value)}
                                        />
                                        <label htmlFor={`example-es-${index}`} className="sr-only">Ejemplo {index + 1} en español</label>
                                        <input
                                            id={`example-es-${index}`}
                                            type="text"
                                            className="w-full p-2 bg-transparent border-b-2 border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary text-sm font-sans placeholder:italic text-muted-foreground"
                                            placeholder="Traducción en español (e.g. El coche se descompuso.)"
                                            value={example.es}
                                            onChange={(e) => handleExampleChange(index, 'es', e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveExample(index)}
                                        className="text-destructive hover:bg-destructive/10 shrink-0"
                                        aria-label={`Eliminar ejemplo ${index + 1}`}
                                    >
                                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                                    </Button>
                                </div>
                            ))}
                            <p className="text-2xs text-muted-foreground italic">
                                * Los ejemplos que dejes en blanco serán ignorados.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                CANCELAR
                            </Button>
                            <Button type="submit">
                                <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                                GUARDAR
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isUploadOpen} onOpenChange={(open) => { setIsUploadOpen(open); if (!open) setUploadFile(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>IMPORTAR CSV</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleFileUpload} className="space-y-6">
                        <div className="text-sm font-sans text-muted-foreground space-y-2">
                            <p>Sube un archivo .csv cuya primera fila tenga exactamente estas columnas:</p>
                            <div className="overflow-x-auto border-2 border-foreground">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted uppercase text-2xs">
                                        <tr>
                                            <th className="p-2 border-b-2 border-foreground font-bold">Columna (CSV)</th>
                                            <th className="p-2 border-b-2 border-foreground font-bold">Qué va aquí</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-foreground/20">
                                        {CSV_COLUMNS.map(col => (
                                            <tr key={col.name}>
                                                <td className="p-2 font-mono font-bold text-foreground whitespace-nowrap"><code>{col.name}</code></td>
                                                <td className="p-2">{col.label}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="csv-file-input" className="block text-sm font-bold text-foreground tracking-wider">ARCHIVO CSV</label>
                            <input
                                id="csv-file-input"
                                type="file"
                                accept=".csv"
                                onChange={(e) => setUploadFile(e.target.files[0])}
                                className="w-full px-3 cursor-pointer py-2 bg-card border-2 border-foreground focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-sans text-sm shadow-pixel-sm"
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsUploadOpen(false);
                                    setUploadFile(null);
                                }}
                            >
                                CANCELAR
                            </Button>
                            <Button type="submit" disabled={!uploadFile}>
                                <Save className="w-4 h-4 mr-2" aria-hidden="true" /> SUBIR CSV
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!wordToDelete} onOpenChange={(open) => !open && setWordToDelete(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">¿Borrar la palabra "{wordToDelete?.text}"?</DialogTitle>
                        <DialogDescription>
                            Esta acción es irreversible. Los alumnos que ya hayan desbloqueado esta
                            palabra la conservarán en su colección, pero dejará de aparecer en el
                            juego para todos los demás.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWordToDelete(null)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            Sí, borrar esta palabra
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default DictionaryAdminPanel;
