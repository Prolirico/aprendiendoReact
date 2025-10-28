const express = require("express");
const router = express.Router();
const certificadoConstanciaController = require("../controllers/certificadoConstanciaController");
const { protect } = require("../middleware/authMiddleware");

/**
 * @route GET /api/alumno/documentos-disponibles
 * @desc Obtiene todos los cursos y credenciales donde el alumno puede generar documentos
 * @access Private (Alumno)
 */
router.get(
  "/documentos-disponibles",
  protect,
  certificadoConstanciaController.getDocumentosDisponibles,
);

/**
 * @route POST /api/alumno/generar-constancia/:id_curso
 * @desc Genera una constancia para un curso específico
 * @access Private (Alumno)
 */
router.post(
  "/generar-constancia/:id_curso",
  protect,
  certificadoConstanciaController.generarConstancia,
);

/**
 * @route POST /api/alumno/generar-certificado/:id_credencial
 * @desc Genera un certificado para una credencial específica
 * @access Private (Alumno)
 */
router.post(
  "/generar-certificado/:id_credencial",
  protect,
  certificadoConstanciaController.generarCertificado,
);

/**
 * @route GET /api/alumno/descargar/:tipo/:id
 * @desc Descarga una constancia o certificado
 * @param tipo - 'constancia' o 'certificado'
 * @param id - ID de la constancia o certificación
 * @access Private (Alumno)
 */
router.get(
  "/descargar/:tipo/:id",
  protect,
  certificadoConstanciaController.descargarDocumento,
);

module.exports = router;
