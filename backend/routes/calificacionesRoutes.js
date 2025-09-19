const express = require("express");
const router = express.Router();
const { upsertCalificacionCurso } = require("../controllers/calificacionesController"); // <-- Asegúrate que las llaves {} estén aquí
const { protect, isAdmin } = require("../middleware/authMiddleware.js");

// @route   POST /api/calificaciones
router.route("/").post(protect, isAdmin, upsertCalificacionCurso);

module.exports = router;