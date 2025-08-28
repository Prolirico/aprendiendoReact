const pool = require("../config/db");
const logger = require("../config/logger");
// Cache functions removed - not implemented in cache.js

// @desc    Crear una nueva solicitud de inscripción
// @route   POST /api/inscripciones
// @access  Private (Alumno)
const crearInscripcion = async (req, res) => {
  const { id_curso } = req.body;
  const id_alumno = req.user.id_alumno; // Obtenido del middleware 'protect'

  if (!id_curso) {
    return res.status(400).json({ error: "El ID del curso es obligatorio." });
  }

  try {
    // Verificar si ya existe una inscripción para este alumno y curso
    const [existing] = await pool.query(
      "SELECT id_inscripcion FROM inscripcion WHERE id_alumno = ? AND id_curso = ?",
      [id_alumno, id_curso],
    );

    if (existing.length > 0) {
      return res
        .status(409)
        .json({ error: "Ya existe una solicitud para este curso." });
    }

    // Crear la nueva inscripción con estatus 'solicitada'
    const [result] = await pool.query(
      "INSERT INTO inscripcion (id_alumno, id_curso, estatus_inscripcion, fecha_solicitud) VALUES (?, ?, 'solicitada', NOW())",
      [id_alumno, id_curso],
    );

    const newInscripcionId = result.insertId;

    // Devolver la inscripción recién creada
    const [newInscripcion] = await pool.query(
      "SELECT * FROM inscripcion WHERE id_inscripcion = ?",
      [newInscripcionId],
    );

    // Cache functionality removed for now
    logger.info("Nueva solicitud de inscripción creada.");

    res.status(201).json({
      message: "Solicitud de inscripción creada con éxito.",
      inscripcion: newInscripcion[0],
    });
  } catch (error) {
    logger.error(`Error al crear la inscripción: ${error.message}`);
    res
      .status(500)
      .json({ error: "Error interno del servidor al crear la inscripción." });
  }
};

// @desc    Obtener todas las inscripciones de un alumno
// @route   GET /api/inscripciones/alumno
// @access  Private (Alumno)
const getInscripcionesAlumno = async (req, res) => {
  const id_alumno = req.user.id_alumno; // Obtenido del middleware 'protect'

  try {
    const [inscripciones] = await pool.query(
      "SELECT id_curso, estatus_inscripcion FROM inscripcion WHERE id_alumno = ?",
      [id_alumno],
    );

    res.json({ inscripciones });
  } catch (error) {
    logger.error(
      `Error al obtener las inscripciones del alumno: ${error.message}`,
    );
    res.status(500).json({
      error: "Error interno del servidor al obtener las inscripciones.",
    });
  }
};

// @desc    Obtener TODAS las inscripciones (para administradores)
// @route   GET /api/inscripciones/all
// @access  Private (Admin)
const getAllInscripciones = async (req, res) => {
  const { id_credencial, id_curso, estado } = req.query;

  try {
    let query = `
            SELECT
                i.id_inscripcion,
                i.fecha_solicitud,
                i.estatus_inscripcion AS estado,
                i.motivo_rechazo,
                u.username AS nombre_alumno,
                u.email AS email_alumno,
                c.id_curso,
                c.nombre_curso,
                cat.nombre_categoria,
                uni.nombre AS nombre_universidad
            FROM inscripcion i
            JOIN alumno a ON i.id_alumno = a.id_alumno
            JOIN usuario u ON a.id_usuario = u.id_usuario
            JOIN curso c ON i.id_curso = c.id_curso
            LEFT JOIN categoria_curso cat ON c.id_categoria = cat.id_categoria
            LEFT JOIN universidad uni ON c.id_universidad = uni.id_universidad
        `;

    const conditions = [];
    const params = [];

    if (id_credencial && id_credencial !== "todas") {
      conditions.push("cat.id_categoria = ?");
      params.push(id_credencial);
    }
    if (id_curso && id_curso !== "todos") {
      conditions.push("c.id_curso = ?");
      params.push(id_curso);
    }
    if (estado && estado !== "todos") {
      conditions.push("i.estatus_inscripcion = ?");
      params.push(estado);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY i.fecha_solicitud DESC";

    const [inscripciones] = await pool.query(query, params);

    const responseData = { inscripciones };

    res.json(responseData);
  } catch (error) {
    logger.error(`Error en getAllInscripciones: ${error.message}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// @desc    Actualizar el estado de una inscripción
// @route   PUT /api/inscripciones/:id/estado
// @access  Private (Admin)
const actualizarEstadoInscripcion = async (req, res) => {
  const { id } = req.params;
  const { estado, motivo_rechazo } = req.body;

  if (!estado || !["aprobada", "rechazada"].includes(estado)) {
    return res
      .status(400)
      .json({ error: "El estado proporcionado no es válido." });
  }

  if (
    estado === "rechazada" &&
    (!motivo_rechazo || motivo_rechazo.trim() === "")
  ) {
    return res
      .status(400)
      .json({ error: "El motivo de rechazo es obligatorio." });
  }

  try {
    const [result] = await pool.query(
      "UPDATE inscripcion SET estatus_inscripcion = ?, motivo_rechazo = ? WHERE id_inscripcion = ?",
      [estado, estado === "rechazada" ? motivo_rechazo.trim() : null, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Inscripción no encontrada." });
    }

    // Cache functionality removed for now
    logger.info(`Estado de inscripción actualizado para ID: ${id}.`);

    res.json({ message: "Estado de la inscripción actualizado con éxito." });
  } catch (error) {
    logger.error(`Error al actualizar estado de inscripción: ${error.message}`);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  crearInscripcion,
  getInscripcionesAlumno,
  getAllInscripciones,
  actualizarEstadoInscripcion,
};
