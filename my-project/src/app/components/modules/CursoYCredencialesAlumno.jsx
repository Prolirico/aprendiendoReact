"use client"

import { useState, useEffect, useCallback } from "react"
import CursoCard from "../controls/CursoCard"
import CursoModal from "../modals/CursoModal" // Importamos el nuevo modal
import styles from "./CursoYCredencialesAlumno.module.css"

const CursoYCredencialesAlumno = () => {
    // Estados para pestañas
    const [activeTab, setActiveTab] = useState("cursos")

    // Estados para filtros
    const [filters, setFilters] = useState({
        universidades: [],
        categorias: [],
        estatus: [],
    })

    // Estados para controlar qué secciones están expandidas
    const [expandedSections, setExpandedSections] = useState({
        universidades: false,
        categorias: false,
        estatus: false,
    })

    // --- ESTADOS PARA DATOS DE LA API ---
    const [cursos, setCursos] = useState([])
    const [credenciales, setCredenciales] = useState([])
    const [universidades, setUniversidades] = useState([])
    const [categorias, setCategorias] = useState([])

    // --- ESTADOS DE UI (CARGA Y ERRORES) ---
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // --- ESTADO PARA EL MODAL ---
    const [selectedCurso, setSelectedCurso] = useState(null)

    const estatusOptions = ["Activo", "Inactivo", "Finalizado"]

    // --- VINCULACIÓN CON API ---
    // Usamos useEffect para cargar todos los datos iniciales cuando el componente se monta.
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Usamos Promise.all para realizar todas las peticiones en paralelo
                const [cursosRes, credencialesRes, universidadesRes, categoriasRes] = await Promise.all([
                    fetch("http://localhost:5000/api/cursos?exclude_assigned=false"), // <-- ¡Añadimos el parámetro aquí!
                    fetch("http://localhost:5000/api/credenciales"), // Endpoint para credenciales del alumno
                    fetch("http://localhost:5000/api/universidades"),
                    fetch("http://localhost:5000/api/categorias/activas"), // Usamos el endpoint de categorías activas
                ])

                // Verificamos que todas las respuestas sean exitosas
                if (!cursosRes.ok) throw new Error("Error al cargar cursos")
                if (!credencialesRes.ok) throw new Error("Error al cargar credenciales")
                if (!universidadesRes.ok) throw new Error("Error al cargar universidades")
                if (!categoriasRes.ok) throw new Error("Error al cargar categorías")

                const cursosData = await cursosRes.json()
                const credencialesData = await credencialesRes.json() // Asumimos que también devuelve un objeto
                const universidadesData = await universidadesRes.json() // Asumimos que también devuelve un objeto
                const categoriasData = await categoriasRes.json()

                // Actualizamos todos los estados con los datos de la API
                // **SOLUCIÓN 1: Accedemos a la propiedad correcta del objeto de la API**
                setCursos(cursosData.cursos || [])
                setCredenciales(credencialesData.credenciales || [])
                setUniversidades(universidadesData.universities || [])
                setCategorias(categoriasData)

            } catch (err) {
                setError(err.message) // Capturamos cualquier error
            } finally {
                setLoading(false) // Dejamos de cargar, ya sea con éxito o con error
            }
        }

        fetchAllData()
        // El array vacío [] significa que este efecto se ejecuta solo una vez
    }, [])

    // --- FUNCIONES DE MANEJO DE ACCIONES ---

    // Placeholder para la lógica de solicitud de curso
    const handleSolicitarCurso = (idCurso) => {
        console.log(`El alumno está solicitando el curso con ID: ${idCurso}`)
        // Aquí iría la lógica para llamar a la API POST para inscribir al alumno
        // por ejemplo: fetch(`/api/inscripciones`, { method: 'POST', body: JSON.stringify({ id_curso: idCurso }) })
        alert(`Solicitud para el curso ${idCurso} enviada.`)
    }

    // Funciones para manejar la visibilidad del modal
    const handleVerMas = (curso) => {
        setSelectedCurso(curso)
    }

    const handleCloseModal = () => {
        setSelectedCurso(null)
    }

    // Función para alternar secciones expandidas
    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }))
    }

    // Función para manejar cambios en filtros
    const handleFilterChange = (filterType, value) => {
        setFilters((prev) => ({
            ...prev,
            [filterType]: prev[filterType].includes(value)
                ? prev[filterType].filter((item) => item !== value)
                : [...prev[filterType], value],
        }))
    }

    // Función para limpiar filtros
    const clearFilters = () => {
        setFilters({
            universidades: [],
            categorias: [],
            estatus: [],
        })
    }

    // Función para filtrar datos
    const filterData = useCallback((data) => {
        // --- SOLUCIÓN AL ERROR ---
        // Añadimos una guarda para asegurar que 'data' siempre sea un array.
        // Si la API devuelve algo que no es un array, evitamos el error.
        if (!Array.isArray(data) || data === null) {
            return [] // Devolvemos un array vacío para prevenir el crash.
        }
        return data.filter((item) => {
            // Adaptamos el filtro a la estructura de datos de la API
            // **SOLUCIÓN 2: Usamos la propiedad aplanada que viene de la API**
            const universidadNombre = item.nombre_universidad || item.universidad
            const categoriaNombre = item.categoria?.nombre_categoria || item.categoria
            const estatusItem = item.estatus_curso || item.estatus_inscripcion || item.estatus

            const universidadMatch =
                filters.universidades.length === 0 || filters.universidades.includes(universidadNombre)
            const categoriaMatch = filters.categorias.length === 0 || filters.categorias.includes(categoriaNombre)
            const estatusMatch = filters.estatus.length === 0 || filters.estatus.includes(estatusItem)

            return universidadMatch && categoriaMatch && estatusMatch
        })
    }, [filters])

    const filteredCursos = filterData(cursos)
    const filteredCredenciales = filterData(credenciales)

    // Componente para renderizar filtros
    const FilterSection = ({ title, items, filterType, isExpanded, onToggle }) => (
        <div className={styles.filterSection}>
            <button className={styles.filterHeader} onClick={() => onToggle(filterType)}>
                <span>{title}</span>
                <span className={`${styles.arrow} ${isExpanded ? styles.expanded : ""}`}>▼</span>
            </button>
            {isExpanded && (
                <div className={styles.filterOptions}>
                    {items.map((item, index) => (
                        <label key={index} className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                // El nombre de la propiedad puede ser 'nombre' (universidad) o 'nombre_categoria'
                                checked={filters[filterType].includes(item.nombre_universidad || item.nombre_categoria || item)}
                                onChange={() => handleFilterChange(filterType, item.nombre_universidad || item.nombre_categoria || item)}
                                className={styles.checkbox}
                            />
                            <span className={styles.checkboxText}>{item.nombre_universidad || item.nombre_categoria || item}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    )

    // Función auxiliar para formatear fechas
    const formatDate = (dateString) => {
        if (!dateString) return "No especificada"
        const options = { year: 'numeric', month: 'long', day: 'numeric' }
        return new Date(dateString).toLocaleDateString('es-ES', options)
    }

    // Componente para tarjetas de credencial
    const CredencialCard = ({ credencial }) => (
        <div className={styles.card}>
            <div className={styles.cardImage}>
                {/* Usamos una imagen por defecto y los campos correctos de la API */}
                <img src={credencial.imagen_url || "/assets/google_signin.png"} alt={credencial.nombre_credencial} className={styles.image} />
            </div>
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{credencial.nombre_credencial || "Credencial sin nombre"}</h3>
                <span className={`${styles.status} ${styles[credencial.estatus_inscripcion?.toLowerCase()]}`}>{credencial.estatus_inscripcion}</span>
            </div>
            <div className={styles.cardContent}>
                <p className={styles.cardInfo}>
                    <strong>Universidad:</strong> {credencial.nombre_universidad || "No disponible"}
                </p>
                <p className={styles.cardInfo}>
                    {/* Asumimos que la credencial está ligada a un curso */}
                    <strong>Curso:</strong> {credencial.nombre_curso || "No especificado"}
                </p>
                <p className={styles.cardInfo}>
                    <strong>Obtenida el:</strong> {formatDate(credencial.fecha_emision)}
                </p>
                <p className={styles.cardInfo}>
                    <strong>Válida hasta:</strong> {formatDate(credencial.fecha_vencimiento) || "No aplica"}
                </p>
            </div>
        </div>
    )

    return (
        <div className={styles.container}>
            {/* Panel de filtros lateral */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2>Filtros</h2>
                    <button onClick={clearFilters} className={styles.clearButton}>
                        Limpiar filtros
                    </button>
                </div>

                <div className={styles.filtersContainer}>
                    <FilterSection
                        title="Universidades"
                        items={universidades}
                        filterType="universidades"
                        isExpanded={expandedSections.universidades}
                        onToggle={toggleSection}
                    />

                    <FilterSection
                        title="Categorías"
                        items={categorias}
                        filterType="categorias"
                        isExpanded={expandedSections.categorias}
                        onToggle={toggleSection}
                    />

                    <FilterSection
                        title="Estatus"
                        items={estatusOptions}
                        filterType="estatus"
                        isExpanded={expandedSections.estatus}
                        onToggle={toggleSection}
                    />
                </div>
            </div>

            {/* Contenido principal */}
            <div className={styles.mainContent}>
                {/* Pestañas */}
                <div className={styles.tabsContainer}>
                    <button
                        className={`${styles.tab} ${activeTab === "cursos" ? styles.activeTab : ""}`}
                        onClick={() => setActiveTab("cursos")}
                    >
                        Cursos ({filteredCursos.length})
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === "credenciales" ? styles.activeTab : ""}`}
                        onClick={() => setActiveTab("credenciales")}
                    >
                        Credenciales ({filteredCredenciales.length})
                    </button>
                </div>

                {/* Contenido de las pestañas */}
                <div className={styles.tabContent}>
                    {/* --- PASO 0: MANEJO DE ESTADOS DE CARGA Y ERROR --- */}
                    {loading && <div className={styles.loadingState}>Cargando...</div>}
                    {error && <div className={styles.errorState}>Error: {error}</div>}

                    {activeTab === "cursos" && (
                        <div className={styles.cardsGrid}>
                            {!loading && !error && (
                                <>
                                    {filteredCursos.length > 0 ? (
                                        filteredCursos.map((curso) => (
                                            <CursoCard
                                                key={curso.id_curso}
                                                curso={curso}
                                                onVerMas={handleVerMas}
                                            />
                                        ))
                                    ) : (
                                        <div className={styles.noResults}>No se encontraron cursos con los filtros seleccionados.</div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === "credenciales" && (
                        <div className={styles.cardsGrid}>
                            {!loading && !error && filteredCredenciales.length > 0 ? (
                                filteredCredenciales.map((credencial) => <CredencialCard key={credencial.id_credencial || credencial.id} credencial={credencial} />)
                            ) : !loading && !error ? (
                                <div className={styles.noResults}>No tienes credenciales para mostrar.</div>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Renderizamos el modal si hay un curso seleccionado */}
                {selectedCurso && (
                    <CursoModal 
                        curso={selectedCurso}
                        onClose={handleCloseModal}
                        onSolicitar={handleSolicitarCurso}
                    />
                )}
            </div>
        </div>
    )
}

export default CursoYCredencialesAlumno
