import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAxios from '@/utils/useAxios';
import { Plus, Edit, Trash2, Save, X, Search, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2';

// Componentes UI Propios
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function BadgesAdminPanel() {
    const api = useAxios();
    const fileInputRef = useRef(null);

    // Estados de datos
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Paginación y Filtros (Simplificado para Badges que suelen ser menos)
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // Estado del Formulario
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);

    // Estado de los campos del formulario
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        xp_reward: 50,
        condition_type: 'WORDS_UNLOCKED',
        condition_value: 10,
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
            setError("No se pudieron cargar las insignias.");
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
            let condType = 'WORDS_UNLOCKED';
            let condValue = 10;
            if (badge.unlock_condition_data && badge.unlock_condition_data.length > 0) {
                condType = badge.unlock_condition_data[0].type || 'WORDS_UNLOCKED';
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
                xp_reward: xp,
                condition_type: condType,
                condition_value: condValue,
                image: null
            });
            setPreviewUrl(badge.image);
        } else {
            setEditingBadge(null);
            setFormData({
                title: '',
                description: '',
                xp_reward: 50,
                condition_type: 'WORDS_UNLOCKED',
                condition_value: 10,
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
        dataToSend.append('condition_description', `${formData.condition_type}: ${formData.condition_value}`); // Simple generation

        const rewardData = { exp: Number(formData.xp_reward) };
        dataToSend.append('reward_data', JSON.stringify(rewardData));
        dataToSend.append('reward_description', `+${formData.xp_reward} XP`); // Simple generation

        dataToSend.append('category', 'BASIC'); // Default category

        if (formData.image instanceof File) {
            dataToSend.append('image', formData.image);
        }

        try {
            if (editingBadge) {
                await api.patch(`/badges/${editingBadge.id}/`, dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                Swal.fire({
                    title: '¡Actualizado!',
                    icon: 'success',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            } else {
                await api.post('/badges/', dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                Swal.fire({
                    title: '¡Creado!',
                    icon: 'success',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
            setIsFormOpen(false);
            fetchBadges();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data ? JSON.stringify(err.response.data) : 'No se pudo guardar.';
            Swal.fire('Error', msg, 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿ELIMINAR MEDALLA?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'font-mono border-4 border-black rounded-none'
            }
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/badges/${id}/`);
                fetchBadges();
                Swal.fire({
                    title: 'Borrado',
                    icon: 'success',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
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

                                    <div className="text-[10px] font-bold bg-secondary/50 px-2 py-1 rounded-none border border-foreground/30 mb-4 w-full truncate">
                                        {conditionDisplay}
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
                                        Recomendado: PNG/WebP 512x512px (thiings.co)
                                    </p>
                                </div>

                                {/* Columna Derecha: Datos */}
                                <div className="md:col-span-2 space-y-4">
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
                                        <label className="text-xs font-bold uppercase">Descripción</label>
                                        <textarea
                                            required
                                            className="w-full p-3 bg-background border-2 border-foreground rounded-none focus:outline-none focus:border-primary text-sm min-h-[80px]"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Descripción que verá el usuario..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-primary">Recompensa XP</label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={formData.xp_reward}
                                                onChange={e => setFormData({ ...formData, xp_reward: e.target.value })}
                                                className="border-2 border-foreground rounded-none focus:ring-0 focus:border-primary text-right font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase">Valor Objetivo</label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={formData.condition_value}
                                                onChange={e => setFormData({ ...formData, condition_value: e.target.value })}
                                                className="border-2 border-foreground rounded-none focus:ring-0 focus:border-primary text-right"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase">Tipo de Condición</label>
                                        <select
                                            className="w-full h-10 px-3 bg-background border-2 border-foreground rounded-none focus:outline-none focus:border-primary text-sm font-mono"
                                            value={formData.condition_type}
                                            onChange={e => setFormData({ ...formData, condition_type: e.target.value })}
                                        >
                                            <option value="correct_slangs">Slangs Acertados</option>
                                            <option value="total_exp_achieved">Experiencia Total</option>
                                            <option value="answered_total_questions">Preguntas Respondidas</option>
                                            <option value="words_seen_total">Palabras Vistas</option>
                                            <option value="phrasal_verbs_seen">Phrasal Verbs Vistos</option>
                                            <option value="correct_answers_total">Respuestas Correctas</option>
                                            <option value="total_slangs_questions">Preguntas de Slangs</option>
                                            <option value="correct_phrasal_verbs">Phrasal Verbs Correctos</option>
                                            <option value="total_phrasal_verbs_questions">Preguntas de Phrasal Verbs</option>
                                            <option value="current_streak">Racha Actual</option>
                                            <option value="longest_streak">Racha Más Larga</option>
                                        </select>
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