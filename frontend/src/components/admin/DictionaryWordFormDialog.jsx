import React from 'react';
import { Plus, Edit, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';

/**
 * Formulario modal de creación/edición de palabra, extraído de
 * DictionaryAdminPanel para que el panel quepa bajo el límite de líneas.
 */
export default function DictionaryWordFormDialog({
    open,
    onOpenChange,
    editingWord,
    formData,
    setFormData,
    onSubmit,
    onAddExample,
    onRemoveExample,
    onExampleChange,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {editingWord ? <Edit className="w-5 h-5" aria-hidden="true" /> : <Plus className="w-5 h-5" aria-hidden="true" />}
                        {editingWord ? 'Editar Palabra' : 'Nueva Palabra'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
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
                            <label htmlFor="word-translation" className="text-xs font-bold ">Traducción</label>
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
                        <label htmlFor="word-definition" className="text-xs font-bold ">Definición (En inglés)</label>
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
                                onClick={onAddExample}
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
                                        onChange={(e) => onExampleChange(index, 'en', e.target.value)}
                                    />
                                    <label htmlFor={`example-es-${index}`} className="sr-only">Ejemplo {index + 1} en español</label>
                                    <input
                                        id={`example-es-${index}`}
                                        type="text"
                                        className="w-full p-2 bg-transparent border-b-2 border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary text-sm font-sans placeholder:italic text-muted-foreground"
                                        placeholder="Traducción en español (e.g. El coche se descompuso.)"
                                        value={example.es}
                                        onChange={(e) => onExampleChange(index, 'es', e.target.value)}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onRemoveExample(index)}
                                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0"
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
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
    );
}
