import React, { useState, useEffect } from "react";
import styles from "./AlumnoTareaYCalificaciones.module.css";

const API_BASE_URL = "http://localhost:5000";

const AlumnoTareaYCalificaciones = ({ userId }) => {
  const [activeTab, setActiveTab] = useState("tareas");
  const [cursosInscritos, setCursosInscritos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [calificaciones, setCalificaciones] = useState(null);
  const [loading, setLoading] = useState({
    cursos: false,
    tareas: false,
    calificaciones: false,
  });
  const [openAccordions, setOpenAccordions] = useState({});
  const [fileUploads, setFileUploads] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Función de diagnóstico para verificar conectividad
  const testConnection = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Token disponible:", !!token);

      if (!token) {
        console.error("No hay token de autenticación");
        showToast("No hay token de autenticación", "error");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      console.log("Probando conexión con inscripciones...");
      const inscripcionesTest = await fetch(
        `${API_BASE_URL}/api/inscripciones/alumno`,
        { headers },
      );
      console.log("Respuesta inscripciones:", inscripcionesTest.status);

      console.log("Probando conexión con cursos...");
      const cursosTest = await fetch(
        `${API_BASE_URL}/api/cursos?exclude_assigned=false`,
        { headers },
      );
      console.log("Respuesta cursos:", cursosTest.status);

      if (inscripcionesTest.ok && cursosTest.ok) {
        showToast("Conexión con backend exitosa", "success");
      } else {
        showToast("Problemas de conexión detectados", "error");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      showToast("Error de conexión: " + error.message, "error");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const loadCursosInscritos = async () => {
    setLoading((prev) => ({ ...prev, cursos: true }));
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Debes iniciar sesión para ver tus cursos.", "error");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Obtener inscripciones del alumno
      const inscripcionesRes = await fetch(
        `${API_BASE_URL}/api/inscripciones/alumno`,
        { headers },
      );

      if (!inscripcionesRes.ok) {
        throw new Error("No se pudieron cargar las inscripciones del alumno");
      }

      const inscripcionesData = await inscripcionesRes.json();
      const inscripciones = inscripcionesData.inscripciones || [];

      console.log("Inscripciones encontradas:", inscripciones);

      // Filtrar solo las inscripciones aprobadas
      const inscripcionesAprobadas = inscripciones.filter(
        (inscripcion) => inscripcion.estatus_inscripcion === "aprobada",
      );

      console.log("Inscripciones aprobadas:", inscripcionesAprobadas);

      if (inscripcionesAprobadas.length === 0) {
        setCursosInscritos([]);
        console.log("No se encontraron cursos con inscripciones aprobadas");
        return;
      }

      // Obtener detalles de los cursos usando exclude_assigned=false para ver todos
      const cursosRes = await fetch(
        `${API_BASE_URL}/api/cursos?exclude_assigned=false`,
        { headers },
      );

      if (!cursosRes.ok) {
        throw new Error("No se pudieron cargar los detalles de los cursos");
      }

      const cursosData = await cursosRes.json();
      console.log("Cursos cargados:", cursosData.cursos?.length || 0);

      // Crear array de cursos inscritos con información completa
      const cursosInscritos = inscripcionesAprobadas
        .map((inscripcion) => {
          const curso = cursosData.cursos?.find(
            (c) => c.id_curso === inscripcion.id_curso,
          );

          if (!curso) {
            console.warn(
              `Curso no encontrado para inscripción: ${inscripcion.id_curso}`,
            );
            return null;
          }

          return {
            id: curso.id_curso,
            nombre: curso.nombre_curso || curso.nombre,
            universidad: curso.nombre_universidad || "Universidad",
            estado: curso.estatus_curso || "en_curso",
            fecha_inicio: curso.fecha_inicio,
            fecha_fin: curso.fecha_fin,
            modalidad: curso.modalidad,
            inscripcion: inscripcion, // Guardamos la inscripción completa para referencia
          };
        })
        .filter(Boolean); // Eliminar elementos null

      console.log("Cursos inscritos procesados:", cursosInscritos);

      setCursosInscritos(cursosInscritos);
      if (cursosInscritos.length > 0 && !cursoSeleccionado) {
        setCursoSeleccionado(cursosInscritos[0]);
      }
    } catch (error) {
      console.error("Error loading cursos:", error);
      showToast("Error al cargar los cursos: " + error.message, "error");
    } finally {
      setLoading((prev) => ({ ...prev, cursos: false }));
    }
  };

  const loadTareas = async () => {
    if (!cursoSeleccionado) {
      console.log("No hay curso seleccionado para cargar tareas");
      return;
    }

    console.log(
      "Cargando tareas para curso:",
      cursoSeleccionado.id,
      cursoSeleccionado.nombre,
    );
    setLoading((prev) => ({ ...prev, tareas: true }));
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Debes iniciar sesión para ver las tareas.", "error");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Obtener calificaciones del curso que incluye las actividades/tareas
      const response = await fetch(
        `${API_BASE_URL}/api/calificaciones/${cursoSeleccionado.id}`,
        { headers },
      );

      console.log("Respuesta de calificaciones:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          // No hay calificaciones configuradas aún
          console.log("No hay calificaciones configuradas para este curso");
          setTareas([]);
          showToast(
            "Este curso aún no tiene actividades configuradas.",
            "info",
          );
          return;
        }
        const errorText = await response.text();
        console.error("Error en respuesta:", errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Datos de calificaciones recibidos:", data);

      // Transformar las actividades a formato de tareas
      const tareasFormateadas = (data.actividades || []).map((actividad) => ({
        id:
          actividad.id_actividad ||
          actividad.id ||
          `act_${actividad.nombre.replace(/\s+/g, "_")}`,
        nombre: actividad.nombre,
        porcentaje: actividad.porcentaje,
        fecha_limite: actividad.fecha_limite,
        entregada: false, // Por ahora asumimos que no están entregadas
        calificacion: null, // Se llenará cuando haya calificaciones
        max_archivos: actividad.max_archivos || 5,
        max_tamano_mb: actividad.max_tamano_mb || 10,
        tipos_archivo_permitidos: actividad.tipos_archivo_permitidos ||
          actividad.tipos_permitidos || ["pdf", "zip"],
      }));

      console.log("Tareas formateadas:", tareasFormateadas);
      setTareas(tareasFormateadas);

      if (tareasFormateadas.length === 0) {
        showToast("No hay actividades disponibles para este curso.", "info");
      }
    } catch (error) {
      console.error("Error loading tareas:", error);
      showToast("Error al cargar las tareas: " + error.message, "error");
    } finally {
      setLoading((prev) => ({ ...prev, tareas: false }));
    }
  };

  const loadCalificaciones = async () => {
    if (!cursoSeleccionado) {
      console.log("No hay curso seleccionado para cargar calificaciones");
      return;
    }

    console.log("Cargando calificaciones para curso:", cursoSeleccionado.id);
    setLoading((prev) => ({ ...prev, calificaciones: true }));
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Debes iniciar sesión para ver las calificaciones.", "error");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Obtener calificaciones del curso
      const response = await fetch(
        `${API_BASE_URL}/api/calificaciones/${cursoSeleccionado.id}`,
        { headers },
      );

      console.log("Respuesta de calificaciones:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          // No hay calificaciones configuradas aún
          console.log("No hay calificaciones configuradas para este curso");
          setCalificaciones(null);
          showToast("Las calificaciones aún no están disponibles.", "info");
          return;
        }
        const errorText = await response.text();
        console.error("Error en respuesta:", errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Datos de calificaciones recibidos:", data);

      // Transformar datos para el componente
      const calificacionesFormateadas = {
        evaluaciones: (data.actividades || []).map((actividad) => ({
          id:
            actividad.id_actividad ||
            actividad.id ||
            `act_${actividad.nombre.replace(/\s+/g, "_")}`,
          nombre: actividad.nombre,
          porcentaje: actividad.porcentaje,
          calificacion: actividad.calificacion_obtenida || null,
          feedback: actividad.feedback || null,
          valor_minimo: Math.floor(actividad.porcentaje * 0.6), // 60% para aprobar cada actividad
        })),
        total: data.calificacion_final || 0,
        umbral_aprobatorio: data.umbral_aprobatorio || 60,
        aprobado:
          (data.calificacion_final || 0) >= (data.umbral_aprobatorio || 60),
      };

      console.log("Calificaciones formateadas:", calificacionesFormateadas);
      setCalificaciones(calificacionesFormateadas);
    } catch (error) {
      console.error("Error loading calificaciones:", error);
      showToast(
        "Error al cargar las calificaciones: " + error.message,
        "error",
      );
    } finally {
      setLoading((prev) => ({ ...prev, calificaciones: false }));
    }
  };

  useEffect(() => {
    loadCursosInscritos();
    // Ejecutar diagnóstico en desarrollo
    if (process.env.NODE_ENV === "development") {
      setTimeout(testConnection, 1000);
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === "tareas" && cursoSeleccionado) {
      loadTareas();
    } else if (activeTab === "calificaciones" && cursoSeleccionado) {
      loadCalificaciones();
    }
  }, [activeTab, cursoSeleccionado]);

  const toggleAccordion = (tareaId) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [tareaId]: !prev[tareaId],
    }));
  };

  const handleFileSelect = (tareaId, files) => {
    const tarea = tareas.find((t) => t.id === tareaId);
    if (!tarea) return;

    const currentFiles = fileUploads[tareaId]?.files || [];
    const newFiles = [];

    if (currentFiles.length + files.length > tarea.max_archivos) {
      showToast(
        `Solo puedes subir un máximo de ${tarea.max_archivos} archivos.`,
        "error",
      );
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > tarea.max_tamano_mb * 1024 * 1024) {
        showToast(
          `El archivo ${file.name} excede el tamaño máximo de ${tarea.max_tamano_mb}MB.`,
          "error",
        );
        continue;
      }

      const fileExt = file.name.split(".").pop().toLowerCase();
      if (!tarea.tipos_archivo_permitidos.includes(fileExt)) {
        showToast(
          `El archivo ${file.name} no tiene un formato permitido (${tarea.tipos_archivo_permitidos.join(", ")}).`,
          "error",
        );
        continue;
      }

      newFiles.push(file);
    }

    if (newFiles.length > 0) {
      setFileUploads((prev) => ({
        ...prev,
        [tareaId]: {
          files: [...currentFiles, ...newFiles],
          uploading: false,
        },
      }));
    }
  };

  const handleFileRemove = (tareaId, fileIndex) => {
    setFileUploads((prev) => ({
      ...prev,
      [tareaId]: {
        ...prev[tareaId],
        files: prev[tareaId].files.filter((_, index) => index !== fileIndex),
      },
    }));
  };

  const handleUpload = async (tareaId) => {
    const files = fileUploads[tareaId]?.files || [];
    if (files.length === 0) return;

    setFileUploads((prev) => ({
      ...prev,
      [tareaId]: { ...prev[tareaId], uploading: true },
    }));

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files[]", file));

      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Debes iniciar sesión para enviar entregas.", "error");
        return;
      }

      // Preparar FormData para envío al backend
      const formDataToSend = new FormData();
      formDataToSend.append("curso_id", cursoSeleccionado.id);
      formDataToSend.append("actividad_id", tareaId);
      files.forEach((file, index) => {
        formDataToSend.append(`archivos`, file);
      });

      const response = await fetch(`${API_BASE_URL}/api/entregas`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        showToast(
          "Tu entrega ha sido enviada con éxito. ¡Estás un paso más cerca!",
          "success",
        );

        // Update task as submitted
        setTareas((prev) =>
          prev.map((tarea) =>
            tarea.id === tareaId ? { ...tarea, entregada: true } : tarea,
          ),
        );

        // Clear file uploads for this task
        setFileUploads((prev) => ({
          ...prev,
          [tareaId]: { files: [] },
        }));
      } else {
        const errorData = await response.json();
        showToast(
          errorData.error ||
            "Ha ocurrido un error al enviar tu entrega. Inténtalo de nuevo.",
          "error",
        );
      }
    } catch (error) {
      showToast(
        "No se pudo enviar la entrega. Por favor, inténtalo de nuevo.",
        "error",
      );
    } finally {
      setFileUploads((prev) => ({
        ...prev,
        [tareaId]: { ...prev[tareaId], uploading: false },
      }));
    }
  };

  const FileUploadComponent = ({ tarea }) => {
    const files = fileUploads[tarea.id]?.files || [];
    const uploading = fileUploads[tarea.id]?.uploading || false;
    const isOverdue = new Date(tarea.fecha_limite) < new Date();

    if (tarea.entregada) {
      return (
        <div className={styles.taskResult}>
          {!isOverdue ? (
            <div className={styles.successMessage}>
              <i className="fas fa-check-circle"></i>
              <div>¡Genial! Tu entrega ha sido enviada. ¡Sigue así!</div>
            </div>
          ) : (
            <div className={styles.errorMessage}>
              <i className="fas fa-exclamation-circle"></i>
              <div>
                Lo sentimos, el plazo ha terminado. ¡Sigue con lo siguiente!
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={styles.uploadSection}>
        <h4>Subir entrega:</h4>
        <div
          className={styles.uploadContainer}
          onDrop={(e) => {
            e.preventDefault();
            handleFileSelect(tarea.id, e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <i className="fas fa-cloud-upload-alt"></i>
          <p>Arrastra archivos aquí o haz clic para seleccionar</p>
          <p className={styles.uploadHint}>
            Máximo {tarea.max_archivos} archivos, {tarea.max_tamano_mb}MB c/u.
            Formatos: {tarea.tipos_archivo_permitidos.join(", ")}
          </p>
          <input
            type="file"
            multiple
            accept={tarea.tipos_archivo_permitidos
              .map((ext) => `.${ext}`)
              .join(",")}
            onChange={(e) => handleFileSelect(tarea.id, e.target.files)}
            style={{ display: "none" }}
            id={`file-input-${tarea.id}`}
          />
          <button
            className={styles.btnOutline}
            onClick={() =>
              document.getElementById(`file-input-${tarea.id}`).click()
            }
          >
            Seleccionar archivos
          </button>
        </div>

        {files.length > 0 && (
          <div className={styles.fileList}>
            {files.map((file, index) => (
              <div key={index} className={styles.fileItem}>
                <span>{file.name}</span>
                <button
                  onClick={() => handleFileRemove(tarea.id, index)}
                  className={styles.removeFileBtn}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          className={styles.btnPrimary}
          disabled={files.length === 0 || uploading}
          onClick={() => handleUpload(tarea.id)}
        >
          {uploading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Enviando...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane"></i>
              Enviar entrega
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Course Selector */}
      {loading.cursos ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Cargando cursos...</span>
        </div>
      ) : cursosInscritos.length > 0 ? (
        <div className={styles.courseSelector}>
          <h2>📚 Mis Cursos Activos</h2>
          <p className={styles.courseSelectorDescription}>
            Selecciona un curso para ver sus tareas, proyectos y calificaciones.
          </p>
          <div className={styles.courseCards}>
            {cursosInscritos.map((curso) => (
              <div
                key={curso.id}
                className={`${styles.courseCard} ${cursoSeleccionado?.id === curso.id ? styles.selectedCourse : ""}`}
                onClick={() => setCursoSeleccionado(curso)}
              >
                <h3>{curso.nombre}</h3>
                <p>{curso.universidad}</p>
                <div className={styles.courseDetails}>
                  <span className={styles.courseModalidad}>
                    <i className="fas fa-laptop"></i>
                    {curso.modalidad === "virtual"
                      ? "Virtual"
                      : curso.modalidad === "presencial"
                        ? "Presencial"
                        : curso.modalidad === "mixto"
                          ? "Mixto"
                          : curso.modalidad}
                  </span>
                  {curso.fecha_fin && (
                    <span className={styles.courseFechaFin}>
                      <i className="fas fa-calendar-alt"></i>
                      Finaliza: {formatDate(curso.fecha_fin)}
                    </span>
                  )}
                </div>
                <span
                  className={`${styles.courseStatus} ${styles[curso.estado]}`}
                >
                  {curso.estado === "en_curso"
                    ? "En Curso"
                    : curso.estado === "finalizado"
                      ? "Finalizado"
                      : curso.estado === "abierto"
                        ? "Abierto"
                        : curso.estado === "planificado"
                          ? "Planificado"
                          : curso.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.emptyMessage}>
          <div className={styles.messageIcon}>
            <i className="fas fa-graduation-cap"></i>
          </div>
          <h3>¡Bienvenido al Centro de Tareas!</h3>
          <p>
            Aquí podrás acceder a las tareas, proyectos y calificaciones de tus
            cursos activos.
          </p>
          <div className={styles.helpSteps}>
            <div className={styles.helpStep}>
              <i className="fas fa-search"></i>
              <span>
                Explora los cursos disponibles en la sección principal
              </span>
            </div>
            <div className={styles.helpStep}>
              <i className="fas fa-paper-plane"></i>
              <span>Solicita inscripción a los cursos que te interesen</span>
            </div>
            <div className={styles.helpStep}>
              <i className="fas fa-check-circle"></i>
              <span>Una vez aprobada tu inscripción, aparecerán aquí</span>
            </div>
          </div>
          <small>
            💡 Tip: Revisa "Mi Seguimiento" para ver el estado de tus
            solicitudes.
          </small>
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={testConnection}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#185d96",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🔧 Diagnosticar Conexión
            </button>
          )}
        </div>
      )}

      {/* Tabs - only show if course is selected */}
      {cursoSeleccionado && (
        <>
          <div className={styles.selectedCourseHeader}>
            <h2>{cursoSeleccionado.nombre}</h2>
            <p>{cursoSeleccionado.universidad}</p>
          </div>

          <div className={styles.tabs}>
            <div
              className={`${styles.tab} ${activeTab === "tareas" ? styles.active : ""}`}
              onClick={() => setActiveTab("tareas")}
            >
              <i className="fas fa-tasks"></i> Tareas y Proyectos
            </div>
            <div
              className={`${styles.tab} ${activeTab === "calificaciones" ? styles.active : ""}`}
              onClick={() => setActiveTab("calificaciones")}
            >
              <i className="fas fa-trophy"></i> Calificaciones
            </div>
          </div>
        </>
      )}

      {/* Tab Content */}
      {cursoSeleccionado && (
        <div className={styles.tabContent}>
          {activeTab === "tareas" && (
            <div className={styles.tareasTab}>
              {loading.tareas ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <span>Cargando tareas...</span>
                </div>
              ) : tareas.length > 0 ? (
                <div className={styles.tareasList}>
                  {tareas.map((tarea) => (
                    <div key={tarea.id} className={styles.accordion}>
                      <div
                        className={styles.accordionHeader}
                        onClick={() => toggleAccordion(tarea.id)}
                      >
                        <div>
                          <span>{tarea.nombre}</span>
                          {tarea.entregada && (
                            <span className={styles.entregadaBadge}>
                              Entregada
                            </span>
                          )}
                        </div>
                        <i
                          className={`fas ${openAccordions[tarea.id] ? "fa-chevron-up" : "fa-chevron-down"}`}
                        ></i>
                      </div>

                      {openAccordions[tarea.id] && (
                        <div className={styles.accordionContent}>
                          <div className={styles.taskMeta}>
                            <span>
                              <i className="fas fa-calendar-alt"></i>
                              Fecha límite: {formatDate(tarea.fecha_limite)}
                            </span>
                            <span>
                              <i className="fas fa-percentage"></i>
                              Valor: {tarea.porcentaje}%
                            </span>
                            {tarea.calificacion && (
                              <span>
                                <i className="fas fa-star"></i>
                                Calificación: {tarea.calificacion}
                              </span>
                            )}
                          </div>

                          <FileUploadComponent tarea={tarea} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyMessage}>
                  <div className={styles.messageIcon}>
                    <i className="fas fa-clipboard-list"></i>
                  </div>
                  <h3>📋 Sin actividades configuradas</h3>
                  <p>
                    El profesor aún no ha publicado tareas o proyectos para este
                    curso.
                  </p>
                  <div className={styles.helpInfo}>
                    <div className={styles.helpItem}>
                      <i className="fas fa-clock"></i>
                      <span>
                        Las actividades aparecerán automáticamente aquí
                      </span>
                    </div>
                    <div className={styles.helpItem}>
                      <i className="fas fa-upload"></i>
                      <span>Podrás subir archivos PDF y agregar enlaces</span>
                    </div>
                    <div className={styles.helpItem}>
                      <i className="fas fa-star"></i>
                      <span>Recibirás calificaciones y retroalimentación</span>
                    </div>
                  </div>
                  <small>
                    💡 Mientras tanto, puedes revisar otros cursos o explorar el
                    material disponible.
                  </small>
                </div>
              )}
            </div>
          )}

          {activeTab === "calificaciones" && (
            <div className={styles.calificacionesTab}>
              {loading.calificaciones ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <span>Cargando calificaciones...</span>
                </div>
              ) : calificaciones ? (
                <div>
                  <div className={styles.gradeList}>
                    {calificaciones.evaluaciones.map((evaluacion) => (
                      <div key={evaluacion.id} className={styles.gradeItem}>
                        <div>
                          <div className={styles.gradeName}>
                            {evaluacion.nombre}
                          </div>
                          {evaluacion.feedback && (
                            <div className={styles.feedbackBubble}>
                              {evaluacion.feedback}
                            </div>
                          )}
                        </div>
                        <div
                          className={`${styles.gradeValue} ${evaluacion.calificacion >= evaluacion.porcentaje * 0.7 ? styles.good : styles.bad}`}
                        >
                          {evaluacion.calificacion || "Pendiente"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.totalGrade}>
                    <div>
                      <div className={styles.totalLabel}>
                        Calificación final
                      </div>
                      <div className={styles.totalValue}>
                        {calificaciones.total}
                      </div>
                    </div>
                    <div className={styles.totalProgress}>
                      <div
                        className={styles.totalProgressBar}
                        style={{
                          width: `${calificaciones.total}%`,
                          backgroundColor:
                            calificaciones.total >=
                            calificaciones.umbral_aprobatorio
                              ? "#4caf50"
                              : "#f44336",
                        }}
                      ></div>
                    </div>
                    <div
                      className={styles.gradeStatus}
                      style={{
                        color: calificaciones.aprobado ? "#4caf50" : "#f44336",
                      }}
                    >
                      {calificaciones.aprobado
                        ? "¡Felicidades! Has aprobado este curso"
                        : `Necesitas ${calificaciones.umbral_aprobatorio} para aprobar`}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyMessage}>
                  <div className={styles.messageIcon}>
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <h3>📊 Calificaciones en preparación</h3>
                  <p>
                    Tus calificaciones aparecerán aquí una vez que el profesor
                    configure las actividades y publique las evaluaciones.
                  </p>
                  <div className={styles.gradeInfo}>
                    <div className={styles.infoItem}>
                      <i className="fas fa-tasks"></i>
                      <span>Completa las tareas asignadas</span>
                    </div>
                    <div className={styles.infoItem}>
                      <i className="fas fa-file-upload"></i>
                      <span>Sube tus entregas a tiempo</span>
                    </div>
                    <div className={styles.infoItem}>
                      <i className="fas fa-trophy"></i>
                      <span>Recibe retroalimentación detallada</span>
                    </div>
                  </div>
                  <small>
                    🎯 Mantente al día con las entregas para obtener la mejor
                    calificación.
                  </small>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toast Messages */}
      {toast.show && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AlumnoTareaYCalificaciones;
