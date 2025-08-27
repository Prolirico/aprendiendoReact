const express = require("express");
const router = express.Router();
const {
  createInscripcion,
  getInscripcionesByAlumno,
} = require("../controllers/inscripcionController");
const { protect } = require("../middleware/authMiddleware.js");

// @route   POST /api/inscripciones
router.post("/", protect, createInscripcion);

// @route   GET /api/inscripciones/alumno
router.get("/alumno", protect, getInscripcionesByAlumno);

module.exports = router;