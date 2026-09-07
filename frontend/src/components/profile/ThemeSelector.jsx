import { PixelMoonIcon, PixelSunIcon, PixelScreenIcon } from '@/components/PixelIcons';
import { useTheme } from '@/context/theme-context';

const OPCIONES = [
    { valor: 'light', etiqueta: 'Claro', Icono: PixelSunIcon },
    { valor: 'dark', etiqueta: 'Oscuro', Icono: PixelMoonIcon },
    { valor: 'system', etiqueta: 'Sistema', Icono: PixelScreenIcon },
];

/**
 * Selector de apariencia.
 *
 * Tres estados y no un interruptor: "sistema" no es un punto medio entre claro y
 * oscuro, es delegar la decision al dispositivo, y con un toggle binario no hay
 * forma de volver a esa opcion una vez que la abandonas.
 */
const ThemeSelector = () => {
    const { theme, preference, setPreference } = useTheme();

    return (
        <section className="bg-card text-card-foreground pixel-border p-5">
            <h3 className="font-mono text-2xs uppercase text-accent-strong mb-1">Apariencia</h3>
            <p className="font-sans text-lg text-muted-foreground mb-4">
                Elige cómo se ve Misspelt. La opción se recuerda en este dispositivo.
            </p>

            <div role="radiogroup" aria-label="Tema de la aplicación" className="grid grid-cols-1 xs:grid-cols-3 gap-3">
                {OPCIONES.map(({ valor, etiqueta, Icono }) => {
                    const seleccionado = preference === valor;
                    return (
                        <button
                            key={valor}
                            type="button"
                            role="radio"
                            aria-checked={seleccionado}
                            onClick={() => setPreference(valor)}
                            className={`
                                flex min-h-11 items-center justify-center gap-2 border-4 px-3 py-3 font-mono text-2xs uppercase
                                transition-transform pixel-btn
                                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2
                                ${seleccionado
                                    ? 'border-foreground bg-primary text-primary-foreground shadow-pixel-md'
                                    : 'border-foreground bg-background text-foreground shadow-pixel-sm hover:bg-muted'
                                }
                            `}
                        >
                            <Icono aria-hidden="true" className="w-4 h-4 shrink-0" />
                            {etiqueta}
                        </button>
                    );
                })}
            </div>

            {preference === 'system' && (
                <p aria-live="polite" className="font-sans text-base text-muted-foreground mt-3">
                    Siguiendo a tu dispositivo: ahora mismo en {theme === 'dark' ? 'oscuro' : 'claro'}.
                </p>
            )}
        </section>
    );
};

export default ThemeSelector;
