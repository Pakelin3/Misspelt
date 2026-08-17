import React from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import ImageUploadField from './ImageUploadField';

const CONDITION_TYPE_OPTIONS = [
    { value: 'correct_slangs', label: 'Slangs Acertados' },
    { value: 'slangs_learned', label: 'Slangs Dominados' },
    { value: 'idioms_learned', label: 'Idioms Dominados' },
    { value: 'phrasal_verbs_learned', label: 'Phrasal Verbs Dominados' },
    { value: 'vocabulary_learned', label: 'Vocabulario Dominado' },
    { value: 'words_seen_total', label: 'Descubrimientos Totales' },
    { value: 'unique_words_unlocked', label: 'Palabras Únicas en Colección' },
    { value: 'avatars_unlocked', label: 'Avatares Desbloqueados' },
    { value: 'level_reached', label: 'Nivel de Jugador' },
    { value: 'total_exp_achieved', label: 'Experiencia Total' },
    { value: 'total_letters_killed', label: 'Letras Eliminadas (Total)' },
    { value: 'total_bosses_killed', label: 'Jefes Derrotados (Total)' },
    { value: 'total_time_played_seconds', label: 'Tiempo Jugado (Segundos, Total)' },
    { value: 'single_game_letters_killed', label: 'Letras Eliminadas (Misma Partida)' },
    { value: 'single_game_bosses_killed', label: 'Jefes Derrotados (Misma Partida)' },
    { value: 'single_game_time_survived', label: 'Sobrevivir Tiempo (Segundos, Misma Partida)' },
    { value: 'general_accuracy', label: 'Precisión General (%)' },
    { value: 'slang_accuracy', label: 'Precisión Slang (%)' },
    { value: 'phrasal_verb_accuracy', label: 'Precisión Phrasal Verbs (%)' },
    { value: 'answered_total_questions', label: 'Preguntas Respondidas' },
    { value: 'correct_answers_total', label: 'Respuestas Correctas' },
    { value: 'phrasal_verbs_seen', label: 'Phrasal Verbs Vistos' },
    { value: 'slangs_seen', label: 'Slangs Vistos' },
    { value: 'correct_phrasal_verbs', label: 'Phrasal Verbs Correctos' },
    { value: 'current_streak', label: 'Racha Actual (Días)' },
    { value: 'longest_streak', label: 'Racha Más Larga (Días)' },
];

/**
 * Formulario modal de creación/edición de insignia, extraído de
 * BadgesAdminPanel. Recibe formData/setFormData ya armados por el panel: no
 * conoce la forma de la petición a la API, solo edita los campos.
 */
export default function BadgeFormDialog({
    open,
    onOpenChange,
    editingBadge,
    formData,
    setFormData,
    avatars,
    fileInputRef,
    previewUrl,
    onFileChange,
    onSubmit,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{editingBadge ? 'Editar Insignia' : 'Nueva Insignia'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 flex flex-col items-center gap-3">
                            <ImageUploadField
                                id="badge-file-input"
                                fileInputRef={fileInputRef}
                                previewUrl={previewUrl}
                                onFileChange={onFileChange}
                                alt="Vista previa de la insignia"
                                label="Icono / Imagen"
                                buttonClassName="w-full aspect-square border-4 border-dashed border-foreground/40 hover:border-primary/60 transition-colors bg-muted/20 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                imageClassName="w-full h-full object-contain p-2 pixelated"
                                helper={(
                                    <p className="text-2xs text-muted-foreground text-center">
                                        Recomendado: PNG/WebP 80x80px <a href="https://thiings.co/" target="_blank" rel="noopener noreferrer" className="underline">thiings.co</a>
                                    </p>
                                )}
                            />
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
                                    <label htmlFor="badge-category" className="text-xs font-bold ">Categoría</label>
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
                                <label htmlFor="badge-description" className="text-xs font-bold ">Descripción General</label>
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
                                    <div className="absolute -top-3 left-2 bg-card px-1 text-2xs font-bold border border-foreground">Condición de desbloqueo</div>
                                    <div className="space-y-2">
                                        <label htmlFor="badge-condition-type" className="text-2xs ">Tipo de Métrica</label>
                                        <select
                                            id="badge-condition-type"
                                            className="w-full h-8 px-2 bg-background border border-foreground rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary text-xs font-mono"
                                            value={formData.condition_type}
                                            onChange={e => setFormData({ ...formData, condition_type: e.target.value })}
                                        >
                                            {CONDITION_TYPE_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
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
                                        <label htmlFor="badge-condition-description" className="text-2xs block underline decoration-dashed">Texto Público Misión</label>
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
                                        <label htmlFor="badge-title-reward" className="text-2xs text-primary">Título (Opcional)</label>
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
                                        <label htmlFor="badge-reward-description" className="text-2xs block underline decoration-dashed mt-4">Texto Público Premio</label>
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
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
    );
}
