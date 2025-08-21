import React, { useEffect } from 'react';
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

const CursoModal = ({ curso, onClose, onSolicitar }) => {
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
                    <button className={styles.solicitarBtn} onClick={() => onSolicitar(curso.id_curso)}>
                        Solicitar MicroCredencial
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CursoModal;