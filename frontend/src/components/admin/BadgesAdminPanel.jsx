import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAxios from '@/utils/useAxios';
import { Plus, Edit, Trash2, Save, Search, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';

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

    const [formData, setFormData] = useState({
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
            setFormData({
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
                image: null
            });
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
            img.onload = () => {
                if (img.width !== 80 || img.height !== 80) {
                    toast.error('Tamaño de imagen incorrecto', { description: `Debe medir 80x80 píxeles exactos (subiste ${img.width}x${img.height}). Puedes ajustar el tamaño en squoosh.app.` });
                    fileInputRef.current.value = '';
                } else {
                    setFormData({ ...formData, image: file });
                    const objectUrl = URL.createObjectURL(file);
                    setPreviewUrl(objectUrl);
                }
            };
            img.src = URL.createObjectURL(file);
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
            {/* --- TOP BAR --- */}
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

            {/* --- TABLA PIXELADA (GRID VIEW PARA BADGES) --- */}
            <div className="bg-card border-4 border-foreground p-4 min-h-[400px] relative">
                {loading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-raised flex items-center justify-center" role="status" aria-live="polite">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden="true" />
                        <span className="sr-only">Cargando insignias...</span>
                    </div>
                )}

                {filteredBadges.length === 0 && !loading ? (
                    <div className="text-center p-12 text-muted-foreground italic border-2 border-dashed border-foreground/30 m-4">
                        No hay insignias configuradas. ¡Crea la primera!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredBadges.map((badge) => {
                            let xpDisplay = 0;
                            if (badge.reward_data && badge.reward_data.exp) xpDisplay = badge.reward_data.exp;

                            let conditionDisplay = "N/A";
                            if (badge.unlock_condition_data && badge.unlock_condition_data.length > 0) {
                                const c = badge.unlock_condition_data[0];
                                conditionDisplay = `${c.type}: ${c.value}`;
                            }

                            return (
                                <div key={badge.id} className="group relative bg-muted/20 border-2 border-foreground p-4 flex flex-col items-center text-center hover:bg-muted/40 transition-colors">
                                    <div className="w-24 h-24 mb-4 bg-background border-2 border-foreground p-2 relative overflow-hidden flex items-center justify-center">
                                        {badge.image ? (
                                            <img src={badge.image} alt={badge.title} width={96} height={96} loading="lazy" className="w-full h-full object-contain pixelated" />
                                        ) : (
                                            <div className="text-muted-foreground text-2xs">NO IMAGE</div>
                                        )}
                                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-2xs px-1 font-bold border-l-2 border-b-2 border-foreground">
                                            +{xpDisplay} XP
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-lg leading-tight mb-1">{badge.title}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 h-8">
                                        {badge.description}
                                    </p>

                                    <div className="text-3xs font-bold px-2 py-0.5 mb-2 border border-foreground uppercase">
                                        {badge.category || 'BASIC'}
                                    </div>

                                    <div className="text-2xs font-bold bg-secondary/30 px-2 py-1 border border-foreground/30 mb-1 w-full truncate">
                                        Desafío: {badge.condition_description || conditionDisplay}
                                    </div>
                                    <div className="text-2xs font-bold bg-primary/20 px-2 py-1 mb-4 border border-foreground/30 w-full truncate text-primary">
                                        Premio: {badge.reward_description || `+${xpDisplay} XP`}
                                    </div>

                                    <div className="flex w-full gap-2 mt-auto">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenForm(badge)}
                                            className="flex-1"
                                        >
                                            <Edit className="w-3 h-3 mr-1" aria-hidden="true" /> EDITAR
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setBadgeToDelete(badge)}
                                            className="text-destructive hover:bg-destructive/10"
                                            aria-label={`Eliminar insignia ${badge.title}`}
                                        >
                                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!loading && totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6 pt-4 border-t-4 border-foreground w-full">
                        <Button
                            variant="accent"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            ANTERIOR
                        </Button>
                        <span className="font-mono text-sm uppercase bg-foreground text-background px-3 py-1 font-bold">
                            PÁG {currentPage} DE {totalPages}
                        </span>
                        <Button
                            variant="accent"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            SIGUIENTE
                        </Button>
                    </div>
                )}
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{editingBadge ? 'Editar Insignia' : 'Nueva Insignia'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 flex flex-col items-center gap-3">
                                <label htmlFor="badge-file-input" className="text-xs font-bold uppercase self-start">Icono / Imagen</label>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-full aspect-square border-4 border-dashed border-foreground/40 hover:border-primary/60 transition-colors bg-muted/20 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Vista previa de la insignia" loading="lazy" className="w-full h-full object-contain p-2 pixelated" />
                                    ) : (
                                        <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
                                            <ImageIcon className="w-8 h-8 mb-2" aria-hidden="true" />
                                            <span className="text-2xs">Click para subir</span>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="w-8 h-8 text-background" aria-hidden="true" />
                                    </div>
                                </button>
                                <input
                                    id="badge-file-input"
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <p className="text-2xs text-muted-foreground text-center">
                                    Recomendado: PNG/WebP 80x80px <a href="https://thiings.co/" target="_blank" rel="noopener noreferrer" className="underline">thiings.co</a>
                                </p>
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="badge-title" className="text-xs font-bold uppercase">Nombre de la Insignia</label>
                                        <Input
                                            id="badge-title"
                                            required
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="border-2 border-foreground rounded-none focus:ring-0 focus:border-primary bg-background"
                                            placeholder="Ej: Cazador de Verbos"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="badge-category" className="text-xs font-bold uppercase">Categoría</label>
                                        <select
                                            id="badge-category"
                                            className="w-full h-10 px-3 bg-background border-2 border-foreground rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary text-sm font-mono"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="BASIC">Básica</option>
                                            <option value="RARE">Rara</option>
                                            <option value="EPIC">Épica</option>
                                            <option value="LEGENDARY">Legendaria</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="badge-description" className="text-xs font-bold uppercase">Descripción General</label>
                                    <textarea
                                        id="badge-description"
                                        required
                                        className="w-full p-2 bg-background border-2 border-foreground rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary text-sm min-h-[60px]"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Descripción que verá el usuario en su perfil..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-4 border-2 border-foreground p-3 bg-muted/10 relative mt-2 pt-4">
                                        <div className="absolute -top-3 left-2 bg-card px-1 text-2xs font-bold border border-foreground">CONDICIÓN DE DESBLOQUEO</div>
                                        <div className="space-y-2">
                                            <label htmlFor="badge-condition-type" className="text-2xs uppercase">Tipo de Métrica</label>
                                            <select
                                                id="badge-condition-type"
                                                className="w-full h-8 px-2 bg-background border border-foreground rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary text-xs font-mono"
                                                value={formData.condition_type}
                                                onChange={e => setFormData({ ...formData, condition_type: e.target.value })}
                                            >
                                                <option value="correct_slangs">Slangs Acertados</option>
                                                <option value="slangs_learned">Slangs Dominados</option>
                                                <option value="idioms_learned">Idioms Dominados</option>
                                                <option value="phrasal_verbs_learned">Phrasal Verbs Dominados</option>
                                                <option value="vocabulary_learned">Vocabulario Dominado</option>

                                                <option value="words_seen_total">Descubrimientos Totales</option>
                                                <option value="unique_words_unlocked">Palabras Únicas en Colección</option>
                                                <option value="avatars_unlocked">Avatares Desbloqueados</option>

                                                <option value="level_reached">Nivel de Jugador</option>
                                                <option value="total_exp_achieved">Experiencia Total</option>

                                                <option value="total_letters_killed">Letras Eliminadas (Total)</option>
                                                <option value="total_bosses_killed">Jefes Derrotados (Total)</option>
                                                <option value="total_time_played_seconds">Tiempo Jugado (Segundos, Total)</option>
                                                <option value="single_game_letters_killed">Letras Eliminadas (Misma Partida)</option>
                                                <option value="single_game_bosses_killed">Jefes Derrotados (Misma Partida)</option>
                                                <option value="single_game_time_survived">Sobrevivir Tiempo (Segundos, Misma Partida)</option>

                                                <option value="general_accuracy">Precisión General (%)</option>
                                                <option value="slang_accuracy">Precisión Slang (%)</option>
                                                <option value="phrasal_verb_accuracy">Precisión Phrasal Verbs (%)</option>

                                                <option value="answered_total_questions">Preguntas Respondidas</option>
                                                <option value="correct_answers_total">Respuestas Correctas</option>

                                                <option value="phrasal_verbs_seen">Phrasal Verbs Vistos</option>
                                                <option value="slangs_seen">Slangs Vistos</option>
                                                <option value="correct_phrasal_verbs">Phrasal Verbs Correctos</option>
                                                <option value="current_streak">Racha Actual (Días)</option>
                                                <option value="longest_streak">Racha Más Larga (Días)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="badge-condition-value" className="text-2xs uppercase">Valor Necesario</label>
                                            <Input
                                                id="badge-condition-value"
                                                type="number"
                                                min="1"
                                                value={formData.condition_value}
                                                onChange={e => setFormData({ ...formData, condition_value: e.target.value })}
                                                className="h-8 border border-foreground rounded-none focus:ring-0 focus:border-primary text-right text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="badge-condition-description" className="text-2xs uppercase block underline decoration-dashed">Texto Público Misión</label>
                                            <Input
                                                id="badge-condition-description"
                                                required
                                                value={formData.condition_description}
                                                onChange={e => setFormData({ ...formData, condition_description: e.target.value })}
                                                className="h-8 border border-foreground rounded-none focus:ring-0 focus:border-primary text-xs"
                                                placeholder="Ej: Acertar 10 Slangs"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-2 border-foreground p-3 bg-muted/10 relative mt-2 pt-4">
                                        <div className="absolute -top-3 left-2 bg-card px-1 text-2xs font-bold border border-foreground text-primary">RECOMPENSAS AL JUGADOR</div>
                                        <div className="space-y-2">
                                            <label htmlFor="badge-xp-reward" className="text-2xs uppercase text-primary">Premios Base (XP)</label>
                                            <Input
                                                id="badge-xp-reward"
                                                type="number"
                                                min="0"
                                                value={formData.xp_reward}
                                                onChange={e => setFormData({ ...formData, xp_reward: e.target.value })}
                                                className="h-8 border border-foreground rounded-none focus:ring-0 focus:border-primary text-right font-bold text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2 mt-2">
                                            <label htmlFor="badge-avatar-reward" className="text-2xs uppercase text-primary">Avatar (Opcional)</label>
                                            <select
                                                id="badge-avatar-reward"
                                                className="w-full h-8 px-2 bg-background border border-foreground text-foreground rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary text-xs"
                                                value={formData.avatar_reward}
                                                onChange={e => setFormData({ ...formData, avatar_reward: e.target.value })}
                                            >
                                                <option value="">Ninguno</option>
                                                {avatars.map(av => (
                                                    <option key={av.id} value={av.id}>{av.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2 mt-2">
                                            <label htmlFor="badge-title-reward" className="text-2xs uppercase text-primary">Título (Opcional)</label>
                                            <Input
                                                id="badge-title-reward"
                                                type="text"
                                                value={formData.title_reward}
                                                onChange={e => setFormData({ ...formData, title_reward: e.target.value })}
                                                placeholder="Ej: Maestro de las Letras"
                                                className="h-8 border border-foreground rounded-none focus:ring-0 focus:border-primary text-xs w-full"
                                            />
                                        </div>
                                        <div className="space-y-2 mt-auto">
                                            <label htmlFor="badge-reward-description" className="text-2xs uppercase block underline decoration-dashed mt-4">Texto Público Premio</label>
                                            <Input
                                                id="badge-reward-description"
                                                value={formData.reward_description}
                                                onChange={e => setFormData({ ...formData, reward_description: e.target.value })}
                                                className="h-8 border border-foreground rounded-none focus:ring-0 focus:border-primary text-xs"
                                                placeholder="Opcional. Se autogenera"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                CANCELAR
                            </Button>
                            <Button type="submit">
                                <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                                {editingBadge ? 'GUARDAR CAMBIOS' : 'CREAR INSIGNIA'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!badgeToDelete} onOpenChange={(open) => !open && setBadgeToDelete(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">¿Borrar la insignia "{badgeToDelete?.title}"?</DialogTitle>
                        <DialogDescription>
                            Esta acción es irreversible. Los alumnos que ya la hayan ganado la
                            conservarán en su historial, pero nadie más podrá desbloquearla.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBadgeToDelete(null)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            Sí, borrar esta insignia
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default BadgesAdminPanel;
