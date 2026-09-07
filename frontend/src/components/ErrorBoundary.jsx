import { Component } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Red de seguridad de render.
 *
 * Sin esto, una respuesta de API con forma inesperada (un `.map()` sobre
 * undefined en cualquier vista) desmonta el arbol entero y el usuario se queda
 * mirando una pantalla en blanco, sin ruta de salida.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        // Punto unico donde enganchar telemetria (Sentry u otro) mas adelante.
        console.error('[ErrorBoundary]', error, info?.componentStack);
    }

    handleRetry = () => {
        this.setState({ error: null });
    };

    render() {
        const { error } = this.state;
        const { children, title, description } = this.props;

        if (!error) return children;

        return (
            <main className="min-h-[60dvh] flex items-center justify-center p-6">
                <div
                    role="alert"
                    className="bg-card text-card-foreground pixel-border p-8 max-w-lg w-full text-center space-y-6"
                >
                    <h1 className="font-mono text-lg md:text-2xl uppercase text-destructive">
                        {title ?? 'Algo se rompió'}
                    </h1>
                    <p className="font-sans text-lg text-muted-foreground">
                        {description ?? 'No pudimos mostrar esta parte de la aplicación. Tu progreso está a salvo.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={this.handleRetry} className="uppercase">
                            Intentar de nuevo
                        </Button>
                        <Button asChild variant="outline" className="uppercase no-underline">
                            <a href="/">Volver al inicio</a>
                        </Button>
                    </div>
                </div>
            </main>
        );
    }
}

export default ErrorBoundary;
