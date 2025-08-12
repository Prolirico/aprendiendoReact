import React, { useState, useEffect, useCallback } from "react";
import styles from "./GestionMaestros.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faChalkboardTeacher,
} from "@fortawesome/free-solid-svg-icons";

// Define the base URL of your backend API
const API_URL = "http://localhost:5000/api/maestros";
const SERVER_URL = "http://localhost:5000";

// Initial state for the form
const initialMaestroState = {
  id_maestro: null,
  id_usuario: null,
  id_universidad: "",
  nombre_completo: "",
  email_institucional: "",
  especialidad: "",
  grado_academico: "",
  fecha_ingreso: "",
  email_admin: "",
  password: "",
};

const gradosAcademicos = [
  { value: "licenciatura", label: "Licenciatura" },
  { value: "maestria", label: "Maestría" },
  { value: "doctorado", label: "Doctorado" },
  { value: "posdoctorado", label: "Posdoctorado" },
];

function GestionMaestros() {
  // Data and loading state
  const [maestros, setMaestros] = useState([]);
  const [universidades, setUniversidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalMaestros, setTotalMaestros] = useState(0);

  // Search and debounce state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formState, setFormState] = useState(initialMaestroState);
  const [isEditing, setIsEditing] = useState(false); // false for add, true for edit
  const [maestroToDelete, setMaestroToDelete] = useState(null);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page on new search
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Fetch maestros from the backend API
  const fetchMaestros = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}?page=${page}&limit=10&searchTerm=${debouncedSearchTerm}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error ||
            `Failed to fetch data: ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.json();
      setMaestros(data.maestros);
      setTotalPages(data.totalPages);
      setTotalMaestros(data.total);
    } catch (err) {
      setError(err.message);
      setMaestros([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchTerm]);

  // Fetch universidades for dropdown
  const fetchUniversidades = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/universidades?limit=9999",
      );
      if (!response.ok) throw new Error("Could not fetch universities");
      const data = await response.json();
      setUniversidades(data.universities || []);
    } catch (err) {
      console.error("Failed to fetch universities:", err);
      setUniversidades([]);
    }
  }, []);

  useEffect(() => {
    fetchMaestros();
    fetchUniversidades();
  }, [fetchMaestros, fetchUniversidades]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const handleOpenModal = (maestro = null) => {
    if (maestro) {
      // Edit operation
      setIsEditing(true);
      setFormState({
        ...initialMaestroState,
        ...maestro,
        password: "", // Clear password for security
        email_admin: maestro.email_admin || "",
      });
    } else {
      // Add operation
      setIsEditing(false);
      setFormState({
        ...initialMaestroState,
        fecha_ingreso: new Date().toISOString().split("T")[0], // Today's date
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormState(initialMaestroState);
  };

  const handleOpenDeleteModal = (maestro) => {
    setMaestroToDelete(maestro);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setMaestroToDelete(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const body = {
      id_universidad: formState.id_universidad,
      nombre_completo: formState.nombre_completo,
      email_institucional: formState.email_institucional,
      especialidad: formState.especialidad,
      grado_academico: formState.grado_academico,
      fecha_ingreso: formState.fecha_ingreso,
      email_admin: formState.email_admin,
      ...(formState.password && { password: formState.password }),
      tipo_usuario: "maestro",
    };

    const url = isEditing ? `${API_URL}/${formState.id_maestro}` : API_URL;
    const method = isEditing ? "PUT" : "POST";
    const successMessage = isEditing
      ? "Maestro actualizado con éxito."
      : "Maestro creado con éxito.";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Ocurrió un error desconocido.");
      }

      showToast(successMessage, "success");
      handleCloseModal();
      fetchMaestros();
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!maestroToDelete) return;

    const url = `${API_URL}/${maestroToDelete.id_maestro}`;
    const successMessage = "Maestro eliminado con éxito.";

    try {
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "La eliminación falló.");
      }

      showToast(successMessage, "success");
      handleCloseDeleteModal();
      fetchMaestros();
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  const getUniversidadNombre = (id_universidad) => {
    const universidad = universidades.find(
      (u) => u.id_universidad === id_universidad,
    );
    return universidad ? universidad.nombre : "N/A";
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Cargando Maestros...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.emptyState}>
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Un error ha ocurrido</h3>
          <p>{error}</p>
          <button
            onClick={() => fetchMaestros()}
            className={styles.emptyStateButton}
          >
            Intenta Otra Vez
          </button>
        </div>
      );
    }

    if (maestros.length === 0) {
      return (
        <div className={styles.emptyState}>
          <i className="fas fa-chalkboard-teacher"></i>
          <h3>No se encontraron maestros</h3>
          <p>Comienza agregando un nuevo maestro.</p>
          <button
            onClick={() => handleOpenModal()}
            className={styles.emptyStateButton}
          >
            <i className="fas fa-plus"></i> Agregar Maestro
          </button>
        </div>
      );
    }

    return (
      <>
        <div className={styles.mobileView}>
          {maestros.map((maestro) => (
            <div key={maestro.id_maestro} className={styles.universityCard}>
              <div className={styles.cardContent}>
                <h3 className={styles.universityName}>
                  {maestro.nombre_completo}
                </h3>
                <p className={styles.universityInfo}>
                  <i className="fas fa-envelope"></i>{" "}
                  {maestro.email_institucional}
                </p>
                <p className={styles.universityInfo}>
                  <i className="fas fa-graduation-cap"></i>{" "}
                  {maestro.grado_academico}
                </p>
                <p className={styles.universityInfo}>
                  <i className="fas fa-university"></i>{" "}
                  {getUniversidadNombre(maestro.id_universidad)}
                </p>
              </div>
              <div className={styles.cardActions}>
                <button
                  onClick={() => handleOpenModal(maestro)}
                  className={styles.editButton}
                >
                  <i className="fas fa-edit"></i> Editar
                </button>
                <button
                  onClick={() => handleOpenDeleteModal(maestro)}
                  className={styles.deleteButton}
                >
                  <i className="fas fa-trash"></i> Borrar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.desktopView}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Email Institucional</th>
                <th>Universidad</th>
                <th>Especialidad</th>
                <th>Grado Académico</th>
                <th>Email Admin</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {maestros.map((maestro) => (
                <tr key={maestro.id_maestro}>
                  <td>{maestro.nombre_completo}</td>
                  <td>{maestro.email_institucional}</td>
                  <td>{getUniversidadNombre(maestro.id_universidad)}</td>
                  <td>{maestro.especialidad}</td>
                  <td>{maestro.grado_academico}</td>
                  <td>{maestro.email_admin || "N/A"}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        onClick={() => handleOpenModal(maestro)}
                        className={styles.editButton}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(maestro)}
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
      </>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Gestión de Maestros</h1>
          <div className={styles.userInfo}>
            <span className={styles.userName}>SEDEQ</span>
            <button className={styles.userButton}>
              <i className="fas fa-user"></i>
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.tabContainer}>
          <button className={`${styles.tabButton} ${styles.activeTab}`}>
            <FontAwesomeIcon icon={faChalkboardTeacher} /> Maestros
          </button>
        </div>

        <div className={styles.toolbar}>
          <button
            onClick={() => handleOpenModal()}
            className={styles.addButton}
          >
            <i className="fas fa-plus"></i> Agregar Maestro
          </button>
          <div className={styles.searchContainer}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {renderContent()}

        {maestros.length > 0 && totalPages > 1 && (
          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>
              Showing{" "}
              <strong>
                {(page - 1) * 10 + 1}-{Math.min(page * 10, totalMaestros)}
              </strong>{" "}
              of <strong>{totalMaestros}</strong>
            </div>
            <div className={styles.paginationControls}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className={styles.pageButton}
              >
                Antes
              </button>
              <span className={styles.pageButton} style={{ cursor: "default" }}>
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className={styles.pageButton}
              >
                Después
              </button>
            </div>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{isEditing ? "Editar Maestro" : "Agregar Nuevo Maestro"}</h3>
              <button onClick={handleCloseModal} className={styles.closeButton}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div
                  className={styles.formGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <label htmlFor="nombre_completo">Nombre Completo</label>
                  <input
                    type="text"
                    id="nombre_completo"
                    name="nombre_completo"
                    value={formState.nombre_completo}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="id_universidad">Universidad</label>
                  <select
                    id="id_universidad"
                    name="id_universidad"
                    value={formState.id_universidad}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Seleccione una</option>
                    {universidades.map((uni) => (
                      <option
                        key={uni.id_universidad}
                        value={uni.id_universidad}
                      >
                        {uni.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="grado_academico">Grado Académico</label>
                  <select
                    id="grado_academico"
                    name="grado_academico"
                    value={formState.grado_academico}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="" disabled>
                      Seleccione una opción
                    </option>
                    {gradosAcademicos.map((grado) => (
                      <option key={grado.value} value={grado.value}>
                        {grado.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  className={styles.formGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <label htmlFor="especialidad">Especialidad</label>
                  <input
                    type="text"
                    id="especialidad"
                    name="especialidad"
                    value={formState.especialidad}
                    onChange={handleFormChange}
                    placeholder="Ej: Programación, Matemáticas, Administración..."
                  />
                </div>

                <div
                  className={styles.formGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <label htmlFor="email_institucional">Email</label>
                  <input
                    type="email"
                    id="email_institucional"
                    name="email_institucional"
                    value={formState.email_institucional}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div
                  className={styles.formGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <label htmlFor="password">Contraseña</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formState.password || ""}
                    onChange={handleFormChange}
                    placeholder={
                      isEditing ? "Dejar en blanco para no cambiar" : ""
                    }
                    required={!isEditing}
                  />
                </div>
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
                  <i className="fas fa-save"></i> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className={styles.modalBackdrop} onClick={handleCloseDeleteModal}>
          <div
            className={styles.deleteModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.deleteModalContent}>
              <div className={styles.deleteIcon}>
                <i className="fas fa-trash-alt"></i>
              </div>
              <h3>Confirmar Eliminación</h3>
              <p>
                ¿Estás seguro de que quieres eliminar al maestro{" "}
                <strong>{maestroToDelete?.nombre_completo}</strong>? Esta acción
                no se puede deshacer.
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

export default GestionMaestros;
