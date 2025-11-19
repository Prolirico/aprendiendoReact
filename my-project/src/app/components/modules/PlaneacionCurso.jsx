"use client"

import { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTrash, faPlus, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons"
import styles from "./PlaneacionCurso.module.css"

const API_BASE_URL = "http://localhost:5000"

const PlaneacionCurso = ({ curso, onClose, onSave, token }) => {
  // Estados principales
  const [planeacion, setPlaneacion] = useState({
    clave_asignatura: "",
    id_carrera: "",
    caracterizacion: "",
    intencion_didactica: "",
    competencias_desarrollar: "",
    competencias_previas: "",
    evaluacion_competencias: "",
    proyecto: {
      fundamentacion: "",
      planeacion: "",
      ejecucion: "",
      evaluacion: "",
    },
    fecha_creacion: new Date().toISOString().split("T")[0],
    convocatoria_id: "",
  })

  const [temario, setTemario] = useState([])
  const [temasExpandidos, setTemasExpandidos] = useState({})
  const [practicas, setPracticas] = useState([])
  const [fuentes, setFuentes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [carreras, setCarreras] = useState([])
  const [convocatorias, setConvocatorias] = useState([])
  const [universidadesParticipantes, setUniversidadesParticipantes] = useState([])

  useEffect(() => {
    cargarCarreras()
    cargarConvocatorias()
  }, [])

  useEffect(() => {
    if (planeacion.convocatoria_id) {
      cargarUniversidadesParticipantes(planeacion.convocatoria_id)
    }
  }, [planeacion.convocatoria_id])

  // --- FUNCIONES PARA CARGAR DATOS ---
  const cargarCarreras = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/carreras`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setCarreras(data)
      }
    } catch (err) {
      console.error("Error al cargar carreras:", err)
    }
  }

  const cargarConvocatorias = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/convocatorias`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setConvocatorias(data)
      }
    } catch (err) {
      console.error("Error al cargar convocatorias:", err)
    }
  }

  const cargarUniversidadesParticipantes = async (convocatoriaId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/convocatorias/${convocatoriaId}/universidades`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUniversidadesParticipantes(data)
      }
    } catch (err) {
      console.error("Error al cargar universidades participantes:", err)
    }
  }

  // Cargar datos existentes si los hay
  useEffect(() => {
    if (curso.id_curso) {
      cargarPlaneacionExistente()
    }
  }, [curso.id_curso])

  const cargarPlaneacionExistente = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/planeacion/${curso.id_curso}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.planeacion) {
          setPlaneacion(data.planeacion)
          setTemario(data.temario || [])
          setPracticas(data.practicas || [])
          setFuentes(data.fuentes || [])
        }
      }
    } catch (err) {
      console.error("Error al cargar planeación:", err)
    } finally {
      setLoading(false)
    }
  }

  // --- FUNCIONES PARA TEMARIO ---
  const handleAddTema = () => {
    const nuevoTema = {
      id_temporal: Date.now(),
      numero_tema: temario.length + 1,
      nombre_tema: "",
      subtemas: [],
    }
    setTemario([...temario, nuevoTema])
    setTemasExpandidos({ ...temasExpandidos, [nuevoTema.id_temporal]: true })
  }

  const handleRemoveTema = (index) => {
    const nuevosTemarios = temario.filter((_, i) => i !== index)
    // Renumerar temas
    const renumerados = nuevosTemarios.map((tema, i) => ({
      ...tema,
      numero_tema: i + 1,
    }))
    setTemario(renumerados)
  }

  const handleTemaChange = (index, field, value) => {
    const nuevosTemarios = [...temario]
    nuevosTemarios[index][field] = value
    setTemario(nuevosTemarios)
  }

  const toggleTemaExpansion = (idTemporal) => {
    setTemasExpandidos({
      ...temasExpandidos,
      [idTemporal]: !temasExpandidos[idTemporal],
    })
  }

  // --- FUNCIONES PARA SUBTEMAS ---
  const handleAddSubtema = (temaIndex) => {
    const nuevosTemarios = [...temario]
    const subtemas = nuevosTemarios[temaIndex].subtemas || []
    const nuevoSubtema = {
      id_temporal: Date.now(),
      numero_subtema: `${nuevosTemarios[temaIndex].numero_tema}.${subtemas.length + 1}`,
      nombre_subtema: "",
    }
    nuevosTemarios[temaIndex].subtemas = [...subtemas, nuevoSubtema]
    setTemario(nuevosTemarios)
  }

  const handleRemoveSubtema = (temaIndex, subtemaIndex) => {
    const nuevosTemarios = [...temario]
    const subtemasFiltrados = nuevosTemarios[temaIndex].subtemas.filter((_, i) => i !== subtemaIndex)
    // Renumerar subtemas
    const renumerados = subtemasFiltrados.map((subtema, i) => ({
      ...subtema,
      numero_subtema: `${nuevosTemarios[temaIndex].numero_tema}.${i + 1}`,
    }))
    nuevosTemarios[temaIndex].subtemas = renumerados
    setTemario(nuevosTemarios)
  }

  const handleSubtemaChange = (temaIndex, subtemaIndex, value) => {
    const nuevosTemarios = [...temario]
    nuevosTemarios[temaIndex].subtemas[subtemaIndex].nombre_subtema = value
    setTemario(nuevosTemarios)
  }

  // --- FUNCIONES PARA ACTIVIDADES DE APRENDIZAJE ---
  const handleActividadesAprendizajeChange = (temaIndex, field, value) => {
    const nuevosTemarios = [...temario]
    if (!nuevosTemarios[temaIndex].actividades_aprendizaje) {
      nuevosTemarios[temaIndex].actividades_aprendizaje = {
        competencias_especificas: "",
        competencias_genericas: "",
        actividades: "",
      }
    }
    nuevosTemarios[temaIndex].actividades_aprendizaje[field] = value
    setTemario(nuevosTemarios)
  }

  // --- FUNCIONES PARA PRÁCTICAS ---
  const handleAddPractica = () => {
    setPracticas([
      ...practicas,
      {
        id_temporal: Date.now(),
        id_tema: "",
        descripcion_practica: "",
      },
    ])
  }

  const handleRemovePractica = (index) => {
    setPracticas(practicas.filter((_, i) => i !== index))
  }

  const handlePracticaChange = (index, field, value) => {
    const nuevasPracticas = [...practicas]
    nuevasPracticas[index][field] = value
    setPracticas(nuevasPracticas)
  }

  const obtenerNombreTema = (idTema) => {
    const tema = temario.find(
      (t) => t.id_temporal?.toString() === idTema?.toString() || t.id_tema?.toString() === idTema?.toString(),
    )
    return tema ? `${tema.numero_tema}. ${tema.nombre_tema}` : "Sin tema asignado"
  }

  const practicasAgrupadasPorTema = () => {
    const grupos = {}

    practicas.forEach((practica, index) => {
      const idTema = practica.id_tema || "sin_tema"
      if (!grupos[idTema]) {
        grupos[idTema] = []
      }
      grupos[idTema].push({ ...practica, index })
    })

    return grupos
  }

  // --- FUNCIONES PARA FUENTES ---
  const handleAddFuente = () => {
    setFuentes([
      ...fuentes,
      {
        id_temporal: Date.now(),
        tipo: "",
        referencia: "",
      },
    ])
  }

  const handleRemoveFuente = (index) => {
    setFuentes(fuentes.filter((_, i) => i !== index))
  }

  const handleFuenteChange = (index, field, value) => {
    const nuevasFuentes = [...fuentes]
    nuevasFuentes[index][field] = value
    setFuentes(nuevasFuentes)
  }

  // --- FUNCIÓN PARA GUARDAR ---
  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validaciones básicas
      if (!planeacion.clave_asignatura.trim()) {
        setError("La clave de la asignatura es obligatoria")
        return
      }

      if (!planeacion.id_carrera) {
        setError("Debe seleccionar una carrera")
        return
      }

      if (temario.length === 0) {
        setError("Debe agregar al menos un tema al temario")
        return
      }

      // Validar que todos los temas tengan nombre
      for (let i = 0; i < temario.length; i++) {
        if (!temario[i].nombre_tema.trim()) {
          setError(`El tema ${i + 1} debe tener un nombre`)
          return
        }
      }

      const payload = {
        id_curso: curso.id_curso,
        planeacion,
        temario,
        practicas: practicas.filter((p) => p.descripcion_practica.trim()),
        fuentes: fuentes.filter((f) => f.referencia.trim()),
      }

      const response = await fetch(`${API_BASE_URL}/api/planeacion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar la planeación")
      }

      const result = await response.json()

      // Llamar al callback de guardado exitoso
      if (onSave) {
        onSave(result)
      }

      alert("Planeación guardada exitosamente")
      onClose()
    } catch (err) {
      setError(err.message)
      console.error("Error al guardar:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !planeacion.clave_asignatura) {
    return (
      <div className={styles.modalBackdrop}>
        <div className={styles.loadingContainer}>
          <p>Cargando planeación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>📋 Planeación del Curso: {curso.nombre_curso || curso.nombre}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* SECCIÓN 1: DATOS GENERALES */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📝 Datos Generales</h3>

            <div className={styles.inputRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Clave de la Asignatura *</label>
                <input
                  type="text"
                  className={styles.inputReadonly}
                  value={planeacion.clave_asignatura}
                  readOnly
                  placeholder="Se asignará automáticamente"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Carrera *</label>
                <select
                  className={styles.select}
                  value={planeacion.id_carrera}
                  onChange={(e) => setPlaneacion({ ...planeacion, id_carrera: e.target.value })}
                >
                  <option value="">Seleccionar carrera...</option>
                  {carreras.map((carrera) => (
                    <option key={carrera.id_carrera} value={carrera.id_carrera}>
                      {carrera.nombre} ({carrera.clave_carrera})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Fecha de Creación</label>
              <input
                type="date"
                className={styles.input}
                value={planeacion.fecha_creacion}
                onChange={(e) => setPlaneacion({ ...planeacion, fecha_creacion: e.target.value })}
              />
            </div>
          </div>

          {/* SECCIÓN 2: PRESENTACIÓN */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📖 Presentación</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Caracterización de la Asignatura</label>
              <textarea
                className={styles.textarea}
                value={planeacion.caracterizacion}
                onChange={(e) => setPlaneacion({ ...planeacion, caracterizacion: e.target.value })}
                placeholder="Describe cómo esta asignatura aporta al perfil del egresado..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Intención Didáctica</label>
              <textarea
                className={styles.textarea}
                value={planeacion.intencion_didactica}
                onChange={(e) => setPlaneacion({ ...planeacion, intencion_didactica: e.target.value })}
                placeholder="Describe la organización de los temas y la estrategia de enseñanza..."
              />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🤝 Participantes</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Convocatoria</label>
              <select
                className={styles.select}
                value={planeacion.convocatoria_id}
                onChange={(e) => setPlaneacion({ ...planeacion, convocatoria_id: e.target.value })}
              >
                <option value="">Seleccionar convocatoria...</option>
                {convocatorias.map((conv) => (
                  <option key={conv.id} value={conv.id}>
                    {conv.nombre}
                  </option>
                ))}
              </select>
            </div>

            {planeacion.convocatoria_id && universidadesParticipantes.length > 0 && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Universidades Participantes</label>
                <div className={styles.universidadesList}>
                  {universidadesParticipantes.map((universidad) => (
                    <div key={universidad.id_universidad} className={styles.universidadItem}>
                      🎓 {universidad.nombre}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: COMPETENCIAS */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🎯 Competencias</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Competencias a Desarrollar</label>
              <textarea
                className={styles.textarea}
                value={planeacion.competencias_desarrollar}
                onChange={(e) => setPlaneacion({ ...planeacion, competencias_desarrollar: e.target.value })}
                placeholder="Describe las competencias específicas que se desarrollarán..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Competencias Previas</label>
              <textarea
                className={styles.textarea}
                value={planeacion.competencias_previas}
                onChange={(e) => setPlaneacion({ ...planeacion, competencias_previas: e.target.value })}
                placeholder="Describe los conocimientos previos requeridos..."
              />
            </div>
          </div>

          {/* SECCIÓN 4: TEMARIO */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📚 Temario</h3>

            {temario.map((tema, temaIndex) => (
              <div key={tema.id_temporal || tema.id_tema} className={styles.temaItem}>
                <div
                  className={styles.temaHeader}
                  onClick={() => toggleTemaExpansion(tema.id_temporal || tema.id_tema)}
                >
                  <div className={styles.temaHeaderContent}>
                    <span className={styles.temaNumero}>Tema {tema.numero_tema}</span>
                    <span className={styles.temaNombre}>{tema.nombre_tema || "Sin nombre"}</span>
                  </div>
                  <div className={styles.temaActions}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveTema(temaIndex)
                      }}
                      className={styles.buttonDanger}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <FontAwesomeIcon
                      icon={temasExpandidos[tema.id_temporal || tema.id_tema] ? faChevronUp : faChevronDown}
                      className={styles.chevronIcon}
                    />
                  </div>
                </div>

                {temasExpandidos[tema.id_temporal || tema.id_tema] && (
                  <div className={styles.temaContent}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nombre del Tema *</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={tema.nombre_tema}
                        onChange={(e) => handleTemaChange(temaIndex, "nombre_tema", e.target.value)}
                        placeholder="Ej: Sistemas numéricos"
                      />
                    </div>

                    {/* Subtemas */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Subtemas</label>
                      {(tema.subtemas || []).map((subtema, subtemaIndex) => (
                        <div key={subtema.id_temporal || subtema.id_subtema} className={styles.subtemaItem}>
                          <span className={styles.subtemaNumero}>{subtema.numero_subtema}</span>
                          <input
                            type="text"
                            className={styles.inputFlex}
                            value={subtema.nombre_subtema}
                            onChange={(e) => handleSubtemaChange(temaIndex, subtemaIndex, e.target.value)}
                            placeholder="Nombre del subtema"
                          />
                          <button
                            onClick={() => handleRemoveSubtema(temaIndex, subtemaIndex)}
                            className={styles.buttonDanger}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => handleAddSubtema(temaIndex)} className={styles.buttonAdd}>
                        <FontAwesomeIcon icon={faPlus} /> Añadir Subtema
                      </button>
                    </div>

                    {/* Actividades de Aprendizaje */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Competencias Específicas del Tema</label>
                      <textarea
                        className={styles.textareaSmall}
                        value={tema.actividades_aprendizaje?.competencias_especificas || ""}
                        onChange={(e) =>
                          handleActividadesAprendizajeChange(temaIndex, "competencias_especificas", e.target.value)
                        }
                        placeholder="Competencias específicas que se desarrollan en este tema..."
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Competencias Genéricas del Tema</label>
                      <textarea
                        className={styles.textareaSmall}
                        value={tema.actividades_aprendizaje?.competencias_genericas || ""}
                        onChange={(e) =>
                          handleActividadesAprendizajeChange(temaIndex, "competencias_genericas", e.target.value)
                        }
                        placeholder="Competencias genéricas que se desarrollan en este tema..."
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Actividades de Aprendizaje</label>
                      <textarea
                        className={styles.textarea}
                        value={tema.actividades_aprendizaje?.actividades || ""}
                        onChange={(e) => handleActividadesAprendizajeChange(temaIndex, "actividades", e.target.value)}
                        placeholder="Lista de actividades de aprendizaje para este tema (una por línea)..."
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button onClick={handleAddTema} className={styles.buttonAdd}>
              <FontAwesomeIcon icon={faPlus} /> Añadir Tema
            </button>
          </div>

          {/* SECCIÓN 5: PRÁCTICAS */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🔬 Prácticas</h3>
            <p className={styles.sectionDescription}>
              Asocia actividades de práctica con cada tema principal. Estas se agregarán automáticamente como
              actividades de calificación.
            </p>

            {temario.length === 0 ? (
              <p className={styles.warningMessage}>⚠️ Debes agregar al menos un tema antes de crear prácticas.</p>
            ) : (
              <>
                {Object.entries(practicasAgrupadasPorTema()).map(([idTema, practicasDelTema]) => (
                  <div key={idTema} className={styles.practicasGrupo}>
                    <h4 className={styles.temaGrupoTitle}>
                      {idTema === "sin_tema" ? "⚠️ Sin tema asignado" : `📚 ${obtenerNombreTema(idTema)}`}
                    </h4>
                    {practicasDelTema.map(({ index, id_temporal, id_practica, id_tema, descripcion_practica }) => (
                      <div key={id_temporal || id_practica} className={styles.practicaItem}>
                        <span className={styles.practicaNumber}>{index + 1}</span>
                        <div className={styles.practicaContent}>
                          <select
                            className={styles.select}
                            value={id_tema || ""}
                            onChange={(e) => handlePracticaChange(index, "id_tema", e.target.value)}
                          >
                            <option value="">Seleccionar tema...</option>
                            {temario.map((tema) => (
                              <option key={tema.id_temporal || tema.id_tema} value={tema.id_temporal || tema.id_tema}>
                                {tema.numero_tema}. {tema.nombre_tema}
                              </option>
                            ))}
                          </select>
                          <textarea
                            className={styles.textareaSmall}
                            value={descripcion_practica}
                            onChange={(e) => handlePracticaChange(index, "descripcion_practica", e.target.value)}
                            placeholder="Descripción de la actividad práctica..."
                            rows={2}
                          />
                        </div>
                        <button onClick={() => handleRemovePractica(index)} className={styles.buttonDanger}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}

                <button onClick={handleAddPractica} className={styles.buttonAdd}>
                  <FontAwesomeIcon icon={faPlus} /> Añadir Práctica
                </button>
              </>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🎓 Proyecto de Asignatura</h3>
            <p className={styles.sectionDescription}>
              El proyecto se agregará automáticamente como actividad de calificación en la pestaña correspondiente.
            </p>

            <div className={styles.formGroup}>
              <label className={styles.label}>Fundamentación</label>
              <textarea
                className={styles.textareaSmall}
                value={planeacion.proyecto.fundamentacion}
                onChange={(e) =>
                  setPlaneacion({
                    ...planeacion,
                    proyecto: { ...planeacion.proyecto, fundamentacion: e.target.value },
                  })
                }
                placeholder="Describe la fundamentación teórica del proyecto..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Planeación</label>
              <textarea
                className={styles.textareaSmall}
                value={planeacion.proyecto.planeacion}
                onChange={(e) =>
                  setPlaneacion({
                    ...planeacion,
                    proyecto: { ...planeacion.proyecto, planeacion: e.target.value },
                  })
                }
                placeholder="Describe la planeación del proyecto..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Ejecución</label>
              <textarea
                className={styles.textareaSmall}
                value={planeacion.proyecto.ejecucion}
                onChange={(e) =>
                  setPlaneacion({
                    ...planeacion,
                    proyecto: { ...planeacion.proyecto, ejecucion: e.target.value },
                  })
                }
                placeholder="Describe las fases de ejecución del proyecto..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Evaluación</label>
              <textarea
                className={styles.textareaSmall}
                value={planeacion.proyecto.evaluacion}
                onChange={(e) =>
                  setPlaneacion({
                    ...planeacion,
                    proyecto: { ...planeacion.proyecto, evaluacion: e.target.value },
                  })
                }
                placeholder="Describe los criterios de evaluación del proyecto..."
              />
            </div>
          </div>

          {/* SECCIÓN 7: EVALUACIÓN POR COMPETENCIAS */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>✅ Evaluación por Competencias</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Criterios de Evaluación</label>
              <textarea
                className={styles.textarea}
                value={planeacion.evaluacion_competencias}
                onChange={(e) => setPlaneacion({ ...planeacion, evaluacion_competencias: e.target.value })}
                placeholder="Describe los instrumentos y criterios de evaluación: mapas conceptuales, reportes, exposiciones, problemarios, rúbricas, listas de cotejo, etc..."
              />
            </div>
          </div>

          {/* SECCIÓN 8: FUENTES DE INFORMACIÓN */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📖 Fuentes de Información</h3>

            {fuentes.map((fuente, index) => (
              <div key={fuente.id_temporal || fuente.id_fuente} className={styles.practicaItem}>
                <span className={styles.practicaNumber}>{index + 1}</span>
                <div className={styles.fuenteContent}>
                  <select
                    className={styles.select}
                    value={fuente.tipo}
                    onChange={(e) => handleFuenteChange(index, "tipo", e.target.value)}
                  >
                    <option value="libro">📚 Libro</option>
                    <option value="articulo">📄 Artículo</option>
                    <option value="web">🌐 Sitio Web</option>
                    <option value="otro">📎 Otro</option>
                  </select>
                  <textarea
                    className={styles.textareaSmall}
                    value={fuente.referencia}
                    onChange={(e) => handleFuenteChange(index, "referencia", e.target.value)}
                    placeholder="Formato: Autor(es). (Año). Título. Editorial/Revista/URL."
                    rows={2}
                  />
                </div>
                <button onClick={() => handleRemoveFuente(index)} className={styles.buttonDanger}>
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}

            <button onClick={handleAddFuente} className={styles.buttonAdd}>
              <FontAwesomeIcon icon={faPlus} /> Añadir Fuente
            </button>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.buttonSecondary} disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className={`${styles.buttonPrimary} ${loading ? styles.buttonDisabled : ""}`}
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar Planeación"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlaneacionCurso
