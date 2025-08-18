import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import styles from "./GestionCursos.module.css";

const API_URL = "http://localhost:5000/api/cursos";
const API_URL_UNIVERSIDADES = "http://localhost:5000/api/universidades";
const API_URL_FACULTADES = "http://localhost:5000/api/facultades";
const API_URL_CARRERAS = "http://localhost:5000/api/carreras";
const API_URL_MAESTROS = "http://localhost:5000/api/maestros";


// Estado inicial para el formulario del curso
const initialCourseState = {
  nombre_curso: "",
  descripcion: "",
  id_categoria: "",
  id_maestro: "",
  horario: "",
  objetivos: "",
  prefrequisitos: "",
  duracion_horas: "",
  cupo_maximo: "",
  fecha_inicio: "",
  fecha_fin: "",
  nivel: "basico",
  link_clase: "",
  codigo_curso: "",
};

function CourseManagement({ userId }) {
  const [universidades, setUniversidades] = useState([]);
  const [facultades, setFacultades] = useState([]);
  const [carreras, setCarreras] = useState([]);
  // Estados para los filtros de maestro
  const [selectedUniversidad, setSelectedUniversidad] = useState("");
  const [selectedFacultad, setSelectedFacultad] = useState("");
  const [selectedCarrera, setSelectedCarrera] = useState("");
  const [isFacultadesLoading, setIsFacultadesLoading] = useState(false);
  const [isCarrerasLoading, setIsCarrerasLoading] = useState(false);
  const [isTeachersLoading, setIsTeachersLoading] = useState(false);
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
      setCarreras([]);
      setTeachers([]);
      return;
    }
    setIsFacultadesLoading(true);
    setFacultades([]);
    setCarreras([]);
    setTeachers([]);
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

  const fetchCarreras = useCallback(async (idFacultad) => {
    if (!idFacultad) {
      setCarreras([]);
      setTeachers([]);
      return;
    }
    setIsCarrerasLoading(true);
    setCarreras([]);
    setTeachers([]);
    try {
      const response = await fetch(`${API_URL_CARRERAS}/facultad/${idFacultad}`);
      const data = await response.json();
      setCarreras(data.data || []);
    } catch (err) {
      console.error("Error al cargar carreras:", err);
    } finally {
      setIsCarrerasLoading(false);
    }
  }, []);

  const fetchTeachers = useCallback(async (idCarrera) => {
    if (!idCarrera) {
      setTeachers([]);
      return;
    }
    setIsTeachersLoading(true);
    setTeachers([]);
    try {
      // El backend podrá filtrar por carrera
      const response = await fetch(`${API_URL_MAESTROS}?id_carrera=${idCarrera}`);
      const data = await response.json();
      setTeachers(data.maestros || []);
    } catch (err) {
      console.error("Error al cargar maestros:", err);
    } finally {
      setIsTeachersLoading(false);
    }
  }, []);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchCourses();
    fetchCategories();
    if (!userId) {
      fetchUniversidades();
    }
  }, [fetchCourses, fetchCategories, fetchUniversidades, userId]);

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

      if (course.id_universidad) {
        setSelectedUniversidad(course.id_universidad);
        fetchFacultades(course.id_universidad);
      }
      if (course.id_facultad) {
        setSelectedFacultad(course.id_facultad);
        fetchCarreras(course.id_facultad);
      }
      if (course.id_carrera) {
        setSelectedCarrera(course.id_carrera);
        fetchTeachers(course.id_carrera);
      }
    } else {
      setIsEditing(false);
      setFormState({ ...initialCourseState, id_maestro: userId || null });
      setSelectedUniversidad("");
      setSelectedFacultad("");
      setSelectedCarrera("");
      setFacultades([]);
      setCarreras([]);
      setTeachers([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setFormState(initialCourseState);
    setSelectedUniversidad("");
    setSelectedFacultad("");
    setSelectedCarrera("");
    setFacultades([]);
    setCarreras([]);
    setTeachers([]);
  };

  const handleOpenDeleteModal = (course) => {
    setCourseToDelete(course);
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
    setSelectedCarrera("");
    setFormState(prev => ({
        ...prev,
        id_universidad: uniId,
        id_facultad: "",
        id_carrera: "",
        id_maestro: ""
    }));
    fetchFacultades(uniId);
  };

  const handleFacultadChange = (e) => {
    const facId = e.target.value;
    setSelectedFacultad(facId);
    setSelectedCarrera("");
    setFormState(prev => ({
        ...prev,
        id_facultad: facId,
        id_carrera: "",
        id_maestro: ""
    }));
    fetchCarreras(facId);
  };

  const handleCarreraChange = (e) => {
    const carId = e.target.value;
    setSelectedCarrera(carId);
    setFormState(prev => ({
        ...prev,
        id_carrera: carId,
        id_maestro: ""
    }));
    fetchTeachers(carId);
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
              <th>Universidad</th>
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
                <td>{course.nombre_universidad || 'N/A'}</td>
                <td>{course.nivel}</td>
                <td>{course.duracion_horas}</td>
                <td>
                  <div className={styles.tableActions}>
                    <button
                      onClick={() => handleOpenModal(course)}
                      className={styles.editButton}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(course)}
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
                {/* --- INICIO DE LA SECCIÓN DE FILTROS --- */}
                {!userId && (
                  <>
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

                    {isFacultadesLoading ? <p>Cargando facultades...</p> : (
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

                    {isCarrerasLoading ? <p>Cargando carreras...</p> : (
                      selectedFacultad && (
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                          <label htmlFor="carrera">Carrera</label>
                          <select
                            id="carrera"
                            name="carrera"
                            value={selectedCarrera}
                            onChange={handleCarreraChange}
                            required
                          >
                            <option value="">Seleccione una carrera</option>
                            {carreras.map((car) => (
                              <option key={car.id_carrera} value={car.id_carrera}>
                                {car.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      )
                    )}
                    
                    {isTeachersLoading ? <p>Cargando maestros...</p> : (
                      selectedCarrera && (
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                          <label htmlFor="id_maestro">Maestro Asignado</label>
                          <select
                            id="id_maestro"
                            name="id_maestro"
                            value={formState.id_maestro || ""}
                            onChange={handleFormChange}
                            required
                          >
                            <option value="">Seleccione un maestro</option>
                            {teachers.map((teacher) => (
                              <option key={teacher.id_maestro} value={teacher.id_maestro}>
                                {teacher.nombre_completo}
                              </option>
                            ))}
                          </select>
                        </div>
                      )
                    )}
                  </>
                )}
                {/* --- FIN DE LA SECCIÓN DE FILTROS --- */}

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
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="objetivos">Objetivos</label>
                  <textarea
                    id="objetivos"
                    name="objetivos"
                    value={formState.objetivos || ""}
                    onChange={handleFormChange}
                    rows="3"
                  ></textarea>
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="prerequisitos">Prerrequisitos</label>
                  <textarea
                    id="prerequisitos"
                    name="prerequisitos"
                    value={formState.prerequisitos || ""}
                    onChange={handleFormChange}
                    rows="3"
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
                {isEditing && (
                  <div className={styles.formGroup}>
                    <label htmlFor="estatus_curso">Estatus del Curso</label>
                    <select
                      id="estatus_curso"
                      name="estatus_curso"
                      value={formState.estatus_curso || "planificado"}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="planificado">Planificado</option>
                      <option value="abierto">Abierto</option>
                      <option value="en_curso">En Curso</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                )}
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
