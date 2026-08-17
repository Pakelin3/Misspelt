import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import usePageTitle from '@/hooks/usePageTitle';

const NotFoundPage = () => {
    usePageTitle('Página no encontrada');

    return (
        <main className="min-h-[70dvh] flex items-center justify-center p-6">
            <div className="bg-card text-card-foreground pixel-border p-8 md:p-12 max-w-lg w-full text-center space-y-6">
                <p className="font-mono text-4xl md:text-6xl text-accent">404</p>
                <h1 className="font-mono text-lg md:text-2xl uppercase">Este camino no existe</h1>
                <p className="font-sans text-lg text-muted-foreground">
                    La página que buscas no está aquí. Puede que el enlace esté roto o que la
                    hayamos movido.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild size="lg">
                        <Link to="/" className="no-underline">Ir al inicio</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link to="/dictionary" className="no-underline">Ver el diccionario</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
};

export default NotFoundPage;
