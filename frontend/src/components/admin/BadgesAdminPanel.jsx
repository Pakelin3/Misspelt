import React, { useState, useEffect, useCallback } from 'react';
import useAxios from '@/utils/useAxios';
import { useTheme } from '@/context/ThemeContext';
import { Plus, Edit, Trash2, Save, XCircle, UploadCloud,  } from 'lucide-react';
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';

function BadgeAdminPanel() {
    const api = useAxios();
    const { theme } = useTheme();
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingBadge, setEditingBadge] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formImage, setFormImage] = useState(null); // Ahora guarda el objeto File (o null)
    const [imagePreview, setImagePreview] = useState(''); // Guarda la URL para previsualización
    const [imageError, setImageError] = useState(''); // Mensajes de error de validación de imagen
    const [formCategory, setFormCategory] = useState('BASIC');
    const [formConditionDescription, setFormConditionDescription] = useState('');
    const [formRewardDescription, setFormRewardDescription] = useState('');
    const [formRewardData, setFormRewardData] = useState('');

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

    const resetForm = () => {
        setFormTitle('');
        setFormDescription('');
        setFormImage(null);
        setImagePreview('');
        setImageError('');
        setFormCategory('BASIC');
        setFormConditionDescription('');
        setFormRewardDescription('');
        setFormRewardData('');
    };

    const handleNewBadge = () => {
        setEditingBadge(null);
        resetForm();
        setIsFormOpen(true);
    };

    const handleEditBadge = (badge) => {
        setEditingBadge(badge);
        setFormTitle(badge.title);
        setFormDescription(badge.description);
        setFormImage(badge.image);
        setImagePreview(badge.image || '');
        setImageError('');
        setFormCategory(badge.category);
        setFormConditionDescription(badge.condition_description);
        setFormRewardDescription(badge.reward_description);
        setFormRewardData(JSON.stringify(badge.reward_data, null, 2));
        setIsFormOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setFormImage(null);
            setImagePreview('');
            setImageError('');
            return;
        }

        // Validación de tipo de archivo
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setImageError('Solo se permiten archivos PNG, JPG, JPEG o WEBP.');
            setFormImage(null);
            setImagePreview('');
            return;
        }

        // Validación de tamaño (300KB = 300 * 1024 bytes)
        const maxSize = 1024 * 1024;
        if (file.size > maxSize) {
            setImageError('El archivo debe ser menor a 1MB.');
            setFormImage(null);
            setImagePreview('');
            return;
        }

        // Si pasa las validaciones
        setFormImage(file);
        setImageError('');
        setImagePreview(URL.createObjectURL(file)); // Crea una URL para previsualizar la imagen seleccionada
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

        if (imageError) {
            Swal.fire({
                title: 'Error de Imagen',
                text: imageError,
                icon: 'error',
                background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
            });
            return;
        }

        const formData = new FormData();
        formData.append('title', formTitle);
        formData.append('description', formDescription);
        formData.append('category', formCategory);
        formData.append('condition_description', formConditionDescription);
        formData.append('reward_description', formRewardDescription);

        if (formImage instanceof File) {
            formData.append('image', formImage);
        } else if (editingBadge && formImage === '') {
            formData.append('image', '');
        }
        try {
            let parsedRewardData = {};
            try {
                parsedRewardData = JSON.parse(formRewardData || '{}');
                // eslint-disable-next-line no-unused-vars
            } catch (jsonErr) {
                Swal.fire({
                    title: 'Error de JSON',
                    text: 'El formato de Datos Recompensa no es JSON válido.',
                    icon: 'error',
                    background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                    color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                });
                return;
            }
            formData.append('reward_data', JSON.stringify(parsedRewardData));


            if (editingBadge) {
                await api.put(`/badges/${editingBadge.id}/`, formData);
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
                await api.post('/badges/', formData); // Usar formData
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
            resetForm();
            setCurrentPage(1);
            fetchBadges(1, perPage);
        } catch (err) {
            console.error("Error saving badge:", err.response?.data || err.message);
            let errorMessage = "Hubo un problema al guardar la insignia.";
            if (err.response?.data) {
                try {
                    const errorDetails = err.response.data;
                    if (errorDetails.image && Array.isArray(errorDetails.image)) {
                        errorMessage += " Error de imagen: " + errorDetails.image.join(", ");
                    } else if (errorDetails.title && Array.isArray(errorDetails.title)) {
                        errorMessage += " Error de título: " + errorDetails.title.join(", ");
                    } else {
                        errorMessage += " Detalles: " + JSON.stringify(errorDetails);
                    }
                    // eslint-disable-next-line no-unused-vars
                } catch (parseErr) {
                    errorMessage += " Detalles: " + err.response.data;
                }
            } else {
                errorMessage += " Detalles: " + err.message;
            }

            Swal.fire({
                title: 'Error al guardar',
                text: errorMessage,
                icon: 'error',
                background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
            });
        }
    };

    const columns = [
        {
            name: 'Imagen',

            cell: row => {
                //console.log("URL de la imagen en DataTable:", row.image);
                return (
                    row.image ? (
                        <img src={row.image} alt={row.title} className="h-8 w-8 object-contain" />
                    ) : (
                        <UploadCloud className={`h-8 w-8 text-[var(--color-text-secondary)]`} />
                    )
                );
            }, // Cierra el bloque de la función
            width: '80px',
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
        },
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
            selector: row => row.category,
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
                color: theme === 'light' ? '#000' : '#fff',
                borderTopStyle: 'solid',
                borderTopWidth: '1px',
                borderTopColor: theme === 'light' ? 'var(--color-text-secondary)' : 'var(--color-dark-border)',
            },
            pageButtonsStyle: {
                backgroundColor: theme === 'light' ? '#e0e0e0' : 'var(--color-dark-bg-tertiary)',
                color: theme === 'light' ? '#000' : '#fff',
                fill: theme === 'light' ? '#000' : '#bbb',
                '&:hover': {
                    backgroundColor: theme === 'light' ? '#9f9f9f' : '#a0a0a0',
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
                            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-body-bg)] hover:bg-[var(--color-bg-secondary-hover)]'
                            : 'bg-[var(--color-bg-secondary)] text-white hover:bg-[var(--color-bg-secondary-hover)]'
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

                {/* Campo Imagen (File Upload) */}
                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Imagen (PNG o WEBP, &lt; 1MB):</label>

                    {/* Contenedor principal para el input de archivo personalizado */}
                    <div className={`relative border-2 border-dashed rounded-md p-4 text-center cursor-pointer
        ${imageError ? 'border-red-500' : (theme === 'light' ? 'border-[var(--color-text-secondary)]' : 'border-[var(--color-dark-border)]')}
        ${imagePreview && 'pb-12'} `} // Añade padding si hay previsualización para los botones
                        onClick={() => document.getElementById('actual-image-input').click()} // Permite hacer clic en cualquier parte del div
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-900'); }} // Estilo al arrastrar
                        onDragLeave={(e) => { e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900'); }} // Quita estilo al salir
                        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900'); handleImageChange({ target: { files: e.dataTransfer.files } }); }} // Maneja soltar
                    >
                        {/* Input de archivo real (oculto visualmente) */}
                        <input
                            type="file"
                            id="actual-image-input" // Nuevo ID para el input oculto
                            onChange={handleImageChange}
                            accept=".png,.webp"
                            className="hidden" // Oculta el input de archivo predeterminado
                        />

                        {!imagePreview && ( // Mostrar el mensaje "Arrastra o haz clic" si no hay imagen seleccionada
                            <p className={`text-[var(--color-text-secondary)] ${theme === 'light' ? '' : 'dark:text-[var(--color-dark-text-secondary)]'}`}>
                                Arrastra tu imagen aquí o haz clic para seleccionar.
                            </p>
                        )}

                        {imagePreview && ( // Previsualización de la imagen seleccionada o existente
                            <div className="flex flex-col items-center gap-2">
                                <img src={imagePreview} alt="Previsualización" className="h-20 w-20 object-contain rounded " />
                                <span className={`text-sm ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}>
                                    {formImage instanceof File ? formImage.name : 'Imagen actual'}
                                </span>
                                {formImage instanceof File && ( // Mostrar tamaño y fecha solo para archivos nuevos
                                    <span className={`text-xs ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`}>
                                        {(formImage.size / 1024).toFixed(2)} KB - {new Date().toLocaleDateString()}
                                    </span>
                                )}
                                {/* Barra de progreso / indicador de tamaño */}
                                {formImage instanceof File && (
                                    <div className="w-full mt-2">
                                        <div className={`h-2 rounded-full ${formImage.size > 1024 * 1024 ? 'bg-red-500' : 'bg-[var(--color-accent-blue)]'}`}
                                            style={{ width: `${Math.min(100, (formImage.size / (1024 * 1024)) * 100)}%` }}></div>
                                        <p className={`text-xs mt-1 ${formImage.size > 1024 * 1024 ? 'text-red-500' : 'text-[var(--color-text-secondary)]'}`}>
                                            {(formImage.size / 1024).toFixed(2)} KB / 1024 KB
                                        </p>
                                    </div>
                                )}

                                {/* Botones de acción flotantes (ej. eliminar) */}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    {/* Botón de eliminar (X) */}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setFormImage(null); setImagePreview(''); setImageError(''); }}
                                        className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                    {/* Aquí puedes añadir otros botones como "ver", "subir" si tuvieran lógica independiente */}
                                </div>
                            </div>
                        )}
                    </div>

                    {imageError && ( // Mensajes de error de validación de imagen
                        <p className="text-red-500 text-xs mt-1">{imageError}</p>
                    )}
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
                        {/* Las opciones de categoría deberían obtenerse del backend si son dinámicas */}
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
                    <label htmlFor="rewardData" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Datos Recompensa (JSON):</label>
                    <textarea
                        id="rewardData"
                        value={formRewardData}
                        onChange={(e) => setFormRewardData(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 h-24 resize-y
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        placeholder={`Ej: ${JSON.stringify({ exp: 30, avatar_id: 5 })}`}
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
                        onClick={() => { setIsFormOpen(false); resetForm(); }}
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