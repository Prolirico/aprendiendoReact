const pool = require("../config/db");

// @desc    Obtener todas las unidades de un curso específico
// @route   GET /api/unidades/curso/:id_curso
const getUnidadesByCursoId = async (req, res) => {
  const { id_curso } = req.params;
  try {
    const [unidades] = await pool.query(
      "SELECT * FROM unidades_curso WHERE id_curso = ? ORDER BY orden ASC",
      [id_curso],
    );
    res.json(unidades);
  } catch (error) {
    console.error("Error al obtener las unidades del curso:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// @desc    Crear una nueva unidad para un curso
// @route   POST /api/unidades
const createUnidad = async (req, res) => {
  const { id_curso, nombre_unidad, descripcion_unidad } = req.body;

  if (!id_curso || !nombre_unidad) {
    return res.status(400).json({ error: "El ID del curso y el nombre de la unidad son obligatorios." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Obtener el orden máximo actual para este curso y sumarle 1
    const [maxOrderResult] = await connection.query(
      "SELECT COALESCE(MAX(orden), -1) as max_orden FROM unidades_curso WHERE id_curso = ?",
      [id_curso]
    );
    const nuevoOrden = maxOrderResult[0].max_orden + 1;

    const [result] = await connection.query(
      "INSERT INTO unidades_curso (id_curso, nombre_unidad, descripcion_unidad, orden) VALUES (?, ?, ?, ?)",
      [id_curso, nombre_unidad, descripcion_unidad || null, nuevoOrden],
    );

    await connection.commit();

    res.status(201).json({
      message: "Unidad creada con éxito.",
      id_unidad: result.insertId,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error al crear la unidad:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  } finally {
    if (connection) connection.release();
  }
};

// @desc    Actualizar una unidad existente
// @route   PUT /api/unidades/:id
const updateUnidad = async (req, res) => {
  const { id } = req.params;
  const { nombre_unidad, descripcion_unidad, orden } = req.body;

  if (!nombre_unidad) {
    return res.status(400).json({ error: "El nombre de la unidad es obligatorio." });
  }

  try {
    const [result] = await pool.query(
      "UPDATE unidades_curso SET nombre_unidad = ?, descripcion_unidad = ?, orden = ? WHERE id_unidad = ?",
      [nombre_unidad, descripcion_unidad || null, orden, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Unidad no encontrada." });
    }

    res.json({ message: "Unidad actualizada con éxito." });
  } catch (error) {
    console.error("Error al actualizar la unidad:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// @desc    Eliminar una unidad
// @route   DELETE /api/unidades/:id
const deleteUnidad = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM unidades_curso WHERE id_unidad = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Unidad no encontrada." });
    }

    res.json({ message: "Unidad eliminada con éxito." });
  } catch (error) {
    console.error("Error al eliminar la unidad:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// @desc    Actualizar el orden de múltiples unidades
// @route   PUT /api/unidades/orden
const updateUnidadesOrden = async (req, res) => {
    const { unidades } = req.body; // Se espera un array: [{ id_unidad, orden }]

    if (!Array.isArray(unidades) || unidades.length === 0) {
        return res.status(400).json({ error: "Se requiere un array de unidades." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        for (const unidad of unidades) {
            await connection.query("UPDATE unidades_curso SET orden = ? WHERE id_unidad = ?", [unidad.orden, unidad.id_unidad]);
        }
        await connection.commit();
        res.json({ message: "Orden de las unidades actualizado con éxito." });
    } catch (error) {
        await connection.rollback();
        console.error("Error al actualizar el orden de las unidades:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    } finally {
        connection.release();
    }
};

module.exports = {
  getUnidadesByCursoId,
  createUnidad,
  updateUnidad,
  deleteUnidad,
  updateUnidadesOrden,
};