const pool = require("../config/db");

// @desc    Obtener todos los horarios de un curso específico
// @route   GET /api/horarios/curso/:id_curso
const getHorariosByCursoId = async (req, res) => {
    const { id_curso } = req.params;
    try {
        const [horarios] = await pool.query(
            "SELECT * FROM horarios_clase WHERE id_curso = ? ORDER BY FIELD(dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'), hora_inicio",
            [id_curso],
        );
        res.json(horarios);
    } catch (error) {
        console.error("Error al obtener los horarios del curso:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
};

// @desc    Crear un nuevo horario para un curso
// @route   POST /api/horarios
const createHorario = async (req, res) => {
    const {
        tipo_sesion,
        id_curso,
        dia_semana,
        hora_inicio,
        hora_fin,
        modalidad_dia,
        link_clase,
    } = req.body;

    if (!id_curso || !dia_semana || !hora_inicio || !hora_fin || !modalidad_dia) {
        return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO horarios_clase (id_curso, tipo_sesion, dia_semana, hora_inicio, hora_fin, modalidad_dia, link_clase) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [id_curso, tipo_sesion || 'clase', dia_semana, hora_inicio, hora_fin, modalidad_dia, link_clase || null],
        );

        res.status(201).json({
            message: "Horario creado con éxito.",
            id_horario: result.insertId,
        });
    } catch (error) {
        console.error("Error al crear el horario:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
};

// @desc    Actualizar un horario existente
// @route   PUT /api/horarios/:id
const updateHorario = async (req, res) => {
    const { id } = req.params;
    const { tipo_sesion, dia_semana, hora_inicio, hora_fin, modalidad_dia, link_clase } =
        req.body;

    if (!dia_semana || !hora_inicio || !hora_fin || !modalidad_dia) {
        return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    try {
        const [result] = await pool.query(
            "UPDATE horarios_clase SET tipo_sesion = ?, dia_semana = ?, hora_inicio = ?, hora_fin = ?, modalidad_dia = ?, link_clase = ? WHERE id_horario = ?",
            [tipo_sesion || 'clase', dia_semana, hora_inicio, hora_fin, modalidad_dia, link_clase || null, id],
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Horario no encontrado." });
        }

        res.json({ message: "Horario actualizado con éxito." });
    } catch (error) {
        console.error("Error al actualizar el horario:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
};

// @desc    Eliminar un horario
// @route   DELETE /api/horarios/:id
const deleteHorario = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            "DELETE FROM horarios_clase WHERE id_horario = ?",
            [id],
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Horario no encontrado." });
        }

        res.json({ message: "Horario eliminado con éxito." });
    } catch (error) {
        console.error("Error al eliminar el horario:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
};

module.exports = {
    getHorariosByCursoId,
    createHorario,
    updateHorario,
    deleteHorario,
};
