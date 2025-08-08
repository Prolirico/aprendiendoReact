import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import styles from "./GestionCursos.module.css";

const API_URL = "http://localhost:5000/api/cursos";

// Estado inicial para el formulario del curso
const initialCourseState = {
  nombre_curso: "",
  descripcion: "",
  id_categoria: "",
  id_maestro: null,
  horario: "",
  objetivos: "",
  prerequisitos: "",
  duracion_horas: "",
  cupo_maximo: "",
  fecha_inicio: "",
  fecha_fin: "",
  nivel: "basico",
  link_clase: "",
  codigo_curso: "",
};

function CourseManagement({ userId }) {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [teachers, setTeachers] = useState([]); // Estado para la lista de maestros
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formState, setFormState] = useState(initialCourseState);
  const [isEditing, setIsEditing] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Función para obtener los cursos
  const fetchCourses = useCallback(async () => {
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
        throw new Error(errData.error || "Error al obtener los cursos");
      }
      const data = await response.json();
      setCourses(data.cursos || []);
    } catch (err) {
      setError(err.message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Función para obtener las categorías de cursos activas
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/categorias/activas",
      );
      if (!response.ok) {
        throw new Error("No se pudieron cargar las categorías");
      }
      const data = await response.json();
      setCategories(data || []);
    } catch (err) {
      console.error("Error al cargar categorías:", err.message);
    }
  }, []);

  // Función para obtener la lista de maestros (solo para la vista de admin)
  const fetchTeachers = useCallback(async () => {
    if (!userId) {
      // Solo si es admin
      try {
        // Obtenemos todos los maestros con un límite alto, como en GestionMaestros
        const response = await fetch(
          "http://localhost:5000/api/maestros?limit=9999",
        );
        if (!response.ok) {
          throw new Error("No se pudieron cargar los maestros");
        }
        const data = await response.json();
        setTeachers(data.maestros || []);
      } catch (err) {
        console.error("Error al cargar maestros:", err.message);
        // Opcional: mostrar un toast de error si la carga de maestros falla
        showToast(err.message, "error");
      }
    }
  }, [userId]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchCourses();
    fetchCategories();
    fetchTeachers();
  }, [fetchCourses, fetchCategories, fetchTeachers]);

  // Función para mostrar notificaciones toast
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Abrir modal para agregar/editar
  const handleOpenModal = (course = null) => {
    if (course) {
      setIsEditing(true);
      // Formatear fechas para los inputs de tipo 'date'
      const formattedCourse = {
        ...course,
        fecha_inicio: course.fecha_inicio
          ? new Date(course.fecha_inicio).toISOString().split("T")[0]
          : "",
        fecha_fin: course.fecha_fin
          ? new Date(course.fecha_fin).toISOString().split("T")[0]
          : "",
      };
      setFormState(formattedCourse);
    } else {
      setIsEditing(false);
      // Si es un maestro, su ID se asigna automáticamente. Si es admin, puede elegir.
      setFormState({ ...initialCourseState, id_maestro: userId || null });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleOpenDeleteModal = (course) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => setIsDeleteModalOpen(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `${API_URL}/${formState.id_curso}` : API_URL;
    const successMessage = isEditing
      ? "Curso actualizado con éxito."
      : "Curso creado con éxito.";

    const bodyToSend = { ...formState };
    if (!isEditing) {
      delete bodyToSend.codigo_curso;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Ocurrió un error desconocido.");
      }
      showToast(successMessage, "success");
      handleCloseModal();
      fetchCourses();
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      const response = await fetch(`${API_URL}/${courseToDelete.id_curso}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "La eliminación falló.");
      }
      showToast("Curso eliminado con éxito.", "success");
      handleCloseDeleteModal();
      fetchCourses();
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Cargando cursos...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className={styles.emptyState}>
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Un error ha ocurrido</h3>
          <p>{error}</p>
          <button onClick={fetchCourses} className={styles.emptyStateButton}>
            Intentar de nuevo
          </button>
        </div>
      );
    }
    if (courses.length === 0) {
      return (
        <div className={styles.emptyState}>
          <FontAwesomeIcon icon={faBook} size="3x" />
          <h3>No se encontraron cursos</h3>
          <p>Comienza agregando un nuevo curso para empezar.</p>
          <button
            onClick={() => handleOpenModal()}
            className={styles.emptyStateButton}
          >
            <i className="fas fa-plus"></i> Agregar Curso
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
              <th>Código</th>
              <th>Nivel</th>
              <th>Duración (horas)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id_curso}>
                <td>{course.nombre_curso}</td>
                <td>{course.codigo_curso}</td>
                <td>{course.nivel}</td>
                <td>{course.duracion_horas}</td>
                <td>
                  <div className={styles.tableActions}>
                    <button
                      onClick={() => handleOpenModal(course)}
                      className={styles.editButton}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(course)}
                      className={styles.deleteButton}
                    >
                      <i className="fas fa-trash"></i>
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
          <h1 className={styles.title}>Gestión de Cursos</h1>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.toolbar}>
          <button
            onClick={() => handleOpenModal()}
            className={styles.addButton}
          >
            <i className="fas fa-plus"></i> Agregar Curso
          </button>
        </div>
        {renderContent()}
      </main>
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{isEditing ? "Editar Curso" : "Agregar Nuevo Curso"}</h3>
              <button onClick={handleCloseModal} className={styles.closeButton}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                {/* Campo para seleccionar maestro (solo para admin) */}
                {!userId && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="id_maestro">Maestro Asignado</label>
                    <select
                      id="id_maestro"
                      name="id_maestro"
                      value={formState.id_maestro || ""}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="" disabled>
                        Seleccione un maestro
                      </option>
                      {teachers.map((teacher) => (
                        <option
                          key={teacher.id_maestro}
                          value={teacher.id_maestro}
                        >
                          {teacher.nombre_completo}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label htmlFor="nombre_curso">Nombre del Curso</label>
                  <input
                    type="text"
                    id="nombre_curso"
                    name="nombre_curso"
                    value={formState.nombre_curso}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="id_categoria">Categoría</label>
                  <select
                    id="id_categoria"
                    name="id_categoria"
                    value={formState.id_categoria}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Seleccione una categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre_categoria}
                      </option>
                    ))}
                  </select>
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
                <div className={styles.formGroup}>
                  <label htmlFor="duracion_horas">Duración (horas)</label>
                  <input
                    type="number"
                    id="duracion_horas"
                    name="duracion_horas"
                    value={formState.duracion_horas}
                    onChange={handleFormChange}
                    min="1"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="cupo_maximo">Cupo Máximo</label>
                  <input
                    type="number"
                    id="cupo_maximo"
                    name="cupo_maximo"
                    value={formState.cupo_maximo}
                    onChange={handleFormChange}
                    min="1"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="fecha_inicio">Fecha de Inicio</label>
                  <input
                    type="date"
                    id="fecha_inicio"
                    name="fecha_inicio"
                    value={formState.fecha_inicio}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="fecha_fin">Fecha de Fin</label>
                  <input
                    type="date"
                    id="fecha_fin"
                    name="fecha_fin"
                    value={formState.fecha_fin}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="nivel">Nivel</label>
                  <select
                    id="nivel"
                    name="nivel"
                    value={formState.nivel}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="basico">Básico</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
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
                  <i className="fas fa-save"></i> Guardar
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
                ¿Estás seguro de que quieres eliminar el curso{" "}
                <strong>{courseToDelete?.nombre_curso}</strong>? Esta acción no
                se puede deshacer.
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

export default CourseManagement;
