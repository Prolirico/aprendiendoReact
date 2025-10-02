import React, { useState, useEffect } from "react";
import styles from "./vistaCalificado.module.css";
import { useAuth } from "../../../hooks/useAuth";

const API_BASE_URL = "http://localhost:5000";

export default function VistaCalificacion({ curso, onClose }) {
  const { token } = useAuth();

  const [alumnos, setAlumnos] = useState([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [errorAlumnos, setErrorAlumnos] = useState(null);

  const [idAlumnoSeleccionado, setIdAlumnoSeleccionado] = useState(null);

  const [entregas, setEntregas] = useState([]);
  const [loadingEntregas, setLoadingEntregas] = useState(false);
  const [errorEntregas, setErrorEntregas] = useState(null);

  // Para manejar calificaciones y feedback localmente antes de guardar
  const [calificacionesLocales, setCalificacionesLocales] = useState({});

  // Estado para controlar qué actividades están expandidas
  const [expandedActividades, setExpandedActividades] = useState({});

  // Cargar lista de alumnos al montar
  useEffect(() => {
    if (!curso?.id_curso) return;

    console.log("Token disponible:", token ? "Sí" : "No");
    console.log("Token length:", token ? token.length : 0);
    console.log(
      "Token preview:",
      token ? token.substring(0, 50) + "..." : "No token",
    );

    if (!token) {
      setErrorAlumnos("No hay token de autenticación disponible");
      setLoadingAlumnos(false);
      return;
    }

    setLoadingAlumnos(true);
    setErrorAlumnos(null);
    fetch(`${API_BASE_URL}/api/cursos/${curso.id_curso}/alumnos`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          console.error("Error response:", text);
          if (res.status === 401) {
            throw new Error("Token de autenticación inválido o expirado");
          }
          throw new Error(text || "Error al obtener alumnos");
        }
        return res.json();
      })
      .then((data) => {
        setAlumnos(data);
        if (data.length > 0) setIdAlumnoSeleccionado(data[0].id_alumno);
      })
      .catch((e) => setErrorAlumnos(e.message))
      .finally(() => setLoadingAlumnos(false));
  }, [curso, token]);

  // Cargar entregas cuando cambia el alumno seleccionado
  useEffect(() => {
    if (!idAlumnoSeleccionado) {
      setEntregas([]);
      return;
    }
    setLoadingEntregas(true);
    setErrorEntregas(null);
    fetch(
      `${API_BASE_URL}/api/entregas/curso/${curso.id_curso}/alumno/${idAlumnoSeleccionado}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Error al obtener entregas");
        }
        return res.json();
      })
      .then((data) => {
        const entregasAgrupadas = {};
        data.forEach((entrega) => {
          if (!entregasAgrupadas[entrega.id_actividad]) {
            entregasAgrupadas[entrega.id_actividad] = {
              id_actividad: entrega.id_actividad,
              nombre_actividad: entrega.nombre_actividad,
              ponderacion: entrega.ponderacion,
              entregas: [],
            };
          }
          entregasAgrupadas[entrega.id_actividad].entregas.push(entrega);
        });

        const actividadesConEntregas = Object.values(entregasAgrupadas);
        setEntregas(actividadesConEntregas);

        const califInit = {};
        data.forEach((entrega) => {
          if (entrega.id_entrega) {
            califInit[entrega.id_entrega] = {
              calificacion:
                entrega.calificacion !== null &&
                entrega.calificacion !== undefined
                  ? entrega.calificacion
                  : "",
              feedback: entrega.feedback || "",
              guardando: false,
              error: null,
            };
          }
        });
        setCalificacionesLocales(califInit);

        // Inicializar todas las actividades como colapsadas
        const expandedInit = {};
        actividadesConEntregas.forEach((actividad) => {
          expandedInit[actividad.id_actividad] = false;
        });
        setExpandedActividades(expandedInit);
      })
      .catch((e) => setErrorEntregas(e.message))
      .finally(() => setLoadingEntregas(false));
  }, [idAlumnoSeleccionado, curso.id_curso, token]);

  // Función para alternar expandir/colapsar una actividad
  const toggleActividad = (id_actividad) => {
    setExpandedActividades((prev) => ({
      ...prev,
      [id_actividad]: !prev[id_actividad],
    }));
  };

  const indiceAlumnoSeleccionado = alumnos.findIndex(
    (a) => a.id_alumno === idAlumnoSeleccionado,
  );

  const handleAnterior = () => {
    if (indiceAlumnoSeleccionado > 0) {
      setIdAlumnoSeleccionado(alumnos[indiceAlumnoSeleccionado - 1].id_alumno);
    }
  };
  const handleSiguiente = () => {
    if (indiceAlumnoSeleccionado < alumnos.length - 1) {
      setIdAlumnoSeleccionado(alumnos[indiceAlumnoSeleccionado + 1].id_alumno);
    }
  };

  const handleCalificacionChange = (id_entrega, value) => {
    setCalificacionesLocales((prev) => ({
      ...prev,
      [id_entrega]: {
        ...prev[id_entrega],
        calificacion: value,
      },
    }));
  };
  const handleFeedbackChange = (id_entrega, value) => {
    setCalificacionesLocales((prev) => ({
      ...prev,
      [id_entrega]: {
        ...prev[id_entrega],
        feedback: value,
      },
    }));
  };

  const handleGuardarCalificacion = (id_entrega) => {
    // 1. Encontrar la actividad y la ponderación máxima para esta entrega.
    let actividadDeLaEntrega = null;
    for (const actividad of entregas) {
      const entregaEncontrada = actividad.entregas.find(
        (e) => e.id_entrega === id_entrega,
      );
      if (entregaEncontrada) {
        actividadDeLaEntrega = actividad;
        break;
      }
    }

    if (!actividadDeLaEntrega) {
      alert("Error: No se pudo encontrar la actividad para esta entrega.");
      return;
    }

    const { calificacion, feedback } = calificacionesLocales[id_entrega];
    if (calificacion === "" || calificacion === null) {
      alert("La calificación no puede estar vacía");
      return;
    }
    const calNum = Number(calificacion);
    if (calNum > actividadDeLaEntrega.ponderacion) {
      alert(`La calificación (${calNum}) no puede ser mayor que la ponderación máxima de la actividad (${actividadDeLaEntrega.ponderacion}%).`);
      return;
    }
    if (isNaN(calNum) || calNum < 0) {
      alert("La calificación debe ser un número válido y no negativa");
      return;
    }

    setCalificacionesLocales((prev) => ({
      ...prev,
      [id_entrega]: { ...prev[id_entrega], guardando: true, error: null },
    }));

    fetch(`${API_BASE_URL}/api/entregas/${id_entrega}/calificar`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        calificacion: calNum,
        feedback,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Error al guardar calificación");
        }
        return res.json();
      })
      .then(() => {
        setCalificacionesLocales((prev) => ({
          ...prev,
          [id_entrega]: { ...prev[id_entrega], guardando: false, error: null },
        }));
        setEntregas((prev) =>
          prev.map((ent) =>
            ent.id_entrega === id_entrega
              ? { ...ent, calificacion: calNum, feedback }
              : ent,
          ),
        );
      })
      .catch((e) => {
        setCalificacionesLocales((prev) => ({
          ...prev,
          [id_entrega]: {
            ...prev[id_entrega],
            guardando: false,
            error: e.message,
          },
        }));
      });
  };

  const handleDownload = (id_archivo, nombre_original) => {
    fetch(`${API_BASE_URL}/api/entregas/download/${id_archivo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res
            .json()
            .catch(() => ({ error: "Error desconocido al descargar" }));
          throw new Error(errorData.error || "Error al descargar el archivo");
        }
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = nombre_original;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      })
      .catch((error) => {
        console.error("Error en la descarga:", error);
        alert(`No se pudo descargar el archivo: ${error.message}`);
      });
  };

  const alumnoSeleccionado = alumnos.find(
    (a) => a.id_alumno === idAlumnoSeleccionado,
  );

  return (
    <div
      className={styles.vistaCalificacionBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.vistaCalificacionContent}>
        <header className={styles.header}>
          <h2>Calificar tareas - {curso.nombre_curso || "Curso sin nombre"}</h2>
          <button
            aria-label="Cerrar modal"
            onClick={onClose}
            type="button"
            className="btn-close"
          >
            ×
          </button>
        </header>

        <main className={styles.mainLayout}>
          <section className={styles.panelIzquierdo}>
            <h3>Alumnos inscritos</h3>
            {loadingAlumnos && (
              <div className={styles.loader} aria-live="polite">
                Cargando alumnos...
              </div>
            )}
            {errorAlumnos && (
              <div role="alert" style={{ color: "red" }}>
                {errorAlumnos}
              </div>
            )}
            {!loadingAlumnos && !errorAlumnos && (
              <ul className={styles.listaAlumnos}>
                {alumnos.length === 0 && (
                  <li className={styles.emptyState}>
                    No hay alumnos inscritos
                  </li>
                )}
                {alumnos.map((alumno) => (
                  <li
                    key={alumno.id_alumno}
                    className={`${styles.alumnoItem} ${
                      alumno.id_alumno === idAlumnoSeleccionado
                        ? styles.alumnoItemSelected
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setIdAlumnoSeleccionado(alumno.id_alumno)}
                      className={styles.btnAlumno}
                    >
                      {alumno.nombre_completo ||
                        alumno.nombre ||
                        "Alumno sin nombre"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.panelDerecho}>
            {!idAlumnoSeleccionado && (
              <p className={styles.emptyState}>
                Selecciona un alumno de la lista para comenzar a calificar
              </p>
            )}

            {idAlumnoSeleccionado && (
              <>
                <header className={styles.headerAlumno}>
                  <h3>{alumnoSeleccionado?.nombre_completo || "Alumno"}</h3>
                  <div className={styles.navegacionAlumnos}>
                    <button
                      type="button"
                      onClick={handleAnterior}
                      disabled={indiceAlumnoSeleccionado <= 0}
                      aria-label="Alumno anterior"
                      className={styles.btnNav}
                      title="Alumno anterior"
                    >
                      &lt;
                    </button>
                    <span className={styles.contadorAlumnos}>
                      {indiceAlumnoSeleccionado + 1} de {alumnos.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleSiguiente}
                      disabled={indiceAlumnoSeleccionado >= alumnos.length - 1}
                      aria-label="Alumno siguiente"
                      className={styles.btnNav}
                      title="Alumno siguiente"
                    >
                      &gt;
                    </button>
                  </div>
                </header>

                {loadingEntregas && (
                  <div className={styles.loader} aria-live="polite">
                    Cargando entregas...
                  </div>
                )}
                {errorEntregas && (
                  <div role="alert" style={{ color: "red" }}>
                    {errorEntregas}
                  </div>
                )}

                {!loadingEntregas && !errorEntregas && (
                  <div className={styles.areaCalificacion}>
                    {entregas.length === 0 && (
                      <p className={styles.emptyState}>
                        No hay actividades para calificar o el alumno no ha
                        entregado nada.
                      </p>
                    )}
                    {entregas.map((actividad) => (
                      <article
                        key={`actividad-${actividad.id_actividad}`}
                        className={`${styles.actividadCard} ${
                          expandedActividades[actividad.id_actividad]
                            ? styles.expanded
                            : ""
                        }`}
                        aria-label={`Actividad ${actividad.nombre_actividad}`}
                      >
                        <div className={styles.actividadHeader}>
                          <h4>
                            {actividad.nombre_actividad} -{" "}
                            {actividad.ponderacion}%
                          </h4>
                          <button
                            type="button"
                            onClick={() =>
                              toggleActividad(actividad.id_actividad)
                            }
                            className={styles.btnToggle}
                            aria-label={
                              expandedActividades[actividad.id_actividad]
                                ? `Colapsar ${actividad.nombre_actividad}`
                                : `Expandir ${actividad.nombre_actividad}`
                            }
                          >
                            {expandedActividades[actividad.id_actividad]
                              ? "−"
                              : "+"}
                          </button>
                        </div>
                        <div className={styles.actividadContent}>
                          {actividad.entregas &&
                          actividad.entregas.length > 0 ? (
                            (() => {
                              const entregasConArchivos =
                                actividad.entregas.filter(
                                  (entrega) =>
                                    entrega.archivos &&
                                    entrega.archivos.length > 0,
                                );

                              if (entregasConArchivos.length > 0) {
                                return entregasConArchivos.map(
                                  (entrega, entregaIndex) => (
                                    <div
                                      key={`entrega-${entrega.id_entrega || entregaIndex}`}
                                      className={styles.entregaSection}
                                    >
                                      <div
                                        className={styles.archivosEntregados}
                                      >
                                        <strong>Archivos entregados:</strong>
                                        <ul>
                                          {entrega.archivos.map((archivo) => (
                                            <li key={archivo.id_archivo}>
                                              <a
                                                href="#"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  handleDownload(
                                                    archivo.id_archivo,
                                                    archivo.nombre_original,
                                                  );
                                                }}
                                              >
                                                {archivo.nombre_original}
                                              </a>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      {entrega.id_entrega && (
                                        <>
                                          <label
                                            htmlFor={`calificacion-${entrega.id_entrega}`}
                                          >
                                            Calificación:
                                          </label>
                                          <input
                                            id={`calificacion-${entrega.id_entrega}`}
                                            type="number"
                                            min="0"
                                            step="any"
                                            className={styles.campoCalificacion}
                                            value={
                                              calificacionesLocales[
                                                entrega.id_entrega
                                              ]?.calificacion ?? ""
                                            }
                                            onChange={(e) =>
                                              handleCalificacionChange(
                                                entrega.id_entrega,
                                                e.target.value,
                                              )
                                            }
                                            onWheel={(e) =>
                                              e.target.blur()
                                            }
                                          />

                                          <label
                                            htmlFor={`feedback-${entrega.id_entrega}`}
                                          >
                                            Retroalimentación:
                                          </label>
                                          <textarea
                                            id={`feedback-${entrega.id_entrega}`}
                                            className={styles.campoFeedback}
                                            rows={3}
                                            value={
                                              calificacionesLocales[
                                                entrega.id_entrega
                                              ]?.feedback ?? ""
                                            }
                                            onChange={(e) =>
                                              handleFeedbackChange(
                                                entrega.id_entrega,
                                                e.target.value,
                                              )
                                            }
                                          />

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleGuardarCalificacion(
                                                entrega.id_entrega,
                                              )
                                            }
                                            disabled={
                                              calificacionesLocales[
                                                entrega.id_entrega
                                              ]?.guardando
                                            }
                                            aria-label={`Guardar calificación para ${actividad.nombre_actividad}`}
                                          >
                                            {calificacionesLocales[
                                              entrega.id_entrega
                                            ]?.guardando
                                              ? "Guardando..."
                                              : "Guardar Calificación"}
                                          </button>

                                          {calificacionesLocales[
                                            entrega.id_entrega
                                          ]?.error && (
                                            <p
                                              role="alert"
                                              style={{ color: "red" }}
                                            >
                                              {
                                                calificacionesLocales[
                                                  entrega.id_entrega
                                                ].error
                                              }
                                            </p>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  ),
                                );
                              } else {
                                return <p>Sin entregas para esta actividad</p>;
                              }
                            })()
                          ) : (
                            <p>Sin entregas para esta actividad</p>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
