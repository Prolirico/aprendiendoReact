const pool = require("../config/db");
const logger = require("../config/logger");

// @desc    Crear una nueva entrega de tarea
// @route   POST /api/entregas
// @access  Private (Alumno)
const crearEntrega = async (req, res) => {
  const { curso_id, actividad_id } = req.body;
  const id_alumno = req.user.id_alumno; // Obtenido del middleware 'protect'

  if (!curso_id || !actividad_id) {
    return res.status(400).json({ error: "El ID del curso y actividad son obligatorios." });
  }

  try {
    // Por ahora, solo simulamos que la entrega fue exitosa
    // En el futuro aquí se manejarán los archivos subidos

    logger.info(`Entrega simulada creada para alumno ${id_alumno}, curso ${curso_id}, actividad ${actividad_id}`);

    res.status(201).json({
      message: "Entrega enviada con éxito.",
      entrega: {
        id_alumno,
        curso_id,
        actividad_id,
        fecha_entrega: new Date().toISOString(),
        estado: "entregada"
      }
    });
  } catch (error) {
    logger.error(`Error al crear la entrega: ${error.message}`);
    res.status(500).json({ error: "Error interno del servidor al enviar la entrega." });
  }
};

// @desc    Obtener entregas de un alumno para un curso
// @route   GET /api/entregas/alumno/:curso_id
// @access  Private (Alumno)
const getEntregasAlumno = async (req, res) => {
  const { curso_id } = req.params;
  const id_alumno = req.user.id_alumno;

  try {
    // Por ahora devolvemos un array vacío
    // En el futuro aquí se consultarán las entregas reales

    res.json({ entregas: [] });
  } catch (error) {
    logger.error(`Error al obtener las entregas del alumno: ${error.message}`);
    res.status(500).json({
      error: "Error interno del servidor al obtener las entregas.",
    });
  }
};

module.exports = {
  crearEntrega,
  getEntregasAlumno,
};
