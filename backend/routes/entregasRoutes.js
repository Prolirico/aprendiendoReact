const express = require("express");
const router = express.Router();
const {
  upload,
  crearEntrega,
  getEntregasAlumno,
  getEntregasActividad,
  calificarEntrega,
  descargarArchivoEntrega,
  getEntregasPorAlumnoYCurso,
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

// @route   GET /api/entregas/curso/:id_curso/alumno/:id_alumno
// @desc    Obtener actividades y entregas de un alumno para un curso
// @access  Private (Maestro/Admin)
router
  .route("/curso/:id_curso/alumno/:id_alumno")
  .get(protect, getEntregasPorAlumnoYCurso);

// @route   GET /api/entregas/actividad/:id_material
// @desc    Obtener todas las entregas de una actividad específica
// @access  Private (Maestro)
router.route("/actividad/:id_material").get(protect, getEntregasActividad);

// @route   PUT /api/entregas/:id_entrega/calificar
// @desc    Calificar una entrega específica
// @access  Private (Maestro)
router.route("/:id_entrega/calificar").put(protect, calificarEntrega);

// @route   GET /api/entregas/download/:id_archivo
// @desc    Descargar archivo de entrega
// @access  Private (Maestro del curso o alumno propietario)
router.route("/download/:id_archivo").get(protect, descargarArchivoEntrega);

// @route   DELETE /api/entregas/archivo/:id_archivo
// @desc    Eliminar archivo individual de entrega
// @access  Private (Alumno propietario)
router.route("/archivo/:id_archivo").delete(protect, eliminarArchivoEntrega);

module.exports = router;
