const express = require("express");
const router = express.Router();
const {
  crearEntrega,
  getEntregasAlumno,
} = require("../controllers/entregasController");
const { protect } = require("../middleware/authMiddleware.js");

// @route   POST /api/entregas
router.route("/").post(protect, crearEntrega);

// @route   GET /api/entregas/alumno/:curso_id
router.route("/alumno/:curso_id").get(protect, getEntregasAlumno);

module.exports = router;
