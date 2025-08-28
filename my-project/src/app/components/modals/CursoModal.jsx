import React, { useEffect, useState } from 'react';
import styles from './CursoModal.module.css';

// Reutilizamos las funciones de formato que estaban en la tarjeta
const formatDate = (dateString) => {
    if (!dateString) return "No especificada";
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
};

const getStatusChipClass = (estatus) => {
    const statusLower = estatus?.toLowerCase();
    switch (statusLower) {
        case 'activo':
        case 'en curso':
            return styles.chipActivo;
        case 'finalizado':
        case 'completado':
            return styles.chipFinalizado;
        case 'proximamente':
        case 'próximamente':
            return styles.chipProximamente;
        default:
            return styles.chipActivo;
    }
};

const formatStatusText = (estatus) => {
    if (estatus?.toLowerCase() === 'activo') return 'En Curso';
    return estatus || 'Sin estatus';
};

const CursoModal = ({ curso, onClose, onSolicitar, onVerCredencial, inscripciones = [] }) => {
    const [isSolicitando, setIsSolicitando] = useState(false);

    // Efecto para cerrar el modal con la tecla 'Escape'
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!curso) return null;

    // Buscamos si existe una inscripción para este curso en particular.
    const inscripcion = inscripciones.find(i => i.id_curso === curso.id_curso);

    const handleSolicitarClick = async () => {
        if (window.confirm("¿Está seguro de querer inscribirse a este curso?")) {
            setIsSolicitando(true);
            try {
                await onSolicitar(curso.id_curso);
                // El componente padre se encarga de mostrar la alerta de éxito y actualizar el estado global.
            } catch (error) {
                // El componente padre también maneja la alerta de error.
                console.error("Error al solicitar inscripción desde CursoModal:", error);
            } finally {
                setIsSolicitando(false);
            }
        }
    };

    // Función para obtener el texto y la clase del botón según el estado
    const getStatusInfo = (estatus) => {
        switch (estatus) {
            case 'solicitada':
                return { text: 'Solicitud Enviada', className: styles.statusSolicitada };
            case 'aprobada':
                return { text: 'Inscrito', className: styles.statusAprobada };
            case 'rechazada':
                return { text: 'Solicitud Rechazada', className: styles.statusRechazada };
            case 'completada':
                return { text: 'Curso Completado', className: styles.statusCompletada };
            case 'abandonada':
                return { text: 'Curso Abandonado', className: styles.statusAbandonada };
            default:
                return { text: 'Estatus Desconocido', className: styles.statusDefault };
        }
    };

    const renderFooterButton = () => {
        if (inscripcion) {
            const { text, className } = getStatusInfo(inscripcion.estatus_inscripcion);
            return (
                <button className={`${styles.solicitarBtn} ${className}`} disabled>
                    {text}
                </button>
            );
        }

        return (
            <button className={styles.solicitarBtn} onClick={handleSolicitarClick} disabled={isSolicitando}>
                {isSolicitando ? 'Enviando...' : 'Solicitar Inscripción'}
            </button>
        );
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>&times;</button>
                <h2 className={styles.modalTitle}>{curso.nombre_curso}</h2>
                
                <div className={styles.statusChip}>
                    <span className={`${styles.chip} ${getStatusChipClass(curso.estatus_curso)}`}>
                        {formatStatusText(curso.estatus_curso)}
                    </span>
                </div>

                <div className={styles.infoGrid}>
                    <p><strong>Universidad:</strong> {curso.nombre_universidad}</p>
                    <p><strong>Facultad:</strong> {curso.nombre_facultad || 'No aplica'}</p>
                    <p><strong>Nivel:</strong> <span style={{textTransform: 'capitalize'}}>{curso.nivel}</span></p>
                    <p><strong>Categoría:</strong> {curso.nombre_categoria || 'No especificada'}</p>
                    <p><strong>Duración:</strong> {curso.duracion_horas} horas</p>
                    <p><strong>Cupo:</strong> {curso.cupo_maximo} estudiantes</p>
                    <p><strong>Inicio:</strong> {formatDate(curso.fecha_inicio)}</p>
                    <p><strong>Fin:</strong> {formatDate(curso.fecha_fin)}</p>
                    <p>
                        <strong>Credencial:</strong>{' '}
                        {curso.id_credencial ? (
                            <button className={styles.linkButton} onClick={() => onVerCredencial(curso)}>
                                {curso.nombre_credencial}
                            </button>
                        ) : ( 'N/A' )}
                    </p>
                </div>

                {curso.descripcion && (
                    <div className={styles.descriptionSection}>
                        <h3>Descripción</h3>
                        <p>{curso.descripcion}</p>
                    </div>
                )}

                {curso.objetivos && <div className={styles.descriptionSection}><h3>Objetivos</h3><p>{curso.objetivos}</p></div>}
                {curso.prerequisitos && <div className={styles.descriptionSection}><h3>Prerrequisitos</h3><p>{curso.prerequisitos}</p></div>}

                <div className={styles.modalFooter}>
                    {renderFooterButton()}
                </div>
            </div>
        </div>
    );
};

export default CursoModal;