import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import useAxios from '@/utils/useAxios';

const WORD_TYPES = [
    { value: 'VOCABULARY', label: 'Vocabulario común' },
    { value: 'SLANG', label: 'Jerga (slang)' },
    { value: 'PHRASAL_VERB', label: 'Verbo frasal' },
    { value: 'IDIOM', label: 'Modismo (idiom)' },
];

const fieldClass =
    'w-full p-3 bg-background text-foreground border-2 border-input text-lg transition-colors ' +
    'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
    'aria-invalid:border-destructive disabled:opacity-60';

const WordSuggestionModal = ({ onClose }) => {
    const api = useAxios();
    const [formData, setFormData] = useState({
        wordText: '',
        wordType: 'VOCABULARY',
        definition: '',
        example: '',
    });
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState(null);
    const [issueNumber, setIssueNumber] = useState(null);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.wordText.trim() || !formData.definition.trim()) return;

        setStatus('loading');
        setErrorMessage(null);

        try {
            // El PAT de GitHub vive solo en el backend: el navegador nunca lo ve.
            const { data } = await api.post('/dictionary/suggest-word/', {
                wordText: formData.wordText.trim(),
                wordType: formData.wordType,
                definition: formData.definition.trim(),
                notes: formData.example.trim(),
            });
            setIssueNumber(data?.number ?? null);
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setErrorMessage(
                err?.response?.status === 429
                    ? 'Has enviado muchas sugerencias seguidas. Prueba de nuevo en un rato.'
                    : 'No pudimos enviar tu sugerencia. Inténtalo de nuevo en unos minutos.',
            );
        }
    };

    const isLoading = status === 'loading';
    const canSubmit = formData.wordText.trim() && formData.definition.trim() && !isLoading;

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg">
                {status === 'success' ? (
                    <div className="text-center">
                        <DialogHeader className="border-none pb-0 mb-4 pr-0">
                            <DialogTitle className="text-primary">¡Enviada a los astros!</DialogTitle>
                        </DialogHeader>
                        <DialogDescription className="mb-2">
                            Tu sugerencia quedó registrada y el equipo la revisará.
                        </DialogDescription>
                        {issueNumber && (
                            <p className="font-mono text-2xs text-muted-foreground mb-6">
                                Referencia #{issueNumber}
                            </p>
                        )}
                        <Button variant="accent" size="lg" onClick={onClose} className="w-full">
                            Cerrar
                        </Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                                <Send aria-hidden="true" className="w-6 h-6 text-primary shrink-0" />
                                Sugerir palabra
                            </DialogTitle>
                            <DialogDescription>
                                Propón una palabra que te gustaría ver en el diccionario.
                            </DialogDescription>
                        </DialogHeader>

                        {status === 'error' && (
                            <p
                                role="alert"
                                className="p-3 mb-4 bg-destructive/15 border-2 border-destructive text-destructive font-sans text-lg text-center"
                            >
                                {errorMessage}
                            </p>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5 font-sans">
                            <div>
                                <label htmlFor="suggest-word" className="block font-mono text-2xs text-muted-foreground uppercase mb-2">
                                    Palabra <span aria-hidden="true">*</span>
                                    <span className="sr-only">(obligatorio)</span>
                                </label>
                                <input
                                    id="suggest-word"
                                    name="wordText"
                                    type="text"
                                    required
                                    lang="en"
                                    autoComplete="off"
                                    placeholder="Ej. Awkward"
                                    className={fieldClass}
                                    value={formData.wordText}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label htmlFor="suggest-type" className="block font-mono text-2xs text-muted-foreground uppercase mb-2">
                                    Tipo <span aria-hidden="true">*</span>
                                    <span className="sr-only">(obligatorio)</span>
                                </label>
                                <select
                                    id="suggest-type"
                                    name="wordType"
                                    className={fieldClass}
                                    value={formData.wordType}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                >
                                    {WORD_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="suggest-definition" className="block font-mono text-2xs text-muted-foreground mb-2">
                                    Definición sugerida <span aria-hidden="true">*</span>
                                    <span className="sr-only">(obligatorio)</span>
                                </label>
                                <textarea
                                    id="suggest-definition"
                                    name="definition"
                                    required
                                    placeholder="¿Qué significa y por qué deberíamos añadirla?"
                                    className={`${fieldClass} min-h-25 resize-y`}
                                    value={formData.definition}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label htmlFor="suggest-example" className="block font-mono text-2xs text-muted-foreground uppercase mb-2">
                                    Ejemplo de uso <span className="normal-case">(opcional)</span>
                                </label>
                                <textarea
                                    id="suggest-example"
                                    name="example"
                                    lang="en"
                                    placeholder="Ej. He made things awkward when he laughed out loud."
                                    className={`${fieldClass} min-h-20 resize-y`}
                                    value={formData.example}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>

                            <Button type="submit" size="lg" disabled={!canSubmit} className="w-full">
                                {isLoading ? (
                                    <>
                                        <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />
                                        Enviando…
                                    </>
                                ) : (
                                    'Enviar sugerencia'
                                )}
                            </Button>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default WordSuggestionModal;
