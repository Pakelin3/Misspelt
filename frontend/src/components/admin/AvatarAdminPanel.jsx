import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAxios from '@/utils/useAxios';
import { Plus, Trash2, Save, Search, Loader2, Upload, Image as ImageIcon, User, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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

    const [formData, setFormData] = useState({
        name: '',
        is_default: false,
        unlock_condition_description: '',
        image: null
    });
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
            setFormData({
                name: '',
                is_default: false,
                unlock_condition_description: '',
                image: null
            });
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
            toast.error('Error', { description: 'No se pudo guardar el avatar. Verifica el nombre único.' });
        }
    };

    const handleDelete = async (id) => {
        toast.custom((t) => (
            <div className="bg-card border-foreground w-[300px] flex flex-col gap-4 font-mono relative">
                <div className="flex flex-col gap-1">
                    <h3 className="font-bold uppercase flex items-center gap-2 text-destructive">
                        <Trash2 className="w-5 h-5" /> ¿ELIMINAR AVATAR?
                    </h3>
                    <p className="text-xs text-muted-foreground leading-tight">Esta acción es destructiva e irreversible.</p>
                </div>
                <div className="flex gap-2 mt-2">
                    <button onClick={() => toast.dismiss(t)} className="flex-1 px-2 py-2 border-2 border-foreground bg-muted hover:bg-background text-xs font-bold transition-colors uppercase">
                        Cancelar
                    </button>
                    <button onClick={async () => {
                        toast.dismiss(t);
                        try {
                            await api.delete(`/avatars/${id}/`);
                            fetchAvatars(currentPage, debouncedSearchTerm);
                            toast.success('Borrado');
                        } catch {
                            toast.error('Error', { description: 'No se pudo eliminar.' });
                        }
                    }} className="flex-1 px-2 py-2 border-2 border-transparent bg-destructive text-destructive-foreground hover:bg-red-600 text-xs font-bold transition-colors uppercase">
                        Sí, borrar
                    </button>
                </div>
            </div>
        ), { duration: 10000 });
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
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar avatar..."
                            className="pl-8 h-10 border-2 border-foreground rounded-none focus:ring-0 focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => handleOpenForm()} className="pixel-btn h-10 border-2 border-foreground rounded-none bg-primary text-primary-foreground hover:translate-y-1 transition-transform">
                        <Plus className="w-4 h-4 mr-2" />
                        NUEVO
                    </Button>
                </div>
            </div>

            <div className="bg-card border-4 border-foreground p-4 min-h-[400px] relative">
                {loading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
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
                                    <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-1 border border-foreground z-10">
                                        DEFAULT
                                    </div>
                                )}

                                <div className="w-24 h-24 sm:w-32 sm:h-32 mb-3 bg-background border-2 border-foreground relative overflow-hidden flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                                    {avatar.image ? (
                                        <img src={avatar.image} alt={avatar.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-muted-foreground" />
                                    )}
                                </div>

                                <div className="text-center w-full mb-3">
                                    <h3 className="font-bold text-sm truncate w-full" title={avatar.name}>{avatar.name}</h3>
                                    {avatar.is_default ? (
                                        <p className="text-[10px] text-green-600 font-bold">Disponible Inicialmente</p>
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground truncate w-full" title={avatar.unlock_condition_description}>
                                            {avatar.unlock_condition_description || "Bloqueado"}
                                        </p>
                                    )}
                                </div>

                                <div className="flex w-full gap-2 mt-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleOpenForm(avatar)}
                                        className="flex-1 h-7 text-[10px] border-2 border-foreground rounded-none pixel-btn hover:bg-blue-100 hover:text-blue-900 px-0"
                                    >
                                        EDITAR
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleDelete(avatar.id)}
                                        className="h-7 w-7 p-0 border-2 border-foreground rounded-none pixel-btn hover:bg-red-100 hover:text-red-900"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6 pt-4 border-t-4 border-foreground w-full">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="pixel-btn h-10 border-2 border-foreground rounded-none bg-accent hover:bg-accent/80 text-accent-foreground disabled:opacity-50"
                        >
                            ANTERIOR
                        </Button>
                        <span className="font-mono text-sm uppercase bg-foreground text-background px-3 py-1 font-bold">
                            PÁG {currentPage} DE {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="pixel-btn h-10 border-2 border-foreground rounded-none bg-accent hover:bg-accent/80 text-accent-foreground disabled:opacity-50"
                        >
                            SIGUIENTE
                        </Button>
                    </div>
                )}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-lg border-4 border-foreground shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center border-b-4 border-foreground shrink-0">
                            <h3 className="font-bold text-lg uppercase flex items-center gap-2">
                                {editingAvatar ? 'Editar Avatar' : 'Nuevo Avatar'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="flex items-center justify-center hover:bg-red-500 hover:text-white px-2 py-1 font-mono  border-2 border-transparent hover:border-foreground transition-colors">
                                X
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col items-center gap-3">
                                    <div
                                        className="w-40 h-40 border-4 border-dashed border-foreground/40 hover:border-primary/60 transition-colors bg-muted/20 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
                                                <ImageIcon className="w-10 h-10 mb-2" />
                                                <span className="text-[10px] font-bold">SUBIR IMAGEN</span>
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        Recomendado: 128x128px
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase">Nombre del Avatar</label>
                                        <Input
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
                                            {formData.is_default && <CheckCircle className="w-4 h-4 text-green-600" />}
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground -mt-2 ml-1">
                                        Si se marca, los nuevos usuarios podrán elegirlo inmediatamente.
                                    </p>

                                    {!formData.is_default && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-xs font-bold uppercase text-primary">Condición de Desbloqueo</label>
                                            <textarea
                                                className="w-full p-3 bg-background border-2 border-foreground rounded-none focus:outline-none focus:border-primary text-sm min-h-[80px]"
                                                value={formData.unlock_condition_description}
                                                onChange={e => setFormData({ ...formData, unlock_condition_description: e.target.value })}
                                                placeholder="Ej: Se desbloquea al alcanzar el Nivel 5..."
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>

                        <div className="p-4 border-t-4 border-foreground bg-muted/20 flex gap-3 shrink-0">
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="flex-1 border-2 border-foreground rounded-none pixel-btn h-12">
                                CANCELAR
                            </Button>
                            <Button onClick={handleSubmit} className="flex-1 border-2 border-foreground rounded-none pixel-btn bg-primary text-primary-foreground h-12">
                                <Save className="w-4 h-4 mr-2" />
                                {editingAvatar ? 'GUARDAR' : 'CREAR'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AvatarAdminPanel;