import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faEdit, faTrash, faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import styles from "./CredencialesCursos.module.css";

const API_URL = "http://localhost:5000/api/credenciales";
const API_URL_UNIVERSIDADES = "http://localhost:5000/api/universidades";
const API_URL_FACULTADES = "http://localhost:5000/api/facultades";
const API_URL_CURSOS = "http://localhost:5000/api/cursos";

const initialCredentialState = {
    nombre_credencial: "",
    descripcion: "",
    id_universidad: "",
    id_facultad: "",
    cursos: [],
};

function CredencialesCursos({ userId }) {
    const [universidades, setUniversidades] = useState([]);
    const [facultades, setFacultades] = useState([]);
    const [cursosDisponibles, setCursosDisponibles] = useState([]);
    const [cursosEnCredencial, setCursosEnCredencial] = useState([]);
    const [credentials, setCredentials] = useState([]);
    const [selectedUniversidad, setSelectedUniversidad] = useState("");
    const [selectedFacultad, setSelectedFacultad] = useState("");
    const [isFacultadesLoading, setIsFacultadesLoading] = useState(false);
    const [isCoursesLoading, setIsCoursesLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [formState, setFormState] = useState(initialCredentialState);
    const [isEditing, setIsEditing] = useState(false);
    const [credentialToDelete, setCredentialToDelete] = useState(null);
    const [toast, setToast] = useState({ show: false, message: "", type: "" });

    const fetchCredentials = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let url = API_URL;
            if (userId) {
                url += `?id_maestro=${userId}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Error al obtener las credenciales");
            }
            const data = await response.json();
            setCredentials(data.credenciales || []);
        } catch (err) {
            setError(err.message);
            setCredentials([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const fetchUniversidades = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL_UNIVERSIDADES}?limit=9999`);
            if (!response.ok) throw new Error("No se pudieron cargar las universidades");
            const data = await response.json();
            setUniversidades(data.universities || []);
        } catch (err) {
            console.error("Error al cargar universidades:", err.message);
        }
    }, []);

    const fetchFacultades = useCallback(async (idUniversidad) => {
        if (!idUniversidad) {
            setFacultades([]);
            setCursosDisponibles([]);
            setCursosEnCredencial([]);
            return;
        }
        setIsFacultadesLoading(true);
        setFacultades([]);
        setCursosDisponibles([]);
        setCursosEnCredencial([]);
        try {
            const response = await fetch(`${API_URL_FACULTADES}/universidad/${idUniversidad}`);
            const data = await response.json();
            setFacultades(data.data || []);
        } catch (err) {
            console.error("Error al cargar facultades:", err);
        } finally {
            setIsFacultadesLoading(false);
        }
    }, []);

    const fetchCursos = useCallback(async (idFacultad) => {
        if (!idFacultad) {
            setCursosDisponibles([]);
            setCursosEnCredencial([]);
            return;
        }
        setIsCoursesLoading(true);
        setCursosDisponibles([]);
        try {
            const response = await fetch(`${API_URL_CURSOS}?id_facultad=${idFacultad}`);
            const data = await response.json();
            setCursosDisponibles(data.cursos || []);
        } catch (err) {
            console.error("Error al cargar cursos:", err);
        } finally {
            setIsCoursesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCredentials();
        fetchUniversidades();
    }, [fetchCredentials, fetchUniversidades]);

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: "", type: "" });
        }, 3000);
    };

    const handleOpenModal = (credential = null) => {
        if (credential) {
            setIsEditing(true);
            setFormState({
                ...credential,
                cursos: credential.cursos ? credential.cursos.map(c => c.id_curso.toString()) : [],
            });
            setSelectedUniversidad(credential.id_universidad || "");
            setSelectedFacultad(credential.id_facultad || "");
            setCursosEnCredencial(credential.cursos || []);
            setCursosDisponibles([]);
            if (credential.id_universidad) {
                fetchFacultades(credential.id_universidad);
            }
            if (credential.id_facultad) {
                fetchCursos(credential.id_facultad);
            }
        } else {
            setIsEditing(false);
            setFormState(initialCredentialState);
            setSelectedUniversidad("");
            setSelectedFacultad("");
            setCursosDisponibles([]);
            setCursosEnCredencial([]);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCursosDisponibles([]);
        setCursosEnCredencial([]);
    };

    const handleOpenDeleteModal = (credential) => {
        setCredentialToDelete(credential);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => setIsDeleteModalOpen(false);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const handleUniversidadChange = (e) => {
        const uniId = e.target.value;
        setSelectedUniversidad(uniId);
        setSelectedFacultad("");
        setFormState((prev) => ({ ...prev, id_universidad: uniId, id_facultad: "", cursos: [] }));
        setCursosDisponibles([]);
        setCursosEnCredencial([]);
        fetchFacultades(uniId);
    };

    const handleFacultadChange = (e) => {
        const facId = e.target.value;
        setSelectedFacultad(facId);
        setFormState((prev) => ({ ...prev, id_facultad: facId, cursos: [] }));
        setCursosDisponibles([]);
        setCursosEnCredencial([]);
        fetchCursos(facId);
    };

    const agregarCurso = (curso) => {
        if (cursosEnCredencial.length >= 10) {
            showToast("No puedes agregar más de 10 cursos.", "error");
            return;
        }
        setCursosDisponibles((prev) => prev.filter((c) => c.id_curso !== curso.id_curso));
        setCursosEnCredencial((prev) => [...prev, curso]);
        setFormState((prev) => ({
            ...prev,
            cursos: [...prev.cursos, curso.id_curso.toString()],
        }));
    };

    const quitarCurso = (curso) => {
        setCursosEnCredencial((prev) => prev.filter((c) => c.id_curso !== curso.id_curso));
        setCursosDisponibles((prev) => [...prev, curso]);
        setFormState((prev) => ({
            ...prev,
            cursos: prev.cursos.filter((id) => id !== curso.id_curso.toString()),
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (cursosEnCredencial.length < 2) {
            showToast("Debes seleccionar al menos 2 cursos.", "error");
            return;
        }
        if (cursosEnCredencial.length > 10) {
            showToast("No puedes seleccionar más de 10 cursos.", "error");
            return;
        }
        const method = isEditing ? "PUT" : "POST";
        const url = isEditing ? `${API_URL}/${formState.id_credencial}` : API_URL;
        const successMessage = isEditing
            ? "Credencial actualizada con éxito."
            : "Credencial creada con éxito.";

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formState),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Ocurrió un error desconocido.");
            }
            showToast(successMessage, "success");
            handleCloseModal();
            fetchCredentials();
        } catch (err) {
            showToast(`Error: ${err.message}`, "error");
        }
    };

    const handleConfirmDelete = async () => {
        if (!credentialToDelete) return;
        try {
            const response = await fetch(`${API_URL}/${credentialToDelete.id_credencial}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || "La eliminación falló.");
            }
            showToast("Credencial eliminada con éxito.", "success");
            handleCloseDeleteModal();
            fetchCredentials();
        } catch (err) {
            showToast(`Error: ${err.message}`, "error");
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Cargando credenciales...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className={styles.emptyState}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <h3>Un error ha ocurrido</h3>
                    <p>{error}</p>
                    <button onClick={fetchCredentials} className={styles.emptyStateButton}>
                        Intentar de nuevo
                    </button>
                </div>
            );
        }
        if (credentials.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <FontAwesomeIcon icon={faBook} size="3x" />
                    <h3>No se encontraron credenciales</h3>
                    <p>Comienza agregando una nueva credencial para empezar.</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className={styles.emptyStateButton}
                    >
                        <i className="fas fa-plus"></i> Agregar Credencial
                    </button>
                </div>
            );
        }
        return (
            <div className={styles.desktopView}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Universidad</th>
                            <th>Facultad</th>
                            <th># Cursos</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {credentials.map((cred) => (
                            <tr key={cred.id_credencial}>
                                <td>{cred.nombre_credencial}</td>
                                <td>{cred.nombre_universidad}</td>
                                <td>{cred.nombre_facultad}</td>
                                <td>{cred.cursos ? cred.cursos.length : 0}</td>
                                <td>
                                    <div className={styles.tableActions}>
                                        <button
                                            onClick={() => handleOpenModal(cred)}
                                            className={styles.editButton}
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                            onClick={() => handleOpenDeleteModal(cred)}
                                            className={styles.deleteButton}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Gestión de Credenciales</h1>
                </div>
            </header>
            <main className={styles.main}>
                <div className={styles.toolbar}>
                    <button
                        onClick={() => handleOpenModal()}
                        className={styles.addButton}
                    >
                        <i className="fas fa-plus"></i> Agregar Credencial
                    </button>
                </div>
                {renderContent()}
            </main>
            {isModalOpen && (
                <div className={styles.modalBackdrop} onClick={handleCloseModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{isEditing ? "Editar Credencial" : "Agregar Nueva Credencial"}</h3>
                            <button onClick={handleCloseModal} className={styles.closeButton}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label htmlFor="universidad">Universidad</label>
                                    <select
                                        id="universidad"
                                        name="universidad"
                                        value={selectedUniversidad}
                                        onChange={handleUniversidadChange}
                                        required
                                    >
                                        <option value="">Seleccione una universidad</option>
                                        {universidades.map((uni) => (
                                            <option key={uni.id_universidad} value={uni.id_universidad}>
                                                {uni.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {isFacultadesLoading ? (
                                    <div className={styles.loadingState}>
                                        <div className={styles.spinner}></div>
                                        <p>Cargando facultades...</p>
                                    </div>
                                ) : (
                                    selectedUniversidad && (
                                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                            <label htmlFor="facultad">Facultad</label>
                                            <select
                                                id="facultad"
                                                name="facultad"
                                                value={selectedFacultad}
                                                onChange={handleFacultadChange}
                                                required
                                            >
                                                <option value="">Seleccione una facultad</option>
                                                {facultades.map((fac) => (
                                                    <option key={fac.id_facultad} value={fac.id_facultad}>
                                                        {fac.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )
                                )}

                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label htmlFor="nombre_credencial">Nombre de la Credencial</label>
                                    <input
                                        type="text"
                                        id="nombre_credencial"
                                        name="nombre_credencial"
                                        value={formState.nombre_credencial}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label htmlFor="descripcion">Descripción</label>
                                    <textarea
                                        id="descripcion"
                                        name="descripcion"
                                        value={formState.descripcion}
                                        onChange={handleFormChange}
                                        rows="3"
                                        required
                                    ></textarea>
                                </div>

                                {isCoursesLoading ? (
                                    <div className={styles.loadingState}>
                                        <div className={styles.spinner}></div>
                                        <p>Cargando cursos...</p>
                                    </div>
                                ) : (
                                    selectedFacultad && (
                                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                            <label>Cursos (mínimo 2, máximo 10)</label>
                                            <div className={styles.courseManagement}>
                                                <div className={styles.courseSection}>
                                                    <div className={styles.courseSectionHeader}>
                                                        <h6>Cursos Disponibles</h6>
                                                        <span className={styles.courseCount}>{cursosDisponibles.length}</span>
                                                    </div>
                                                    <div className={styles.courseList}>
                                                        {cursosDisponibles.length === 0 ? (
                                                            <div className={styles.emptyCourseList}>
                                                                <FontAwesomeIcon icon={faBook} />
                                                                <p>No hay cursos disponibles</p>
                                                            </div>
                                                        ) : (
                                                            cursosDisponibles.map((curso) => (
                                                                <div key={curso.id_curso} className={styles.courseItem}>
                                                                    <div className={styles.courseInfo}>
                                                                        <span className={styles.courseName}>{curso.nombre_curso}</span>
                                                                        <span className={styles.courseCode}>{curso.codigo_curso}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => agregarCurso(curso)}
                                                                        className={styles.addCourseBtn}
                                                                        title="Agregar curso"
                                                                    >
                                                                        <FontAwesomeIcon icon={faPlus} />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.courseDivider}>
                                                    <div className={styles.dividerLine}></div>
                                                    <i className="fas fa-arrows-alt-h"></i>
                                                    <div className={styles.dividerLine}></div>
                                                </div>
                                                <div className={styles.courseSection}>
                                                    <div className={styles.courseSectionHeader}>
                                                        <h6>Cursos en Credencial</h6>
                                                        <span className={styles.courseCount}>{cursosEnCredencial.length}</span>
                                                    </div>
                                                    <div className={styles.courseList}>
                                                        {cursosEnCredencial.length === 0 ? (
                                                            <div className={styles.emptyCourseList}>
                                                                <FontAwesomeIcon icon={faBook} />
                                                                <p>Agrega cursos aquí</p>
                                                            </div>
                                                        ) : (
                                                            cursosEnCredencial.map((curso) => (
                                                                <div key={curso.id_curso} className={`${styles.courseItem} ${styles.selectedCourseItem}`}>
                                                                    <div className={styles.courseInfo}>
                                                                        <span className={styles.courseName}>{curso.nombre_curso}</span>
                                                                        <span className={styles.courseCode}>{curso.codigo_curso}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => quitarCurso(curso)}
                                                                        className={styles.removeCourseBtn}
                                                                        title="Quitar curso"
                                                                    >
                                                                        <FontAwesomeIcon icon={faMinus} />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className={styles.cancelButton}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.saveButton}>
                                    <i className="fas fa-save"></i> Guardar
                                </button>
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
                                <i className="fas fa-trash-alt"></i>
                            </div>
                            <h3>Confirmar Eliminación</h3>
                            <p>
                                ¿Estás seguro de que quieres eliminar la credencial{" "}
                                <strong>{credentialToDelete?.nombre_credencial}</strong>? Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <div className={styles.deleteActions}>
                            <button
                                onClick={handleCloseDeleteModal}
                                className={styles.cancelButton}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className={styles.confirmDeleteButton}
                            >
                                Confirmar Eliminación
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {toast.show && (
                <div className={styles.toast}>
                    <div
                        className={`${styles.toastContent} ${styles[toast.type] || styles.success}`}
                    >
                        <i
                            className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}
                        ></i>
                        <p>{toast.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CredencialesCursos;
