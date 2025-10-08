const express = require("express");
const router = express.Router();
const {
  upload,
  crearEntrega,
  getEntregasAlumno,
  getEntregasActividad,
  calificarEntrega,
  submitEntrega,
  unsubmitEntrega,
  descargarArchivoEntrega,
  eliminarArchivoEntrega,
} = require("../controllers/entregasController");
const { protect } = require("../middleware/authMiddleware.js");

// @route   POST /api/entregas
// @desc    Crear nueva entrega con archivos
// @access  Private (Alumno)
router.route("/").post(protect, upload.array("archivos", 10), crearEntrega);

// @route   GET /api/entregas/alumno/:id_curso
// @desc    Obtener entregas de un alumno para un curso específico
// @access  Private (Alumno)
router.route("/alumno/:id_curso").get(protect, getEntregasAlumno);

// @route   GET /api/entregas/actividad/:id_actividad
// @desc    Obtener todas las entregas de una actividad específica
// @access  Private (Maestro)
router.route("/actividad/:id_actividad").get(protect, getEntregasActividad);

// @route   PUT /api/entregas/:id_entrega/calificar
// @desc    Calificar una entrega específica
// @access  Private (Maestro)
router.route("/:id_entrega/calificar").put(protect, calificarEntrega);

// @route   PUT /api/entregas/:id_entrega/submit
// @desc    Marcar una entrega como finalizada (enviada)
// @access  Private (Alumno)
router.route("/:id_entrega/submit").put(protect, submitEntrega);

// @route   PUT /api/entregas/:id_entrega/unsubmit
// @desc    Anular una entrega (volver a borrador)
// @access  Private (Alumno)
router.route("/:id_entrega/unsubmit").put(protect, unsubmitEntrega);

// @route   GET /api/entregas/download/:id_archivo
// @desc    Descargar archivo de entrega
// @access  Private (Maestro del curso o alumno propietario)
router.route("/download/:id_archivo").get(protect, descargarArchivoEntrega);

// @route   DELETE /api/entregas/archivo/:id_archivo
// @desc    Eliminar archivo individual de entrega
// @access  Private (Alumno propietario)
router.route("/archivo/:id_archivo").delete(protect, eliminarArchivoEntrega);

module.exports = router;
