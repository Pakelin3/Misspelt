import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAxios from '@/utils/useAxios';
import { Plus, Search, User, CheckCircle, Loader2, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import ImageUploadField from './ImageUploadField';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import AdminPagination from './AdminPagination';

const EMPTY_FORM = {
    name: '',
    is_default: false,
    unlock_condition_description: '',
    image: null
};

function AvatarAdminPanel() {
    const api = useAxios();
    const fileInputRef = useRef(null);
    const [avatars, setAvatars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAvatar, setEditingAvatar] = useState(null);
    const [avatarToDelete, setAvatarToDelete] = useState(null);

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 500);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    const fetchAvatars = useCallback(async (page, search) => {
        setLoading(true);
        try {
            const searchParam = search ? `&search=${search}` : '';
            const response = await api.get(`/avatars/?page=${page}${searchParam}`);

            if (response.data.results) {
                setAvatars(response.data.results);
                setTotalPages(Math.ceil(response.data.count / 15));
            } else {
                setAvatars(response.data);
            }
        } catch (err) {
            console.error("Error fetching avatars:", err);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchAvatars(currentPage, debouncedSearchTerm);
    }, [fetchAvatars, currentPage, debouncedSearchTerm]);

    const handleOpenForm = (avatar = null) => {
        if (avatar) {
            setEditingAvatar(avatar);
            setFormData({
                name: avatar.name,
                is_default: avatar.is_default,
                unlock_condition_description: avatar.unlock_condition_description || '',
                image: null
            });
            setPreviewUrl(avatar.image);
        } else {
            setEditingAvatar(null);
            setFormData(EMPTY_FORM);
            setPreviewUrl(null);
        }
        setIsFormOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Archivo muy grande', { description: 'Máximo 2MB por avatar.' });
                return;
            }

            setFormData({ ...formData, image: file });
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSend = new FormData();
        dataToSend.append('name', formData.name);
        dataToSend.append('is_default', formData.is_default ? 'true' : 'false');
        dataToSend.append('unlock_condition_description', formData.unlock_condition_description);

        if (formData.image instanceof File) {
            dataToSend.append('image', formData.image);
        }

        try {
            if (editingAvatar) {
                await api.patch(`/avatars/${editingAvatar.id}/`, dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('¡Actualizado!');
            } else {
                await api.post('/avatars/', dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('¡Creado!');
            }
            setIsFormOpen(false);
            fetchAvatars(currentPage, debouncedSearchTerm);
        } catch (err) {
            console.error(err);
            toast.error('No se pudo guardar el avatar', { description: 'Revisa que el nombre no esté repetido y vuelve a intentarlo.' });
        }
    };

    const handleConfirmDelete = async () => {
        if (!avatarToDelete) return;
        try {
            await api.delete(`/avatars/${avatarToDelete.id}/`);
            setAvatarToDelete(null);
            fetchAvatars(currentPage, debouncedSearchTerm);
            toast.success('Avatar borrado');
        } catch {
            toast.error('No se pudo eliminar el avatar', { description: 'Inténtalo de nuevo en unos segundos.' });
        }
    };

    return (
        <div className="space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 border-4 border-foreground shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tighter flex items-center gap-2">
                        Avatares
                    </h2>
                    <p className="text-xs text-muted-foreground">Personajes y skins de usuario</p>
                </div>

                <div className="flex w-full sm:w-auto gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <label htmlFor="avatar-search" className="sr-only">Buscar avatar</label>
                        <Input
                            id="avatar-search"
                            placeholder="Buscar avatar..."
                            className="pl-8 h-10 border-2 border-foreground rounded-none focus:ring-0 focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => handleOpenForm()}>
                        <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                        NUEVO
                    </Button>
                </div>
            </div>

            <div className="bg-card border-4 border-foreground p-4 min-h-[400px] relative">
                {loading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-raised flex items-center justify-center" role="status" aria-live="polite">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden="true" />
                        <span className="sr-only">Cargando avatares...</span>
                    </div>
                )}

                {avatars.length === 0 && !loading ? (
                    <div className="text-center p-12 text-muted-foreground italic border-2 border-dashed border-foreground/30 m-4">
                        No hay avatares creados.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {avatars.map((avatar) => (
                            <div key={avatar.id} className="group relative bg-muted/20 border-2 border-foreground p-3 flex flex-col items-center hover:bg-muted/40 transition-colors">
                                {avatar.is_default && (
                                    <div className="absolute top-2 left-2 bg-accent text-accent-foreground text-2xs font-bold px-1 border border-foreground z-raised">
                                        DEFAULT
                                    </div>
                                )}

                                <div className="w-24 h-24 sm:w-32 sm:h-32 mb-3 bg-background border-2 border-foreground relative overflow-hidden flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                                    {avatar.image ? (
                                        <img src={avatar.image} alt={avatar.name} width={128} height={128} loading="lazy" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-muted-foreground" aria-hidden="true" />
                                    )}
                                </div>

                                <div className="text-center w-full mb-3">
                                    <h3 className="font-bold text-sm truncate w-full" title={avatar.name}>{avatar.name}</h3>
                                    {avatar.is_default ? (
                                        <p className="text-2xs text-success font-bold">Disponible Inicialmente</p>
                                    ) : (
                                        <p className="text-2xs text-muted-foreground truncate w-full" title={avatar.unlock_condition_description}>
                                            {avatar.unlock_condition_description || "Bloqueado"}
                                        </p>
                                    )}
                                </div>

                                <div className="flex w-full gap-2 mt-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenForm(avatar)}
                                        className="flex-1"
                                    >
                                        EDITAR
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setAvatarToDelete(avatar)}
                                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground/10"
                                        aria-label={`Eliminar avatar ${avatar.name}`}
                                    >
                                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && totalPages > 1 && (
                    <AdminPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingAvatar ? 'Editar Avatar' : 'Nuevo Avatar'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <ImageUploadField
                            id="avatar-file-input"
                            fileInputRef={fileInputRef}
                            previewUrl={previewUrl}
                            onFileChange={handleFileChange}
                            alt="Vista previa del avatar"
                            placeholderText="SUBIR IMAGEN"
                            buttonClassName="w-40 h-40 border-4 border-dashed border-foreground/40 hover:border-primary/60 transition-colors bg-muted/20 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            imageClassName="w-full h-full object-cover"
                            helper={(
                                <p className="text-2xs text-muted-foreground">
                                    Recomendado: 128x128px
                                </p>
                            )}
                        />

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="avatar-name" className="text-xs font-bold uppercase">Nombre del Avatar</label>
                                <Input
                                    id="avatar-name"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="border-2 border-foreground rounded-none focus:ring-0 focus:border-primary"
                                    placeholder="Ej: Guerrero Pixel"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-3 border-2 border-foreground/20 bg-muted/20">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_default"
                                        checked={formData.is_default}
                                        onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                                        className="w-5 h-5 border-2 border-foreground rounded-none text-primary focus:ring-0 cursor-pointer"
                                    />
                                </div>
                                <label htmlFor="is_default" className="text-sm font-bold cursor-pointer select-none flex items-center gap-2">
                                    Avatar por Defecto
                                    {formData.is_default && <CheckCircle className="w-4 h-4 text-success" aria-hidden="true" />}
                                </label>
                            </div>
                            <p className="text-2xs text-muted-foreground -mt-2 ml-1">
                                Si se marca, los nuevos usuarios podrán elegirlo inmediatamente.
                            </p>

                            {!formData.is_default && (
                                <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
                                    <label htmlFor="avatar-unlock-condition" className="text-xs font-bold uppercase text-primary">Condición de Desbloqueo</label>
                                    <textarea
                                        id="avatar-unlock-condition"
                                        className="w-full p-3 bg-background border-2 border-foreground rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary text-sm min-h-[80px]"
                                        value={formData.unlock_condition_description}
                                        onChange={e => setFormData({ ...formData, unlock_condition_description: e.target.value })}
                                        placeholder="Ej: Se desbloquea al alcanzar el Nivel 5..."
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                CANCELAR
                            </Button>
                            <Button type="submit">
                                <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                                {editingAvatar ? 'GUARDAR' : 'CREAR'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                open={!!avatarToDelete}
                onOpenChange={(open) => !open && setAvatarToDelete(null)}
                title={`¿Borrar el avatar "${avatarToDelete?.name}"?`}
                description="Esta acción es irreversible. Los alumnos que ya tengan este avatar equipado o desbloqueado dejarán de poder usarlo."
                confirmLabel="Sí, borrar este avatar"
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}

export default AvatarAdminPanel;
