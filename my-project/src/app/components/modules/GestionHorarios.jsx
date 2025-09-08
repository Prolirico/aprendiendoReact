import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import styles from './GestionHorarios.module.css';

const API_URL = 'http://localhost:5000/api/horarios';

const initialHorarioState = {
    id_horario: null,
    tipo_sesion: 'clase',
    dia_semana: 'lunes',
    hora_inicio: '',
    hora_fin: '',
    modalidad_dia: 'presencial',
    link_clase: '',
};

function GestionHorarios({ cursoId }) {
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formState, setFormState] = useState(initialHorarioState);

    const fetchHorarios = useCallback(async () => {
        if (!cursoId) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/curso/${cursoId}`);
            if (!response.ok) {
                throw new Error('Error al cargar los horarios.');
            }
            const data = await response.json();
            setHorarios(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [cursoId]);

    useEffect(() => {
        fetchHorarios();
    }, [fetchHorarios]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenForm = (horario = null) => {
        if (horario) {
            setIsEditing(true);
            setFormState({ ...horario, hora_inicio: horario.hora_inicio.substring(0,5), hora_fin: horario.hora_fin.substring(0,5) });
        } else {
            setIsEditing(false);
            setFormState(initialHorarioState);
        }
        setIsFormVisible(true);
    };

    const handleCloseForm = () => {
        setIsFormVisible(false);
        setIsEditing(false);
        setFormState(initialHorarioState);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${API_URL}/${formState.id_horario}` : API_URL;
        
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
            fetchHorarios();
            handleCloseForm();
        } catch (err) {
            console.error("Error al guardar el horario:", err);
            setError(err.message);
        }
    };

    const handleDelete = async (id_horario) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este horario?')) {
            try {
                const response = await fetch(`${API_URL}/${id_horario}`, { method: 'DELETE' });
                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error || 'Ocurrió un error.');
                }
                fetchHorarios();
            } catch (err) {
                console.error("Error al eliminar el horario:", err);
                setError(err.message);
            }
        }
    };

    const formatDay = (day) => day.charAt(0).toUpperCase() + day.slice(1);
    const formatTime = (time) => time ? time.substring(0, 5) : '';

    return (
        <div className={styles.gestionContainer}>
            <h4>Gestión de Horarios</h4>
            {loading && <p>Cargando horarios...</p>}
            {error && <p className={styles.errorText}>{error}</p>}
            
            {!loading && horarios.length === 0 && !isFormVisible && (
                <div className={styles.emptyState}><p>Este curso aún no tiene horarios definidos.</p></div>
            )}

            <ul className={styles.horariosList}>
                {horarios.map(h => (
                    <li key={h.id_horario} className={styles.horarioItem}>
                        <div className={styles.horarioInfo}>
                            <strong>{h.tipo_sesion === 'clase' ? 'Clase' : 'Tutoría'}:</strong> {formatDay(h.dia_semana)} de {formatTime(h.hora_inicio)} a {formatTime(h.hora_fin)} ({h.modalidad_dia})
                        </div>
                        <div className={styles.horarioActions}>
                            <button onClick={() => handleOpenForm(h)} className={styles.actionButton} title="Editar"><FontAwesomeIcon icon={faEdit} /></button>
                            <button onClick={() => handleDelete(h.id_horario)} className={styles.actionButton} title="Eliminar"><FontAwesomeIcon icon={faTrash} /></button>
                        </div>
                    </li>
                ))}
            </ul>

            {!isFormVisible && (
                <button onClick={() => handleOpenForm()} className={styles.addButton}><FontAwesomeIcon icon={faPlus} /> Agregar Horario</button>
            )}

            {isFormVisible && (
                <form onSubmit={handleSubmit} className={styles.horarioForm}>
                    <h5>{isEditing ? 'Editar Horario' : 'Nuevo Horario'}</h5>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Tipo</label>
                            <select name="tipo_sesion" value={formState.tipo_sesion} onChange={handleFormChange}><option value="clase">Clase</option><option value="tutoria">Tutoría</option></select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Día</label>
                            <select name="dia_semana" value={formState.dia_semana} onChange={handleFormChange}><option value="lunes">Lunes</option><option value="martes">Martes</option><option value="miercoles">Miércoles</option><option value="jueves">Jueves</option><option value="viernes">Viernes</option><option value="sabado">Sábado</option><option value="domingo">Domingo</option></select>
                        </div>
                        <div className={styles.formGroup}><label>Hora Inicio</label><input type="time" name="hora_inicio" value={formState.hora_inicio} onChange={handleFormChange} required /></div>
                        <div className={styles.formGroup}><label>Hora Fin</label><input type="time" name="hora_fin" value={formState.hora_fin} onChange={handleFormChange} required /></div>
                        <div className={styles.formGroup}>
                            <label>Modalidad del Día</label>
                            <select name="modalidad_dia" value={formState.modalidad_dia} onChange={handleFormChange}><option value="presencial">Presencial</option><option value="virtual">Virtual</option></select>
                        </div>
                        {formState.modalidad_dia === 'virtual' && (
                            <div className={styles.formGroup}><label>Link de la Clase</label><input type="url" name="link_clase" value={formState.link_clase || ''} onChange={handleFormChange} placeholder="https://meet.google.com/..." /></div>
                        )}
                    </div>
                    <div className={styles.formActions}>
                        <button type="button" onClick={handleCloseForm} className={styles.cancelButton}>Cancelar</button>
                        <button type="submit" className={styles.saveButton}>Guardar Horario</button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default GestionHorarios;