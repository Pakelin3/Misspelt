import React, { useState, useEffect } from 'react';
import useAxios from '@/utils/useAxios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';

export default function FarmsAdminPanel() {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newFarmName, setNewFarmName] = useState('');
    const api = useAxios();
    const navigate = useNavigate();

    const fetchFarms = async () => {
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
    };

    useEffect(() => {
        fetchFarms();
    }, []);

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

    const handleDeleteFarm = async (id, e) => {
        e.stopPropagation();
        toast.custom((t) => (
            <div className="bg-card border-foreground w-[300px] flex flex-col gap-4 font-mono relative">
                <div className="flex flex-col gap-1">
                    <h3 className="font-bold uppercase flex items-center gap-2 text-destructive">
                        <Trash2 className="w-5 h-5" /> ¿ELIMINAR GRANJA?
                    </h3>
                    <p className="text-xs text-muted-foreground leading-tight">Esta acción es destructiva e irreversible.</p>
                </div>
                <div className="flex gap-2 mt-2">
                    <button onClick={() => toast.dismiss(t)} className="flex-1 px-2 py-2 border-2 border-foreground bg-muted hover:bg-background text-xs font-bold transition-colors uppercase">
                        Cancelar
                    </button>
                    <button onClick={async () => {
                        toast.dismiss(t);
                        try {
                            await api.delete(`/farms/${id}/`);
                            fetchFarms();
                            toast.success('Borrado');
                        } catch {
                            toast.error('Error', { description: 'No se pudo eliminar.' });
                        }
                    }} className="flex-1 px-2 py-2 border-2 border-transparent bg-destructive text-destructive-foreground hover:bg-red-600 text-xs font-bold transition-colors uppercase">
                        Sí, borrar
                    </button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
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
                <button
                    onClick={() => setIsCreating(true)}
                    className="pixel-btn bg-primary text-primary-foreground hover:brightness-110 px-4 py-2 font-mono text-sm border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[2px] transition-transform active:translate-y-1 active:shadow-none"
                >
                    + NUEVA GRANJA
                </button>
            </div>

            {isCreating && (
                <div className="bg-muted/50 p-4 border-2 border-foreground border-dashed">
                    <form onSubmit={handleCreateFarm} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="font-mono text-[10px] uppercase text-muted-foreground block mb-2">Nombre de la Granja</label>
                            <input
                                autoFocus
                                type="text"
                                className="w-full bg-background border-2 border-foreground px-3 py-2 font-mono focus:border-primary outline-none"
                                placeholder="Ej: Inglés Nivel 1"
                                value={newFarmName}
                                onChange={e => setNewFarmName(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="pixel-btn bg-accent text-accent-foreground px-4 py-2 border-2 border-foreground hover:brightness-110">Crear</button>
                        <button type="button" onClick={() => setIsCreating(false)} className="pixel-btn bg-background text-foreground px-4 py-2 border-2 border-foreground hover:bg-muted">Cancelar</button>
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
                            onClick={() => navigate(`/admin-dashboard/farms/${farm.id}`)}
                            className="bg-card pixel-border border-4 border-foreground p-5 cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-mono font-bold text-lg leading-tight mb-2 truncate pr-2" title={farm.name}>{farm.name}</h3>
                                    <button
                                        onClick={(e) => handleDeleteFarm(farm.id, e)}
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 p-1 border-2 border-transparent hover:border-destructive"
                                        title="Eliminar Granja"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="font-mono text-xs text-muted-foreground">Código: <span className="text-primary font-bold">{farm.invite_code}</span></p>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="text-[10px] font-mono bg-muted/50 px-2 py-1 border border-foreground/20 text-muted-foreground uppercase">
                                    {farm.students_count} Alumnos
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
