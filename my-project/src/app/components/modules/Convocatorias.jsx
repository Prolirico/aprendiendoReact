import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarAlt,
    faEdit,
    faTrash,
    faPlus,
    faMinus,
    faUniversity,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./Convocatorias.module.css";

const API_URL_CONVOCATORIAS = "http://localhost:5000/api/convocatorias";
const API_URL_UNIVERSIDADES = "http://localhost:5000/api/universidades";

const initialFormState = {
    nombre: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "planeada",
    universidades: [],
};

// Helper para obtener el token (asumiendo que lo guardas en localStorage)
const getAuthToken = () => localStorage.getItem("token");

function GestionConvocatorias() {
    const [convocatorias, setConvocatorias] = useState([]);
    const [allUniversidades, setAllUniversidades] = useState([]);
    const [universidadesDisponibles, setUniversidadesDisponibles] = useState([]);
    const [universidadesEnConvocatoria, setUniversidadesEnConvocatoria] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [formState, setFormState] = useState(initialFormState);
    const [isEditing, setIsEditing] = useState(false);
    const [convocatoriaToDelete, setConvocatoriaToDelete] = useState(null);
    const [toast, setToast] = useState({ show: false, message: "", type: "" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    };

    const fetchConvocatorias = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL_CONVOCATORIAS);
            if (!response.ok) throw new Error("Error al cargar las convocatorias.");
            const data = await response.json();
            setConvocatorias(data);
        } catch (err) {
            setError(err.message);
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUniversidades = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL_UNIVERSIDADES}?limit=9999`);
            if (!response.ok) throw new Error("Error al cargar las universidades.");
            const data = await response.json();
            setAllUniversidades(data.universities || []);
        } catch (err) {
            showToast(err.message, "error");
        }
    }, []);

    useEffect(() => {
        fetchConvocatorias();
        fetchUniversidades();
    }, [fetchConvocatorias, fetchUniversidades]);

    const handleOpenModal = async (convocatoria = null) => {
        if (convocatoria) {
            setIsEditing(true);
            try {
                const response = await fetch(`${API_URL_CONVOCATORIAS}/${convocatoria.id}`);
                if (!response.ok) throw new Error("No se pudo cargar la convocatoria para editar.");
                const data = await response.json();

                const formattedData = {
                    ...data,
                    fecha_inicio: data.fecha_inicio.split('T')[0],
                    fecha_fin: data.fecha_fin.split('T')[0],
                };
                setFormState(formattedData);

                const enConvocatoria = allUniversidades.filter(uni => data.universidades.includes(uni.id_universidad));
                const disponibles = allUniversidades.filter(uni => !data.universidades.includes(uni.id_universidad));
                setUniversidadesEnConvocatoria(enConvocatoria);
                setUniversidadesDisponibles(disponibles);

            } catch (err) {
                showToast(err.message, "error");
                return;
            }
        } else {
            setIsEditing(false);
            setFormState(initialFormState);
            setUniversidadesEnConvocatoria([]);
            setUniversidadesDisponibles([...allUniversidades]);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormState(initialFormState);
        setUniversidadesEnConvocatoria([]);
        setUniversidadesDisponibles([]);
    };

    const handleOpenDeleteModal = (convocatoria) => {
        setConvocatoriaToDelete(convocatoria);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => setIsDeleteModalOpen(false);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const agregarUniversidad = (universidad) => {
        setUniversidadesEnConvocatoria((prev) => [...prev, universidad]);
        setUniversidadesDisponibles((prev) => prev.filter((u) => u.id_universidad !== universidad.id_universidad));
        setFormState((prev) => ({
            ...prev,
            universidades: [...prev.universidades, universidad.id_universidad],
        }));
    };

    const quitarUniversidad = (universidad) => {
        setUniversidadesDisponibles((prev) => [...prev, universidad]);
        setUniversidadesEnConvocatoria((prev) => prev.filter((u) => u.id_universidad !== universidad.id_universidad));
        setFormState((prev) => ({
            ...prev,
            universidades: prev.universidades.filter((id) => id !== universidad.id_universidad),
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const token = getAuthToken();
        if (!token) {
            showToast("No estás autenticado.", "error");
            return;
        }

        const method = isEditing ? "PUT" : "POST";
        const url = isEditing ? `${API_URL_CONVOCATORIAS}/${formState.id}` : API_URL_CONVOCATORIAS;
        const successMessage = isEditing ? "Convocatoria actualizada con éxito." : "Convocatoria creada con éxito.";

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formState),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Ocurrió un error.");

            showToast(successMessage);
            handleCloseModal();
            fetchConvocatorias();
        } catch (err) {
            showToast(`Error: ${err.message}`, "error");
        }
    };

    const handleConfirmDelete = async () => {
        if (!convocatoriaToDelete) return;
        const token = getAuthToken();
        if (!token) {
            showToast("No estás autenticado.", "error");
            return;
        }

        try {
            const response = await fetch(`${API_URL_CONVOCATORIAS}/${convocatoriaToDelete.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || "La eliminación falló.");
            }
            showToast("Convocatoria eliminada con éxito.");
            handleCloseDeleteModal();
            fetchConvocatorias();
        } catch (err) {
            showToast(`Error: ${err.message}`, "error");
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Cargando convocatorias...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className={styles.emptyState}>
                    <FontAwesomeIcon icon={faCalendarAlt} className={styles.icon} />
                    <h3>Ocurrió un error</h3>
                    <p>{error}</p>
                    <button onClick={fetchConvocatorias} className={styles.emptyStateButton}>
                        Intentar de nuevo
                    </button>
                </div>
            );
        }
        if (convocatorias.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <FontAwesomeIcon icon={faCalendarAlt} size="3x" className={styles.icon} />
                    <h3>No hay convocatorias</h3>
                    <p>Crea una nueva convocatoria para empezar a gestionarlas.</p>
                    <button onClick={() => handleOpenModal()} className={styles.emptyStateButton}>
                        <FontAwesomeIcon icon={faPlus} /> Agregar Convocatoria
                    </button>
                </div>
            );
        }
        return (
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Fechas</th>
                        <th>Universidades</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {convocatorias.map((conv) => (
                        <tr key={conv.id}>
                            <td>{conv.nombre}</td>
                            <td>{conv.estado}</td>
                            <td>{new Date(conv.fecha_inicio).toLocaleDateString()} - {new Date(conv.fecha_fin).toLocaleDateString()}</td>
                            <td>{conv.universidades_nombres || 'Ninguna'}</td>
                            <td>
                                <div className={styles.tableActions}>
                                    <button onClick={() => handleOpenModal(conv)} className={styles.editButton} title="Editar">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button onClick={() => handleOpenDeleteModal(conv)} className={styles.deleteButton} title="Eliminar">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Gestión de Convocatorias</h1>
                </div>
            </header>
            <main className={styles.main}>
                <div className={styles.toolbar}>
                    <button onClick={() => handleOpenModal()} className={styles.addButton}>
                        <FontAwesomeIcon icon={faPlus} /> Agregar Convocatoria
                    </button>
                </div>
                {renderContent()}
            </main>

            {isModalOpen && (
                <div className={styles.modalBackdrop} onClick={handleCloseModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{isEditing ? "Editar Convocatoria" : "Nueva Convocatoria"}</h3>
                            <button onClick={handleCloseModal} className={styles.closeButton}>&times;</button>
                        </div>
                        <form onSubmit={handleFormSubmit} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="nombre">Nombre</label>
                                    <input type="text" id="nombre" name="nombre" value={formState.nombre} onChange={handleFormChange} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="estado">Estado</label>
                                    <select id="estado" name="estado" value={formState.estado} onChange={handleFormChange} required>
                                        <option value="planeada">Planeada</option>
                                        <option value="activa">Activa</option>
                                        <option value="finalizada">Finalizada</option>
                                        <option value="cancelada">Cancelada</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="fecha_inicio">Fecha de Inicio</label>
                                    <input type="date" id="fecha_inicio" name="fecha_inicio" value={formState.fecha_inicio} onChange={handleFormChange} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="fecha_fin">Fecha de Fin</label>
                                    <input type="date" id="fecha_fin" name="fecha_fin" value={formState.fecha_fin} onChange={handleFormChange} required />
                                </div>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label htmlFor="descripcion">Descripción</label>
                                    <textarea id="descripcion" name="descripcion" value={formState.descripcion} onChange={handleFormChange} rows="3"></textarea>
                                </div>

                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label>Universidades Participantes</label>
                                    <div className={styles.universityManagement}>
                                        <div className={styles.universitySection}>
                                            <div className={styles.universitySectionHeader}>
                                                <h6>Disponibles</h6>
                                                <span className={styles.universityCount}>{universidadesDisponibles.length}</span>
                                            </div>
                                            <div className={styles.universityList}>
                                                {universidadesDisponibles.length === 0 ? (
                                                    <div className={styles.emptyList}>
                                                        <FontAwesomeIcon icon={faUniversity} className={styles.icon} />
                                                        <p>No hay más universidades</p>
                                                    </div>
                                                ) : (
                                                    universidadesDisponibles.map((uni) => (
                                                        <div key={uni.id_universidad} className={styles.universityItem}>
                                                            <div className={styles.universityInfo}>
                                                                <span className={styles.universityName}>{uni.nombre}</span>
                                                            </div>
                                                            <button type="button" onClick={() => agregarUniversidad(uni)} className={styles.addUniversityBtn} title="Agregar">
                                                                <FontAwesomeIcon icon={faPlus} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.universitySection}>
                                            <div className={styles.universitySectionHeader}>
                                                <h6>En Convocatoria</h6>
                                                <span className={styles.universityCount}>{universidadesEnConvocatoria.length}</span>
                                            </div>
                                            <div className={styles.universityList}>
                                                {universidadesEnConvocatoria.length === 0 ? (
                                                    <div className={styles.emptyList}>
                                                        <FontAwesomeIcon icon={faUniversity} className={styles.icon} />
                                                        <p>Agrega universidades</p>
                                                    </div>
                                                ) : (
                                                    universidadesEnConvocatoria.map((uni) => (
                                                        <div key={uni.id_universidad} className={`${styles.universityItem} ${styles.selectedUniversityItem}`}>
                                                            <div className={styles.universityInfo}>
                                                                <span className={styles.universityName}>{uni.nombre}</span>
                                                            </div>
                                                            <button type="button" onClick={() => quitarUniversidad(uni)} className={styles.removeUniversityBtn} title="Quitar">
                                                                <FontAwesomeIcon icon={faMinus} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.formActions}>
                                <button type="button" onClick={handleCloseModal} className={styles.cancelButton}>Cancelar</button>
                                <button type="submit" className={styles.saveButton}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className={styles.modalBackdrop} onClick={handleCloseDeleteModal}>
                    <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.deleteModalContent}>
                            <div className={styles.deleteIcon}>
                                <FontAwesomeIcon icon={faTrash} />
                            </div>
                            <h3>Confirmar Eliminación</h3>
                            <p>
                                ¿Estás seguro de que quieres eliminar la convocatoria{" "}
                                <strong>{convocatoriaToDelete?.nombre}</strong>? Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <div className={styles.deleteActions}>
                            <button onClick={handleCloseDeleteModal} className={styles.cancelButton}>Cancelar</button>
                            <button onClick={handleConfirmDelete} className={styles.confirmDeleteButton}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {toast.show && (
                <div className={styles.toast}>
                    <div className={`${styles.toastContent} ${styles[toast.type] || styles.success}`}>
                        <p>{toast.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GestionConvocatorias;
