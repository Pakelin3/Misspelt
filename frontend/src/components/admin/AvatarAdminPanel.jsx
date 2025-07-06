import React, { useState, useEffect, useCallback } from 'react';
import useAxios from '@/utils/useAxios';
import { useTheme } from '@/context/ThemeContext';
import { Plus, Edit, Trash2, Save, XCircle, UploadCloud } from 'lucide-react';
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';

function AvatarAdminPanel() {
    const api = useAxios();
    const { theme } = useTheme();
    
    // --- ESTADOS ---
    const [avatars, setAvatars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingAvatar, setEditingAvatar] = useState(null); // Para edición
    const [isFormOpen, setIsFormOpen] = useState(false); // Controla la visibilidad del formulario

    // Estados para los campos del formulario
    const [formName, setFormName] = useState('');
    const [formImage, setFormImage] = useState(null); // Guarda el objeto File o la URL (para edición)
    const [imagePreview, setImagePreview] = useState(''); // URL para previsualizar la imagen
    const [imageError, setImageError] = useState(''); // Mensajes de error de validación de imagen
    const [formIsDefault, setFormIsDefault] = useState(false); // Si es un avatar por defecto
    const [formUnlockConditionDescription, setFormUnlockConditionDescription] = useState(''); // Descripción de desbloqueo

    // Estados para paginación de DataTable (si implementas paginación en el backend)
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // --- FUNCIONES DE FETCHING Y MANEJO DE DATOS ---

    // Función para obtener los avatares del backend
    const fetchAvatars = useCallback(async (page = 1, limit = 10) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/avatars/?page=${page}&limit=${limit}`); // Ruta de la API de avatares
            setAvatars(response.data.results);
            setTotalRows(response.data.count);
        } catch (err) {
            console.error("Error fetching avatars:", err);
            setError("No se pudieron cargar los avatares. Asegúrate de tener permisos de administrador.");
        } finally {
            setLoading(false);
        }
    }, [api]);

    // Efecto para cargar los avatares al inicio y al cambiar la paginación
    useEffect(() => {
        fetchAvatars(currentPage, perPage);
    }, [fetchAvatars, currentPage, perPage]);

    // Función para resetear el formulario a sus valores iniciales
    const resetForm = () => {
        setFormName('');
        setFormImage(null);
        setImagePreview('');
        setImageError('');
        setFormIsDefault(false);
        setFormUnlockConditionDescription('');
        setEditingAvatar(null); // Asegurarse de limpiar el avatar en edición
    };

    // Abre el formulario para crear un nuevo avatar
    const handleNewAvatar = () => {
        resetForm();
        setIsFormOpen(true);
    };

    // Abre el formulario para editar un avatar existente
    const handleEditAvatar = (avatar) => {
        setEditingAvatar(avatar);
        setFormName(avatar.name);
        setFormImage(avatar.image); // URL de la imagen actual (string)
        setImagePreview(avatar.image || ''); // Para previsualizar la imagen existente
        setImageError(''); // Limpia errores anteriores
        setFormIsDefault(avatar.is_default);
        setFormUnlockConditionDescription(avatar.unlock_condition_description || '');
        setIsFormOpen(true);
    };

    // Maneja la selección y validación del archivo de imagen
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setFormImage(null);
            setImagePreview('');
            setImageError('');
            return;
        }

        const validTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg']; // Añade más tipos si es necesario
        if (!validTypes.includes(file.type)) {
            setImageError('Solo se permiten archivos de imagen (PNG, WEBP, JPG, JPEG).');
            setFormImage(null);
            setImagePreview('');
            return;
        }

        const maxSize = 500 * 1024; // Ejemplo: 500KB
        if (file.size > maxSize) {
            setImageError(`El archivo debe ser menor a ${maxSize / 1024}KB.`);
            setFormImage(null);
            setImagePreview('');
            return;
        }

        setFormImage(file); // Guarda el objeto File
        setImageError('');
        setImagePreview(URL.createObjectURL(file)); // Crea una URL temporal para previsualización
    };

    // Maneja el envío del formulario (creación/edición)
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (imageError) { // Si hay errores de validación de imagen
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
        formData.append('name', formName);
        formData.append('is_default', formIsDefault);
        formData.append('unlock_condition_description', formUnlockConditionDescription);

        // Adjunta la imagen solo si es un nuevo archivo (instancia de File)
        if (formImage instanceof File) { //
            formData.append('image', formImage);
        } else if (editingAvatar && formImage === '') { 
            formData.append('image', null);
        }
        
        try {
            if (editingAvatar) {
                await api.put(`/avatars/${editingAvatar.id}/`, formData); // PUT para actualizar completamente
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'El avatar ha sido modificado.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                    color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                });
            } else {
                await api.post('/avatars/', formData); // POST para crear
                Swal.fire({
                    title: '¡Creado!',
                    text: 'Nuevo avatar añadido.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                    color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                });
            }
            setIsFormOpen(false);
            resetForm();
            fetchAvatars(currentPage, perPage); // Recargar la lista
        } catch (err) {
            console.error("Error saving avatar:", err.response?.data || err.message);
            let errorMessage = "Hubo un problema al guardar el avatar.";
            if (err.response?.data) {
                // Intenta parsear errores de backend
                const errorDetails = err.response.data;
                errorMessage += " Detalles: " + JSON.stringify(errorDetails);
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

    // Maneja la eliminación de un avatar
    const handleDeleteAvatar = async (avatarId) => {
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
                await api.delete(`/avatars/${avatarId}/`); // Ruta de la API de avatares
                Swal.fire({
                    title: '¡Borrado!',
                    text: 'El avatar ha sido eliminado.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                    color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                });
                // Ajustar paginación después de eliminar
                const newTotalRows = totalRows - 1;
                const newCurrentPage = (newTotalRows > 0 && newTotalRows <= (currentPage - 1) * perPage) ? currentPage - 1 : currentPage;
                setCurrentPage(newCurrentPage < 1 ? 1 : newCurrentPage);
                fetchAvatars(newCurrentPage < 1 ? 1 : newCurrentPage, perPage);
            } catch (err) {
                console.error("Error deleting avatar:", err);
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo eliminar el avatar.',
                    icon: 'error',
                    background: theme === 'light' ? 'var(--color-bg-card)' : 'var(--color-dark-bg-secondary)',
                    color: theme === 'light' ? 'var(--color-text-main)' : 'var(--color-dark-text)',
                });
            }
        }
    };

    // --- COLUMNAS PARA REACT-DATA-TABLE-COMPONENT ---
    const columns = [
        {
            name: 'Imagen',
            cell: row => (
                row.image ? (
                    <img src={row.image} alt={row.name} className="h-10 w-10 object-contain rounded-full" />
                ) : (
                    <UploadCloud className={`h-8 w-8 text-[var(--color-text-secondary)]`} />
                )
            ),
            width: '80px',
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
        },
        {
            name: 'ID',
            selector: row => row.id,
            sortable: true,
            width: '80px',
        },
        {
            name: 'Nombre',
            selector: row => row.name,
            sortable: true,
            grow: 2,
            cell: row => (
                <span className={theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}>{row.name}</span>
            )
        },
        {
            name: 'Por Defecto',
            selector: row => row.is_default,
            sortable: true,
            cell: row => (
                <span className={theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}>
                    {row.is_default ? 'Sí' : 'No'}
                </span>
            ),
            width: '120px',
        },
        {
            name: 'Condición de Desbloqueo',
            selector: row => row.unlock_condition_description,
            grow: 3,
            cell: row => (
                <span className={theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}>{row.unlock_condition_description || 'N/A'}</span>
            )
        },
        {
            name: 'Acciones',
            cell: row => (
                <div className="flex">
                    <button
                        onClick={() => handleEditAvatar(row)}
                        className={`text-[var(--color-accent-blue)] hover:text-[var(--color-bg-secondary)] mr-3`}
                        aria-label={`Editar ${row.name}`}
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleDeleteAvatar(row.id)}
                        className={`text-red-500 hover:text-red-700`}
                        aria-label={`Eliminar ${row.name}`}
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

    // --- ESTILOS PERSONALIZADOS PARA DATATABLE ---
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

    // --- MANEJO DE PAGINACIÓN ---
    const handlePageChange = page => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage, page) => {
        setPerPage(newPerPage);
        setCurrentPage(page);
    };

    // --- RENDERING DEL COMPONENTE ---
    const renderAvatarList = () => (
        <div className={`p-4 rounded-lg shadow-md
            ${theme === 'light' ? 'bg-[var(--color-bg-card)]' : 'bg-[var(--color-dark-bg-secondary)]'}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--color-text-main)]">Gestión de Avatares</h2>
                <button
                    onClick={handleNewAvatar}
                    className={`px-4 py-2 cursor-pointer rounded-full flex items-center gap-2 font-semibold transition-colors whitespace-nowrap
                        ${theme === 'light'
                            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-body-bg)] hover:bg-[var(--color-bg-secondary-hover)]'
                            : 'bg-[var(--color-bg-secondary)] text-white hover:bg-[var(--color-bg-secondary-hover)]'
                        }`}>
                    <Plus className="w-5 h-5" />
                    Nuevo Avatar
                </button>
            </div>
            {error ? (
                <p className="text-red-500 text-center py-4">{error}</p>
            ) : (
                <DataTable
                    columns={columns}
                    data={avatars}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerPageChange}
                    progressPending={loading}
                    customStyles={customStyles}
                    noDataComponent={
                        <p className={theme === 'light' ? 'text-[var(--color-text-secondary)] py-4' : 'text-[var(--color-dark-text-secondary)] py-4'}>
                            No se encontraron avatares para mostrar.
                        </p>
                    }
                />
            )}
        </div>
    );

    const renderAvatarForm = () => (
        <div className={`p-4 rounded-lg shadow-md
            ${theme === 'light' ? 'bg-[var(--color-bg-card)]' : 'bg-[var(--color-dark-bg-secondary)]'}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--color-text-main)]">{editingAvatar ? 'Editar Avatar' : 'Crear Nuevo Avatar'}</h2>
                <button
                    onClick={() => { setIsFormOpen(false); resetForm(); }}
                    className={`text-[var(--color-text-secondary)] hover:text-red-500`}
                >
                    <XCircle className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo Nombre */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Nombre:</label>
                    <input
                        type="text"
                        id="name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        required
                    />
                </div>

                {/* Campo Imagen (File Upload) - CON ESTILO PERSONALIZADO COMO EL EJEMPLO */}
                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Imagen (PNG, WEBP, JPG, JPEG, &lt; 500KB):</label>
                    <div className={`relative border-2 border-dashed rounded-md p-4 text-center cursor-pointer
                        ${imageError ? 'border-red-500' : (theme === 'light' ? 'border-[var(--color-text-secondary)]' : 'border-[var(--color-dark-border)]')}
                        ${imagePreview && 'pb-12'} `} 
                        onClick={() => document.getElementById('actual-image-input').click()} 
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-900'); }} 
                        onDragLeave={(e) => { e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900'); }} 
                        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900'); handleImageChange({ target: { files: e.dataTransfer.files } }); }} 
                    >
                        <input
                            type="file"
                            id="actual-image-input" 
                            onChange={handleImageChange}
                            accept=".png,.webp,.jpg,.jpeg"
                            className="hidden" 
                        />

                        {!imagePreview && ( 
                            <p className={`text-[var(--color-text-secondary)] ${theme === 'light' ? '' : 'dark:text-[var(--color-dark-text-secondary)]'}`}>
                                Arrastra tu imagen aquí o haz clic para seleccionar.
                            </p>
                        )}

                        {imagePreview && ( 
                            <div className="flex flex-col items-center gap-2">
                                <img src={imagePreview} alt="Previsualización" className="h-20 w-20 object-contain rounded" />
                                <span className={`text-sm ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}>
                                    {formImage instanceof File ? formImage.name : 'Imagen actual'}
                                </span>
                                {formImage instanceof File && ( 
                                    <span className={`text-xs ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`}>
                                        {(formImage.size / 1024).toFixed(2)} KB - {new Date().toLocaleDateString()}
                                    </span>
                                )}
                                <div className="w-full mt-2">
                                    <div className={`h-2 rounded-full ${formImage instanceof File && formImage.size > 500 * 1024 ? 'bg-red-500' : 'bg-[var(--color-accent-blue)]'}`}
                                         style={{ width: `${Math.min(100, (formImage instanceof File ? formImage.size : 0) / (500 * 1024) * 100)}%` }}></div>
                                    <p className={`text-xs mt-1 ${formImage instanceof File && formImage.size > 500 * 1024 ? 'text-red-500' : 'text-[var(--color-text-secondary)]'}`}>
                                        {(formImage instanceof File ? (formImage.size / 1024).toFixed(2) : '0.00')} KB / 500 KB
                                    </p>
                                </div>
                                
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setFormImage(null); setImagePreview(''); setImageError(''); }}
                                        className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    {imageError && ( 
                        <p className="text-red-500 text-xs mt-1">{imageError}</p>
                    )}
                </div>

                {/* Campo Es Por Defecto */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isDefault"
                        checked={formIsDefault}
                        onChange={(e) => setFormIsDefault(e.target.checked)}
                        className={`mr-2 h-4 w-4 rounded
                            ${theme === 'light' ? 'text-[var(--color-bg-secondary)] border-[var(--color-text-secondary)]' : 'text-[var(--color-accent-blue)] border-[var(--color-dark-border)]'}
                        `}
                    />
                    <label htmlFor="isDefault" className="text-sm font-medium text-[var(--color-text-main)]">Es Avatar por Defecto</label>
                </div>

                {/* Campo Descripción de Condición de Desbloqueo */}
                <div>
                    <label htmlFor="unlockConditionDescription" className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Condición de Desbloqueo (si no es por defecto):</label>
                    <textarea
                        id="unlockConditionDescription"
                        value={formUnlockConditionDescription}
                        onChange={(e) => setFormUnlockConditionDescription(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 h-24 resize-y
                            ${theme === 'light'
                                ? 'border-[var(--color-text-secondary)] text-[var(--color-text)] focus:ring-[var(--color-bg-secondary)]'
                                : 'border-[var(--color-dark-border)] text-[var(--color-dark-text)] focus:ring-[var(--color-accent-blue)]'
                            }`}
                        placeholder="Ej: 'Desbloqueado al obtener la insignia Maestro de Slangs'"
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

    // --- RENDER PRINCIPAL ---
    return (
        <div className="p-4 sm:p-6 lg:p-8">
        {renderAvatarList()}
        {isFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                {renderAvatarForm()}
            </div>
        )}
    </div>
    );
}

export default AvatarAdminPanel;