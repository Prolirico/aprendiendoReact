const express = require("express");
const router = express.Router();
const verificacionController = require("../controllers/verificacionHomeConstanciasYcertificadosController");

/**
 * @route   GET /public/student-status
 * @desc    Verifica públicamente las constancias y certificados de un alumno.
 * @access  Public
 * @query   universityId - El ID de la universidad.
 * @query   studentId - La matrícula del alumno.
 */
router.get("/student-status", verificacionController.getStudentStatusPublic);

module.exports = router;
