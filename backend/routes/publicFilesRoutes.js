const express = require("express");
const router = express.Router();
const publicFilesController = require("../controllers/publicFilesController");

/**
 * @route   GET /api/public-files/metadatos/:tipo/:filename
 * @desc    Obtiene los metadatos de un documento público (constancia o certificado).
 * @access  Public
 */
router.get("/metadatos/:tipo/:filename", publicFilesController.getMetadatos);

/**
 * @route   GET /api/public-files/documentos/:tipo/:filename
 * @desc    Sirve el archivo PDF de un documento público.
 * @access  Public
 */
router.get("/documentos/:tipo/:filename", publicFilesController.getDocumento);

module.exports = router;
