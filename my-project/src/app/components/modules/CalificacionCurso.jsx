"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import styles from "./CalificacionCurso.module.css";

const API_BASE_URL = "http://localhost:5000";

// Componente para el modal de edición de calificaciones
const CalificacionModal = ({ curso, onClose, onSave }) => {
    const [actividades, setActividades] = useState(curso.actividades || [{ nombre: "Tarea 1", porcentaje: 100, fecha_limite: '', max_archivos: 5, max_tamano_mb: 10, tipos_permitidos: ['pdf', 'link'] }])
    const [umbral, setUmbral] = useState(curso.umbral_aprobatorio || 60)

    const handleAddActividad = () => {
        setActividades([...actividades, { nombre: `Actividad ${actividades.length + 1}`, porcentaje: 0, fecha_limite: '', max_archivos: 5, max_tamano_mb: 10, tipos_permitidos: ['pdf', 'link'] }])
    }

    const handleActividadChange = (index, field, value) => {
        const nuevasActividades = [...actividades]
        if (field === "porcentaje") {
            nuevasActividades[index][field] = parseInt(value, 10) || 0
        } else {
            nuevasActividades[index][field] = value
        }
        setActividades(nuevasActividades)
    }

    const handleRemoveActividad = (index) => {
        const nuevasActividades = actividades.filter((_, i) => i !== index)
        setActividades(nuevasActividades)
    }

    const totalPorcentaje = actividades.reduce((sum, act) => sum + act.porcentaje, 0)

    const handleSave = () => {
        if (totalPorcentaje !== 100) {
            alert("La suma de los porcentajes de las actividades debe ser 100%.")
            return
        }
        if (umbral < 50 || umbral > 100) {
            alert("El umbral aprobatorio debe estar entre 50 y 100.")
            return
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
                alert(`El tamaño máximo de archivo para "${act.nombre}" debe ser mayor a 0.`);
                return;
            }
        }
        onSave({ ...curso, umbral_aprobatorio: umbral, actividades })
        onClose()
    }

    return (
        <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
                <h2>Configurar Calificaciones: {curso.nombre}</h2>

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

                <h3>Actividades de Calificación</h3>
                {actividades.map((act, index) => (
                    <div key={index} className={styles.actividadItem}>
                        <div className={styles.actividadRow}>
                            <input
                                type="text"
                                placeholder="Nombre de la actividad"
                                value={act.nombre}
                                onChange={(e) => handleActividadChange(index, "nombre", e.target.value)}
                                className={styles.input}
                            />
                            <input
                                type="number"
                                placeholder="%"
                                value={act.porcentaje}
                                onChange={(e) => handleActividadChange(index, "porcentaje", e.target.value)}
                                className={styles.inputPorcentaje}
                            />
                            <button onClick={() => handleRemoveActividad(index)} className={styles.removeButton}>
                                &times;
                            </button>
                        </div>
                        <div className={styles.actividadDetalles}>
                            <div className={styles.opcionDetalle}>
                                <label>Fecha Límite: (Opcional)</label>
                                <input
                                    type="date"
                                    value={act.fecha_limite}
                                    onChange={(e) => handleActividadChange(index, "fecha_limite", e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.opcionDetalle} style={{ display: 'none' }}>
                                <label>Máx. Archivos:</label>
                                <input
                                    type="number"
                                    value={act.max_archivos}
                                    onChange={(e) => handleActividadChange(index, "max_archivos", e.target.value)}
                                    className={styles.input} min="1" max="10"
                                />
                            </div>
                            <div className={styles.opcionDetalle} style={{ display: 'none' }}>
                                <label>Tamaño Máx. (MB):</label>
                                <input
                                    type="number"
                                    value={act.max_tamano_mb}
                                    onChange={(e) => handleActividadChange(index, "max_tamano_mb", e.target.value)}
                                    className={styles.input} min="1" max="15"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button onClick={handleAddActividad} className={styles.addButton}>
                    + Añadir Actividad
                </button>

                <div className={`${styles.totalPorcentaje} ${totalPorcentaje !== 100 ? styles.totalError : ""}`}>
                    Total: {totalPorcentaje}%
                </div>

                <div className={styles.modalActions}>
                    <button onClick={onClose} className={styles.buttonSecondary}>
                        Cancelar
                    </button>
                    <button onClick={handleSave} className={styles.buttonPrimary} disabled={totalPorcentaje !== 100}>
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    )
}

const CalificacionCurso = ({ rol, entidadId }) => {
    const { user, token } = useAuth()
    const [cursos, setCursos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cursoSeleccionado, setCursoSeleccionado] = useState(null)

    // Estados de paginación
    const [paginaActual, setPaginaActual] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(0)
    const [totalCursos, setTotalCursos] = useState(0)
    const cursosPerPage = 15

    // Estados para los filtros
    const [universidades, setUniversidades] = useState([])
    const [facultades, setFacultades] = useState([])
    const [carreras, setCarreras] = useState([])
    const [filtros, setFiltros] = useState({
        universidadId: "",
        facultadId: "",
        carreraId: "",
        searchTerm: ""
    })

    const fetchData = async (page = 1, filtrosActuales = filtros) => {
        setLoading(true)
        setError(null)
        try {
            // Construir la URL con los parámetros de paginación y filtros
            const params = new URLSearchParams({
                page: page,
                limit: cursosPerPage,
                groupByCourse: 'true', // <-- Mantener este parámetro
                exclude_assigned: 'false', // <-- Añadir este para ver TODOS los cursos
                ...filtrosActuales
            });

            // Filtrar parámetros vacíos para limpiar la URL
            for (const [key, value] of [...params.entries()]) {
                if (!value || value === "" || value === "undefined") {
                    params.delete(key);
                }
            }

            const response = await fetch(`${API_BASE_URL}/api/cursos?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

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
            setError("No se pudieron cargar los datos. " + err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) {
            fetchData(1, filtros);

            // Cargar datos para los filtros
            const fetchFilterData = async () => {
                try {
                    // Cargar Universidades
                    const uniRes = await fetch(`${API_BASE_URL}/api/universidades?limit=9999`);
                    const uniData = await uniRes.json();
                    setUniversidades(uniData.universities || []);

                    // Cargar Facultades (si una universidad está seleccionada)
                    if (filtros.universidadId) {
                        const facRes = await fetch(`${API_BASE_URL}/api/facultades/universidad/${filtros.universidadId}`);
                        const facData = await facRes.json();
                        setFacultades(facData.data || []);
                    } else {
                        setFacultades([]); // Limpiar si no hay universidad
                    }

                    // Cargar Carreras (si una facultad está seleccionada)
                    if (filtros.facultadId) {
                        const carRes = await fetch(`${API_BASE_URL}/api/carreras/facultad/${filtros.facultadId}`);
                        const carData = await carRes.json();
                        setCarreras(carData.data || []);
                    }
                    else {
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
            fetchData(nuevaPagina, filtros)
        }
    }

    const handleFiltroChange = (campo, valor) => {
        // Si se cambia la universidad, se resetea la facultad
        let nuevosFiltros = { ...filtros, [campo]: valor };
        if (campo === 'universidadId') {
            nuevosFiltros.facultadId = "";
            nuevosFiltros.carreraId = "";
        }
        if (campo === 'facultadId') {
            nuevosFiltros.carreraId = "";
        }
        setFiltros(nuevosFiltros)
        setPaginaActual(1) // Resetear a página 1 cuando se filtran
        fetchData(1, nuevosFiltros)
    }

    const handleSaveCurso = async (cursoActualizado) => {
        try {
            const payload = {
                id_curso: cursoActualizado.id_curso,
                umbral_aprobatorio: cursoActualizado.umbral_aprobatorio,
                actividades: cursoActualizado.actividades
            };

            const response = await fetch(`${API_BASE_URL}/api/calificaciones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al guardar la configuración.');
            }

            alert("Configuración guardada con éxito.");
            // Opcional: Volver a cargar los datos para reflejar el nuevo umbral
            fetchData(paginaActual, filtros);
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    }

    if (loading) return (
        <div className={styles.container}>
            <div className={styles.loader}>
                <p>Cargando gestión de calificaciones...</p>
            </div>
        </div>
    )

    if (error) return (
        <div className={styles.container}>
            <div className={styles.errorModal}>{error}</div>
        </div>
    )

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
                            onChange={(e) => handleFiltroChange('universidadId', e.target.value)}
                        >
                            <option value="">Todas las Universidades</option>
                            {universidades.map(uni => (
                                <option key={uni.id_universidad} value={uni.id_universidad}>{uni.nombre}</option>
                            ))}
                        </select>
                        <select
                            className={styles.input}
                            value={filtros.facultadId}
                            onChange={(e) => handleFiltroChange('facultadId', e.target.value)}
                            disabled={!filtros.universidadId || facultades.length === 0}
                        >
                            <option value="">Facultad</option>
                            {facultades.map(fac => (
                                <option key={fac.id_facultad} value={fac.id_facultad}>{fac.nombre}</option>
                            ))}
                        </select>
                        <select
                            className={styles.input}
                            value={filtros.carreraId}
                            onChange={(e) => handleFiltroChange('carreraId', e.target.value)}
                            disabled={!filtros.facultadId || carreras.length === 0}
                        >
                            <option value="">Carrera</option>
                            {carreras.map(car => (
                                <option key={car.id_carrera} value={car.id_carrera}>{car.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="Buscar por nombre de curso..."
                            className={styles.searchInput}
                            value={filtros.searchTerm}
                            onChange={(e) => handleFiltroChange('searchTerm', e.target.value)}
                        />
                    </div>
                </div>

                {/* Información de resultados */}
                {totalCursos > 0 && (
                    <div className={styles.resultsInfo}>
                        <p>Mostrando {((paginaActual - 1) * cursosPerPage) + 1}-{Math.min(paginaActual * cursosPerPage, totalCursos)} de {totalCursos} cursos</p>
                    </div>
                )}

                {/* Grid de Cursos */}
                {cursos.length > 0 ? (
                    <div className={styles.coursesGrid}>
                        {cursos.map((curso) => {
                            const isCursoFinalizado = curso.fecha_fin && new Date(curso.fecha_fin) < new Date();
                            return (
                                <div key={curso.id_curso} className={styles.courseCard}>
                                <h3 className={styles.courseTitle}>{curso.nombre_curso}</h3>
                                <p className={styles.courseInfo}>
                                    {curso.nombre_universidad || 'N/A'} - {curso.nombre_facultad || 'N/A'}
                                </p>
                                <p className={styles.courseInfo}>Carrera: {curso.nombre_carrera || 'No especificada'}</p>
                                <div className={styles.courseStats}>
                                    <span>Umbral: {curso.umbral_aprobatorio ?? 'N/A'}%</span>
                                </div>
                                    <button
                                        onClick={() => setCursoSeleccionado(curso)}
                                        className={styles.buttonPrimary}
                                        disabled={isCursoFinalizado}
                                        title={isCursoFinalizado ? "Este curso ya ha finalizado y no se puede configurar." : "Configurar calificaciones del curso"}
                                    >
                                        {isCursoFinalizado ? "Curso Finalizado" : "Configurar Calificación"}
                                    </button>
                            </div>
                            )
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
                    />
                )}
            </main>
        </div>
    )
}

export default CalificacionCurso;