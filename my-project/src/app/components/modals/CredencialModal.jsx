import React, { useEffect, useMemo } from 'react';
import styles from './CredencialModal.module.css';

const formatDate = (dateString) => {
    if (!dateString) return "No especificada";
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
};

const CredencialModal = ({ credencial, onClose, isLoading }) => {
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

    if (!credencial) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar modal">&times;</button>
                
                <h2 className={styles.modalTitle}>{credencial.nombre_certificacion}</h2>
                <p className={styles.modalSubtitle}>
                    Ofrecida por: <strong>{credencial.nombre_universidad}</strong>
                </p>

                <div className={styles.infoGrid}>
                    <p><strong>Facultad:</strong> {credencial.nombre_facultad || 'No aplica'}</p>
                    <p><strong>Categorías:</strong> {isLoading ? 'Cargando...' : categoriasDeCursos}</p>
                    <p><strong>Estatus:</strong> {credencial.estatus}</p>
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
                                {credencial.cursos.filter(curso => curso).map(curso => (
                                    <li key={curso.id_curso} className={styles.cursoItem}>
                                        <span className={styles.cursoNombre}>{curso.nombre_curso}</span>
                                        <span className={styles.cursoDuracion}>{curso.duracion_horas} hrs</span>
                                    </li>
                                ))}
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