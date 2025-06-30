import React, { useState, useEffect, useCallback } from 'react';
import useAxios from '@/utils/useAxios';
import { useTheme } from '@/context/ThemeContext';
import { Plus, Edit, Trash2, Save, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';

function BadgeAdminPanel() {
    const api = useAxios();
    const { theme } = useTheme();
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingBadge, setEditingBadge] = useState(null); // Insignia que se está editando (o null para crear)
    const [isFormOpen, setIsFormOpen] = useState(false); // Controla la visibilidad del formulario en móvil

    // Estados del formulario
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formImage, setFormImage] = useState(''); // URL o path de la imagen
    const [formCategory, setFormCategory] = useState('BASIC');
    const [formConditionDescription, setFormConditionDescription] = useState('');
    const [formRewardDescription, setFormRewardDescription] = useState('');
    const [formRewardData, setFormRewardData] = useState(''); // Se maneja como string JSON

    // Paginación
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchBadges = useCallback(async (page = 1, limit = 10) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/badges/?page=${page}&limit=${limit}`);
            setBadges(response.data.results);
            setTotalRows(response.data.count);
        } catch (err) {
            console.error("Error fetching badges:", err);
            setError("No se pudieron cargar las insignias. Asegúrate de tener permisos de administrador.");
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchBadges(currentPage, perPage);
    }, [fetchBadges, currentPage, perPage]);

    const handleNewBadge = () => {
        setEditingBadge(null);
        setFormTitle('');
        setFormDescription('');
        setFormImage('');
        setFormCategory('BASIC');
        setFormConditionDescription('');
        setFormRewardDescription('');
        setFormRewardData('');
        setIsFormOpen(true);
    };

    const handleEditBadge = (badge) => {
        setEditingBadge(badge);
        setFormTitle(badge.title);
        setFormDescription(badge.description);
        setFormImage(badge.image || ''); // Asegura que sea un string vacío si es null
        setFormCategory(badge.category);
        setFormConditionDescription(badge.condition_description);
        setFormRewardDescription(badge.reward_description);
        setFormRewardData(JSON.stringify(badge.reward_data, null, 2));
        setIsFormOpen(true);
    };

    const handleDeleteBadge = async (badgeId) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--color-bg-tertiary)',
            cancelButtonColor: 'var(--color-bg-secondary)',
            confirmButtonText: 'Sí, ¡bórralo!',
            cancelButtonText: 'Cancelar',
            background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
            color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/badges/${badgeId}/`);
                Swal.fire({
                    title: '¡Borrada!',
                    text: 'La insignia ha sido eliminada.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                    color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                });
                const newTotalRows = totalRows - 1;
                const newCurrentPage = (newTotalRows > 0 && newTotalRows <= (currentPage - 1) * perPage) ? currentPage - 1 : currentPage;
                setCurrentPage(newCurrentPage < 1 ? 1 : newCurrentPage);
                fetchBadges(newCurrentPage < 1 ? 1 : newCurrentPage, perPage);
            } catch (err) {
                console.error("Error deleting badge:", err);
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo eliminar la insignia.',
                    icon: 'error',
                    background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                    color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const badgeData = {
                title: formTitle,
                description: formDescription,
                image: formImage,
                category: formCategory,
                condition_description: formConditionDescription,
                reward_description: formRewardDescription,
                reward_data: JSON.parse(formRewardData || '{}'), // Parsear JSON, usar objeto vacío si está vacío
            };

            if (editingBadge) {
                await api.put(`/badges/${editingBadge.id}/`, badgeData);
                Swal.fire({
                    title: '¡Actualizada!',
                    text: 'La insignia ha sido modificada.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                    color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                });
            } else {
                await api.post('/badges/', badgeData);
                Swal.fire({
                    title: '¡Creada!',
                    text: 'Nueva insignia añadida.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                    color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                });
            }
            setIsFormOpen(false);
            setCurrentPage(1); // Volver a la primera página para ver la nueva insignia
            fetchBadges(1, perPage);
        } catch (err) {
            console.error("Error saving badge:", err.response?.data || err.message);
            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            Swal.fire({
                title: 'Error al guardar',
                text: `Hubo un problema: ${errorMessage}`,
                icon: 'error',
                background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
            });
        }
    };

    // Columnas para DataTable
    const columns = [
        {
            name: 'Título',
            selector: row => row.title,
            sortable: true,
            grow: 2,
            minWidth: '150px',
            cell: row => (
                <span className={theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}>{row.title}</span>
            )
        },
        {
            name: 'Categoría',
            selector: row => row.category, // Muestra el valor en inglés del modelo
            sortable: true,
            grow: 1,
            minWidth: '120px',
            cell: row => (
                <span className={theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}>{row.category}</span>
            )
        },
        {
            name: 'Descripción',
            selector: row => row.description,
            grow: 3,
            minWidth: '200px',
            cell: row => (
                <span className={theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}>{row.description}</span>
            )
        },
        {
            name: 'Acciones',
            cell: row => (
                <div className="flex">
                    <button
                        onClick={() => handleEditBadge(row)}
                        className={`text-[var(--color-accent-blue)] hover:text-[var(--color-bg-secondary)] mr-3`}
                        aria-label={`Editar ${row.title}`}
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleDeleteBadge(row.id)}
                        className={`text-red-500 hover:text-red-700`}
                        aria-label={`Eliminar ${row.title}`}
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            width: '120px',
        },
    ];

    // Estilos personalizados para DataTable (los mismos que en DictionaryAdminPanel)
    const customStyles = {
        header: {
            style: {
                minHeight: '56px',
                backgroundColor: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
            },
        },
        headRow: {
            style: {
                backgroundColor: theme === 'light' ? 'var(--color-bg-main)' : 'var(--color-dark-bg-tertiary)',
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
            },
        },
        headCells: {
            style: {
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                fontSize: '14px',
                fontWeight: 'bold',
            },
        },
        cells: {
            style: {
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                backgroundColor: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                '&:not(:last-of-type)': {
                    borderRightStyle: 'solid',
                    borderRightWidth: '1px',
                    borderRightColor: theme === 'light' ? 'var(--color-text-secondary)' : 'var(--color-dark-border)',
                },
            },
        },
        pagination: {
            style: {
                backgroundColor: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                borderTopStyle: 'solid',
                borderTopWidth: '1px',
                borderTopColor: theme === 'light' ? 'var(--color-text-secondary)' : 'var(--color-dark-border)',
            },
            pageButtonsStyle: {
                backgroundColor: theme === 'light' ? 'var(--color-bg-main)' : 'var(--color-dark-bg-tertiary)',
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                '&:hover': {
                    backgroundColor: theme === 'light' ? '#4ECDC4' : '#a0a0a0',
                },
                '&:disabled': {
                    opacity: 0.5,
                },
                '&:not(:disabled)': {
                    cursor: 'pointer',
                },
            },
        },
    };

    const handlePageChange = page => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage, page) => {
        setPerPage(newPerPage);
        setCurrentPage(page);
    };

    const renderBadgeList = () => (
        <div className={`p-4 rounded-lg shadow-md
            ${theme === 'light' ? 'bg-[var(--color-bg-card)]' : 'bg-[var(--color-dark-bg-secondary)]'}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--color-text-main)]">Gestión de Insignias</h2>
                <button
                    onClick={handleNewBadge}
                    className={`px-4 py-2 rounded-full flex items-center gap-2 font-semibold transition-colors
                        ${theme === 'light'
                            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-body-bg)] hover:bg-[var(--color-bg-tertiary)]'
                            : 'bg-[var(--color-accent-blue)] text-white hover:bg-[var(--color-bg-tertiary)]'
                        }`}>
                    <Plus className="w-5 h-5" />
                    Nueva Insignia
                </button>
            </div>
            {error ? (
                <p className="text-red-500 text-center py-4">{error}</p>
            ) : (
                <DataTable
                    columns={columns}
                    data={badges}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerPageChange}
                    progressPending={loading}
                    customStyles={customStyles}
                    noDataComponent={
                        <p className={theme === 'light' ? 'text-[var(--color-text-secondary)] py-4' : 'text-[var(--color-dark-text-secondary)] py-4'}>
                            No se encontraron insignias para mostrar.
                        </p>
                    }
                />
            )}
        </div>
    );

    const renderBadgeForm = () => (
        <div className={`p-4 rounded-lg shadow-md
            ${theme === 'light' ? 'bg-[var(--color-bg-card)]' : 'bg-[var(--color-dark-bg-secondary)]'}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--color-text-main)]">{editingBadge ? 'Editar Insignia' : 'Crear Nueva Insignia'}</h2>
                <button
                    onClick={() => setIsFormOpen(false)}
                    className={`text-[var(--color-text-secondary)] hover:text-red-500`}
                >
                    <XCircle className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo Título */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Título:</label>
                    <input
                        type="text"
                        id="title"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        required
                    />
                </div>

                {/* Campo Descripción */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Descripción:</label>
                    <textarea
                        id="description"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 h-24 resize-y
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        required
                    ></textarea>
                </div>

                {/* Campo Imagen (URL) */}
                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">URL de la Imagen:</label>
                    <input
                        type="text"
                        id="image"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        placeholder="Ej: /media/badges/my_badge.png"
                    />
                </div>

                {/* Campo Categoría */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Categoría:</label>
                    <select
                        id="category"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)] bg-white'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)] bg-[var(--color-dark-bg-tertiary)]'
                            }`}
                        required
                    >
                        <option value="BASIC">Básica</option>
                        <option value="RARE">Rara</option>
                        <option value="EPIC">Épica</option>
                        <option value="LEGENDARY">Legendaria</option>
                    </select>
                </div>

                {/* Campo Descripción de la Condición */}
                <div>
                    <label htmlFor="conditionDescription" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Condición:</label>
                    <textarea
                        id="conditionDescription"
                        value={formConditionDescription}
                        onChange={(e) => setFormConditionDescription(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 h-24 resize-y
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        required
                        placeholder="Ej: 'Acertar 10 slangs'"
                    ></textarea>
                </div>

                {/* Campo Descripción de la Recompensa */}
                <div>
                    <label htmlFor="rewardDescription" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Recompensa :</label>
                    <textarea
                        id="rewardDescription"
                        value={formRewardDescription}
                        onChange={(e) => setFormRewardDescription(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 h-24 resize-y
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        required
                        placeholder="Ej: '+30 EXP, Nuevo Avatar'"
                    ></textarea>
                </div>

                {/* Campo Datos de Recompensa (JSON) */}
                <div>
                    <label htmlFor="rewardData" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Datos Recompensa (JSON Array):</label>
                    <textarea
                        id="rewardData"
                        value={formRewardData}
                        onChange={(e) => setFormRewardData(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 h-24 resize-y
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        placeholder={`Ej: ${JSON.stringify({exp: 30, avatar_id: 5})}`}
                    ></textarea>
                </div>

                {/* Botones de guardar y cancelar */}
                <div className="flex gap-4 mt-6">
                    <button
                        type="submit"
                        className={`flex-1 px-4 py-2 rounded-full flex items-center justify-center gap-2 font-semibold transition-colors
                            ${theme === 'light'
                                ? 'bg-[var(--color-bg-secondary)] text-[var(--color-body-bg)] hover:bg-[var(--color-bg-tertiary)]'
                                : 'bg-[var(--color-accent-blue)] text-white hover:bg-[var(--color-bg-tertiary)]'
                            }`}>
                        <Save className="w-5 h-5" />
                        Guardar
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className={`flex-1 px-4 py-2 rounded-full flex items-center justify-center gap-2 font-semibold transition-colors
                            ${theme === 'light'
                                ? 'bg-gray-300 text-[var(--color-text-main)] hover:bg-gray-400'
                                : 'bg-[var(--color-dark-bg-tertiary)] text-[var(--color-dark-text)] hover:bg-gray-700'
                            }`}>
                        <XCircle className="w-5 h-5" />
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 sm:hidden">
                    {renderBadgeForm()}
                </div>
            )}

            <div className={`hidden sm:grid ${isFormOpen ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-6`}>
                <div className={`${isFormOpen ? '' : 'sm:col-span-1'}`}>
                    {renderBadgeList()}
                </div>
                {isFormOpen && (
                    <div className="sm:col-span-1">
                        {renderBadgeForm()}
                    </div>
                )}
            </div>

            <div className="sm:hidden">
                {!isFormOpen && renderBadgeList()}
            </div>
        </div>
    );
}

export default BadgeAdminPanel;