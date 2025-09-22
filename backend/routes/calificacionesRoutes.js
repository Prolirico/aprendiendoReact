const express = require("express");
const router = express.Router();
const {
  upsertCalificacionCurso,
  getCalificacionCurso,
} = require("../controllers/calificacionesController"); // <-- Asegúrate que las llaves {} estén aquí
const { protect, isAdmin } = require("../middleware/authMiddleware.js");

// @route   POST /api/calificaciones
router.route("/").post(protect, isAdmin, upsertCalificacionCurso);

// @route   GET /api/calificaciones/:id_curso
router.route("/:id_curso").get(protect, getCalificacionCurso);

module.exports = router;
