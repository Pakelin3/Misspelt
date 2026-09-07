import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAxios from '@/utils/useAxios';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import BadgeGrid from './BadgeGrid';
import BadgeFormDialog from './BadgeFormDialog';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

const EMPTY_FORM = {
    title: '',
    description: '',
    category: 'BASIC',
    xp_reward: 50,
    avatar_reward: '',
    title_reward: '',
    condition_type: 'correct_slangs',
    condition_value: 10,
    condition_description: '',
    reward_description: '',
    is_secret: false,
    image: null
};

function BadgesAdminPanel() {
    const api = useAxios();
    const fileInputRef = useRef(null);

    const [badges, setBadges] = useState([]);
    const [avatars, setAvatars] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);
    const [badgeToDelete, setBadgeToDelete] = useState(null);

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [previewUrl, setPreviewUrl] = useState(null);
    const previewUrlRef = useRef(null);

    // La vista previa de un archivo recien elegido es un blob: URL creado con
    // createObjectURL. Sin revocarlo queda retenido en memoria durante toda la
    // vida de la pestaña. `previewUrl` también puede apuntar a la imagen ya
    // subida (una URL normal del backend), así que solo revocamos lo que
    // guardamos en el ref, nunca por adivinar el contenido del estado.
    const releasePreviewUrl = useCallback(() => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!isFormOpen) releasePreviewUrl();
        return () => releasePreviewUrl();
    }, [isFormOpen, releasePreviewUrl]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 500);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    const fetchBadges = useCallback(async (page, search) => {
        setLoading(true);
        try {
            const searchParam = search ? `&search=${search}` : '';
            const response = await api.get(`/badges/?page=${page}${searchParam}`);

            if (response.data.results) {
                setBadges(response.data.results);
                setTotalPages(Math.ceil(response.data.count / 12));
            } else {
                setBadges(Array.isArray(response.data) ? response.data : []);
            }
        } catch (err) {
            console.error("Error fetching badges:", err);
            toast.error("No se pudieron cargar las insignias", { description: "Revisa tu conexión y vuelve a intentarlo." });
        } finally {
            setLoading(false);
        }
    }, [api]);

    const fetchAvatars = useCallback(async () => {
        try {
            const response = await api.get(`/avatars/`);
            const data = response.data.results ? response.data.results : response.data;
            setAvatars(data);
        } catch (err) {
            console.error("Error fetching avatars:", err);
        }
    }, [api]);

    useEffect(() => {
        fetchBadges(currentPage, debouncedSearchTerm);
        fetchAvatars();
    }, [fetchBadges, fetchAvatars, currentPage, debouncedSearchTerm]);

    const handleOpenForm = (badge = null) => {
        releasePreviewUrl();
        if (badge) {
            setEditingBadge(badge);
            let condType = 'correct_slangs';
            let condValue = 10;
            if (badge.unlock_condition_data && badge.unlock_condition_data.length > 0) {
                condType = badge.unlock_condition_data[0].type || 'correct_slangs';
                condValue = badge.unlock_condition_data[0].value || 0;
            }

            let xp = 50;
            let avatarId = '';
            let titleRw = '';
            if (badge.reward_data) {
                if (badge.reward_data.exp) xp = badge.reward_data.exp;
                if (badge.reward_data.avatar_id) avatarId = badge.reward_data.avatar_id;
                if (badge.reward_data.title) titleRw = badge.reward_data.title;
            }

            setFormData({
                title: badge.title || '',
                description: badge.description || '',
                category: badge.category || 'BASIC',
                xp_reward: xp,
                avatar_reward: avatarId,
                title_reward: titleRw,
                condition_type: condType,
                condition_value: condValue,
                condition_description: badge.condition_description || '',
                reward_description: badge.reward_description || '',
                image: null
            });
            setPreviewUrl(badge.image);
        } else {
            setEditingBadge(null);
            setFormData(EMPTY_FORM);
            setPreviewUrl(null);
        }
        setIsFormOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'image/png' && file.type !== 'image/webp') {
                toast.error('Formato de imagen no válido', { description: 'Solo se permiten imágenes PNG o WebP.' });
                fileInputRef.current.value = '';
                return;
            }

            const img = new Image();
            // Este blob solo sirve para leer las dimensiones: se revoca en
            // cuanto la medición termina, tanto si carga como si falla, en
            // vez de dejarlo retenido en memoria indefinidamente.
            const measureUrl = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(measureUrl);

                // El servidor recorta al cuadrado y reescala a 80x80 al
                // guardar (ver `api.image_processing`), así que ya no hace
                // falta bloquear otras medidas: se avisa y se deja subir.
                // El único caso que sí degrada el resultado es una imagen
                // no cuadrada, porque el recorte se come parte del icono.
                if (img.width !== img.height) {
                    toast.warning('La imagen no es cuadrada', {
                        description: `Mide ${img.width}x${img.height}. El servidor recortará el centro para dejarla cuadrada, así que puede perder los bordes. Si quieres controlar el recorte, súbela ya cuadrada.`,
                    });
                } else if (img.width !== 80 || img.height !== 80) {
                    toast.info('Se ajustará el tamaño automáticamente', {
                        description: `Mide ${img.width}x${img.height}; el servidor la redimensionará a 80x80 píxeles al guardarla.`,
                    });
                }

                setFormData({ ...formData, image: file });
                releasePreviewUrl();
                const objectUrl = URL.createObjectURL(file);
                previewUrlRef.current = objectUrl;
                setPreviewUrl(objectUrl);
            };
            img.onerror = () => {
                URL.revokeObjectURL(measureUrl);
                toast.error('No se pudo leer la imagen', { description: 'El archivo podría estar dañado. Prueba con otro.' });
                fileInputRef.current.value = '';
            };
            img.src = measureUrl;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSend = new FormData();
        dataToSend.append('title', formData.title);
        dataToSend.append('description', formData.description);

        const conditionData = [{
            type: formData.condition_type,
            value: Number(formData.condition_value)
        }];
        dataToSend.append('unlock_condition_data', JSON.stringify(conditionData));
        dataToSend.append('condition_description', formData.condition_description || `${formData.condition_type}: ${formData.condition_value}`);

        const rewardData = {};
        if (Number(formData.xp_reward) > 0) rewardData.exp = Number(formData.xp_reward);
        if (formData.avatar_reward) rewardData.avatar_id = Number(formData.avatar_reward);
        if (formData.title_reward) rewardData.title = formData.title_reward;

        dataToSend.append('reward_data', JSON.stringify(rewardData));

        const defaultRewardDesc = [
            Number(formData.xp_reward) > 0 ? `+${formData.xp_reward} XP` : null,
            formData.title_reward ? `Título: ${formData.title_reward}` : null,
            formData.avatar_reward ? `Avatar` : null
        ].filter(Boolean).join(' | ') || 'Sin Recompensa';

        dataToSend.append('reward_description', formData.reward_description || defaultRewardDesc);

        dataToSend.append('category', formData.category);

        if (formData.image instanceof File) {
            dataToSend.append('image', formData.image);
        }

        try {
            if (editingBadge) {
                await api.patch(`/badges/${editingBadge.id}/`, dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('¡Insignia Actualizada!');
            } else {
                await api.post('/badges/', dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('¡Insignia Creada!');
            }
            setIsFormOpen(false);
            fetchBadges(currentPage, debouncedSearchTerm);
        } catch (err) {
            console.error(err);
            toast.error('No se pudo guardar la insignia', {
                description: 'Revisa que el título no esté repetido y que todos los campos obligatorios estén completos.'
            });
        }
    };

    const handleConfirmDelete = async () => {
        if (!badgeToDelete) return;
        try {
            await api.delete(`/badges/${badgeToDelete.id}/`);
            setBadgeToDelete(null);
            fetchBadges(currentPage, debouncedSearchTerm);
            toast.success('Insignia borrada');
        } catch {
            toast.error('No se pudo eliminar la insignia', { description: 'Inténtalo de nuevo en unos segundos.' });
        }
    };

    const filteredBadges = badges.filter(badge =>
        badge.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 border-4 border-foreground shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tighter flex items-center gap-2">
                        Insignias y Logros
                    </h2>
                    <p className="text-xs text-muted-foreground">Gestión de recompensas del juego</p>
                </div>

                <div className="flex w-full sm:w-auto gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <label htmlFor="badge-search" className="sr-only">Buscar insignia</label>
                        <Input
                            id="badge-search"
                            placeholder="Buscar insignia..."
                            className="pl-8 h-10 border-2 border-foreground rounded-none focus:ring-0 focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => handleOpenForm()}>
                        <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                        NUEVA
                    </Button>
                </div>
            </div>

            <BadgeGrid
                badges={filteredBadges}
                loading={loading}
                onEdit={handleOpenForm}
                onDeleteRequest={setBadgeToDelete}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <BadgeFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                editingBadge={editingBadge}
                formData={formData}
                setFormData={setFormData}
                avatars={avatars}
                fileInputRef={fileInputRef}
                previewUrl={previewUrl}
                onFileChange={handleFileChange}
                onSubmit={handleSubmit}
            />

            <ConfirmDeleteDialog
                open={!!badgeToDelete}
                onOpenChange={(open) => !open && setBadgeToDelete(null)}
                title={`¿Borrar la insignia "${badgeToDelete?.title}"?`}
                description="Esta acción es irreversible. Los alumnos que ya la hayan ganado la conservarán en su historial, pero nadie más podrá desbloquearla."
                confirmLabel="Sí, borrar esta insignia"
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}

export default BadgesAdminPanel;
