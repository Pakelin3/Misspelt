import React, { useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';

const WordSuggestionModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
        wordText: '',
        wordType: 'VOCABULARIO',
        definition: '',
        example: ''
    });
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.wordText || !formData.definition) return;

        setStatus('loading');

        try {
            const pat = import.meta.env.VITE_GITHUB_API_KEY_PAT_ISSUES;
            const url = 'https://api.github.com/repos/Pakelin3/Misspelt/issues';

            const issueBody = `### Tipo de Palabra\n${formData.wordType}\n\n### Definición\n${formData.definition}\n\n### Ejemplo de Uso\n${formData.example || '*Sin ejemplo provisto*'}\n\n---\n*Sugerencia enviada desde la interfaz de usuario de Misspelt.*`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${pat}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: `[Sugerencia de Palabra] ${formData.wordText}`,
                    body: issueBody,
                    labels: ['word-suggestion']
                })
            });

            if (!response.ok) {
                throw new Error('Fallo al crear el Issue en GitHub');
            }

            setStatus('success');
            setTimeout(() => {
                onClose();
            }, 3000);

        } catch (error) {
            console.error("Error enviando la sugerencia:", error);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
                <div className="bg-card pixel-border p-8 text-center max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <h2 className="text-2xl font-mono text-primary font-bold mb-4">¡ENVIADO A LOS ASTROS!</h2>
                    <p className="text-foreground font-sans text-lg mb-6">Tu sugerencia ha sido enviada con éxito. Los sabios del Oráculo la revisarán pronto.</p>
                    <button onClick={onClose} className="px-6 py-3 bg-accent text-accent-foreground font-bold pixel-btn shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[2px] transition-all">
                        CERRAR
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="relative bg-card pixel-border p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                
                <div className="flex items-center justify-between border-b-4 border-muted pb-4 mb-6">
                    <h2 className="text-2xl font-mono text-foreground font-bold flex items-center gap-2">
                        <Send className="w-6 h-6 text-primary" />
                        SUGERIR PALABRA
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-destructive font-mono text-xl transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {status === 'error' && (
                    <div className="p-3 mb-4 bg-destructive/20 border-2 border-destructive text-destructive font-sans font-bold text-center">
                        Hubo un problema de conexión al enviar la sugerencia.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 font-sans max-h-full">
                    <div>
                        <label className="block font-mono text-xs text-muted-foreground uppercase mb-1">Palabra *</label>
                        <input
                            type="text"
                            name="wordText"
                            required
                            placeholder="Ej. Awkward"
                            className="w-full p-3 bg-background border-2 border-muted focus:border-primary focus:outline-none transition-colors text-lg"
                            value={formData.wordText}
                            onChange={handleChange}
                            disabled={status === 'loading'}
                        />
                    </div>

                    <div>
                        <label className="block font-mono text-xs text-muted-foreground uppercase mb-1">Tipo *</label>
                        <select
                            name="wordType"
                            className="w-full p-3 bg-background border-2 border-muted focus:border-primary focus:outline-none transition-colors text-lg"
                            value={formData.wordType}
                            onChange={handleChange}
                            disabled={status === 'loading'}
                        >
                            <option value="VOCABULARIO">Vocabulario Común</option>
                            <option value="SLANG">Jerga (Slang)</option>
                            <option value="PHRASAL_VERB">Verbo Frasal</option>
                            <option value="IDIOM">Modismo (Idiom)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-mono text-xs text-muted-foreground uppercase mb-1">Definición Sugerida *</label>
                        <textarea
                            name="definition"
                            required
                            placeholder="¿Qué significa y por qué deberíamos añadirla?"
                            className="w-full p-3 bg-background border-2 border-muted focus:border-primary focus:outline-none transition-colors text-lg min-h-[100px] resize-y"
                            value={formData.definition}
                            onChange={handleChange}
                            disabled={status === 'loading'}
                        ></textarea>
                    </div>

                    <div>
                        <label className="block font-mono text-xs text-muted-foreground uppercase mb-1">Ejemplo de Uso (Opcional)</label>
                        <textarea
                            name="example"
                            placeholder="Ej. He made things awkward when he laughed out loud."
                            className="w-full p-3 bg-background border-2 border-muted focus:border-primary focus:outline-none transition-colors text-lg min-h-[80px] resize-y"
                            value={formData.example}
                            onChange={handleChange}
                            disabled={status === 'loading'}
                        ></textarea>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={status === 'loading' || !formData.wordText || !formData.definition}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 font-mono text-xl font-bold pixel-btn border-4 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 className="animate-spin w-5 h-5" />
                                    ENVIANDO...
                                </>
                            ) : 'ENVIAR SUGERENCIA'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WordSuggestionModal;
