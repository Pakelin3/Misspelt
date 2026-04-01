import React, { useState, useEffect } from 'react';
import useAxios from '@/utils/useAxios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PixelCopyPasteIcon, PixelCrownIcon } from '@/components/PixelIcons';
import { Loader2, ArrowLeft, Trash2, Eye } from 'lucide-react';
import { VillagerIcon } from '@/components/AdminPixelIcons';
import StudentProfileModal from './StudentProfileModal';

export default function FarmDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const api = useAxios();

    const [farm, setFarm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    const fetchFarmDetail = async () => {
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
    };

    useEffect(() => {
        fetchFarmDetail();
    }, [id]);

    const handleCopyCode = () => {
        if (!farm) return;
        navigator.clipboard.writeText(farm.invite_code);
        toast.success("Código copiado al portapapeles");
    };

    const handleRemoveStudent = async (studentId, studentName) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar a ${studentName} de esta granja?`)) {
            return;
        }
        try {
            await api.post(`/farms/${id}/remove-student/`, { student_id: studentId });
            toast.success("Estudiante removido de la granja");
            fetchFarmDetail();
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            toast.error("Error al remover estudiante");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
        );
    }

    if (!farm) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-foreground pb-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin-dashboard/farms')}
                        className="p-2 border-2 border-transparent hover:border-foreground hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-mono font-bold tracking-wider truncate" title={farm.name}>{farm.name}</h2>
                        <p className="text-xs font-mono text-muted-foreground uppercase">Granja de {farm.owner_username}</p>
                    </div>
                </div>

                <div className="bg-accent text-accent-foreground pixel-border border-4 border-foreground p-3 flex items-center gap-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <div>
                        <p className="text-[10px] font-mono font-bold">CÓDIGO DE INVITACIÓN</p>
                        <p className="text-xl font-mono font-black tracking-widest">{farm.invite_code}</p>
                    </div>
                    <button
                        onClick={handleCopyCode}
                        className="p-2 bg-background text-foreground border-2 border-foreground hover:bg-muted active:scale-95 transition-all"
                        title="Copiar Código"
                    >
                        <PixelCopyPasteIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-card pixel-border">
                <div className="p-4 border-b-4 border-foreground bg-muted/40 flex justify-between items-center">
                    <h3 className="font-mono font-bold flex items-center gap-2">
                        <VillagerIcon className="w-5 h-5" />
                        TABLA DE DESEMPEÑO (LEADERBOARD)
                    </h3>
                    <span className="font-mono text-xs bg-background px-2 py-1 border-2 border-foreground">
                        {farm.students_data?.length || 0} ALUMNOS
                    </span>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left font-mono text-sm whitespace-nowrap">
                        <thead className="bg-muted/20 border-b-4 border-foreground text-[10px] uppercase text-muted-foreground">
                            <tr>
                                <th className="p-4 w-16 text-center">Rango</th>
                                <th className="p-4">Granjero</th>
                                <th className="p-4 text-center">Nivel</th>
                                <th className="p-4 text-center text-accent">Experiencia (XP)</th>
                                <th className="p-4 text-center text-blue-500">Precisión</th>
                                <th className="p-4 text-center text-yellow-500">Palabras Aprendidas</th>
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
                                            {index === 0 ? <PixelCrownIcon className="w-5 h-5 text-amber-400" /> : index === 1 ? <PixelCrownIcon className="w-5 h-5 text-gray-500" /> : index === 2 ? <PixelCrownIcon className="w-5 h-5 text-orange-600" /> : (index + 1)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 border-2 border-foreground bg-muted shrink-0 overflow-hidden pixel-rendering shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${student.username}&background=random`}
                                                        alt="avatar"
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
                                                <button
                                                    onClick={() => setSelectedStudentId(student.id)}
                                                    className="p-2 border-2 border-transparent text-primary hover:border-primary hover:bg-primary/20 transition-colors"
                                                    title="Ver Detalles del Estudiante"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveStudent(student.id, student.username)}
                                                    className="p-2 border-2 border-transparent text-destructive hover:border-destructive hover:bg-destructive/20 transition-colors"
                                                    title="Remover Estudiante"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
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
        </div>
    );
}
