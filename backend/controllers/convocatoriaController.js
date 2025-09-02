// backend/controllers/convocatoriaController.js
const pool = require("../config/db");

// Función auxiliar para manejar la relación con las universidades
const manageConvocatoriaUniversidades = async (
    connection,
    convocatoriaId,
    universidades,
) => {
    // Primero, eliminamos las asociaciones existentes para esta convocatoria
    await connection.query(
        "DELETE FROM convocatoria_universidades WHERE convocatoria_id = ?",
        [convocatoriaId],
    );

    // Si se proporcionó una lista de universidades, insertamos las nuevas
    if (universidades && universidades.length > 0) {
        const values = universidades.map((uniId) => [convocatoriaId, uniId]);
        await connection.query(
            "INSERT INTO convocatoria_universidades (convocatoria_id, universidad_id) VALUES ?",
            [values],
        );
    }
};

// @desc    Obtener todas las convocatorias
// @route   GET /api/convocatorias
// @access  Public
const getAllConvocatorias = async (req, res) => {
    try {
        const query = `
      SELECT 
        c.*,
        GROUP_CONCAT(u.nombre SEPARATOR ', ') as universidades_nombres
      FROM convocatorias c
      LEFT JOIN convocatoria_universidades cu ON c.id = cu.convocatoria_id
      LEFT JOIN universidad u ON cu.universidad_id = u.id_universidad
      GROUP BY c.id
      ORDER BY c.fecha_inicio DESC;
    `;
        const [convocatorias] = await pool.query(query);
        res.json(convocatorias);
    } catch (error) {
        console.error("Error al obtener las convocatorias:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
};

// @desc    Obtener una convocatoria por ID
// @route   GET /api/convocatorias/:id
// @access  Public
const getConvocatoriaById = async (req, res) => {
    const { id } = req.params;
    try {
        const [convocatorias] = await pool.query(
            "SELECT * FROM convocatorias WHERE id = ?",
            [id],
        );

        if (convocatorias.length === 0) {
            return res.status(404).json({ error: "Convocatoria no encontrada." });
        }

        const convocatoria = convocatorias[0];

        // Obtener las universidades asociadas
        const [universidades] = await pool.query(
            `SELECT universidad_id FROM convocatoria_universidades WHERE convocatoria_id = ?`,
            [id],
        );

        convocatoria.universidades = universidades.map((u) => u.universidad_id);

        res.json(convocatoria);
    } catch (error) {
        console.error(`Error al obtener la convocatoria ${id}:`, error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
};

// @desc    Crear una nueva convocatoria
// @route   POST /api/convocatorias
// @access  Private (SEDEQ)
const createConvocatoria = async (req, res) => {
    const { nombre, descripcion, fecha_inicio, fecha_fin, estado, universidades } =
        req.body;

    if (!nombre || !fecha_inicio || !fecha_fin || !estado) {
        return res
            .status(400)
            .json({ error: "Nombre, fechas y estado son obligatorios." });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            "INSERT INTO convocatorias (nombre, descripcion, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, ?)",
            [nombre, descripcion, fecha_inicio, fecha_fin, estado],
        );
        const newConvocatoriaId = result.insertId;

        await manageConvocatoriaUniversidades(
            connection,
            newConvocatoriaId,
            universidades,
        );

        await connection.commit();
        res.status(201).json({
            message: "Convocatoria creada con éxito",
            id: newConvocatoriaId,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error al crear la convocatoria:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    } finally {
        if (connection) connection.release();
    }
};

// @desc    Actualizar una convocatoria
// @route   PUT /api/convocatorias/:id
// @access  Private (SEDEQ)
const updateConvocatoria = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, fecha_inicio, fecha_fin, estado, universidades } =
        req.body;

    if (!nombre || !fecha_inicio || !fecha_fin || !estado) {
        return res
            .status(400)
            .json({ error: "Nombre, fechas y estado son obligatorios." });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            "UPDATE convocatorias SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, estado = ? WHERE id = ?",
            [nombre, descripcion, fecha_inicio, fecha_fin, estado, id],
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Convocatoria no encontrada." });
        }

        await manageConvocatoriaUniversidades(connection, id, universidades);

        await connection.commit();
        res.json({ message: "Convocatoria actualizada con éxito." });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error al actualizar la convocatoria ${id}:`, error);
        res.status(500).json({ error: "Error interno del servidor." });
    } finally {
        if (connection) connection.release();
    }
};

// @desc    Eliminar una convocatoria
// @route   DELETE /api/convocatorias/:id
// @access  Private (SEDEQ)
const deleteConvocatoria = async (req, res) => {
    const { id } = req.params;
    try {
        // La FK con ON DELETE CASCADE se encargará de la tabla pivot
        const [result] = await pool.query("DELETE FROM convocatorias WHERE id = ?", [
            id,
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Convocatoria no encontrada." });
        }

        res.json({ message: "Convocatoria eliminada con éxito." });
    } catch (error) {
        console.error(`Error al eliminar la convocatoria ${id}:`, error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
};

module.exports = {
    getAllConvocatorias,
    getConvocatoriaById,
    createConvocatoria,
    updateConvocatoria,
    deleteConvocatoria,
};
