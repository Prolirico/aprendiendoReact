"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import styles from "./CalificacionCurso.module.css";

const API_BASE_URL = "http://localhost:5000";

// Componente para el modal de gestión del curso
const CalificacionModal = ({
  curso,
  onClose,
  onSave,
  showConfirmModal,
  showToast,
}) => {
  // Estados para las pestañas
  const [activeTab, setActiveTab] = useState("planeacion");

  // Estados para Planeación del curso
  const [planeacion, setPlaneacion] = useState({
    descripcion: "",
    objetivos: "",
    metodologia: "",
    evaluacion: "",
    cronograma: "",
    archivo_temario: null,
  });

  // Estados para Material a descargar
  const [materiales, setMateriales] = useState([]);
  const [materialExistente, setMaterialExistente] = useState({
    planeacion: [],
    material_descarga: [],
    actividad: [],
  });
  const [loadingMaterial, setLoadingMaterial] = useState(false);

  // Estados para Actividades de calificación (existente)
  const [actividades, setActividades] = useState(
    curso.actividades || [
      {
        nombre: "Tarea 1",
        porcentaje: 100,
        fecha_limite: "",
        instrucciones: "",
        max_archivos: 5,
        max_tamano_mb: 10,
        tipos_permitidos: ["pdf", "link"],
        archivo_instrucciones: null,
        archivos_instrucciones: [], // Para múltiples archivos
        enlace_recursos: [], // Para múltiples enlaces
      },
    ],
  );
  const [umbral, setUmbral] = useState(curso.umbral_aprobatorio || 60);

  const handleAddActividad = () => {
    setActividades([
      ...actividades,
      {
        nombre: `Actividad ${actividades.length + 1}`,
        porcentaje: 0,
        fecha_limite: "",
        instrucciones: "",
        max_archivos: 5,
        max_tamano_mb: 10,
        tipos_permitidos: ["pdf", "link"],
        archivo_instrucciones: null,
        archivos_instrucciones: [],
        enlace_recursos: [],
      },
    ]);
  };

  const handleActividadChange = (index, field, value) => {
    const nuevasActividades = [...actividades];
    if (field === "porcentaje") {
      nuevasActividades[index][field] = parseInt(value, 10) || 0;
    } else {
      nuevasActividades[index][field] = value;
    }
    setActividades(nuevasActividades);
  };

  const handleRemoveActividad = (index) => {
    const nuevasActividades = actividades.filter((_, i) => i !== index);
    setActividades(nuevasActividades);
  };

  const totalPorcentaje = actividades.reduce(
    (sum, act) => sum + act.porcentaje,
    0,
  );

  // Usamos useMemo para agrupar los materiales de actividad por su nombre de actividad
  const materialesPorActividad = useMemo(() => {
    const agrupados = {};
    if (materialExistente.actividad) {
      materialExistente.actividad.forEach(material => {
        // Extraemos el nombre de la actividad de la descripción
        const match = material.descripcion?.match(/para la actividad: (.+)/);
        const nombreActividad = match ? match[1] : material.nombre_archivo;
        if (!agrupados[nombreActividad]) agrupados[nombreActividad] = [];
        agrupados[nombreActividad].push(material);
      });
    }
    return agrupados;
  }, [materialExistente.actividad]);

  const handleSave = () => {
    if (totalPorcentaje !== 100) {
      alert("La suma de los porcentajes de las actividades debe ser 100%.");
      return;
    }
    if (umbral < 50 || umbral > 100) {
      alert("El umbral aprobatorio debe estar entre 50 y 100.");
      return;
    }

    // Validación de campos obligatorios en cada actividad
    for (const act of actividades) {
      if (!act.nombre.trim()) {
        alert(`El nombre de la actividad no puede estar vacío.`);
        return;
      }
      if (!act.max_archivos || act.max_archivos <= 0) {
        alert(`La actividad "${act.nombre}" debe permitir al menos 1 archivo.`);
        return;
      }
      if (!act.max_tamano_mb || act.max_tamano_mb <= 0) {
        alert(
          `El tamaño máximo de archivo para "${act.nombre}" debe ser mayor a 0.`,
        );
        return;
      }
    }
    onSave({
      ...curso,
      umbral_aprobatorio: umbral,
      actividades,
      planeacion,
      materiales,
    });
  };

  // Función para cargar material existente del curso
  const loadMaterialExistente = async () => {
    setLoadingMaterial(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/material/curso/${curso.id_curso}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setMaterialExistente(
          data.material || {
            planeacion: [],
            material_descarga: [],
            actividad: [],
          },
        );
      }
    } catch (error) {
      console.error("Error al cargar material existente:", error);
    } finally {
      setLoadingMaterial(false);
    }
  };

  // Función para eliminar material existente
  const eliminarMaterialExistente = async (idMaterial, tipo) => {
    if (!showConfirmModal || !showToast) {
      console.error("showConfirmModal or showToast not available");
      return;
    }

    showConfirmModal(
      "Confirmar eliminación",
      "¿Estás seguro de que quieres eliminar este material? Esta acción no se puede deshacer.",
      async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${API_BASE_URL}/api/material/${idMaterial}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.ok) {
            showToast("Material eliminado exitosamente", "success");
            loadMaterialExistente(); // Recargar material
          } else {
            const error = await response.json();
            showToast(`Error al eliminar: ${error.error}`, "error");
          }
        } catch (error) {
          showToast("Error al eliminar el material", "error");
        }
      },
      "warning",
    );
  };

  // Cargar material existente al abrir el modal
  useEffect(() => {
    if (curso.id_curso) {
      loadMaterialExistente();
    }
  }, [curso.id_curso, curso._reloadTrigger]);

  // --- Nuevas funciones para manejar múltiples archivos y enlaces ---

  const handleAddArchivoActividad = (actividadIndex) => {
    const nuevasActividades = [...actividades];
    if (!nuevasActividades[actividadIndex].archivos_instrucciones) {
      nuevasActividades[actividadIndex].archivos_instrucciones = [];
    }
    nuevasActividades[actividadIndex].archivos_instrucciones.push(null);
    setActividades(nuevasActividades);
  };

  const handleRemoveArchivoActividad = (actividadIndex, archivoIndex) => {
    const nuevasActividades = [...actividades];
    nuevasActividades[actividadIndex].archivos_instrucciones.splice(archivoIndex, 1);
    setActividades(nuevasActividades);
  };

  const handleAddEnlaceActividad = (actividadIndex) => {
    const nuevasActividades = [...actividades];
    if (!nuevasActividades[actividadIndex].enlace_recursos) {
      nuevasActividades[actividadIndex].enlace_recursos = [];
    }
    nuevasActividades[actividadIndex].enlace_recursos.push("");
    setActividades(nuevasActividades);
  };

  const handleRemoveEnlaceActividad = (actividadIndex, enlaceIndex) => {
    const nuevasActividades = [...actividades];
    nuevasActividades[actividadIndex].enlace_recursos.splice(enlaceIndex, 1);
    setActividades(nuevasActividades);
  };

  const handleEnlaceChange = (actividadIndex, enlaceIndex, value) => {
    const nuevasActividades = [...actividades];
    nuevasActividades[actividadIndex].enlace_recursos[enlaceIndex] = value;
    setActividades(nuevasActividades);
  };

  // --- Fin de nuevas funciones ---

  // Funciones para manejar materiales
  const handleAddMaterial = () => {
    setMateriales([
      ...materiales,
      {
        nombre: "",
        tipo: "pdf",
        descripcion: "",
        archivo: null,
        link: "",
      },
    ]);
  };

  const handleMaterialChange = (index, field, value) => {
    const nuevosMateriales = [...materiales];
    nuevosMateriales[index][field] = value;
    setMateriales(nuevosMateriales);
  };

  const handleRemoveMaterial = (index) => {
    const nuevosMateriales = materiales.filter((_, i) => i !== index);
    setMateriales(nuevosMateriales);
  };

  // Función para manejar archivos
  const handleFileChange = (e, type, index = null) => {
    const file = e.target.files[0];
    if (type === "planeacion") {
      setPlaneacion({ ...planeacion, archivo_temario: file });
    } else if (type === "material" && index !== null) {
      handleMaterialChange(index, "archivo", file);
    } else if (type === "actividad" && index !== null) {
      // Modificado para manejar múltiples archivos
      const nuevasActividades = [...actividades];
      const archivoIndex = nuevasActividades[index].archivos_instrucciones.findIndex(f => f === null);
      if (archivoIndex !== -1) {
        nuevasActividades[index].archivos_instrucciones[archivoIndex] = file;
      }
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Gestión del Curso: {curso.nombre_curso || curso.nombre}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        {/* Pestañas */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "planeacion" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("planeacion")}
            >
              📋 Planeación del Curso
            </button>
            <button
              className={`${styles.tab} ${activeTab === "materiales" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("materiales")}
            >
              📚 Material a Descargar
            </button>
            <button
              className={`${styles.tab} ${activeTab === "actividades" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("actividades")}
            >
              Actividades de Calificación
            </button>
          </div>
        </div>

        {/* Contenido de las pestañas */}
        <div className={styles.tabContent}>
          {/* Pestaña de Planeación */}
          {activeTab === "planeacion" && (
            <div className={styles.planeacionTab}>
              <h3>Planeación del Curso</h3>
              <p className={styles.tabDescription}>
                Configure la estructura y contenido general del curso
              </p>

              <div className={styles.formGroup}>
                <label>Comentarios acerca del Curso:</label>
                <textarea
                  value={planeacion.descripcion}
                  onChange={(e) =>
                    setPlaneacion({
                      ...planeacion,
                      descripcion: e.target.value,
                    })
                  }
                  className={styles.textarea}
                  rows={3}
                  placeholder="Describe el contenido y alcance del curso..."
                />
              </div>

              {/* Material existente de planeación */}
              {loadingMaterial ? (
                <div className={styles.loadingState}>
                  <p>Cargando material existente...</p>
                </div>
              ) : (
                materialExistente.planeacion.length > 0 && (
                  <div className={styles.existingMaterial}>
                    <h4>📋 Material de planeación existente:</h4>
                    {materialExistente.planeacion.map((item) => (
                      <div
                        key={item.id_material}
                        className={styles.materialCard}
                      >
                        <div className={styles.materialInfo}>
                          <span className={styles.materialName}>
                            {item.es_enlace ? "🔗" : "📄"} {item.nombre_archivo}
                          </span>
                          {item.descripcion && (
                            <p className={styles.materialDesc}>
                              {item.descripcion}
                            </p>
                          )}
                          {item.es_enlace && item.url_enlace && (
                            <p className={styles.materialLink}>
                              <a
                                href={item.url_enlace}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.linkPreview}
                              >
                                {item.url_enlace}
                              </a>
                            </p>
                          )}
                          <small className={styles.materialDate}>
                            Subido:{" "}
                            {new Date(item.fecha_subida).toLocaleDateString()}
                          </small>
                        </div>
                        <div className={styles.materialActions}>
                          {item.es_enlace && (
                            <a
                              href={item.url_enlace}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.viewButton}
                              title="Abrir enlace"
                            >
                              👁️
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              eliminarMaterialExistente(
                                item.id_material,
                                "planeacion",
                              )
                            }
                            className={styles.deleteButton}
                            title="Eliminar material"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              <div className={styles.formGroup}>
                <label>Subir Nueva Planeación (PDF):</label>
                <div className={styles.fileUploadArea}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, "planeacion")}
                    className={styles.fileInput}
                    id="temario-upload"
                  />
                  <label htmlFor="temario-upload" className={styles.fileLabel}>
                    📄{" "}
                    {planeacion.archivo_temario ? (
                      planeacion.archivo_temario.name
                    ) : (
                      <span style={{ color: "white" }}>
                        Seleccionar archivo PDF de la planeacion
                      </span>
                    )}
                  </label>
                  <small className={styles.fileHint}>
                    Opcional: Sube un PDF con la planificacion detallada del
                    curso
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* Pestaña de Materiales */}
          {activeTab === "materiales" && (
            <div className={styles.materialesTab}>
              <h3>Material a Descargar</h3>
              <p className={styles.tabDescription}>
                Gestiona los recursos que los estudiantes podrán descargar
              </p>

              {/* Material existente */}
              {loadingMaterial ? (
                <div className={styles.loadingState}>
                  <p>Cargando material existente...</p>
                </div>
              ) : (
                materialExistente.material_descarga.length > 0 && (
                  <div className={styles.existingMaterial}>
                    <h4>📚 Material existente:</h4>
                    {materialExistente.material_descarga.map((item) => (
                      <div
                        key={item.id_material}
                        className={styles.materialCard}
                      >
                        <div className={styles.materialInfo}>
                          <span className={styles.materialName}>
                            {item.es_enlace ? "🔗" : "📄"} {item.nombre_archivo}
                          </span>
                          {item.descripcion && (
                            <p className={styles.materialDesc}>
                              {item.descripcion}
                            </p>
                          )}
                          <small className={styles.materialDate}>
                            Subido:{" "}
                            {new Date(item.fecha_subida).toLocaleDateString()}
                          </small>
                        </div>
                        <div className={styles.materialActions}>
                          {item.es_enlace && (
                            <a
                              href={item.url_enlace}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.viewButton}
                              title="Ver enlace"
                            >
                              👁️
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              eliminarMaterialExistente(
                                item.id_material,
                                "material_descarga",
                              )
                            }
                            className={styles.deleteButton}
                            title="Eliminar material"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {materiales.map((material, index) => (
                <div key={index} className={styles.materialItem}>
                  <div className={styles.materialHeader}>
                    <input
                      type="text"
                      placeholder="Nombre del material"
                      value={material.nombre}
                      onChange={(e) =>
                        handleMaterialChange(index, "nombre", e.target.value)
                      }
                      className={styles.input}
                    />
                    <select
                      value={material.tipo}
                      onChange={(e) =>
                        handleMaterialChange(index, "tipo", e.target.value)
                      }
                      className={styles.select}
                    >
                      <option value="pdf">📄 PDF</option>
                      <option value="link">🔗 Enlace</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMaterial(index)}
                      className={styles.deleteButton}
                      title="Eliminar material"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>

                  <div className={styles.materialContent}>
                    <div className={styles.formGroup}>
                      <label>Descripción:</label>
                      <textarea
                        value={material.descripcion}
                        onChange={(e) =>
                          handleMaterialChange(
                            index,
                            "descripcion",
                            e.target.value,
                          )
                        }
                        className={styles.textarea}
                        rows={2}
                        placeholder="Describe brevemente este material..."
                      />
                    </div>

                    {material.tipo === "pdf" ? (
                      <div className={styles.formGroup}>
                        <label>Archivo PDF:</label>
                        <div className={styles.fileUploadArea}>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) =>
                              handleFileChange(e, "material", index)
                            }
                            className={styles.fileInput}
                            id={`material-${index}`}
                          />
                          <label
                            htmlFor={`material-${index}`}
                            className={styles.fileLabel}
                          >
                            📎{" "}
                            {material.archivo
                              ? material.archivo.name
                              : "Seleccionar archivo PDF"}
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.formGroup}>
                        <label>URL del enlace:</label>
                        <input
                          type="url"
                          placeholder="https://ejemplo.com/recurso"
                          value={material.link}
                          onChange={(e) =>
                            handleMaterialChange(index, "link", e.target.value)
                          }
                          className={styles.input}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button onClick={handleAddMaterial} className={styles.addButton}>
                + Añadir Material
              </button>
            </div>
          )}

          {/* Pestaña de Actividades */}
          {activeTab === "actividades" && (
            <div className={styles.actividadesTab}>
              <h3>Actividades de Calificación</h3>
              <p className={styles.tabDescription}>
                Configure las tareas y proyectos que serán evaluados
              </p>

              <div className={styles.formGroup}>
                <label>Umbral Aprobatorio (%):</label>
                <input
                  type="number"
                  value={umbral}
                  onChange={(e) => setUmbral(Number(e.target.value))}
                  min="50"
                  max="100"
                  className={styles.input}
                />
              </div>

              {actividades.map((act, index) => (
                <div key={index} className={styles.actividadItem}>
                  <div className={styles.actividadRow}>
                    <input
                      type="text"
                      placeholder="Nombre de la actividad"
                      value={act.nombre}
                      onChange={(e) =>
                        handleActividadChange(index, "nombre", e.target.value)
                      }
                      className={styles.input}
                    />
                    <input
                      type="number"
                      placeholder="%"
                      value={act.porcentaje}
                      onChange={(e) =>
                        handleActividadChange(
                          index,
                          "porcentaje",
                          e.target.value,
                        )
                      }
                      className={styles.inputPorcentaje}
                    />
                    <button
                      onClick={() => handleRemoveActividad(index)}
                      className={styles.deleteButton}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                  <div className={styles.actividadDetalles}>
                    <div className={styles.opcionDetalle}>
                      <label>Fecha Límite: (Opcional)</label>
                      <input
                        type="date"
                        value={act.fecha_limite}
                        onChange={(e) =>
                          handleActividadChange(
                            index,
                            "fecha_limite",
                            e.target.value,
                          )
                        }
                        className={styles.input}
                      />
                    </div>
                  </div>
                  <div
                    className={styles.formGroup}
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <label>Instrucciones para el alumno:</label>
                    <textarea
                      value={act.instrucciones}
                      onChange={(e) =>
                        handleActividadChange(
                          index,
                          "instrucciones",
                          e.target.value,
                        )
                      }
                      className={styles.textarea}
                      rows={3}
                      placeholder="Instrucciones para el alumno"
                    />
                  </div>

                  {/* Recursos para la actividad */}
                  <div className={styles.actividadRecursos}>
                    <h4>Recursos adicionales para esta actividad (Opcional)</h4>
                    
                    {/* Material existente para esta actividad */}
                    {materialesPorActividad[act.nombre] && materialesPorActividad[act.nombre].length > 0 && (
                      <div className={styles.existingMaterial}>
                        <h5>Recursos ya subidos:</h5>
                        {materialesPorActividad[act.nombre].map(item => (
                          <div key={item.id_material} className={styles.materialCard}>
                            <div className={styles.materialInfo}>
                              <span className={styles.materialName}>
                                {item.es_enlace ? "🔗" : "📄"} {item.nombre_archivo}
                              </span>
                            </div>
                            <div className={styles.materialActions}>
                              <button
                                type="button"
                                onClick={() => eliminarMaterialExistente(item.id_material, "actividad")}
                                className={styles.deleteButton}
                                title="Eliminar recurso"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sección para múltiples archivos */}
                    <div className={styles.recursoOption}>
                      <label>Subir archivos de apoyo (PDF):</label>
                      {act.archivos_instrucciones.map((archivo, archivoIndex) => (
                        <div key={archivoIndex} className={styles.recursoItem}>
                          <div className={styles.fileUploadArea}>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                const nuevasActividades = [...actividades];
                                nuevasActividades[index].archivos_instrucciones[archivoIndex] = e.target.files[0];
                                setActividades(nuevasActividades);
                              }}
                              className={styles.fileInput}
                              id={`actividad-archivo-${index}-${archivoIndex}`}
                            />
                            <label
                              htmlFor={`actividad-archivo-${index}-${archivoIndex}`}
                              className={styles.fileLabel}
                            >
                              📎{" "}
                              {archivo ? archivo.name : "Seleccionar PDF"}
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveArchivoActividad(index, archivoIndex)}
                            className={styles.removeButton}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddArchivoActividad(index)}
                        className={styles.addButton}
                        style={{marginTop: '0.5rem'}}
                      >
                        + Añadir Archivo
                      </button>
                    </div>

                    {/* Sección para múltiples enlaces */}
                    <div className={styles.recursoOption}>
                      <label>Añadir enlaces a recursos externos:</label>
                      {act.enlace_recursos.map((enlace, enlaceIndex) => (
                        <div key={enlaceIndex} className={styles.recursoItem}>
                          <input
                            type="url"
                            placeholder="https://ejemplo.com/recurso"
                            value={enlace}
                            onChange={(e) => handleEnlaceChange(index, enlaceIndex, e.target.value)}
                            className={styles.input}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveEnlaceActividad(index, enlaceIndex)}
                            className={styles.removeButton}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddEnlaceActividad(index)}
                        className={styles.addButton}
                        style={{marginTop: '0.5rem'}}
                      >
                        + Añadir Enlace
                      </button>
                    </div>

                  </div>
                </div>
              ))}

              <button onClick={handleAddActividad} className={styles.addButton}>
                + Añadir Actividad
              </button>

              <div
                className={`${styles.totalPorcentaje} ${totalPorcentaje !== 100 ? styles.totalError : ""}`}
              >
                Total: {totalPorcentaje}%
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.buttonSecondary}>
            Cerrar
          </button>
          <button
            onClick={handleSave}
            className={styles.buttonPrimary}
            disabled={activeTab === "actividades" && totalPorcentaje !== 100}
          >
            Guardar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

const CalificacionCurso = ({ rol, entidadId }) => {
  const { user, token } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);

  // Estados para modales de confirmación y toast
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "warning", // 'success', 'error', 'warning'
  });

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Función para mostrar toast
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Función para mostrar modal de confirmación
  const showConfirmModal = (title, message, onConfirm, type = "warning") => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm,
      type,
    });
  };

  // Función para cerrar modal de confirmación
  const closeConfirmModal = () => {
    setConfirmModal({
      show: false,
      title: "",
      message: "",
      onConfirm: null,
      type: "warning",
    });
  };

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalCursos, setTotalCursos] = useState(0);
  const cursosPerPage = 15;

  // Estados para los filtros
  const [universidades, setUniversidades] = useState([]);
  const [facultades, setFacultades] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [filtros, setFiltros] = useState({
    universidadId: "",
    facultadId: "",
    carreraId: "",
    searchTerm: "",
  });

  const fetchData = async (page = 1, filtrosActuales = filtros) => {
    setLoading(true);
    setError(null);
    try {
      // Construir la URL con los parámetros de paginación y filtros
      const params = new URLSearchParams({
        page: page,
        limit: cursosPerPage,
        groupByCourse: "true", // <-- Mantener este parámetro
        exclude_assigned: "false", // <-- Añadir este para ver TODOS los cursos
        ...filtrosActuales,
      });

      // Filtrar parámetros vacíos para limpiar la URL
      for (const [key, value] of [...params.entries()]) {
        if (!value || value === "" || value === "undefined") {
          params.delete(key);
        }
      }

      const response = await fetch(
        `${API_BASE_URL}/api/cursos?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData.message || "Error al cargar los cursos");
      }

      const data = await response.json();
      setCursos(data.cursos || []);
      setTotalPaginas(data.totalPages || 0);
      setTotalCursos(data.total || 0); // <-- Usar 'total' en lugar de 'totalCursos'
      setPaginaActual(page);
    } catch (err) {
      setError("No se pudieron cargar los datos. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData(1, filtros);

      // Cargar datos para los filtros
      const fetchFilterData = async () => {
        try {
          // Cargar Universidades
          const uniRes = await fetch(
            `${API_BASE_URL}/api/universidades?limit=9999`,
          );
          const uniData = await uniRes.json();
          setUniversidades(uniData.universities || []);

          // Cargar Facultades (si una universidad está seleccionada)
          if (filtros.universidadId) {
            const facRes = await fetch(
              `${API_BASE_URL}/api/facultades/universidad/${filtros.universidadId}`,
            );
            const facData = await facRes.json();
            setFacultades(facData.data || []);
          } else {
            setFacultades([]); // Limpiar si no hay universidad
          }

          // Cargar Carreras (si una facultad está seleccionada)
          if (filtros.facultadId) {
            const carRes = await fetch(
              `${API_BASE_URL}/api/carreras/facultad/${filtros.facultadId}`,
            );
            const carData = await carRes.json();
            setCarreras(carData.data || []);
          } else {
            setCarreras([]);
          }
        } catch (error) {
          console.error("Error al cargar datos de filtros:", error);
        }
      };

      fetchFilterData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, rol, entidadId, filtros.universidadId, filtros.facultadId]); // Se vuelve a ejecutar si cambia el ID de la universidad o facultad

  const handlePageChange = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      fetchData(nuevaPagina, filtros);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    // Si se cambia la universidad, se resetea la facultad
    let nuevosFiltros = { ...filtros, [campo]: valor };
    if (campo === "universidadId") {
      nuevosFiltros.facultadId = "";
      nuevosFiltros.carreraId = "";
    }
    if (campo === "facultadId") {
      nuevosFiltros.carreraId = "";
    }
    setFiltros(nuevosFiltros);
    setPaginaActual(1); // Resetear a página 1 cuando se filtran
    fetchData(1, nuevosFiltros);
  };

  const handleSaveCurso = async (cursoActualizado) => {
    // Mostrar modal de carga
    showToast("Procesando configuración del curso...", "info");

    try {
      console.log(
        "🚀 Iniciando guardado del curso:",
        cursoActualizado.id_curso,
      );

      // 1. Guardar configuración de calificaciones y actividades
      const payloadCalificaciones = {
        id_curso: cursoActualizado.id_curso,
        umbral_aprobatorio: cursoActualizado.umbral_aprobatorio,
        actividades: cursoActualizado.actividades,
      };

      console.log("📝 Guardando configuración de calificaciones...");
      const responseCalif = await fetch(`${API_BASE_URL}/api/calificaciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payloadCalificaciones),
      });

      if (!responseCalif.ok) {
        const errorData = await responseCalif.json();
        console.error("❌ Error en calificaciones:", errorData);
        throw new Error(
          errorData.error ||
            "Error al guardar la configuración de calificaciones.",
        );
      }

      console.log("✅ Configuración de calificaciones guardada");

      // 2. Subir material de planeación si existe
      if (cursoActualizado.planeacion?.archivo_temario) {
        console.log("📋 Subiendo planeación del curso...");
        const formDataPlaneacion = new FormData();
        formDataPlaneacion.append(
          "archivo",
          cursoActualizado.planeacion.archivo_temario,
        );
        formDataPlaneacion.append("id_curso", cursoActualizado.id_curso);
        formDataPlaneacion.append("categoria_material", "planeacion");
        formDataPlaneacion.append("nombre_archivo", "Planeación del Curso");
        formDataPlaneacion.append(
          "descripcion",
          cursoActualizado.planeacion.descripcion || "",
        );
        formDataPlaneacion.append("es_enlace", "false");

        console.log("📤 Enviando planeación al servidor...");
        const responsePlaneacion = await fetch(`${API_BASE_URL}/api/material`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataPlaneacion,
        });

        if (!responsePlaneacion.ok) {
          const errorData = await responsePlaneacion.json().catch(() => ({}));
          console.warn("⚠️ Error al subir planeación:", errorData);
          showToast(
            `Advertencia: No se pudo subir la planeación - ${errorData.error || "Error desconocido"}`,
            "warning",
          );
        } else {
          console.log("✅ Planeación subida exitosamente");
        }
      }

      // 3. Subir materiales de descarga
      for (const material of cursoActualizado.materiales || []) {
        console.log(`📚 Procesando material: ${material.nombre}`);
        console.log(`   - Tipo: ${material.tipo}`);
        console.log(`   - Nombre: ${material.nombre}`);
        console.log(`   - Link: ${material.link}`);
        console.log(
          `   - Archivo: ${material.archivo ? material.archivo.name : "Sin archivo"}`,
        );

        // Validar que el material tenga contenido
        if (!material.nombre || !material.nombre.trim()) {
          console.warn(`⚠️ Material sin nombre, saltando`);
          continue;
        }

        const formDataMaterial = new FormData();
        formDataMaterial.append("id_curso", cursoActualizado.id_curso);
        formDataMaterial.append("categoria_material", "material_descarga");
        formDataMaterial.append("nombre_archivo", material.nombre.trim());
        formDataMaterial.append("descripcion", material.descripcion || "");

        if (material.tipo === "pdf" && material.archivo) {
          console.log(`📄 Subiendo archivo PDF: ${material.archivo.name}`);
          formDataMaterial.append("archivo", material.archivo);
          formDataMaterial.append("es_enlace", "false");
        } else if (
          material.tipo === "link" &&
          material.link &&
          material.link.trim()
        ) {
          console.log(`🔗 Guardando enlace: ${material.link}`);
          formDataMaterial.append("es_enlace", "true");
          formDataMaterial.append("url_enlace", material.link.trim());
        } else {
          console.warn(`⚠️ Material incompleto, saltando: ${material.nombre}`);
          console.warn(`   - Tipo: ${material.tipo}`);
          console.warn(`   - Archivo: ${material.archivo ? "SÍ" : "NO"}`);
          console.warn(`   - Link: ${material.link || "VACÍO"}`);
          continue; // Saltar si no tiene archivo ni enlace
        }

        console.log(`📤 Enviando material al servidor: ${material.nombre}`);
        const responseMaterial = await fetch(`${API_BASE_URL}/api/material`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataMaterial,
        });

        if (!responseMaterial.ok) {
          const errorData = await responseMaterial.json().catch(() => ({}));
          console.error(`❌ Error al subir material: ${material.nombre}`, {
            status: responseMaterial.status,
            error: errorData,
          });
          showToast(
            `Advertencia: No se pudo subir "${material.nombre}" - ${errorData.error || "Error desconocido"}`,
            "warning",
          );
        } else {
          const responseData = await responseMaterial.json().catch(() => ({}));
          console.log(
            `✅ Material subido exitosamente: ${material.nombre}`,
            responseData,
          );
        }
      }

      // 4. Crear actividades en material_curso
      for (const actividad of cursoActualizado.actividades || []) {
        console.log(`📝 Creando actividad: ${actividad.nombre}`);

        // Primero crear el registro base de la actividad (sin archivo)
        const formDataActividad = new FormData();
        formDataActividad.append("id_curso", cursoActualizado.id_curso);
        formDataActividad.append("categoria_material", "actividad");
        formDataActividad.append("nombre_archivo", actividad.nombre);
        formDataActividad.append("es_enlace", "false");

        // Crear instrucciones completas
        let instrucciones = `Actividad: ${actividad.nombre}\nValor: ${actividad.porcentaje}%`;
        if (actividad.instrucciones && actividad.instrucciones.trim()) {
          instrucciones += `\n\nInstrucciones:\n${actividad.instrucciones}`;
        }
        formDataActividad.append("instrucciones_texto", instrucciones);

        if (actividad.fecha_limite) {
          formDataActividad.append("fecha_limite", actividad.fecha_limite);
        }

        const responseActividad = await fetch(`${API_BASE_URL}/api/material`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataActividad,
        });

        if (!responseActividad.ok) {
          const errorData = await responseActividad.json().catch(() => ({}));
          console.warn(
            `⚠️ Error al crear actividad: ${actividad.nombre}`,
            errorData,
          );
          showToast(
            `Advertencia: No se pudo crear la actividad "${actividad.nombre}" - ${errorData.error || "Error desconocido"}`,
            "warning",
          );
        } else {
          console.log(`✅ Actividad creada exitosamente: ${actividad.nombre}`);
        }

        // Subir cada archivo de apoyo
        for (const archivo of actividad.archivos_instrucciones || []) {
          if (!archivo) continue;
          console.log(`📎 Subiendo archivo de apoyo para: ${actividad.nombre}`);
          const formDataRecurso = new FormData();
          formDataRecurso.append("archivo", archivo);
          formDataRecurso.append("id_curso", cursoActualizado.id_curso);
          formDataRecurso.append("categoria_material", "actividad");
          formDataRecurso.append(
            "nombre_archivo",
            archivo.name,
          );
          formDataRecurso.append(
            "descripcion",
            `Archivo de apoyo para la actividad: ${actividad.nombre}`,
          );
          formDataRecurso.append("es_enlace", "false");

          const responseRecurso = await fetch(`${API_BASE_URL}/api/material`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formDataRecurso,
          });

          if (!responseRecurso.ok) {
            console.warn(`⚠️ Error al subir recurso para: ${actividad.nombre}`);
          } else {
            console.log(`✅ Recurso de apoyo subido para: ${actividad.nombre}`);
          }
        }

        // Guardar cada enlace de recurso
        for (const enlace of actividad.enlace_recursos || []) {
          if (!enlace || !enlace.trim()) continue;
          console.log(
            `🔗 Guardando enlace de recurso para: ${actividad.nombre}`,
          );
          console.log(`   - URL: ${enlace}`);

          const formDataEnlace = new FormData();
          formDataEnlace.append("id_curso", cursoActualizado.id_curso);
          formDataEnlace.append("categoria_material", "actividad");
          formDataEnlace.append(
            "nombre_archivo",
            `${actividad.nombre} - Enlace de apoyo`, // Nombre genérico para enlaces
          );
          formDataEnlace.append(
            "descripcion",
            `Enlace de apoyo para la actividad: ${actividad.nombre}`,
          );
          formDataEnlace.append("es_enlace", "true");
          formDataEnlace.append("url_enlace", enlace.trim());

          const responseEnlace = await fetch(`${API_BASE_URL}/api/material`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formDataEnlace,
          });

          if (!responseEnlace.ok) {
            const errorData = await responseEnlace.json().catch(() => ({}));
            console.warn(
              `⚠️ Error al guardar enlace para: ${actividad.nombre}`,
              errorData,
            );
          } else {
            const responseData = await responseEnlace.json().catch(() => ({}));
            console.log(
              `✅ Enlace de apoyo guardado para: ${actividad.nombre}`,
              responseData,
            );
          }
        }
      }

      // 5. Crear resumen de lo que se subió
      let resumen = "¡Configuración guardada con éxito!\n\n";
      let conteoSubidos = {
        planeacion: 0,
        materiales: 0,
        actividades: 0,
      };

      if (cursoActualizado.planeacion?.archivo_temario) {
        conteoSubidos.planeacion = 1;
        resumen += "📋 Planeación del curso subida\n";
      }

      if (cursoActualizado.materiales?.length > 0) {
        conteoSubidos.materiales = cursoActualizado.materiales.length;
        resumen += `📚 ${conteoSubidos.materiales} material(es) de descarga subido(s)\n`;
      }

      if (cursoActualizado.actividades?.length > 0) {
        conteoSubidos.actividades = cursoActualizado.actividades.length;
        resumen += `📝 ${conteoSubidos.actividades} actividad(es) creada(s)\n`;
      }

      resumen += "\nTodo el contenido ya está disponible para los estudiantes.";

      console.log("🎉 Proceso completado exitosamente");
      showToast("¡Configuración guardada exitosamente! " + resumen, "success");
      // NO cerrar el modal automáticamente para permitir más subidas
      // En su lugar, hacer trigger para recargar el material
      if (cursoSeleccionado) {
        setCursoSeleccionado({
          ...cursoSeleccionado,
          _reloadTrigger: Date.now(),
        });
      }

      // Limpiar formularios para permitir más subidas
      // (los formularios se limpiarán automáticamente al recargar)
    } catch (err) {
      console.error("💥 Error durante el guardado:", err);
      showToast(`Error al guardar: ${err.message}`, "error");
    }
  };

  if (loading)
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <p>Cargando gestión de calificaciones...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className={styles.container}>
        <div className={styles.errorModal}>{error}</div>
      </div>
    );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Gestión de Calificaciones</h1>
        </div>
      </header>

      <main className={styles.main}>
        {/* Sección de Filtros */}
        <div className={styles.filterBar}>
          <div className={styles.filters}>
            <select
              className={styles.input}
              value={filtros.universidadId}
              onChange={(e) =>
                handleFiltroChange("universidadId", e.target.value)
              }
            >
              <option value="">Todas las Universidades</option>
              {universidades.map((uni) => (
                <option key={uni.id_universidad} value={uni.id_universidad}>
                  {uni.nombre}
                </option>
              ))}
            </select>
            <select
              className={styles.input}
              value={filtros.facultadId}
              onChange={(e) => handleFiltroChange("facultadId", e.target.value)}
              disabled={!filtros.universidadId || facultades.length === 0}
            >
              <option value="">Facultad</option>
              {facultades.map((fac) => (
                <option key={fac.id_facultad} value={fac.id_facultad}>
                  {fac.nombre}
                </option>
              ))}
            </select>
            <select
              className={styles.input}
              value={filtros.carreraId}
              onChange={(e) => handleFiltroChange("carreraId", e.target.value)}
              disabled={!filtros.facultadId || carreras.length === 0}
            >
              <option value="">Carrera</option>
              {carreras.map((car) => (
                <option key={car.id_carrera} value={car.id_carrera}>
                  {car.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Buscar por nombre de curso..."
              className={styles.searchInput}
              value={filtros.searchTerm}
              onChange={(e) => handleFiltroChange("searchTerm", e.target.value)}
            />
          </div>
        </div>

        {/* Información de resultados */}
        {totalCursos > 0 && (
          <div className={styles.resultsInfo}>
            <p>
              Mostrando {(paginaActual - 1) * cursosPerPage + 1}-
              {Math.min(paginaActual * cursosPerPage, totalCursos)} de{" "}
              {totalCursos} cursos
            </p>
          </div>
        )}

        {/* Grid de Cursos */}
        {cursos.length > 0 ? (
          <div className={styles.coursesGrid}>
            {cursos.map((curso) => {
              const isCursoFinalizado =
                curso.fecha_fin && new Date(curso.fecha_fin) < new Date();
              return (
                <div key={curso.id_curso} className={styles.courseCard}>
                  <h3 className={styles.courseTitle}>{curso.nombre_curso}</h3>
                  <p className={styles.courseInfo}>
                    {curso.nombre_universidad || "N/A"} -{" "}
                    {curso.nombre_facultad || "N/A"}
                  </p>
                  <p className={styles.courseInfo}>
                    Carrera: {curso.nombre_carrera || "No especificada"}
                  </p>
                  <div className={styles.courseStats}>
                    <span>Umbral: {curso.umbral_aprobatorio ?? "N/A"}%</span>
                  </div>
                  <button
                    onClick={() => setCursoSeleccionado(curso)}
                    className={styles.buttonPrimary}
                    disabled={isCursoFinalizado}
                    title={
                      isCursoFinalizado
                        ? "Este curso ya ha finalizado y no se puede configurar."
                        : "Gestionar curso completo"
                    }
                  >
                    {isCursoFinalizado ? "Curso Finalizado" : "Gestionar Curso"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>No se encontraron cursos</h3>
            <p>Intenta ajustar los filtros o agrega nuevos cursos.</p>
          </div>
        )}

        {/* Controles de paginación */}
        {totalPaginas > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => handlePageChange(paginaActual - 1)}
              disabled={paginaActual === 1}
              className={styles.pageButton}
            >
              Anterior
            </button>

            <span className={styles.pageInfo}>
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              onClick={() => handlePageChange(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className={styles.pageButton}
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Modal de Edición */}
        {cursoSeleccionado && (
          <CalificacionModal
            curso={cursoSeleccionado}
            onClose={() => setCursoSeleccionado(null)}
            onSave={handleSaveCurso}
            showConfirmModal={showConfirmModal}
            showToast={showToast}
          />
        )}

        {/* Modal de Confirmación */}
        {confirmModal.show && (
          <div className={styles.modalBackdrop} onClick={closeConfirmModal}>
            <div
              className={styles.deleteModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.deleteModalContent}>
                <div
                  className={`${styles.deleteIcon} ${styles[confirmModal.type]}`}
                >
                  {confirmModal.type === "success"
                    ? "✅"
                    : confirmModal.type === "error"
                      ? "❌"
                      : "⚠️"}
                </div>
                <h3>{confirmModal.title}</h3>
                <p>{confirmModal.message}</p>
              </div>
              <div className={styles.deleteActions}>
                <button
                  onClick={closeConfirmModal}
                  className={styles.cancelButton}
                >
                  {confirmModal.onConfirm ? "Cancelar" : "Cerrar"}
                </button>
                {confirmModal.onConfirm && (
                  <button
                    onClick={() => {
                      confirmModal.onConfirm();
                      closeConfirmModal();
                    }}
                    className={styles.confirmDeleteButton}
                  >
                    Confirmar
                  </button>
                )}
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
      </main>
    </div>
  );
};

export default CalificacionCurso;
