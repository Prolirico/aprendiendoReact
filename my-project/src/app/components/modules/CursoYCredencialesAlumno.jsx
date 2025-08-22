"use client"

import { useState, useEffect, useCallback } from "react"
import CursoCard from "../controls/CursoCard"
import CredencialCard from "../controls/CredencialCard" // 1. Importar CredencialCard
import CursoModal from "../modals/CursoModal"
import CredencialModal from "../modals/CredencialModal" // 2. Importar CredencialModal
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
    const [selectedCredencial, setSelectedCredencial] = useState(null) // 3. Estado para el modal de credencial
    const [isModalLoading, setIsModalLoading] = useState(false);

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

    // Funciones para manejar la visibilidad del modal de credenciales
    const handleVerMasCredencial = async (credencial) => {
        setIsModalLoading(true);
        // Establecemos la credencial básica para que el modal se abra inmediatamente con el título.
        setSelectedCredencial(credencial);
        try {
            const res = await fetch(`http://localhost:5000/api/credenciales/${credencial.id_credencial}`);
            if (!res.ok) {
                throw new Error('Error al cargar los detalles de la credencial');
            }
            const fullCredencialData = await res.json();
            setSelectedCredencial(fullCredencialData); // Reemplazamos con los datos completos.
        } catch (error) {
            console.error(error);
            handleCloseCredencialModal(); // Cerramos el modal si hay un error.
        } finally {
            setIsModalLoading(false);
        }
    }

    const handleCloseCredencialModal = () => {
        setSelectedCredencial(null)
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
            const universidadNombre = item.nombre_universidad || item.universidad;
            const estatusItem = item.estatus_curso || item.estatus_inscripcion || item.estatus

            const universidadMatch =
                filters.universidades.length === 0 || filters.universidades.includes(universidadNombre)
            const estatusMatch = filters.estatus.length === 0 || filters.estatus.includes(estatusItem);

            // Si no hay filtro de categoría, solo evaluamos los otros filtros.
            if (filters.categorias.length === 0) {
                return universidadMatch && estatusMatch;
            }

            // Lógica de filtrado de categoría
            let categoriaMatch = false;
            if (item.nombre_curso) { // Es un curso
                categoriaMatch = filters.categorias.includes(item.nombre_categoria);
            } else if (item.nombre_credencial) { // Es una credencial
                // Verificamos si alguna de las categorías de la credencial está en los filtros seleccionados.
                const credencialCategorias = item.categorias || [];
                categoriaMatch = credencialCategorias.some(cat => filters.categorias.includes(cat));
            }

            return universidadMatch && estatusMatch && categoriaMatch;
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
                    {items.map((item) => (
                        <label key={item.id_universidad || item.id_categoria || item} className={styles.checkboxLabel}>
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
                                filteredCredenciales.map((credencial, index) => (
                                    <CredencialCard
                                        key={`${credencial.id_certificacion}-${index}`}
                                        credencial={credencial}
                                        onVerMas={handleVerMasCredencial}
                                    />
                                ))
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

                {/* 5. Renderizar el modal de credencial */}
                {selectedCredencial && (
                    <CredencialModal
                        credencial={selectedCredencial}
                        onClose={handleCloseCredencialModal}
                        isLoading={isModalLoading}
                    />
                )}
            </div>
        </div>
    )
}

export default CursoYCredencialesAlumno
