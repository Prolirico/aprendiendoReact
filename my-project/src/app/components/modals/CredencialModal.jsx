import React, { useEffect, useMemo, useState } from 'react';
import styles from './CredencialModal.module.css';

const formatDate = (dateString) => {
    if (!dateString) return "No especificada";
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
};

const CredencialModal = ({ credencial, onClose, isLoading, onSolicitarCurso, inscripciones = [] }) => {
    const [solicitandoId, setSolicitandoId] = useState(null);

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const categoriasDeCursos = useMemo(() => {
        if (isLoading || !credencial || !credencial.cursos || credencial.cursos.length === 0) {
            return isLoading ? '' : 'No especificada';
        }

        const categorias = credencial.cursos
            .map(curso => curso.nombre_categoria)
            .filter(Boolean); // Filtra nulos o undefined

        if (categorias.length === 0) {
            return 'Sin categoría';
        }

        const categoriasUnicas = [...new Set(categorias)];
        return categoriasUnicas.join(', ');
    }, [credencial, isLoading]);

    const handleSolicitarClick = async (idCurso) => {
        if (window.confirm("¿Está seguro de querer inscribirse a este curso?")) {
            setSolicitandoId(idCurso);
            try {
                // La lógica de la API la maneja el componente padre.
                // Esto actualizará la prop 'inscripciones' y re-renderizará el modal.
                await onSolicitarCurso(idCurso);
            } catch (error) {
                // El componente padre debería mostrar un toast de error.
                console.error("Error al solicitar curso:", error);
            } finally {
                setSolicitandoId(null);
            }
        }
    };

    const formatStatusText = (estatus) => {
        if (!estatus) return 'No disponible';
        return estatus.replace(/_/g, ' ').charAt(0).toUpperCase() + estatus.slice(1).replace(/_/g, ' ');
    };

    const getStatusClass = (estatus) => {
        switch (estatus) {
            case 'solicitada': return styles.statusSolicitada;
            case 'aprobada': return styles.statusAprobada;
            case 'rechazada': return styles.statusRechazada;
            case 'completada': return styles.statusCompletada;
            case 'abandonada': return styles.statusAbandonada;
            default: return '';
        }
    };

    if (!credencial) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar modal">&times;</button>

                <h2 className={styles.modalTitle}>{credencial.nombre_credencial || credencial.nombre_certificacion || credencial.nombre}</h2>
                <p className={styles.modalSubtitle}>
                    Ofrecida por: <strong>{credencial.nombre_universidad || 'N/A'}</strong>
                </p>

                <div className={styles.infoGrid}>
                    <p><strong>Facultad:</strong> {credencial.nombre_facultad || 'No aplica'}</p>
                    <p><strong>Categorías:</strong> {isLoading ? 'Cargando...' : categoriasDeCursos}</p>
                    <p><strong>Estatus:</strong> <span style={{textTransform: 'capitalize'}}>{credencial.estatus}</span></p>
                    <p><strong>Fecha de creación:</strong> {formatDate(credencial.fecha_creacion)}</p>
                </div>

                {credencial.descripcion && (
                    <div className={styles.descriptionSection}>
                        <h3>Descripción de la Credencial</h3>
                        <p>{credencial.descripcion}</p>
                    </div>
                )}

                <div className={styles.cursosSection}>
                    <h3>Cursos en la Credencial</h3>
                    {isLoading ? (
                        <p>Cargando cursos...</p>
                    ) : (
                        credencial.cursos && credencial.cursos.length > 0 ? (
                            <ul className={styles.cursosList}>
                                {credencial.cursos.filter(curso => curso).map(curso => {
                                    const inscripcion = inscripciones.find(i => i.id_curso === curso.id_curso);
                                    const isCurrentRequest = solicitandoId === curso.id_curso;

                                    return (
                                        <li key={curso.id_curso} className={styles.cursoItem}>
                                            <span className={styles.cursoNombre}>{curso.nombre_curso}</span>
                                            {inscripcion ? (
                                                <span className={`${styles.cursoStatus} ${getStatusClass(inscripcion.estatus_inscripcion)}`}>
                                                    {formatStatusText(inscripcion.estatus_inscripcion)}
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSolicitarClick(curso.id_curso)}
                                                    className={styles.solicitarCursoBtn}
                                                    disabled={isCurrentRequest}
                                                >
                                                    {isCurrentRequest ? 'Solicitando...' : 'Solicitar'}
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p>No hay cursos asociados a esta credencial.</p>
                        )
                    )}
                </div>

            </div>
        </div>
    );
};

export default CredencialModal;