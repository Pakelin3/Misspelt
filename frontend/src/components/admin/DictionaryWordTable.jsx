import React from 'react';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function getTypeBadgeStyle(type) {
    switch (type) {
        case 'SLANG': return 'bg-word-slang/15 text-word-slang border-word-slang';
        case 'PHRASAL_VERB': return 'bg-word-noun/15 text-word-noun border-word-noun';
        case 'IDIOM': return 'bg-word-idiom/15 text-word-idiom border-word-idiom';
        case 'VOCABULARY': return 'bg-word-verb/15 text-word-verb border-word-verb';
        default: return 'bg-muted text-muted-foreground border-foreground';
    }
}

/**
 * Tabla del diccionario, extraída de DictionaryAdminPanel para que el panel
 * quepa bajo el límite de líneas. Puramente presentacional.
 */
export default function DictionaryWordTable({ words, loading, onEdit, onDeleteRequest }) {
    return (
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
                                                onClick={() => onEdit(word)}
                                                className="text-info hover:bg-info hover:text-info-foreground/10"
                                                aria-label={`Editar la palabra ${word.text}`}
                                            >
                                                <Edit className="w-5 h-5" aria-hidden="true" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDeleteRequest(word)}
                                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground/10"
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
    );
}
