import React, { useState, useEffect, useCallback } from 'react';
import useAxios from '@/utils/useAxios';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DictionaryWordTable from './DictionaryWordTable';
import DictionaryWordFormDialog from './DictionaryWordFormDialog';
import DictionaryCsvImportDialog from './DictionaryCsvImportDialog';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

const EMPTY_FORM = {
    text: '',
    translation: '',
    definition: '',
    word_type: 'SLANG',
    difficulty_level: 1,
    examples: [{ en: '', es: '' }],
    tags: ''
};

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
    const [formData, setFormData] = useState(EMPTY_FORM);

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
            setFormData(EMPTY_FORM);
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

        const uploadFormData = new FormData();
        uploadFormData.append('file', uploadFile);

        try {
            const response = await api.post('/words/import_csv/', uploadFormData, {
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

            <DictionaryWordTable
                words={words}
                loading={loading}
                onEdit={handleOpenForm}
                onDeleteRequest={setWordToDelete}
            />

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

            <DictionaryWordFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                editingWord={editingWord}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                onAddExample={handleAddExample}
                onRemoveExample={handleRemoveExample}
                onExampleChange={handleExampleChange}
            />

            <DictionaryCsvImportDialog
                open={isUploadOpen}
                onOpenChange={(open) => { setIsUploadOpen(open); if (!open) setUploadFile(null); }}
                uploadFile={uploadFile}
                onFileSelect={setUploadFile}
                onSubmit={handleFileUpload}
            />

            <ConfirmDeleteDialog
                open={!!wordToDelete}
                onOpenChange={(open) => !open && setWordToDelete(null)}
                title={`¿Borrar la palabra "${wordToDelete?.text}"?`}
                description="Esta acción es irreversible. Los alumnos que ya hayan desbloqueado esta palabra la conservarán en su colección, pero dejará de aparecer en el juego para todos los demás."
                confirmLabel="Sí, borrar esta palabra"
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}

export default DictionaryAdminPanel;
