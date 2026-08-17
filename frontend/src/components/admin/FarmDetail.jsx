import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAxios from '@/utils/useAxios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PixelCopyPasteIcon, PixelCrownIcon } from '@/components/PixelIcons';
import { Loader2, ArrowLeft, Trash2, Eye } from 'lucide-react';
import { VillagerIcon } from '@/components/AdminPixelIcons';
import { Button } from '@/components/ui/Button';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import StudentProfileModal from './StudentProfileModal';

export default function FarmDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const api = useAxios();

    const [farm, setFarm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [studentToRemove, setStudentToRemove] = useState(null);

    const fetchFarmDetail = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/farms/${id}/leaderboard/`);
            setFarm(res.data);
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            toast.error("Error cargando detalles de la granja");
            navigate('/admin-dashboard/farms');
        } finally {
            setLoading(false);
        }
    }, [api, id, navigate]);

    // `api` cambia de identidad cada vez que se refresca el token (ver
    // useAxios), y `navigate` puede cambiar entre renders del router. Sin
    // este guardado por `id`, incluir fetchFarmDetail como dependencia
    // dispararía un refetch cada vez que cualquiera de esos cambie de
    // identidad. El ref solo deja pasar el fetch cuando el id de la granja
    // realmente cambió (mismo patrón que hasFetchedStatsRef en GamePage).
    const fetchedFarmIdRef = useRef(null);
    useEffect(() => {
        if (fetchedFarmIdRef.current === id) return;
        fetchedFarmIdRef.current = id;
        fetchFarmDetail();
    }, [id, fetchFarmDetail]);

    const handleCopyCode = () => {
        if (!farm) return;
        navigator.clipboard.writeText(farm.invite_code);
        toast.success("Código copiado al portapapeles");
    };

    const handleConfirmRemoveStudent = async () => {
        if (!studentToRemove) return;
        const { id: studentId } = studentToRemove;
        try {
            await api.post(`/farms/${id}/remove-student/`, { student_id: studentId });
            toast.success("Estudiante removido de la granja");
            setStudentToRemove(null);
            fetchFarmDetail();
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            toast.error("Error", { description: "No se pudo remover al estudiante. Inténtalo de nuevo." });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12" role="status" aria-live="polite">
                <Loader2 className="animate-spin w-8 h-8 text-primary" aria-hidden="true" />
                <span className="sr-only">Cargando datos de la granja...</span>
            </div>
        );
    }

    if (!farm) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-foreground pb-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/admin-dashboard/farms')}
                        aria-label="Volver a la lista de granjas"
                    >
                        <ArrowLeft className="w-6 h-6" aria-hidden="true" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-mono font-bold tracking-wider truncate" title={farm.name}>{farm.name}</h2>
                        <p className="text-xs font-mono text-muted-foreground uppercase">Granja de {farm.owner_username}</p>
                    </div>
                </div>

                <div className="bg-accent text-accent-foreground pixel-border border-4 border-foreground p-3 flex items-center gap-4 shadow-pixel-md">
                    <div>
                        <p className="text-2xs font-mono font-bold">Código de invitación</p>
                        <p className="text-xl font-mono font-black tracking-widest">{farm.invite_code}</p>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyCode}
                        aria-label="Copiar código de invitación"
                    >
                        <PixelCopyPasteIcon className="w-5 h-5" aria-hidden="true" />
                    </Button>
                </div>
            </div>

            <div className="bg-card pixel-border">
                <div className="p-4 border-b-4 border-foreground bg-muted/40 flex justify-between items-center">
                    <h3 className="font-mono font-bold flex items-center gap-2">
                        <VillagerIcon className="w-5 h-5" aria-hidden="true" />
                        Tabla de desempeño
                    </h3>
                    <span className="font-mono text-xs bg-background px-2 py-1 border-2 border-foreground">
                        {farm.students_data?.length || 0} ALUMNOS
                    </span>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left font-mono text-sm whitespace-nowrap">
                        <thead className="bg-muted/20 border-b-4 border-foreground text-2xs uppercase text-muted-foreground">
                            <tr>
                                <th className="p-4 w-16 text-center">Rango</th>
                                <th className="p-4">Granjero</th>
                                <th className="p-4 text-center">Nivel</th>
                                <th className="p-4 text-center text-accent-strong">Experiencia (XP)</th>
                                <th className="p-4 text-center text-info">Precisión</th>
                                <th className="p-4 text-center text-word-slang">Palabras Aprendidas</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-foreground/20">
                            {farm.students_data?.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-muted-foreground">
                                        Esta granja aún no tiene granjeros.
                                    </td>
                                </tr>
                            ) : (
                                farm.students_data.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="p-4 text-center font-bold">
                                            {index === 0 ? <PixelCrownIcon className="w-5 h-5 text-accent-strong" aria-hidden="true" /> : index === 1 ? <PixelCrownIcon className="w-5 h-5 text-muted-foreground" aria-hidden="true" /> : index === 2 ? <PixelCrownIcon className="w-5 h-5 text-warning" aria-hidden="true" /> : (index + 1)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 border-2 border-foreground bg-muted shrink-0 overflow-hidden pixel-rendering shadow-pixel-sm">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${student.username}&background=random`}
                                                        alt={`Avatar de ${student.username}`}
                                                        width={40}
                                                        height={40}
                                                        loading="lazy"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <span className="font-bold">@{student.username}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-bold">NVL {student.level}</td>
                                        <td className="p-4 text-center font-bold">{student.experience} XP</td>
                                        <td className="p-4 text-center font-bold">{student.accuracy}%</td>
                                        <td className="p-4 text-center text-sm font-bold text-muted-foreground">{student.unlocked_count} p.</td>
                                        <td className="p-4">
                                            <div className="flex gap-2 justify-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSelectedStudentId(student.id)}
                                                    className="text-primary hover:bg-primary hover:text-primary-foreground/20"
                                                    aria-label={`Ver detalles de ${student.username}`}
                                                >
                                                    <Eye className="w-5 h-5" aria-hidden="true" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setStudentToRemove({ id: student.id, username: student.username })}
                                                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground/20"
                                                    aria-label={`Remover a ${student.username} de la granja`}
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

            {/* Modal de Detalles del Estudiante */}
            {selectedStudentId && (
                <StudentProfileModal
                    farmId={id}
                    studentId={selectedStudentId}
                    onClose={() => setSelectedStudentId(null)}
                />
            )}

            {/* Confirmacion de remover estudiante */}
            <ConfirmDeleteDialog
                open={!!studentToRemove}
                onOpenChange={(open) => !open && setStudentToRemove(null)}
                title={`¿Quitar a @${studentToRemove?.username} de la granja?`}
                description="El alumno perderá el acceso a esta granja y desaparecerá de esta tabla de desempeño. Su cuenta, su progreso y las palabras o insignias que ya haya desbloqueado no se ven afectados."
                confirmLabel="Sí, quitar a este alumno"
                onConfirm={handleConfirmRemoveStudent}
            />
        </div>
    );
}
