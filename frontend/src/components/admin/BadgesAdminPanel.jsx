import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAxios from '@/utils/useAxios';
import { Plus, Edit, Trash2, Save, X, Search, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

// Componentes UI Propios
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function BadgesAdminPanel() {
    const api = useAxios();
    const fileInputRef = useRef(null);

    // Estados de datos
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');

    // Estado del Formulario
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);

    // Estado de los campos del formulario
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'BASIC',
        xp_reward: 50,
        condition_type: 'correct_slangs',
        condition_value: 10,
        condition_description: '',
        reward_description: '',
        image: null // File object
    });
    const [previewUrl, setPreviewUrl] = useState(null);

    // --- FETCH DATA ---
    const fetchBadges = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get(`/badges/`);
            const data = response.data.results ? response.data.results : response.data;
            setBadges(data);
        } catch (err) {
            console.error("Error fetching badges:", err);
            toast.error("Error", { description: "No se pudieron cargar las insignias." });
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchBadges();
    }, [fetchBadges]);

    // --- MANEJADORES DEL FORMULARIO ---
    const handleOpenForm = (badge = null) => {
        if (badge) {
            setEditingBadge(badge);

            // Extract condition data safely
            let condType = 'correct_slangs';
            let condValue = 10;
            if (badge.unlock_condition_data && badge.unlock_condition_data.length > 0) {
                condType = badge.unlock_condition_data[0].type || 'correct_slangs';
                condValue = badge.unlock_condition_data[0].value || 0;
            }

            // Extract reward data safely
            let xp = 50;
            if (badge.reward_data && badge.reward_data.exp) {
                xp = badge.reward_data.exp;
            }

            setFormData({
                title: badge.title || '',
                description: badge.description || '',
                category: badge.category || 'BASIC',
                xp_reward: xp,
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
            setFormData({ ...formData, image: file });
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSend = new FormData();
        dataToSend.append('title', formData.title);
        dataToSend.append('description', formData.description);

        // Construct complex fields for backend
        const conditionData = [{
            type: formData.condition_type,
            value: Number(formData.condition_value)
        }];
        dataToSend.append('unlock_condition_data', JSON.stringify(conditionData));
        dataToSend.append('condition_description', formData.condition_description || `${formData.condition_type}: ${formData.condition_value}`);

        const rewardData = { exp: Number(formData.xp_reward) };
        dataToSend.append('reward_data', JSON.stringify(rewardData));
        dataToSend.append('reward_description', formData.reward_description || `+${formData.xp_reward} XP`);

        dataToSend.append('category', formData.category);

        if (formData.image instanceof File) {
            dataToSend.append('image', formData.image);
        }

        try {
            if (editingBadge) {
                await api.patch(`/badges/${editingBadge.id}/`, dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('¡Actualizado!');
            } else {
                await api.post('/badges/', dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('¡Creado!');
            }
            setIsFormOpen(false);
            fetchBadges();
        } catch (err) {
            console.error(err);
            let errorMessage = 'No se pudo guardar la insignia.';

            if (err.response?.data) {
                const data = err.response.data;
                const errorMessages = [];
                for (const key in data) {
                    if (Array.isArray(data[key])) {
                        errorMessages.push(`${key}: ${data[key].join(', ')}`);
                    } else if (typeof data[key] === 'string') {
                        errorMessages.push(data[key]);
                    }
                }

                if (errorMessages.length > 0) {
                    errorMessage = errorMessages.join(' | ');
                }
            }

            toast.error('Error de Validación', { description: errorMessage });
        }
    };

    const handleDelete = async (id) => {
        toast('¿ELIMINAR MEDALLA?', {
            description: "Esta acción no se puede deshacer.",
            action: {
                label: 'Sí, borrar',
                onClick: async () => {
                    try {
                        await api.delete(`/badges/${id}/`);
                        fetchBadges();
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

    // Filter by title
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
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar medalla..."
                            className="pl-8 h-10 border-2 border-foreground rounded-none focus:ring-0 focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => handleOpenForm()} className="pixel-btn h-10 border-2 border-foreground rounded-none bg-primary text-primary-foreground hover:translate-y-1 transition-transform">
                        <Plus className="w-4 h-4 mr-2" />
                        NUEVA
                    </Button>
                </div>
            </div>

            {/* --- TABLA PIXELADA (GRID VIEW PARA BADGES) --- */}
            <div className="bg-card border-4 border-foreground p-4 min-h-[400px] relative">
                {loading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                )}

                {filteredBadges.length === 0 && !loading ? (
                    <div className="text-center p-12 text-muted-foreground italic border-2 border-dashed border-foreground/30 m-4">
                        No hay medallas configuradas. ¡Crea la primera!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredBadges.map((badge) => {
                            // Extract display info safely
                            let xpDisplay = 0;
                            if (badge.reward_data && badge.reward_data.exp) xpDisplay = badge.reward_data.exp;

                            let conditionDisplay = "N/A";
                            if (badge.unlock_condition_data && badge.unlock_condition_data.length > 0) {
                                const c = badge.unlock_condition_data[0];
                                conditionDisplay = `${c.type}: ${c.value}`;
                            }

                            return (
                                <div key={badge.id} className="group relative bg-muted/20 border-2 border-foreground p-4 flex flex-col items-center text-center hover:bg-muted/40 transition-colors">
                                    {/* Badge Image Preview */}
                                    <div className="w-24 h-24 mb-4 bg-background border-2 border-foreground p-2 relative overflow-hidden flex items-center justify-center">
                                        {badge.image ? (
                                            <img src={badge.image} alt={badge.title} className="w-full h-full object-contain pixelated" />
                                        ) : (
                                            <div className="text-muted-foreground text-[10px]">NO IMAGE</div>
                                        )}
                                        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-1 font-bold border-l-2 border-b-2 border-foreground">
                                            +{xpDisplay} XP
                                        </div>
                                    </div>

                                    {/* Badge Info */}
                                    <h3 className="font-bold text-lg leading-tight mb-1">{badge.title}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 h-8">
                                        {badge.description}
                                    </p>

                                    {/* Category */}
                                    <div className="text-[9px] font-bold px-2 py-0.5 mb-2 border border-foreground uppercase">
                                        {badge.category || 'BASIC'}
                                    </div>

                                    {/* Action info */}
                                    <div className="text-[10px] font-bold bg-secondary/30 px-2 py-1 border border-foreground/30 mb-1 w-full truncate">
                                        Desafío: {badge.condition_description || conditionDisplay}
                                    </div>
                                    <div className="text-[10px] font-bold bg-primary/20 px-2 py-1 mb-4 border border-foreground/30 w-full truncate text-primary">
                                        Premio: {badge.reward_description || `+${xpDisplay} XP`}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex w-full gap-2 mt-auto">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleOpenForm(badge)}
                                            className="flex-1 h-8 text-xs border-2 border-foreground rounded-none pixel-btn hover:bg-blue-100 hover:text-blue-900"
                                        >
                                            <Edit className="w-3 h-3 mr-1" /> EDITAR
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleDelete(badge.id)}
                                            className="h-8 w-8 p-0 border-2 border-foreground rounded-none pixel-btn hover:bg-red-100 hover:text-red-900"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- MODAL FORMULARIO --- */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-2xl border-4 border-foreground shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center border-b-4 border-foreground shrink-0">
                            <h3 className="font-bold text-lg uppercase flex items-center gap-2">
                                {editingBadge ? 'Editar Insignia' : 'Nueva Insignia'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="hover:bg-red-500 hover:text-white p-1 border-2 border-transparent hover:border-foreground transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body Scrollable */}
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Columna Izquierda: Imagen */}
                                <div className="md:col-span-1 flex flex-col items-center gap-3">
                                    <label className="text-xs font-bold uppercase self-start">Icono / Imagen</label>
                                    <div
                                        className="w-full aspect-square border-4 border-dashed border-foreground/40 hover:border-primary/60 transition-colors bg-muted/20 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2 pixelated" />
                                        ) : (
                                            <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
                                                <ImageIcon className="w-8 h-8 mb-2" />
                                                <span className="text-[10px]">Click para subir</span>
                                            </div>
                                        )}

                                        {/* Overlay Hover */}
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
                                    <p className="text-[10px] text-muted-foreground text-center">
                                        Recomendado: PNG/WebP 512x512px <a href="https://thiings.co/" target="_blank" rel="noopener noreferrer" className="underline">thiings.co</a>
                                    </p>
                                </div>

                                {/* Columna Derecha: Datos */}
                                <div className="md:col-span-2 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase">Nombre de la Medalla</label>
                                            <Input
                                                required
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                className="border-2 border-foreground rounded-none focus:ring-0 focus:border-primary bg-background"
                                                placeholder="Ej: Cazador de Verbos"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase">Categoría</label>
                                            <select
                                                className="w-full h-10 px-3 bg-background border-2 border-foreground rounded-none focus:outline-none focus:border-primary text-sm font-mono"
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
                                        <label className="text-xs font-bold uppercase">Descripción General</label>
                                        <textarea
                                            required
                                            className="w-full p-2 bg-background border-2 border-foreground rounded-none focus:outline-none focus:border-primary text-sm min-h-[60px]"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Descripción que verá el usuario en su perfil..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-4 border-2 border-foreground p-3 bg-muted/10 relative mt-2 pt-4">
                                            <div className="absolute -top-3 left-2 bg-card px-1 text-[10px] font-bold border border-foreground">CONDICIÓN DE DESBLOQUEO</div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase">Tipo de Métrica</label>
                                                <select
                                                    className="w-full h-8 px-2 bg-background border border-foreground rounded-none focus:outline-none focus:border-primary text-xs font-mono"
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

                                                    <option value="general_accuracy">Precisión General (%)</option>
                                                    <option value="slang_accuracy">Precisión Slang (%)</option>
                                                    <option value="phrasal_verb_accuracy">Precisión Phrasal Verbs (%)</option>

                                                    <option value="answered_total_questions">Preguntas Respondidas</option>
                                                    <option value="correct_answers_total">Respuestas Correctas</option>

                                                    <option value="phrasal_verbs_seen">Phrasal Verbs Vistos</option>
                                                    <option value="slangs_seen">Slangs Vistos</option>
                                                    <option value="total_slangs_questions">Preguntas de Slangs</option>
                                                    <option value="correct_phrasal_verbs">Phrasal Verbs Correctos</option>
                                                    <option value="total_phrasal_verbs_questions">Preguntas de Phrasal Verbs</option>
                                                    <option value="current_streak">Racha Actual (Días)</option>
                                                    <option value="longest_streak">Racha Más Larga (Días)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase">Valor Necesario</label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={formData.condition_value}
                                                    onChange={e => setFormData({ ...formData, condition_value: e.target.value })}
                                                    className="h-8 border border-foreground rounded-none focus:ring-0 focus:border-primary text-right text-xs"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase block underline decoration-dashed">Texto Público Misión</label>
                                                <Input
                                                    required
                                                    value={formData.condition_description}
                                                    onChange={e => setFormData({ ...formData, condition_description: e.target.value })}
                                                    className="h-8 border border-foreground rounded-none focus:ring-0 focus:border-primary text-xs"
                                                    placeholder="Ej: Acertar 10 Slangs"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 border-2 border-foreground p-3 bg-muted/10 relative mt-2 pt-4">
                                            <div className="absolute -top-3 left-2 bg-card px-1 text-[10px] font-bold border border-foreground text-primary">RECOMPENSAS AL JUGADOR</div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase text-primary">Premios Base (XP)</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={formData.xp_reward}
                                                    onChange={e => setFormData({ ...formData, xp_reward: e.target.value })}
                                                    className="h-8 border border-foreground rounded-none focus:ring-0 focus:border-primary text-right font-bold text-xs"
                                                />
                                            </div>
                                            <div className="space-y-2 mt-auto">
                                                <label className="text-[10px] uppercase block underline decoration-dashed mt-4">Texto Público Premio</label>
                                                <Input
                                                    required
                                                    value={formData.reward_description}
                                                    onChange={e => setFormData({ ...formData, reward_description: e.target.value })}
                                                    className="h-8 border border-foreground rounded-none focus:ring-0 focus:border-primary text-xs"
                                                    placeholder="Ej: +50 XP"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Footer Buttons */}
                        <div className="p-4 border-t-4 border-foreground bg-muted/20 flex gap-3 shrink-0">
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="flex-1 border-2 border-foreground rounded-none pixel-btn h-12">
                                CANCELAR
                            </Button>
                            <Button onClick={handleSubmit} className="flex-1 border-2 border-foreground rounded-none pixel-btn bg-primary text-primary-foreground h-12">
                                <Save className="w-4 h-4 mr-2" />
                                {editingBadge ? 'GUARDAR CAMBIOS' : 'CREAR MEDALLA'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BadgesAdminPanel;