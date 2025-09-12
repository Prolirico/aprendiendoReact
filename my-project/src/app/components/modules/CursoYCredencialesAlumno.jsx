"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons"
import CursoCard from "../controls/CursoCard"
import CredencialCard from "../controls/CredencialCard"
import CursoModal from "../modals/CursoModal"
import CredencialModal from "../modals/CredencialModal"
import styles from "./CursoYCredencialesAlumno.module.css"

const CursoYCredencialesAlumno = ({ enConvocatoria = false, universidadesConvocatoria = [], universidadAlumno = null }) => {
    // Estados para pestañas
    const [activeTab, setActiveTab] = useState("cursos")

    // Estados para filtros
    const [filters, setFilters] = useState({
        universidades: [],
        categorias: [],
        estatus: [],
        estatusInscripcion: [], // Nuevo filtro para estatus de inscripción
        modalidad: [],
        searchTerm: "", // Para la barra de búsqueda
    })

    // Estados para controlar qué secciones están expandidas
    const [expandedSections, setExpandedSections] = useState({
        universidades: false,
        categorias: false,
        estatus: false,
        estatusInscripcion: false, // Nueva sección expandible
        modalidad: false,
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
    const inscripcionStatusOptions = ["solicitada", "aprobada", "rechazada", "completada", "abandonada", "lista de espera", "baja por el sistema"];
    const modalidadOptions = ["presencial", "mixto", "virtual"];

    const formatModalidadLabel = (modalidad) => {
        if (!modalidad) return '';
        switch (modalidad) {
            case 'presencial':
                return 'Presencial';
            case 'mixto':
                return 'SemiPresencial/Mixto';
            case 'virtual':
                return 'Virtual';
            default: return modalidad.charAt(0).toUpperCase() + modalidad.slice(1);
        }
    };

    // Función para formatear los estatus para mostrarlos en la UI
    const formatStatusLabel = (status) => {
        if (!status) return '';
        // Reemplaza guiones bajos y capitaliza la primera letra de cada palabra
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const activeCredentialIdsByInscription = useMemo(() => {
        if (filters.estatusInscripcion.length === 0) {
            return null; // No hay filtro aplicado, no filtrar por esto.
        }

        // 1. Obtener los IDs de los cursos que coinciden con el filtro de inscripción
        const filteredCourseIds = new Set(
            inscripciones
                .filter(insc => filters.estatusInscripcion.includes(insc.estatus_inscripcion))
                .map(insc => insc.id_curso)
        );

        // 2. Encontrar a qué credenciales pertenecen esos cursos
        const credentialIds = new Set();
        cursos.forEach(curso => {
            if (filteredCourseIds.has(curso.id_curso) && curso.id_credencial) {
                credentialIds.add(curso.id_credencial);
            }
        });

        return credentialIds;
    }, [filters.estatusInscripcion, inscripciones, cursos]);

    const activeCredentialIdsByModalidad = useMemo(() => {
        // Si no hay filtro de modalidad, no hacemos nada y no se filtra por esto.
        if (filters.modalidad.length === 0) {
            return null;
        }

        // 1. Obtener los IDs de las credenciales a partir de los cursos que coinciden con el filtro.
        const credentialIds = new Set();
        cursos
            .filter(curso => curso && filters.modalidad.includes(curso.modalidad))
            .forEach(curso => {
                if (curso.id_credencial) {
                    credentialIds.add(curso.id_credencial);
                }
            });

        return credentialIds;
    }, [filters.modalidad, cursos]);
    
    // --- VINCULACIÓN CON API ---
    // Usamos useEffect para cargar todos los datos iniciales cuando el componente se monta.
    useEffect(() => {
        // Asumimos que el token se guarda en localStorage después del login
        const token = localStorage.getItem('token');

        const fetchAllData = async () => {
            // Envolvemos todo en un try/finally para asegurar que el loading se desactive
            try {
                setLoading(true); // Iniciar carga
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                let cursosUrl = "http://localhost:5000/api/cursos?exclude_assigned=false";
                let credencialesUrl = "http://localhost:5000/api/credenciales";
                let fetchUniversidadesPromise;

                if (enConvocatoria && universidadesConvocatoria.length > 0) {
                    const uniIds = universidadesConvocatoria.map(u => u.id_universidad).join(',');
                    cursosUrl += `&universidades=${uniIds}`;
                    credencialesUrl += `?universidades=${uniIds}`;
                    // Si estamos en convocatoria, usamos las universidades de la prop y no las fetcheamos
                    setUniversidades(universidadesConvocatoria); // Seteamos directamente las universidades
                    fetchUniversidadesPromise = Promise.resolve({ ok: true, json: () => Promise.resolve({ universities: [] }) }); // Evitamos el fetch
                } else if (universidadAlumno) {
                    // Si NO estamos en convocatoria, filtramos por la universidad del alumno.
                    cursosUrl += `&universidades=${universidadAlumno.id_universidad}`;
                    credencialesUrl += `?universidades=${universidadAlumno.id_universidad}`;
                    fetchUniversidadesPromise = fetch("http://localhost:5000/api/universidades");
                } else {
                    // En modo normal, fetcheamos todas las universidades (el backend debería filtrar por la del alumno si es necesario)
                    fetchUniversidadesPromise = fetch("http://localhost:5000/api/universidades");
                }

                // 1. Peticiones de datos críticos (cursos, credenciales, etc.)
                // Estas peticiones deben funcionar para que la página se muestre.
                const [cursosRes, credencialesRes, universidadesRes, categoriasRes] = await Promise.all([
                    fetch(cursosUrl),
                    fetch(credencialesUrl),
                    fetchUniversidadesPromise,
                    fetch("http://localhost:5000/api/categorias/activas"), // Usamos el endpoint de categorías activas
                ]);

                // Verificamos que todas las respuestas sean exitosas
                if (!cursosRes.ok) throw new Error("Error al cargar cursos")
                if (!universidadesRes.ok) throw new Error("Error al cargar universidades")
                if (!categoriasRes.ok) throw new Error("Error al cargar categorías")

                const cursosData = await cursosRes.json()
                const universidadesData = await universidadesRes.json()
                const categoriasData = await categoriasRes.json()

                // Actualizamos los estados críticos
                setCursos(cursosData.cursos || [])
                if (credencialesRes.ok) {
                    // Leemos el JSON de credenciales UNA SOLA VEZ aquí
                    const credencialesData = await credencialesRes.json();
                    setCredenciales(credencialesData.credenciales || credencialesData || []);
                } else {
                    setCredenciales([]); // Si falla, inicializamos como vacío
                }
                // Solo seteamos universidades si no estamos en modo convocatoria (ya se setearon antes)
                if (!enConvocatoria) {
                    setUniversidades(universidadesData.universities || []);
                }
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
    }, [enConvocatoria, universidadesConvocatoria, universidadAlumno]); // Se ejecuta cuando cambia el modo convocatoria o el alumno

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

    // Función para manejar el cambio en la barra de búsqueda
    const handleSearchChange = (e) => {
        setFilters(prev => ({
            ...prev,
            searchTerm: e.target.value,
        }));
    };

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
            estatusInscripcion: [],
            modalidad: [],
            searchTerm: ""
        });
    };

    // Función para obtener el estatus de inscripción de un item
    const getInscripcionStatus = useCallback((itemId) => {
        if (!inscripciones || inscripciones.length === 0) return null;
        
        // Para cursos, buscamos directamente en las inscripciones
        const inscripcion = inscripciones.find(insc => insc.id_curso === itemId);
        return inscripcion ? inscripcion.estatus_inscripcion : null;
    }, [inscripciones]);

    // Función para filtrar datos
    const filterData = useCallback((data) => {
        // Añadimos una guarda para asegurar que 'data' siempre sea un array.
        if (!Array.isArray(data) || data === null) {
            return []
        }
        return data.filter((item) => {
            // Filtro por término de búsqueda
            const searchTermMatch =
                filters.searchTerm.trim() === '' ||
                (item.nombre_curso || item.nombre_credencial || '')
                    .toLowerCase()
                    .includes(filters.searchTerm.toLowerCase());

            const universidadNombre = item.nombre_universidad || item.universidad;
            const universidadMatch =
                filters.universidades.length === 0 || filters.universidades.includes(universidadNombre)
            
            // Lógica de filtrado de estatus simplificada
            const itemStatus = item.nombre_curso ? item.estatus_curso : item.estatus;
            const estatusMatch = filters.estatus.length === 0 || filters.estatus.includes(itemStatus);
            
            // Nuevo filtro de estatus de inscripción
            let estatusInscripcionMatch = true;
            // Solo aplicamos el filtro de inscripción si hay alguno seleccionado
            if (activeCredentialIdsByInscription) {
                const isCredencial = !item.nombre_curso; // Si no tiene nombre_curso, es una credencial
                if (isCredencial) {
                    // Para una credencial, vemos si su ID está en el conjunto pre-calculado
                    estatusInscripcionMatch = activeCredentialIdsByInscription.has(item.id_credencial || item.id_certificacion);
                } else {
                    // Para un curso, revisamos su estatus de inscripción individual
                    const inscripcionStatus = getInscripcionStatus(item.id_curso);
                    if (inscripcionStatus) {
                        estatusInscripcionMatch = filters.estatusInscripcion.includes(inscripcionStatus);
                    } else {
                        // Si un curso no tiene inscripción, no debe coincidir con ningún filtro de estatus
                        estatusInscripcionMatch = false;
                    }
                }
            }

            // Lógica de filtrado de modalidad (corregida)
            const modalidadMatch =
                filters.modalidad.length === 0 || // Si no hay filtro, todo coincide
                (item.nombre_curso && filters.modalidad.includes(item.modalidad)) || // Si es un curso, se filtra por su modalidad
                (!!item.nombre_credencial && activeCredentialIdsByModalidad?.has(item.id_credencial || item.id_certificacion)); // Si es una credencial, se usa la lista pre-calculada
            
            // Si no hay filtro de categoría, solo evaluamos los otros filtros.
            if (filters.categorias.length === 0) {
                return searchTermMatch && universidadMatch && estatusMatch && estatusInscripcionMatch && modalidadMatch;
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

            return searchTermMatch && universidadMatch && estatusMatch && categoriaMatch && estatusInscripcionMatch && modalidadMatch;
        })
    }, [filters, getInscripcionStatus, activeCredentialIdsByInscription, activeCredentialIdsByModalidad])

    const filteredCursos = filterData(cursos)
    const filteredCredenciales = filterData(credenciales)

    // Componente para renderizar filtros
    const FilterSection = ({ title, items, filterType, isExpanded, onToggle, formatLabel = formatStatusLabel }) => {
        const getUniqueKey = (item) => {
            // Prefijo para evitar colisiones entre diferentes tipos de filtros (ej. id 1 de categoría y id 1 de universidad)
            return `${filterType}-${item.id_universidad || item.id_categoria || item}`;
        };

        const getValue = (item) => {
            // El valor que se guarda en el estado de filtros
            return item.nombre || item.nombre_categoria || item;
        };

        const getLabel = (item) => {
            // El texto que se muestra al usuario
            return item.nombre || item.nombre_categoria || formatLabel(item);
        };

        return (
            <div className={styles.filterSection}>
            <button className={styles.filterHeader} onClick={() => onToggle(filterType)}>
                <span>{title}</span>
                <span className={`${styles.arrow} ${isExpanded ? styles.expanded : ""}`}>▼</span>
            </button>
            {isExpanded && (
                <div className={styles.filterOptions}>
                    {items.map((item) => {
                        const value = getValue(item);
                        return (
                            <label key={getUniqueKey(item)} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={filters[filterType].includes(value)}
                                    onChange={() => handleFilterChange(filterType, value)}
                                    className={styles.checkbox}
                                />
                                <span className={styles.checkboxText}>{getLabel(item)}</span>
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
        );
    }

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
                    {/* El filtro de universidades solo aparece si estamos en convocatoria y hay más de una */}
                    {enConvocatoria && universidades.length > 1 && (
                        <FilterSection
                            title="Universidades"
                            items={universidades} // Ya poblado con las de la convocatoria
                            filterType="universidades"
                            isExpanded={expandedSections.universidades}
                            onToggle={toggleSection}
                        />
                    )}

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

                    <FilterSection
                        title="Estatus Inscripción"
                        items={inscripcionStatusOptions}
                        filterType="estatusInscripcion"
                        isExpanded={expandedSections.estatusInscripcion}
                        onToggle={toggleSection}
                    />
                    <FilterSection
                        title="Modalidad"
                        items={modalidadOptions}
                        filterType="modalidad"
                        isExpanded={expandedSections.modalidad}
                        onToggle={toggleSection}
                        formatLabel={formatModalidadLabel}
                    />
                </div>
            </div>

            {/* Contenido principal */}
            <div className={styles.mainContent}>
                {/* Pestañas */}
                <div className={styles.tabsContainer}>
                    <div className={styles.tabButtons}>
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
                    <div className={styles.searchBarContainer}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            className={styles.searchInput}
                            value={filters.searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
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
                        inscripciones={inscripciones}
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
