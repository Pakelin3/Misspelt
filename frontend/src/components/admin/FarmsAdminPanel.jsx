import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAxios from '@/utils/useAxios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

export default function FarmsAdminPanel() {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newFarmName, setNewFarmName] = useState('');
    const [farmToDelete, setFarmToDelete] = useState(null);
    const api = useAxios();
    const navigate = useNavigate();
    const newFarmNameInputRef = useRef(null);

    const fetchFarms = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/farms/');

            setFarms(res.data.results || res.data || []);
        } catch (error) {
            toast.error("Error cargando granjas");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [api]);

    // `api` cambia de identidad al refrescarse el token (ver useAxios); sin
    // este guardado, listar fetchFarms como dependencia dispararía un
    // refetch cada vez que eso pase. Solo queremos cargar una vez al entrar
    // a la vista, igual que hasFetchedStatsRef en GamePage.
    const hasFetchedFarmsRef = useRef(false);
    useEffect(() => {
        if (hasFetchedFarmsRef.current) return;
        hasFetchedFarmsRef.current = true;
        fetchFarms();
    }, [fetchFarms]);

    // El foco solo debe moverse al abrir el formulario de creación, no en
    // cada carga de la página (por eso ya no usamos autoFocus).
    useEffect(() => {
        if (isCreating) {
            newFarmNameInputRef.current?.focus();
        }
    }, [isCreating]);

    const handleCreateFarm = async (e) => {
        e.preventDefault();
        if (!newFarmName.trim()) return;
        try {
            const res = await api.post('/farms/', { name: newFarmName });
            toast.success("Granja creada", { description: `Código: ${res.data.invite_code}` });
            setNewFarmName('');
            setIsCreating(false);
            fetchFarms();
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            toast.error("Error", { description: "No se pudo crear la granja." });
        }
    };

    const handleConfirmDeleteFarm = async () => {
        if (!farmToDelete) return;
        try {
            await api.delete(`/farms/${farmToDelete.id}/`);
            setFarmToDelete(null);
            fetchFarms();
            toast.success('Granja borrada');
        } catch {
            toast.error('Error', { description: 'No se pudo eliminar la granja.' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12" role="status" aria-live="polite">
                <Loader2 className="animate-spin w-8 h-8 text-primary" aria-hidden="true" />
                <span className="sr-only">Cargando granjas...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b-4 border-foreground pb-4">
                <div>
                    <h2 className="text-xl font-mono font-bold tracking-wider">Tus Granjas</h2>
                    <p className="text-xs font-mono text-muted-foreground">Gestiona tus clases y a tus alumnos.</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="font-mono text-sm">
                    + NUEVA GRANJA
                </Button>
            </div>

            {isCreating && (
                <div className="bg-muted/50 p-4 border-2 border-foreground border-dashed">
                    <form onSubmit={handleCreateFarm} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label htmlFor="new-farm-name" className="font-mono text-2xs uppercase text-muted-foreground block mb-2">Nombre de la Granja</label>
                            <Input
                                id="new-farm-name"
                                ref={newFarmNameInputRef}
                                type="text"
                                className="w-full bg-background border-2 border-foreground rounded-none px-3 py-2 font-mono focus:border-primary"
                                placeholder="Ej: Inglés Nivel 1"
                                value={newFarmName}
                                onChange={e => setNewFarmName(e.target.value)}
                            />
                        </div>
                        <Button type="submit" variant="accent" className="font-mono">Crear</Button>
                        <Button type="button" variant="outline" onClick={() => setIsCreating(false)} className="font-mono">Cancelar</Button>
                    </form>
                </div>
            )}

            {farms.length === 0 && !isCreating ? (
                <div className="text-center p-12 bg-muted/20 border-2 border-foreground border-dashed">
                    <p className="font-mono text-muted-foreground text-sm">No tienes ninguna granja creada todavía.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {farms.map(farm => (
                        <div
                            key={farm.id}
                            className="bg-card pixel-border border-4 border-foreground p-5 hover:-translate-y-1 hover:shadow-pixel-lg transition-all flex flex-col justify-between"
                        >
                            <button
                                type="button"
                                onClick={() => navigate(`/admin-dashboard/farms/${farm.id}`)}
                                className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-mono font-bold text-lg leading-tight mb-2 truncate pr-2" title={farm.name}>{farm.name}</h3>
                                </div>
                                <p className="font-mono text-xs text-muted-foreground">Código: <span className="text-primary font-bold">{farm.invite_code}</span></p>
                            </button>
                            <div className="flex items-center justify-between gap-2 mt-4">
                                <div className="text-2xs font-mono bg-muted/50 px-2 py-1 border border-foreground/20 text-muted-foreground uppercase">
                                    {farm.students_count} Alumnos
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFarmToDelete(farm);
                                    }}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    aria-label={`Eliminar la granja ${farm.name}`}
                                >
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDeleteDialog
                open={!!farmToDelete}
                onOpenChange={(open) => !open && setFarmToDelete(null)}
                title={`¿Borrar la granja "${farmToDelete?.name}"?`}
                description="Esta acción es irreversible. Todos los alumnos inscritos perderán su vínculo con esta granja y su código de invitación dejará de funcionar."
                confirmLabel="Sí, borrar esta granja"
                onConfirm={handleConfirmDeleteFarm}
            />
        </div>
    );
}
