"use client"

import { useState, useEffect, useCallback } from "react"
import CursoCard from "../controls/CursoCard"
import CredencialCard from "../controls/CredencialCard"
import CursoModal from "../modals/CursoModal"
import CredencialModal from "../modals/CredencialModal"
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
    const [inscripciones, setInscripciones] = useState([]); // Estado para las inscripciones del alumno

    // --- ESTADOS DE UI (CARGA Y ERRORES) ---
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // --- ESTADO PARA EL MODAL ---
    const [selectedCurso, setSelectedCurso] = useState(null)
    const [selectedCredencial, setSelectedCredencial] = useState(null)
    const [isModalLoading, setIsModalLoading] = useState(false);

    // Arrays de opciones de estatus dinámicos según la pestaña
    // Usamos los valores reales del backend para el filtrado
    const cursoStatusOptions = ["planificado", "abierto", "en_curso", "finalizado", "cancelado"];
    const credencialStatusOptions = ["activa", "inactiva"];

    // Función para formatear los estatus para mostrarlos en la UI
    const formatStatusLabel = (status) => {
        if (!status) return '';
        // Reemplaza guiones bajos y capitaliza la primera letra de cada palabra
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    // --- VINCULACIÓN CON API ---
    // Usamos useEffect para cargar todos los datos iniciales cuando el componente se monta.
    useEffect(() => {
        // Asumimos que el token se guarda en localStorage después del login
        const token = localStorage.getItem('token');

        const fetchAllData = async () => {
            // Envolvemos todo en un try/finally para asegurar que el loading se desactive
            try {
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                // 1. Peticiones de datos críticos (cursos, credenciales, etc.)
                // Estas peticiones deben funcionar para que la página se muestre.
                const [cursosRes, credencialesRes, universidadesRes, categoriasRes] = await Promise.all([
                    fetch("http://localhost:5000/api/cursos?exclude_assigned=false"),
                    fetch("http://localhost:5000/api/credenciales"), // Endpoint para credenciales del alumno
                    fetch("http://localhost:5000/api/universidades"),
                    fetch("http://localhost:5000/api/categorias/activas"), // Usamos el endpoint de categorías activas
                ]);

                // Verificamos que todas las respuestas sean exitosas
                if (!cursosRes.ok) throw new Error("Error al cargar cursos")
                if (!credencialesRes.ok) throw new Error("Error al cargar credenciales")
                if (!universidadesRes.ok) throw new Error("Error al cargar universidades")
                if (!categoriasRes.ok) throw new Error("Error al cargar categorías")

                const cursosData = await cursosRes.json()
                const credencialesData = await credencialesRes.json()
                const universidadesData = await universidadesRes.json()
                const categoriasData = await categoriasRes.json()

                // Actualizamos los estados críticos
                setCursos(cursosData.cursos || [])
                setCredenciales(credencialesData.credenciales || [])
                setUniversidades(universidadesData.universities || [])
                setCategorias(categoriasData)

                // 2. Petición de datos no críticos (inscripciones)
                // Si esta petición falla, la página principal seguirá funcionando.
                if (token) {
                    try {
                        const inscripcionesRes = await fetch("http://localhost:5000/api/inscripciones/alumno", { headers });
                        if (inscripcionesRes.ok) {
                            const inscripcionesData = await inscripcionesRes.json();
                            setInscripciones(inscripcionesData.inscripciones || []);
                        } else {
                            // No lanzamos un error que bloquee, solo lo mostramos en consola.
                            console.error("Advertencia: No se pudieron cargar las inscripciones del alumno. Estado:", inscripcionesRes.status);
                        }
                    } catch (inscError) {
                        console.error("Error al solicitar inscripciones:", inscError);
                    }
                }

            } catch (err) {
                setError(err.message) // Capturamos cualquier error
            } finally {
                setLoading(false) // Dejamos de cargar, ya sea con éxito o con error
            }
        }

        fetchAllData()
        // El array vacío [] significa que este efecto se ejecuta solo una vez
    }, []); // La dependencia vacía es correcta aquí

    // Limpiar filtros de estatus cuando cambia la pestaña activa
    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            estatus: []
        }))
    }, [activeTab])

    // --- FUNCIONES DE MANEJO DE ACCIONES ---

    // Placeholder para la lógica de solicitud de curso
    const handleSolicitarCurso = (idCurso) => {
        // Esta función ahora puede ser más robusta
        handleSolicitarInscripcion(idCurso);
    };

    // Nueva función unificada para manejar solicitudes de inscripción
    const handleSolicitarInscripcion = async (idCurso) => {
        console.log(`Solicitando inscripción al curso con ID: ${idCurso}`);
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Debes iniciar sesión para solicitar un curso.");
            throw new Error("Usuario no autenticado");
        }

        try {
            const response = await fetch('http://localhost:5000/api/inscripciones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id_curso: idCurso })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "No se pudo procesar la solicitud.");
            }

            setInscripciones(prev => [...prev, result.inscripcion]);
            alert("¡Solicitud enviada con éxito!");
        } catch (error) {
            alert(`Error: ${error.message}`);
            throw error; // Re-lanzamos el error para que el componente hijo sepa que falló
        }
    };

    // Funciones para manejar la visibilidad del modal
    const handleVerMas = (curso) => {
        setSelectedCurso(curso)
    }

    const handleCloseModal = () => {
        setSelectedCurso(null)
    }

    // Funciones para manejar la visibilidad del modal de credenciales
    const handleVerMasCredencial = async (item) => {
        setIsModalLoading(true);
        // El 'item' puede ser un objeto 'credencial' (desde CredencialCard)
        // o un objeto 'curso' (desde CursoModal)
        const credencialId = item.id_credencial || item.id_certificacion;
        const credencialName = item.nombre_credencial || item.nombre_certificacion || item.nombre;

        if (!credencialId) {
            console.error("No se encontró ID de credencial en el item:", item);
            setIsModalLoading(false);
            return;
        }

        // Cerramos el modal del curso si estuviera abierto para una mejor UX
        setSelectedCurso(null);
        // Abrimos el modal de la credencial con la información básica que ya tenemos para que se vea algo mientras carga
        setSelectedCredencial({ id_credencial: credencialId, nombre_certificacion: credencialName });

        try {
            const res = await fetch(`http://localhost:5000/api/credenciales/${credencialId}`);
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
        // Añadimos una guarda para asegurar que 'data' siempre sea un array.
        if (!Array.isArray(data) || data === null) {
            return []
        }
        return data.filter((item) => {
            const universidadNombre = item.nombre_universidad || item.universidad;

            const universidadMatch =
                filters.universidades.length === 0 || filters.universidades.includes(universidadNombre)
            
            // Lógica de filtrado de estatus simplificada
            const itemStatus = item.nombre_curso ? item.estatus_curso : item.estatus;
            const estatusMatch = filters.estatus.length === 0 || filters.estatus.includes(itemStatus);

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
                                // Para universidades es 'nombre', para categorías es 'nombre_categoria', y para estatus es el item mismo.
                                checked={filters[filterType].includes(item.nombre || item.nombre_categoria || item)}
                                onChange={() => handleFilterChange(filterType, item.nombre || item.nombre_categoria || item)}
                                className={styles.checkbox}
                            />
                            <span className={styles.checkboxText}>{item.nombre || item.nombre_categoria || formatStatusLabel(item)}</span>
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
                        title="Estado"
                        items={activeTab === "cursos" ? cursoStatusOptions : credencialStatusOptions}
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
                        onVerCredencial={handleVerMasCredencial}
                    />
                )}

                {/* Renderizar el modal de credencial */}
                {selectedCredencial && (
                    <CredencialModal
                        credencial={selectedCredencial}
                        onClose={handleCloseCredencialModal}
                        isLoading={isModalLoading}
                        onSolicitarCurso={handleSolicitarInscripcion}
                        inscripciones={inscripciones}
                    />
                )}
            </div>
        </div>
    )
}

export default CursoYCredencialesAlumno