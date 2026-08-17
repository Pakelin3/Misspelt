import React from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';

const CSV_COLUMNS = [
    { name: 'word', label: 'Palabra' },
    { name: 'translation', label: 'Traducción' },
    { name: 'word_type', label: 'Tipo (SLANG, PHRASAL_VERB, IDIOM, VOCABULARY)' },
    { name: 'difficulty_level', label: 'Nivel de dificultad (1-10)' },
    { name: 'definition', label: 'Definición en inglés' },
    { name: 'tags', label: 'Etiquetas separadas por coma' },
    { name: 'ex1_en', label: 'Ejemplo 1 en inglés' },
    { name: 'ex1_es', label: 'Ejemplo 1 en español' },
    { name: 'ex2_en', label: 'Ejemplo 2 en inglés' },
    { name: 'ex2_es', label: 'Ejemplo 2 en español' },
];

/**
 * Diálogo de importación masiva de palabras vía CSV, extraído de
 * DictionaryAdminPanel para que el panel quepa bajo el límite de líneas.
 */
export default function DictionaryCsvImportDialog({ open, onOpenChange, uploadFile, onFileSelect, onSubmit }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>IMPORTAR CSV</DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="text-sm font-sans text-muted-foreground space-y-2">
                        <p>Sube un archivo .csv cuya primera fila tenga exactamente estas columnas:</p>
                        <div className="overflow-x-auto border-2 border-foreground">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted uppercase text-2xs">
                                    <tr>
                                        <th className="p-2 border-b-2 border-foreground font-bold">Columna (CSV)</th>
                                        <th className="p-2 border-b-2 border-foreground font-bold">Qué va aquí</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-foreground/20">
                                    {CSV_COLUMNS.map(col => (
                                        <tr key={col.name}>
                                            <td className="p-2 font-mono font-bold text-foreground whitespace-nowrap"><code>{col.name}</code></td>
                                            <td className="p-2">{col.label}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="csv-file-input" className="block text-sm font-bold text-foreground tracking-wider">ARCHIVO CSV</label>
                        <input
                            id="csv-file-input"
                            type="file"
                            accept=".csv"
                            onChange={(e) => onFileSelect(e.target.files[0])}
                            className="w-full px-3 cursor-pointer py-2 bg-card border-2 border-foreground focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-sans text-sm shadow-pixel-sm"
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            CANCELAR
                        </Button>
                        <Button type="submit" disabled={!uploadFile}>
                            <Save className="w-4 h-4 mr-2" aria-hidden="true" /> SUBIR CSV
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
