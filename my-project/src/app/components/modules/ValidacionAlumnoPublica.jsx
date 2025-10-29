// src/app/components/modules/ValidacionAlumnoPublica.jsx
import React, { useState, useEffect } from 'react';
import styles from './ValidacionAlumnoPublica.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSearch, faCalendarAlt, faFilePdf, faFileAlt } from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ValidacionAlumnoPublica = () => {
    const [universidades, setUniversidades] = useState([]);
    const [selectedUniversidad, setSelectedUniversidad] = useState('');
    const [matricula, setMatricula] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingUniversidades, setIsLoadingUniversidades] = useState(true);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);

    // Load universities when component mounts
    useEffect(() => {
        const fetchUniversidades = async () => {
            try {
                setIsLoadingUniversidades(true);
                // Corregida: Quita /api si backend monta en /api/universidades; ajusta si proxy
                const response = await fetch(`${API_BASE_URL}/universidades`);  // <--- Cambio clave: quita /api

                if (!response.ok) {
                    throw new Error('Error al cargar las universidades');
                }

                const data = await response.json();
                // Asegúrate de que el backend devuelve un array en `data.universities`
                setUniversidades(data.universities || []);
            } catch (error) {
                console.error('Error fetching universities:', error);
                setError('Error al cargar la lista de universidades. Por favor, recarga la página.');
            } finally {
                setIsLoadingUniversidades(false);
            }
        };

        fetchUniversidades();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            console.log('Enviando solicitud con:', { selectedUniversidad, matricula });
            const response = await fetch(
                `${API_BASE_URL}/public/student-status?universityId=${selectedUniversidad}&studentId=${matricula}`
            );

            const data = await response.json();
            console.log('Respuesta del servidor:', data);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('No se encontraron resultados para la matrícula y universidad proporcionadas. Por favor, verifica los datos e inténtalo de nuevo.');
                }
                throw new Error(data.error || 'Error al buscar la información del estudiante.');
            }

            setResults(data);
        } catch (error) {
            console.error('Error en handleSubmit:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setResults(null);
        setError(null);
        setSelectedUniversidad('');
        setMatricula('');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Fecha no disponible';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    return (
        <div className={styles.validationCard}>
            {!results ? (
                <>
                    <h2 className={styles.cardTitle}>Validación de Certificados y Constancias</h2>

                    {error && (
                        <div className={`${styles.alert} ${styles.alertDanger}`}>
                            {error}
                        </div>
                    )}

                    {isLoadingUniversidades ? (
                        <div className={styles.textCenter}>
                            <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
                            <p>Cargando universidades...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label htmlFor="universidad" className={styles.formLabel}>Universidad</label>
                                <select
                                    id="universidad"
                                    className={styles.formControl}
                                    value={selectedUniversidad}
                                    onChange={(e) => setSelectedUniversidad(e.target.value)}
                                    required
                                >
                                    <option value="">Selecciona una universidad</option>
                                    {universidades.map((uni) => (
                                        <option key={uni.id_universidad} value={uni.id_universidad}>
                                            {uni.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="matricula" className={styles.formLabel}>Matrícula</label>
                                <input
                                    type="text"
                                    id="matricula"
                                    className={styles.formControl}
                                    value={matricula}
                                    onChange={(e) => setMatricula(e.target.value)}
                                    placeholder="Ingresa la matrícula del alumno"
                                    required
                                />
                            </div>

                            <div className={`${styles.textCenter} ${styles.mt4}`}>
                                <button
                                    type="submit"
                                    className={`${styles.btn} ${styles.btnPrimary} ${styles.w100}`}
                                    disabled={!selectedUniversidad || !matricula || isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin className={styles.iconSpacing} />
                                            Buscando...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faSearch} className={styles.iconSpacing} />
                                            Buscar
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </>
            ) : (
                <div className={styles.resultsContainer}>
                    <div className={styles.resultsHeader}>
                        <h2 className={styles.resultsTitle}>{results.studentName || 'Nombre no disponible'}</h2>
                        <div className={styles.resultsSubtitle}>{results.universityName || 'Universidad no disponible'}</div>
                    </div>

                    <h3 className={styles.mb2}>Cursos Completados</h3>

                    {results.completedCourses && results.completedCourses.length > 0 ? (
                        <ul className={styles.courseList}>
                            {results.completedCourses.map((course, index) => (
                                <li key={index} className={styles.courseItem}>
                                    <div className={styles.courseName}>{course.courseName || 'Curso no disponible'}</div>
                                    <div className={styles.courseDate}>
                                        <FontAwesomeIcon icon={faCalendarAlt} className={styles.iconSpacing} />
                                        Completado el {formatDate(course.completionDate)}
                                    </div>
                                    <div className={styles.downloadButtons}>
                                        {course.certificateUrl && (
                                            <a
                                                href={course.certificateUrl}
                                                className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <FontAwesomeIcon icon={faFilePdf} className={styles.iconSpacing} />
                                                Descargar Certificado
                                            </a>
                                        )}

                                        {course.recordUrl && (
                                            <a
                                                href={course.recordUrl}
                                                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <FontAwesomeIcon icon={faFileAlt} className={styles.iconSpacing} />
                                                Descargar Constancia
                                            </a>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className={`${styles.alert} ${styles.alertInfo}`}>
                            El estudiante no tiene cursos completados registrados.
                        </div>
                    )}

                    <div className={`${styles.textCenter} ${styles.mt4}`}>
                        <button
                            onClick={resetForm}
                            className={`${styles.btn} ${styles.btnPrimary}`}
                        >
                            <FontAwesomeIcon icon={faSearch} className={styles.iconSpacing} />
                            Realizar otra consulta
                        </button>
                    </div>
                </div>
            )}

            <div className={`${styles.textCenter} ${styles.mt4} ${styles.footer}`}>
                Sistema de validación de certificados - 2025
            </div>
        </div>
    );
};

export default ValidacionAlumnoPublica;