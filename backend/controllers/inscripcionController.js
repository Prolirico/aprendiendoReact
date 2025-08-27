const pool = require("../config/db");

// @desc    Crear una nueva solicitud de inscripción
// @route   POST /api/inscripciones
// @access  Private (Alumno)
const createInscripcion = async (req, res) => {
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
      "INSERT INTO inscripcion (id_alumno, id_curso, estatus_inscripcion) VALUES (?, ?, 'solicitada')",
      [id_alumno, id_curso],
    );

    const newInscripcionId = result.insertId;

    // Devolver la inscripción recién creada
    const [newInscripcion] = await pool.query(
      "SELECT * FROM inscripcion WHERE id_inscripcion = ?",
      [newInscripcionId],
    );

    res.status(201).json({
      message: "Solicitud de inscripción creada con éxito.",
      inscripcion: newInscripcion[0],
    });
  } catch (error) {
    console.error("Error al crear la inscripción:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al crear la inscripción." });
  }
};

// @desc    Obtener todas las inscripciones de un alumno
// @route   GET /api/inscripciones/alumno
// @access  Private (Alumno)
const getInscripcionesByAlumno = async (req, res) => {
  const id_alumno = req.user.id_alumno; // Obtenido del middleware 'protect'

  try {
    const [inscripciones] = await pool.query(
      "SELECT id_curso, estatus_inscripcion FROM inscripcion WHERE id_alumno = ?",
      [id_alumno],
    );

    res.json({ inscripciones });
  } catch (error) {
    console.error("Error al obtener las inscripciones del alumno:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener las inscripciones.",
    });
  }
};

module.exports = {
  createInscripcion,
  getInscripcionesByAlumno,
};