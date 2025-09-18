"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import styles from "./CalificacionCurso.module.css";

const API_BASE_URL = "http://localhost:5000";

// Componente para el modal de edición de calificaciones
const CalificacionModal = ({ curso, onClose, onSave }) => {
    const [actividades, setActividades] = useState(curso.actividades || [{ nombre: "Tarea 1", porcentaje: 100 }])
    const [umbral, setUmbral] = useState(curso.umbral_aprobatorio || 60)

    const handleAddActividad = () => {
        setActividades([...actividades, { nombre: `Actividad ${actividades.length + 1}`, porcentaje: 0 }])
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
                    <div key={index} className={styles.actividadRow}>
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
    const [filtros, setFiltros] = useState({
        universidadId: "",
        facultadId: "",
        cursoId: "",
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
                } catch (error) {
                    console.error("Error al cargar datos de filtros:", error);
                }
            };

            fetchFilterData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, rol, entidadId, filtros.universidadId]); // Se vuelve a ejecutar si cambia el ID de la universidad



    const handlePageChange = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            fetchData(nuevaPagina, filtros)
        }
    }

    const handleFiltroChange = (campo, valor) => {
        // Si se cambia la universidad, se resetea la facultad
        if (campo === 'universidadId') {
            setFiltros({ ...filtros, universidadId: valor, facultadId: "" });
            return; // El useEffect se encargará de recargar
        }
        const nuevosFiltros = { ...filtros, [campo]: valor }
        setFiltros(nuevosFiltros)
        setPaginaActual(1) // Resetear a página 1 cuando se filtran
        fetchData(1, nuevosFiltros)
    }

    const handleSaveCurso = (cursoActualizado) => {
        console.log("Guardando curso:", cursoActualizado)
        setCursos(cursos.map((c) => (c.id === cursoActualizado.id ? cursoActualizado : c)))
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
                <div className={styles.filters}>
                    <select
                        className={styles.input}
                        value={filtros.universidadId}
                        onChange={(e) => handleFiltroChange('universidadId', e.target.value)}
                    >
                        <option value="">-- Todas las Universidades --</option>
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
                        <option value="">-- Todas las Facultades --</option>
                        {facultades.map(fac => (
                            <option key={fac.id_facultad} value={fac.id_facultad}>{fac.nombre}</option>
                        ))}
                    </select>
                    <select className={styles.input} disabled>
                        <option>-- Filtrar por Curso --</option>
                    </select>
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
                        {cursos.map((curso) => (
                            <div key={curso.id_curso} className={styles.courseCard}>
                                <h3 className={styles.courseTitle}>{curso.nombre_curso}</h3>
                                <p className={styles.courseInfo}>
                                    {curso.nombre_universidad || 'N/A'} - {curso.nombre_facultad || 'N/A'}
                                </p>
                                <p className={styles.courseInfo}>Carrera: {curso.nombre_carrera || 'No especificada'}</p>
                                <div className={styles.courseStats}>
                                    <span>Umbral: {curso.umbral_aprobatorio ?? 'N/A'}%</span>
                                </div>
                                <button onClick={() => setCursoSeleccionado(curso)} className={styles.buttonPrimary}>
                                    Configurar Calificación
                                </button>
                            </div>
                        ))}
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