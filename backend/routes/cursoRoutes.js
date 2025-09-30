const express = require("express");
const router = express.Router();
const {
  getAllCursos,
  getCursoById,
  createCurso,
  updateCurso,
  deleteCurso,
  getAlumnosPorCurso,
} = require("../controllers/cursoController");
const { protect } = require("../middleware/authMiddleware.js");

// Aquí se podrían añadir middlewares de autenticación y autorización

// Rutas para los cursos
router.get("/", getAllCursos);
router.get("/:id", getCursoById);
router.get("/:id/alumnos", protect, getAlumnosPorCurso); // <-- NUEVA RUTA
router.post("/", createCurso);
router.put("/:id", updateCurso);
router.delete("/:id", deleteCurso);

module.exports = router;
