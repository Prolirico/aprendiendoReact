import React, { useState, useEffect, useCallback } from "react";
import styles from "./CategoriasCursos.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTag,
  faPlus,
  faEdit,
  faTrash,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = "http://localhost:5000/api/categorias";

// Simula la obtención del token. En una aplicación real, esto vendría de un AuthContext o localStorage.
const getAuthToken = () => {
  // Intenta obtener el token del localStorage.
  // Reemplaza 'authToken' por la clave real que usas para guardar el token.
  return localStorage.getItem("token");
};

const initialFormState = {
  id_categoria: null,
  nombre_categoria: "",
  descripcion: "",
  tipo_categoria: "area_conocimiento",
  estatus: "activa",
};

function CategoriasCursos() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [categoryToModify, setCategoryToModify] = useState(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No se encontró token de autenticación.");
      }

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al obtener las categorías.");
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setIsEditing(true);
      setCategoryToModify(category);
      setFormState(category);
    } else {
      setIsEditing(false);
      setFormState(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCategoryToModify(null);
  };

  const handleOpenDeleteModal = (category) => {
    setCategoryToModify(category);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCategoryToModify(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    const url = isEditing
      ? `${API_URL}/${categoryToModify.id_categoria}`
      : API_URL;
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formState),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Ocurrió un error desconocido.");
      }

      showToast(
        isEditing
          ? "Categoría actualizada con éxito"
          : "Categoría creada con éxito",
        "success",
      );
      handleCloseModal();
      fetchCategories();
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToModify) return;
    const token = getAuthToken();
    try {
      const response = await fetch(
        `${API_URL}/${categoryToModify.id_categoria}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "La desactivación falló.");
      }

      showToast("Categoría desactivada con éxito", "success");
      handleCloseDeleteModal();
      fetchCategories();
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Cargando Categorías...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className={styles.emptyState}>
          <h3>Un error ha ocurrido</h3>
          <p>{error}</p>
          <button onClick={fetchCategories} className={styles.emptyStateButton}>
            Intentar de Nuevo
          </button>
        </div>
      );
    }
    if (categories.length === 0) {
      return (
        <div className={styles.emptyState}>
          <FontAwesomeIcon icon={faTag} size="2x" />
          <h3>No se encontraron categorías</h3>
          <p>
            Comienza agregando una nueva categoría para organizar los cursos.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className={styles.emptyStateButton}
          >
            <FontAwesomeIcon icon={faPlus} /> Agregar Categoría
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
              <th>Tipo</th>
              <th>Estatus</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id_categoria}>
                <td>{cat.nombre_categoria}</td>
                <td>{cat.tipo_categoria}</td>
                <td>
                  <span
                    className={
                      cat.estatus === "activa"
                        ? styles.statusActive
                        : styles.statusInactive
                    }
                  >
                    {cat.estatus}
                  </span>
                </td>
                <td>
                  <div className={styles.tableActions}>
                    <button
                      onClick={() => handleOpenModal(cat)}
                      className={styles.editButton}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    {cat.estatus === "activa" && (
                      <button
                        onClick={() => handleOpenDeleteModal(cat)}
                        className={styles.deleteButton}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
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
          <h1 className={styles.title}>Gestión de Categorías</h1>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.toolbar}>
          <button
            onClick={() => handleOpenModal()}
            className={styles.addButton}
          >
            <FontAwesomeIcon icon={faPlus} /> Agregar Categoría
          </button>
        </div>
        {renderContent()}
      </main>

      {/* Modal para Agregar/Editar */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={handleCloseModal}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "500px" }}
          >
            <div className={styles.modalHeader}>
              <h3>
                {isEditing ? "Editar Categoría" : "Agregar Nueva Categoría"}
              </h3>
              <button onClick={handleCloseModal} className={styles.closeButton}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className={styles.form}>
              <div
                className={styles.formGroup}
                style={{ gridColumn: "1 / -1" }}
              >
                <label htmlFor="nombre_categoria">Nombre</label>
                <input
                  type="text"
                  id="nombre_categoria"
                  name="nombre_categoria"
                  value={formState.nombre_categoria}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div
                className={styles.formGroup}
                style={{ gridColumn: "1 / -1" }}
              >
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formState.descripcion}
                  onChange={handleFormChange}
                  rows="3"
                ></textarea>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="tipo_categoria">Tipo</label>
                <select
                  id="tipo_categoria"
                  name="tipo_categoria"
                  value={formState.tipo_categoria}
                  onChange={handleFormChange}
                >
                  <option value="area_conocimiento">
                    Área de Conocimiento
                  </option>
                  <option value="carrera">Carrera</option>
                  <option value="tipo_apoyo">Tipo de Apoyo</option>
                  <option value="nivel">Nivel</option>
                </select>
              </div>
              {isEditing && (
                <div className={styles.formGroup}>
                  <label htmlFor="estatus">Estatus</label>
                  <select
                    id="estatus"
                    name="estatus"
                    value={formState.estatus}
                    onChange={handleFormChange}
                  >
                    <option value="activa">Activa</option>
                    <option value="inactiva">Inactiva</option>
                  </select>
                </div>
              )}
              <div
                className={styles.formActions}
                style={{ gridColumn: "1 / -1" }}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.saveButton}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {isDeleteModalOpen && (
        <div className={styles.modalBackdrop} onClick={handleCloseDeleteModal}>
          <div
            className={styles.deleteModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.deleteModalContent}>
              <div className={styles.deleteIcon}>
                <FontAwesomeIcon icon={faTrash} />
              </div>
              <h3>Confirmar Desactivación</h3>
              <p>
                ¿Estás seguro de que quieres desactivar la categoría{" "}
                <strong>{categoryToModify?.nombre_categoria}</strong>? No se
                borrará, pero no podrá ser asignada a nuevos cursos.
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
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={styles.toast}>
          <div className={`${styles.toastContent} ${styles[toast.type]}`}>
            <p>{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriasCursos;
