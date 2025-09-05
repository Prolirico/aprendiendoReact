// backend/controllers/convocatoriaController.js
const pool = require("../config/db");

// Función auxiliar para manejar la relación con las universidades y sus capacidades
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

  await connection.query(
    "DELETE FROM capacidad_universidad WHERE convocatoria_id = ?",
    [convocatoriaId],
  );

  // Si se proporcionó una lista de universidades con capacidades, insertamos las nuevas
  if (universidades && universidades.length > 0) {
    // Insertar en convocatoria_universidades (tabla de relación)
    const relationValues = universidades.map((uni) => [
      convocatoriaId,
      uni.id_universidad,
    ]);
    await connection.query(
      "INSERT INTO convocatoria_universidades (convocatoria_id, universidad_id) VALUES ?",
      [relationValues],
    );

    // Insertar en capacidad_universidad (tabla de capacidades)
    const capacityValues = universidades.map((uni) => [
      convocatoriaId,
      uni.id_universidad,
      uni.capacidad_maxima,
      0, // cupo_actual inicial en 0
    ]);
    await connection.query(
      "INSERT INTO capacidad_universidad (convocatoria_id, universidad_id, capacidad_maxima, cupo_actual) VALUES ?",
      [capacityValues],
    );
  }
};

// @desc    Obtener todas las convocatorias
// @route   GET /api/convocatorias
// @access  Public
const getAllConvocatorias = async (req, res) => {
  try {
    // Primero, actualizamos los estados basados en las fechas actuales
    const updateStatusesQuery = `
        UPDATE convocatorias
        SET estado = CASE
            WHEN estado IN ('cancelada', 'rechazada', 'llena') THEN estado
            WHEN CURDATE() > fecha_ejecucion_fin THEN 'finalizada'
            WHEN CURDATE() >= fecha_ejecucion_inicio THEN 'activa'
            WHEN fecha_revision_inicio IS NOT NULL AND fecha_revision_fin IS NOT NULL AND CURDATE() BETWEEN fecha_revision_inicio AND fecha_revision_fin THEN 'revision'
            WHEN CURDATE() BETWEEN fecha_aviso_inicio AND fecha_aviso_fin THEN 'aviso'
            ELSE 'planeada'
        END;
    `;
    await pool.query(updateStatusesQuery);

    // Luego, obtenemos todas las convocatorias con los estados ya actualizados
    const getQuery = `
      SELECT
          c.*,
          COALESCE((SELECT SUM(cu.capacidad_maxima) FROM capacidad_universidad cu WHERE cu.convocatoria_id = c.id), 0) as capacidad_maxima,
          COALESCE((SELECT SUM(cu.cupo_actual) FROM capacidad_universidad cu WHERE cu.convocatoria_id = c.id), 0) as cupo_actual,
          CASE
              WHEN COALESCE((SELECT SUM(cu2.cupo_actual) FROM capacidad_universidad cu2 WHERE cu2.convocatoria_id = c.id), 0) >= COALESCE((SELECT SUM(cu3.capacidad_maxima) FROM capacidad_universidad cu3 WHERE cu3.convocatoria_id = c.id), 1) THEN 1
              ELSE 0
          END as llena
      FROM convocatorias c
      ORDER BY c.fecha_ejecucion_inicio DESC;

    `;
    const [convocatorias] = await pool.query(getQuery);

    // Para cada convocatoria, obtener los detalles de sus universidades
    for (let convocatoria of convocatorias) {
      const [universidades] = await pool.query(
        `SELECT
          u.nombre,
          cu.capacidad_maxima,
          cu.cupo_actual
         FROM capacidad_universidad cu
         JOIN universidad u ON cu.universidad_id = u.id_universidad
         WHERE cu.convocatoria_id = ?`,
        [convocatoria.id],
      );
      convocatoria.universidades = universidades;
    }

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

    // Obtener las universidades asociadas con sus capacidades
    const [universidades] = await pool.query(
      `SELECT
                cu.universidad_id,
                cu.capacidad_maxima,
                cu.cupo_actual,
                u.nombre as nombre_universidad
             FROM capacidad_universidad cu
             JOIN universidad u ON cu.universidad_id = u.id_universidad
             WHERE cu.convocatoria_id = ?`,
      [id],
    );

    convocatoria.universidades = universidades;

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
  const {
    nombre,
    descripcion,
    fecha_aviso_inicio,
    fecha_aviso_fin,
    fecha_revision_inicio,
    fecha_revision_fin,
    fecha_ejecucion_inicio,
    fecha_ejecucion_fin,
    universidades,
  } = req.body;

  if (
    !nombre ||
    !fecha_aviso_inicio ||
    !fecha_aviso_fin ||
    !fecha_revision_inicio ||
    !fecha_revision_fin ||
    !fecha_ejecucion_inicio ||
    !fecha_ejecucion_fin ||
    !universidades ||
    !Array.isArray(universidades) ||
    universidades.length === 0
  ) {
    return res.status(400).json({
      error:
        "Todos los campos son obligatorios, y se debe seleccionar y asignar capacidad al menos a una universidad.",
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // El estado inicial siempre es 'planeada'
    const [result] = await connection.query(
      `INSERT INTO convocatorias (
                nombre, descripcion, estado,
                fecha_aviso_inicio, fecha_aviso_fin,
                fecha_revision_inicio, fecha_revision_fin,
                fecha_ejecucion_inicio, fecha_ejecucion_fin
            ) VALUES (?, ?, 'planeada', ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        descripcion,
        fecha_aviso_inicio,
        fecha_aviso_fin,
        fecha_revision_inicio || null,
        fecha_revision_fin || null,
        fecha_ejecucion_inicio,
        fecha_ejecucion_fin,
      ],
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
  const {
    nombre,
    descripcion,
    estado, // Mantenemos estado para cambios manuales como 'cancelada'
    fecha_aviso_inicio,
    fecha_aviso_fin,
    fecha_revision_inicio,
    fecha_revision_fin,
    fecha_ejecucion_inicio,
    fecha_ejecucion_fin,
    universidades,
  } = req.body;

  if (
    !nombre ||
    !fecha_aviso_inicio ||
    !fecha_aviso_fin ||
    !fecha_revision_inicio ||
    !fecha_revision_fin ||
    !fecha_ejecucion_inicio ||
    !fecha_ejecucion_fin ||
    !estado ||
    !universidades ||
    !Array.isArray(universidades) ||
    universidades.length === 0
  ) {
    return res.status(400).json({
      error:
        "Todos los campos son obligatorios, y se debe seleccionar y asignar capacidad al menos a una universidad.",
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // No actualizamos el estado directamente a menos que sea un estado manual. La lógica de GET se encarga del resto.
    const [result] = await connection.query(
      `UPDATE convocatorias SET
                nombre = ?, descripcion = ?, estado = ?,
                fecha_aviso_inicio = ?, fecha_aviso_fin = ?,
                fecha_revision_inicio = ?, fecha_revision_fin = ?,
                fecha_ejecucion_inicio = ?, fecha_ejecucion_fin = ?
             WHERE id = ?`,
      [
        nombre,
        descripcion,
        estado,
        fecha_aviso_inicio,
        fecha_aviso_fin,
        fecha_revision_inicio || null,
        fecha_revision_fin || null,
        fecha_ejecucion_inicio,
        fecha_ejecucion_fin,
        id,
      ],
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
    // La FK con ON DELETE CASCADE se encargará de las tablas relacionadas
    const [result] = await pool.query(
      "DELETE FROM convocatorias WHERE id = ?",
      [id],
    );

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
