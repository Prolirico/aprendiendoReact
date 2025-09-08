import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import styles from './GestionUnidades.module.css';

const API_URL = 'http://localhost:5000/api/unidades';

const initialUnidadState = {
    id_unidad: null,
    nombre_unidad: '',
    descripcion_unidad: '',
};

function GestionUnidades({ cursoId }) {
    const [unidades, setUnidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formState, setFormState] = useState(initialUnidadState);

    const fetchUnidades = useCallback(async () => {
        if (!cursoId) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/curso/${cursoId}`);
            if (!response.ok) throw new Error('Error al cargar las unidades.');
            const data = await response.json();
            setUnidades(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [cursoId]);

    useEffect(() => {
        fetchUnidades();
    }, [fetchUnidades]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenForm = (unidad = null) => {
        if (unidad) {
            setIsEditing(true);
            setFormState({ ...unidad });
        } else {
            setIsEditing(false);
            setFormState(initialUnidadState);
        }
        setIsFormVisible(true);
    };

    const handleCloseForm = () => {
        setIsFormVisible(false);
        setIsEditing(false);
        setFormState(initialUnidadState);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${API_URL}/${formState.id_unidad}` : API_URL;
        
        const body = { ...formState, id_curso: cursoId };

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Ocurrió un error.');
            }
            fetchUnidades();
            handleCloseForm();
        } catch (err) {
            console.error("Error al guardar la unidad:", err);
            setError(err.message);
        }
    };

    const handleDelete = async (id_unidad) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta unidad?')) {
            try {
                const response = await fetch(`${API_URL}/${id_unidad}`, { method: 'DELETE' });
                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error || 'Ocurrió un error.');
                }
                fetchUnidades();
            } catch (err) {
                console.error("Error al eliminar la unidad:", err);
                setError(err.message);
            }
        }
    };

    return (
        <div className={styles.gestionContainer}>
            <h4>Gestión de Unidades del Curso</h4>
            {loading && <p>Cargando unidades...</p>}
            {error && <p className={styles.errorText}>{error}</p>}
            
            {!loading && unidades.length === 0 && !isFormVisible && (
                <div className={styles.emptyState}><p>Este curso aún no tiene unidades temáticas definidas.</p></div>
            )}

            <ul className={styles.unidadesList}>
                {unidades.map((u) => (
                    <li key={u.id_unidad} className={styles.unidadItem}>
                        <div className={styles.unidadInfo}>
                            <span className={styles.unidadOrden}>{u.orden + 1}.</span>
                            <span className={styles.unidadNombre}>{u.nombre_unidad}</span>
                        </div>
                        <div className={styles.unidadActions}>
                            <button onClick={() => handleOpenForm(u)} className={styles.actionButton} title="Editar"><FontAwesomeIcon icon={faEdit} /></button>
                            <button onClick={() => handleDelete(u.id_unidad)} className={styles.actionButton} title="Eliminar"><FontAwesomeIcon icon={faTrash} /></button>
                        </div>
                    </li>
                ))}
            </ul>

            {!isFormVisible && (
                <button onClick={() => handleOpenForm()} className={styles.addButton}>
                    <FontAwesomeIcon icon={faPlus} /> Agregar Unidad
                </button>
            )}

            {isFormVisible && (
                <form onSubmit={handleSubmit} className={styles.unidadForm}>
                    <h5>{isEditing ? 'Editar Unidad' : 'Nueva Unidad'}</h5>
                    <div className={styles.formGroup}>
                        <label>Nombre de la Unidad</label>
                        <input type="text" name="nombre_unidad" value={formState.nombre_unidad} onChange={handleFormChange} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Descripción (Opcional)</label>
                        <textarea name="descripcion_unidad" value={formState.descripcion_unidad || ''} onChange={handleFormChange} rows="3"></textarea>
                    </div>
                    <div className={styles.formActions}>
                        <button type="button" onClick={handleCloseForm} className={styles.cancelButton}>Cancelar</button>
                        <button type="submit" className={styles.saveButton}>Guardar Unidad</button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default GestionUnidades;