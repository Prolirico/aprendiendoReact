// /backend/routes/planeacionRoutes.js
const express = require("express");
const router = express.Router();
const { guardarPlaneacion, obtenerPlaneacion } = require("../controllers/planeacionController");
const { protect } = require("../middleware/authMiddleware");

// Ruta para guardar/actualizar planeación
router.post("/:id_curso", protect, guardarPlaneacion);

// Ruta para obtener planeación
router.get("/:id_curso", protect, obtenerPlaneacion);

module.exports = router;