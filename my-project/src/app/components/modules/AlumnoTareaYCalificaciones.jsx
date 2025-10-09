"use client";

import { useState, useEffect } from "react";
import styles from "./AlumnoTareaYCalificaciones.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faExternalLinkAlt, faDownload } from "@fortawesome/free-solid-svg-icons";

const API_BASE_URL = "http://localhost:5000";

const AlumnoTareaYCalificaciones = ({ userId }) => {
  const [activeTab, setActiveTab] = useState("material");
  const [cursosInscritos, setCursosInscritos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [material, setMaterial] = useState({
    planeacion: [],
    material_descarga: [],
  });
  const [tareas, setTareas] = useState([]);
  const [calificaciones, setCalificaciones] = useState(null);
  const [loading, setLoading] = useState({
    cursos: false,
    material: false,
    tareas: false,
    calificaciones: false,
  });
  const [openAccordions, setOpenAccordions] = useState({});
  const [fileUploads, setFileUploads] = useState({});
  const [linkInputs, setLinkInputs] = useState({});
  const [linksToSubmit, setLinksToSubmit] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleAddLink = (tareaId) => {
    const link = linkInputs[tareaId];
    if (!link || !link.startsWith("http")) {
      showToast(
        "Por favor, introduce un enlace válido (debe empezar con http o https).",
        "error",
      );
      return;
    }
    setLinksToSubmit((prev) => ({
      ...prev,
      [tareaId]: [...(prev[tareaId] || []), link],
    }));
    setLinkInputs((prev) => ({ ...prev, [tareaId]: "" })); // Clear input
  };

  const handleRemoveLink = (tareaId, linkIndex) => {
    setLinksToSubmit((prev) => ({
      ...prev,
      [tareaId]: prev[tareaId].filter((_, index) => index !== linkIndex),
    }));
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
    if (!dateString) return null;
    const date = new Date(dateString);
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) return null;
    // Verificar si no es la fecha Unix epoch (1970-01-01)
    if (date.getFullYear() <= 1970) return null;
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

  const loadMaterial = async () => {
    if (!cursoSeleccionado) {
      console.log("No hay curso seleccionado para cargar material");
      return;
    }

    console.log("Cargando material para curso:", cursoSeleccionado.id);
    setLoading((prev) => ({ ...prev, material: true }));
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Debes iniciar sesión para ver el material.", "error");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(
        `${API_BASE_URL}/api/material/curso/${cursoSeleccionado.id}`,
        { headers },
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log("No hay material configurado para este curso");
          setMaterial({ planeacion: [], material_descarga: [] });
          return;
        }
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log("Material recibido:", data);

      // Formatear material correctamente para mostrar planeación y material de descarga
      const formattedMaterial = {
        planeacion: data.material?.planeacion || [],
        material_descarga: data.material?.material_descarga || [],
      };
      setMaterial(formattedMaterial);
    } catch (error) {
      console.error("Error loading material:", error);
      showToast("Error al cargar el material: " + error.message, "error");
    } finally {
      setLoading((prev) => ({ ...prev, material: false }));
    }
  };

  const loadTareas = async () => {
    if (!cursoSeleccionado) {
      console.log("No hay curso seleccionado para cargar tareas");
      return;
    }

    console.log("Cargando tareas para curso:", cursoSeleccionado.id);
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

      // 1. Obtener actividades configuradas desde el backend de calificaciones
      const actividadesResponse = await fetch(
        `${API_BASE_URL}/api/calificaciones/${cursoSeleccionado.id}`,
        { headers },
      );

      let actividadesConfiguradas = [];
      if (actividadesResponse.ok) {
        const actividadesData = await actividadesResponse.json();
        actividadesConfiguradas = actividadesData.actividades || [];
      }

      // 2. Obtener material de actividad (recursos de apoyo)
      const materialResponse = await fetch(
        `${API_BASE_URL}/api/material/curso/${cursoSeleccionado.id}`,
        { headers },
      );

      let materialesActividad = [];
      if (materialResponse.ok) {
        const materialData = await materialResponse.json();
        materialesActividad = materialData.material?.actividad || [];
      }

      // 3. Fetch existing submissions (entregas) for the student in this course
      const entregasResponse = await fetch(
        `${API_BASE_URL}/api/entregas/alumno/${cursoSeleccionado.id}`,
        { headers },
      );

      let entregasExistentes = [];
      if (entregasResponse.ok) {
        const entregasData = await entregasResponse.json();
        entregasExistentes = entregasData.entregas || [];
      } else {
        console.error("Error cargando entregas:", entregasResponse.status);
      }

      // 4. Combinar actividades con material y entregas
      const tareasFormateadas = actividadesConfiguradas.map((actividad) => {
        const recursosActividad = materialesActividad.filter(
          (material) => material.id_actividad === actividad.id_actividad,
        );

        const materialPrincipal =
          recursosActividad.find((material) => !material.es_enlace) ||
          recursosActividad[0];

        // Buscar entrega existente por id_actividad
        const entregaExistente = entregasExistentes.find(
          (entrega) => entrega.id_actividad === actividad.id_actividad,
        );

        const recursos = recursosActividad.map((material) => ({
          nombre:
            material.nombre_archivo || material.nombre_enlace || "Recurso",
          url: material.es_enlace
            ? material.url_enlace
            : `${API_BASE_URL}${material.ruta_descarga}`,
          tipo: material.es_enlace ? "enlace" : "archivo",
        }));

        return {
          // Usar una combinación única para el ID del componente para evitar colisiones
          id: `tarea-${actividad.id_actividad}`,
          id_actividad: actividad.id_actividad,
          nombre: actividad.nombre,
          descripcion: actividad.descripcion || "",
          instrucciones: actividad.instrucciones || "",
          fecha_limite:
            actividad.fecha_limite &&
            actividad.fecha_limite !== "0000-00-00 00:00:00" &&
            new Date(actividad.fecha_limite).getFullYear() > 1970
              ? actividad.fecha_limite
              : null,
          entregada: !!entregaExistente,
          entrega: entregaExistente || null,
          calificacion: entregaExistente?.calificacion || null,
          recursos: recursos,
          max_archivos: actividad.max_archivos || 5,
          max_tamano_mb: actividad.max_tamano_mb || 25,
          tipos_archivo_permitidos: actividad.tipos_archivo_permitidos
            ? JSON.parse(actividad.tipos_archivo_permitidos)
            : ["pdf", "docx", "zip", "jpg", "png"],
        };
      });

      console.log("Tareas formateadas (lógica corregida):", tareasFormateadas);
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
          // Usar la calificación y el feedback desde el objeto 'entrega' anidado
          calificacion: actividad.entrega?.calificacion ?? null,
          feedback: actividad.entrega?.comentario_profesor || null,
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
    if (activeTab === "material" && cursoSeleccionado) {
      loadMaterial();
    } else if (activeTab === "tareas" && cursoSeleccionado) {
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
    const tarea = tareas.find((t) => t.id === tareaId);
    if (!tarea) {
      showToast("Error: No se pudo encontrar la tarea.", "error");
      return;
    }

    const files = fileUploads[tareaId]?.files || [];
    const links = linksToSubmit[tareaId] || [];

    if (files.length === 0 && links.length === 0) {
      showToast("No hay archivos ni enlaces para adjuntar.", "info");
      return;
    }

    setFileUploads((prev) => ({
      ...prev,
      [tareaId]: { ...prev[tareaId], uploading: true },
    }));

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Debes iniciar sesión para enviar entregas.", "error");
        setFileUploads((prev) => ({ ...prev, [tareaId]: { ...prev[tareaId], uploading: false } }));
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("id_actividad", tarea.id_actividad);
      formDataToSend.append("comentario_estudiante", "Entrega de actividad");

      files.forEach((file) => {
        formDataToSend.append("archivos", file);
      });

      // Enviar el array de enlaces como JSON una sola vez
      if (links.length > 0) {
        formDataToSend.append("links", JSON.stringify(links));
      }

      const response = await fetch(`${API_BASE_URL}/api/entregas`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        showToast("Archivos y/o enlaces adjuntados con éxito.", "success");
        loadTareas();
        setFileUploads((prev) => ({ ...prev, [tareaId]: { files: [] } }));
        setLinksToSubmit((prev) => ({ ...prev, [tareaId]: [] }));
      } else {
        const errorData = await response.json();
        showToast(`Error al adjuntar: ${errorData.error || response.statusText}`, "error");
      }
    } catch (error) {
      showToast(`Error de conexión al subir: ${error.message}`, "error");
    } finally {
      setFileUploads((prev) => ({
        ...prev,
        [tareaId]: { ...prev[tareaId], uploading: false },
      }));
    }
  };

  // Función para manejar descargas con autenticación
  const handleDownloadWithAuth = async (url) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Debes iniciar sesión para descargar archivos.", "error");
        return;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;

        // Obtener el nombre del archivo desde los headers de la respuesta
        const contentDisposition = response.headers.get("content-disposition");
        let filename = "archivo";
        if (contentDisposition && contentDisposition.includes("filename=")) {
          filename = contentDisposition
            .split("filename=")[1]
            .replace(/"/g, "")
            .trim();
        } else {
          // Fallback: usar el último segmento de la URL si no hay header
          filename = url.split("/").pop() || "archivo";
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        showToast("Error al descargar el archivo.", "error");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      showToast("Error al descargar el archivo.", "error");
    }
  };

  // Función para eliminar una entrega
  const handleEliminarEntrega = async (id_archivo_entrega) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este archivo?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Debes iniciar sesión para eliminar archivos.", "error");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/entregas/archivo/${id_archivo_entrega}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        showToast("Archivo eliminado exitosamente.", "success");
        loadTareas(); // Recargar para actualizar la vista
      } else {
        const errorText = await response.text();
        showToast("Error al eliminar el archivo.", "error");
      }
    } catch (error) {
      console.error("Error eliminando archivo:", error);
      showToast("Error al eliminar el archivo.", "error");
    }
  };

  const handleSubmitEntrega = async (id_entrega) => {
    if (!confirm("¿Estás seguro de que quieres entregar esta tarea? Una vez entregada, solo podrás anular la entrega si el profesor no la ha calificado.")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/entregas/${id_entrega}/submit`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        showToast("Tarea entregada exitosamente.", "success");
        loadTareas();
      } else {
        const error = await response.json();
        showToast(`Error al entregar: ${error.error || 'Error desconocido'}`, "error");
      }
    } catch (error) {
      showToast(`Error de conexión: ${error.message}`, "error");
    }
  };

  const handleUnsubmitEntrega = async (id_entrega) => {
    if (!confirm("¿Estás seguro de que quieres anular la entrega? Podrás volver a subir archivos y entregar de nuevo.")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/entregas/${id_entrega}/unsubmit`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        showToast("Entrega anulada. Ahora puedes hacer cambios.", "info");
        loadTareas();
      } else {
        const error = await response.json();
        showToast(`Error al anular: ${error.error || 'Error desconocido'}`, "error");
      }
    } catch (error) {
      showToast(`Error de conexión: ${error.message}`, "error");
    }
  };

  // Componente refactorizado para manejar la lógica de entrega de tareas
  const FileUploadComponent = ({ tareaId }) => {
    const tarea = tareas.find((t) => t.id === tareaId);
    if (!tarea) return null;

    const { entrega } = tarea;
    const filesToUpload = fileUploads[tareaId]?.files || [];
    const linksToSubmitList = linksToSubmit[tareaId] || [];
    const isUploading = fileUploads[tareaId]?.uploading || false;

    const isOverdue =
      tarea.fecha_limite && new Date(tarea.fecha_limite) < new Date();
    const isGraded = entrega?.estatus_entrega === "calificada";
    const isSubmitted = entrega?.estatus_entrega === "entregada";
    const isDraft = entrega?.estatus_entrega === "no_entregada";

    // Debug: Ver el estado actual
    console.log(`[DEBUG] Tarea ${tareaId}:`, {
      estatus: entrega?.estatus_entrega,
      isGraded,
      isSubmitted,
      isDraft,
      isOverdue,
      archivos: entrega?.archivos?.length || 0
    });

    const canSubmit =
      entrega &&
      (entrega.archivos?.length > 0 || entrega.links?.length > 0);
    const canModify = !isGraded && (!isOverdue || isDraft || isSubmitted);
    
    console.log(`[DEBUG] Tarea ${tareaId} - Permisos:`, {
      canSubmit,
      canModify,
      formula: `!${isGraded} && (!${isOverdue} || ${isDraft} || ${isSubmitted})`
    });

    // 1. Vista de Tarea Calificada (Estado final)
    if (isGraded) {
      return (
        <div className={styles.taskResult}>
          <div className={styles.successMessage}>
            <i className="fas fa-check-circle"></i>
            <div>
              <strong>¡Tarea calificada!</strong>
              <p>
                Calificación: <strong>{entrega.calificacion} / 100</strong>
              </p>
              {entrega.comentario_profesor && (
                <div className={styles.professorComment}>
                  <strong>Comentario del profesor:</strong>
                  <p>{entrega.comentario_profesor}</p>
                </div>
              )}
              {entrega.archivos && entrega.archivos.length > 0 && (
                <div className={styles.entregaFiles}>
                  <strong>Archivos y enlaces entregados:</strong>
                  <div className={styles.archivosEntregadosList}>
                    {entrega.archivos.map((archivo) => {
                      const esEnlace = archivo.tipo_archivo === 'link';
                      return (
                        <div
                          key={archivo.id_archivo_entrega}
                          className={styles.archivoEntregadoItem}
                        >
                          <div className={styles.archivoInfo}>
                            <i className={esEnlace ? "fas fa-link" : "fas fa-file-alt"}></i>
                            <span className={styles.archivoNombre}>
                              {archivo.nombre_archivo_original}
                            </span>
                          </div>
                          <div className={styles.archivoAcciones}>
                            {esEnlace ? (
                              <button
                                onClick={() => window.open(archivo.nombre_archivo_original, '_blank', 'noopener,noreferrer')}
                                className={styles.btnArchivoAction}
                                title="Abrir enlace"
                              >
                                <i className="fas fa-external-link-alt"></i>
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleDownloadWithAuth(
                                    `${API_BASE_URL}/api/entregas/download/${archivo.id_archivo_entrega}`,
                                  )
                                }
                                className={styles.btnArchivoAction}
                                title="Descargar archivo"
                              >
                                <i className="fas fa-download"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 2. Vista de Tarea Entregada (Esperando calificación)
    if (isSubmitted) {
      return (
        <div className={styles.taskResult}>
          <div className={styles.successMessage}>
            <i className="fas fa-check-double"></i>
            <div>
              <strong>¡Entrega enviada!</strong>
              <p>Enviada el: {formatDate(entrega.fecha_entrega)}</p>
              <p>Esperando calificación del profesor.</p>
              {canModify && (
                <button
                  onClick={() => handleUnsubmitEntrega(entrega.id_entrega)}
                  className={styles.btnSecondary}
                >
                  <i className="fas fa-undo"></i> Anular Entrega
                </button>
              )}
              {entrega.archivos && entrega.archivos.length > 0 && (
                <div className={styles.entregaFiles}>
                  <strong>Archivos y enlaces entregados:</strong>
                  <div className={styles.archivosEntregadosList}>
                    {entrega.archivos.map((archivo) => {
                      const esEnlace = archivo.tipo_archivo === 'link';
                      return (
                        <div
                          key={archivo.id_archivo_entrega}
                          className={styles.archivoEntregadoItem}
                        >
                          <div className={styles.archivoInfo}>
                            <i className={esEnlace ? "fas fa-link" : "fas fa-file-alt"}></i>
                            <span className={styles.archivoNombre}>
                              {archivo.nombre_archivo_original}
                            </span>
                          </div>
                          <div className={styles.archivoAcciones}>
                            {esEnlace ? (
                              <button
                                onClick={() => window.open(archivo.nombre_archivo_original, '_blank', 'noopener,noreferrer')}
                                className={styles.btnArchivoAction}
                                title="Abrir enlace"
                              >
                                <i className="fas fa-external-link-alt"></i>
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleDownloadWithAuth(
                                    `${API_BASE_URL}/api/entregas/download/${archivo.id_archivo_entrega}`,
                                  )
                                }
                                className={styles.btnArchivoAction}
                                title="Descargar archivo"
                              >
                                <i className="fas fa-download"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 3. Vista de Plazo Vencido (sin entrega)
    if (isOverdue && !entrega) {
      return (
        <div className={styles.taskResult}>
          <div className={styles.errorMessage}>
            <i className="fas fa-exclamation-circle"></i>
            <div>
              Lo sentimos, el plazo ha terminado el{" "}
              {formatDate(tarea.fecha_limite)}
            </div>
          </div>
        </div>
      );
    }

    // 4. Vista de Borrador (Subiendo archivos o listo para entregar)
    const filesCount = filesToUpload.length;
    const linksCount = linksToSubmitList.length;
    const totalItemsToUpload = filesCount + linksCount;

    return (
      <div className={styles.uploadSection}>
        {entrega && entrega.archivos && entrega.archivos.length > 0 && (
          <div className={styles.entregaFiles}>
            <strong>Archivos y enlaces subidos:</strong>
            <div className={styles.archivosEntregadosList}>
              {entrega.archivos.map((archivo) => {
                const esEnlace = archivo.tipo_archivo === 'link';
                return (
                  <div
                    key={archivo.id_archivo_entrega}
                    className={styles.archivoEntregadoItem}
                  >
                    <div className={styles.archivoInfo}>
                      <i className={esEnlace ? "fas fa-link" : "fas fa-file-alt"}></i>
                      <span className={styles.archivoNombre}>
                        {archivo.nombre_archivo_original}
                      </span>
                    </div>
                    {canModify && (
                      <div className={styles.archivoAcciones}>
                        {esEnlace ? (
                          <button
                            onClick={() => window.open(archivo.nombre_archivo_original, '_blank', 'noopener,noreferrer')}
                            className={styles.btnArchivoAction}
                            title="Abrir enlace"
                          >
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleDownloadWithAuth(
                                `${API_BASE_URL}/api/entregas/download/${archivo.id_archivo_entrega}`,
                              )
                            }
                            className={styles.btnArchivoAction}
                            title="Descargar archivo"
                          >
                            <FontAwesomeIcon icon={faDownload} />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleEliminarEntrega(archivo.id_archivo_entrega)
                          }
                          className={styles.btnArchivoDelete}
                          title={esEnlace ? "Eliminar enlace" : "Eliminar archivo"}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {canModify && (
          <>
            {/* File Upload */}
            <div
              className={styles.uploadContainer}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(tareaId, e.dataTransfer.files);
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <i className="fas fa-cloud-upload-alt"></i>
              <p>Arrastra archivos aquí o haz clic para seleccionar</p>
              <p className={styles.uploadHint}>
                Máximo {tarea.max_archivos} archivos, {tarea.max_tamano_mb}MB
                c/u.
              </p>
              <input
                type="file"
                multiple
                accept={tarea.tipos_archivo_permitidos
                  .map((ext) => `.${ext}`)
                  .join(",")}
                onChange={(e) => handleFileSelect(tareaId, e.target.files)}
                style={{ display: "none" }}
                id={`file-input-${tareaId}`}
              />
              <button
                className={styles.btnOutline}
                onClick={() =>
                  document.getElementById(`file-input-${tareaId}`).click()
                }
              >
                Seleccionar archivos
              </button>
            </div>

            {/* Link Input */}
            <div className={styles.linkInputSection}>
              <div className={styles.linkInputContainer}>
                <i className="fas fa-link"></i>
                <input
                  type="url"
                  placeholder="Pega un enlace aquí (ej. https://...)"
                  value={linkInputs[tareaId] || ""}
                  onChange={(e) =>
                    setLinkInputs((prev) => ({
                      ...prev,
                      [tareaId]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLink(tareaId);
                    }
                  }}
                />
                <button
                  onClick={() => handleAddLink(tareaId)}
                  className={styles.btnOutline}
                >
                  Añadir Enlace
                </button>
              </div>
            </div>

            {/* Staged Files and Links */}
            {(filesToUpload.length > 0 || linksToSubmitList.length > 0) && (
              <div className={styles.fileList}>
                <strong>Archivos y enlaces para adjuntar:</strong>
                {filesToUpload.map((file, index) => (
                  <div key={`file-${index}`} className={styles.fileItem}>
                    <span>
                      <i className="fas fa-file-alt"></i> {file.name}
                    </span>
                    <button
                      onClick={() => handleFileRemove(tareaId, index)}
                      className={styles.removeFileBtn}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
                {linksToSubmitList.map((link, index) => (
                  <div key={`link-${index}`} className={styles.fileItem}>
                    <span>
                      <i className="fas fa-link"></i> {link}
                    </span>
                    <button
                      onClick={() => handleRemoveLink(tareaId, index)}
                      className={styles.removeFileBtn}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Submission Actions */}
            <div className={styles.submissionActions}>
              {totalItemsToUpload > 0 && (
                <button
                  className={styles.btnSecondary}
                  disabled={isUploading}
                  onClick={() => handleUpload(tareaId)}
                >
                  {isUploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Adjuntando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload"></i> Adjuntar{" "}
                      {totalItemsToUpload} elemento(s)
                    </>
                  )}
                </button>
              )}

              {canSubmit && (
                <button
                  className={styles.btnPrimary}
                  disabled={isUploading}
                  onClick={() => handleSubmitEntrega(entrega.id_entrega)}
                >
                  <i className="fas fa-paper-plane"></i> Marcar como Entregada
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderMaterialTab = () => {
    const loadingMaterial = loading.material; // Alias for clarity

    if (loadingMaterial) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Cargando material del curso...</span>
        </div>
      );
    }

    return (
      <div className={styles.materialTab}>
        {/* Planeación Section */}
        {material.planeacion && material.planeacion.length > 0 && (
          <div className={styles.materialSection}>
            <h3>
              <i className="fas fa-calendar-alt"></i>
              Planeación del Curso
            </h3>
            <div className={styles.materialGrid}>
              {material.planeacion.map((item, index) => {
                const isLink = item.es_enlace || item.url_enlace;
                const url = item.es_enlace
                  ? item.url_enlace
                  : `${API_BASE_URL}${item.ruta_descarga}`;
                return (
                  <div key={index} className={styles.materialCard}>
                    <div className={styles.materialHeader}>
                      <div
                        className={`${styles.materialIcon} ${isLink ? styles.link : styles.pdf}`}
                      >
                        <i
                          className={isLink ? "fas fa-link" : "fas fa-file-pdf"}
                        ></i>
                      </div>
                      <div className={styles.materialInfo}>
                        <div className={styles.materialTitle}>
                          {item.nombre_archivo ||
                            item.nombre_enlace ||
                            "Planeación del Curso"}
                        </div>
                        <div className={styles.materialDescription}>
                          {item.descripcion ||
                            "Documento de planeación académica del curso"}
                        </div>
                      </div>
                    </div>
                    <div className={styles.materialActions}>
                      {isLink ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.materialBtn} ${styles.primary}`}
                        >
                          <i className="fas fa-external-link-alt"></i>
                          Ver
                        </a>
                      ) : (
                        <button
                          onClick={() => handleDownloadWithAuth(url)}
                          className={`${styles.materialBtn} ${styles.primary}`}
                        >
                          <i className="fas fa-download"></i>
                          Descargar PDF
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Material para Descargar Section */}
        {material.material_descarga &&
          material.material_descarga.length > 0 && (
            <div className={styles.materialSection}>
              <h3>
                <i className="fas fa-download"></i>
                Material para Descargar
              </h3>
              <div className={styles.materialGrid}>
                {material.material_descarga.map((item, index) => {
                  const isLink = item.es_enlace || item.url_enlace;
                  const url = item.es_enlace
                    ? item.url_enlace
                    : `${API_BASE_URL}${item.ruta_descarga}`;
                  return (
                    <div key={index} className={styles.materialCard}>
                      <div className={styles.materialHeader}>
                        <div
                          className={`${styles.materialIcon} ${isLink ? styles.link : styles.pdf}`}
                        >
                          <i
                            className={
                              isLink ? "fas fa-link" : "fas fa-file-pdf"
                            }
                          ></i>
                        </div>
                        <div className={styles.materialInfo}>
                          <div className={styles.materialTitle}>
                            {item.nombre_archivo ||
                              item.nombre_enlace ||
                              "Material del Curso"}
                          </div>
                          <div className={styles.materialDescription}>
                            {item.descripcion ||
                              (isLink
                                ? "Enlace de apoyo para el curso"
                                : "Documento PDF para descargar")}
                          </div>
                        </div>
                      </div>
                      <div className={styles.materialActions}>
                        {isLink ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.materialBtn} ${styles.primary}`}
                          >
                            <i className="fas fa-external-link-alt"></i>
                            Ver
                          </a>
                        ) : (
                          <button
                            onClick={() => handleDownloadWithAuth(url)}
                            className={`${styles.materialBtn} ${styles.primary}`}
                          >
                            <i className="fas fa-download"></i>
                            Descargar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {(!material.planeacion || material.planeacion.length === 0) &&
          (!material.material_descarga ||
            material.material_descarga.length === 0) && (
            <div className={styles.emptyMessage}>
              <div className={styles.messageIcon}>
                <i className="fas fa-folder-open"></i>
              </div>
              <h3>No hay material disponible</h3>
              <p>El profesor aún no ha subido material para este curso.</p>
              <small>El material aparecerá aquí cuando esté disponible.</small>
            </div>
          )}
      </div>
    );
  };

  const renderTareasTab = () => {
    const loadingTareas = loading.tareas; // Alias for clarity

    if (loadingTareas) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Cargando tareas...</span>
        </div>
      );
    }

    if (!tareas || tareas.length === 0) {
      return (
        <div className={styles.emptyMessage}>
          <div className={styles.messageIcon}>
            <i className="fas fa-tasks"></i>
          </div>
          <h3>No hay tareas disponibles</h3>
          <p>Aún no se han asignado tareas para este curso.</p>
          <div className={styles.helpInfo}>
            <div className={styles.helpItem}>
              <i className="fas fa-info-circle"></i>
              <span>
                Las tareas aparecerán aquí cuando el profesor las publique
              </span>
            </div>
            <div className={styles.helpItem}>
              <i className="fas fa-clock"></i>
              <span>Revisa regularmente para no perder fechas límite</span>
            </div>
            <div className={styles.helpItem}>
              <i className="fas fa-upload"></i>
              <span>Podrás subir tus entregas directamente desde aquí</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.tareasTab}>
        <div className={styles.tareasList}>
          {tareas.map((tarea, index) => (
            <div
              key={index}
              className={`${styles.taskAccordion} ${
                tarea.entrega?.estatus_entrega === "entregada" ||
                tarea.entrega?.estatus_entrega === "calificada"
                  ? styles.taskCompleted
                  : styles.taskPending
              }`}
            >
              <div
                className={styles.taskAccordionHeader}
                onClick={() => toggleAccordion(index)}
              >
                <div className={styles.taskHeaderContent}>
                  <div className={styles.taskTitle}>
                    <i
                      className={
                        tarea.entrega?.estatus_entrega === "calificada"
                          ? "fas fa-check-double"
                          : tarea.entrega?.estatus_entrega === "entregada"
                          ? "fas fa-check-circle"
                          : tarea.entrega?.estatus_entrega === "no_entregada"
                          ? "fas fa-pencil-alt"
                          : "fas fa-clock"
                      }
                    ></i>
                    <span>{tarea.nombre}</span>
                  </div>
                  <div className={styles.taskStatus}>
                    {(() => {
                      const estatus = tarea.entrega?.estatus_entrega;
                      if (estatus === "calificada") {
                        return (
                          <span
                            className={`${styles.statusBadge} ${styles.completed}`}>
                            <i className="fas fa-check-double"></i> Calificada
                          </span>
                        );
                      }
                      if (estatus === "entregada") {
                        return (
                          <span
                            className={`${styles.statusBadge} ${styles.completed}`}>
                            <i className="fas fa-check-circle"></i> Entregada
                          </span>
                        );
                      }
                      if (estatus === "no_entregada") {
                        return (
                          <span
                            className={`${styles.statusBadge} ${styles.inProgress}`}>
                            <i className="fas fa-pencil-alt"></i> En Progreso
                          </span>
                        );
                      }
                      return (
                        <span
                          className={`${styles.statusBadge} ${styles.pending}`}>
                          <i className="fas fa-clock"></i> Pendiente
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <i
                  className={`fas fa-chevron-${openAccordions[index] ? "up" : "down"} ${
                    styles.chevronIcon
                  }`}
                ></i>
              </div>

              {openAccordions[index] && (
                <div className={styles.taskAccordionContent}>
                  <div className={styles.taskMeta}>
                    {tarea.fecha_limite && (
                      <div className={styles.taskMetaItem}>
                        <i className="fas fa-calendar-alt"></i>
                        <span>
                          Fecha límite: {formatDate(tarea.fecha_limite)}
                        </span>
                      </div>
                    )}
                    {tarea.calificacion && (
                      <div className={styles.taskMetaItem}>
                        <i className="fas fa-star"></i>
                        <span>Calificación: {tarea.calificacion}</span>
                      </div>
                    )}
                  </div>

                  {tarea.instrucciones && (
                    <div className={styles.taskInstructions}>
                      <h4>
                        <i className="fas fa-info-circle"></i>
                        Instrucciones
                      </h4>
                      <p>{tarea.instrucciones}</p>
                    </div>
                  )}

                  {tarea.recursos && tarea.recursos.length > 0 && (
                    <div className={styles.taskResourcesSection}>
                      <h4>
                        <i className="fas fa-book-open"></i>
                        Material de apoyo
                      </h4>
                      <div className={styles.taskResourcesList}>
                        {tarea.recursos.map((recurso, rIndex) => {
                          const isLink = recurso.tipo === "enlace";
                          return (
                            <div
                              key={rIndex}
                              className={styles.taskResourceItem}
                            >
                              <div className={styles.taskResourceInfo}>
                                <div
                                  className={`${styles.taskResourceIcon} ${isLink ? styles.linkIcon : styles.pdfIcon}`}
                                >
                                  <i
                                    className={
                                      isLink ? "fas fa-link" : "fas fa-file-pdf"
                                    }
                                  ></i>
                                </div>
                                <span className={styles.taskResourceName}>
                                  {recurso.nombre ||
                                    (isLink
                                      ? "Enlace de apoyo"
                                      : "Documento PDF")}
                                </span>
                              </div>
                              {isLink ? (
                                <a
                                  href={recurso.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`${styles.taskResourceBtn} ${styles.linkBtn}`}
                                >
                                  <i className="fas fa-external-link-alt"></i>
                                  Ver
                                </a>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleDownloadWithAuth(recurso.url)
                                  }
                                  className={`${styles.taskResourceBtn} ${styles.downloadBtn}`}
                                >
                                  <i className="fas fa-download"></i>
                                  Descargar
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className={styles.taskSubmissionSection}>
                    <h4>
                      <i className="fas fa-upload"></i>
                      Tu Entrega
                    </h4>
                    <FileUploadComponent
                      tareaId={tarea.id}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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
              className={`${styles.tab} ${activeTab === "material" ? styles.active : ""}`}
              onClick={() => setActiveTab("material")}
            >
              <i className="fas fa-book"></i> Material del Curso
            </div>
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
              <i className="fas fa-trophy"></i> Creditos
            </div>
          </div>
        </>
      )}

      {/* Tab Content */}
      {cursoSeleccionado && (
        <div className={styles.tabContent}>
          {activeTab === "material" && renderMaterialTab()}

          {activeTab === "tareas" && renderTareasTab()}

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
                        {evaluacion.calificacion !== null ? (
                          <div className={styles.gradeValueContainer}>
                            <span className={`${styles.gradeValue} ${evaluacion.calificacion >= 70 ? styles.good : styles.bad}`}>
                              {evaluacion.calificacion}/100
                            </span>
                          </div>
                        ) : (
                          <div className={`${styles.gradeValue} ${styles.pending}`}>
                            Pendiente
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className={styles.totalGrade}>
                    <div>
                      <div className={styles.totalLabel}>
                        Creditos finales
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
                  <h3> Creditos en preparación</h3>
                  <p>
                    Tus creditos aparecerán aquí una vez que el profesor
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
                    Mantente al día con las entregas para obtener la mejor
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
