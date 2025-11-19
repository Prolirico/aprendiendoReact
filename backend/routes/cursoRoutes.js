const express = require("express");
const router = express.Router();
const {
  getAllCursos,
  getCursoById,
  createCurso,
  updateCurso,
  deleteCurso,
  getAlumnosPorCurso,
  obtenerPlaneacion,
  actualizarPlaneacion,
} = require("../controllers/cursoController");
const { protect } = require("../middleware/authMiddleware.js");

// Aquí se podrían añadir middlewares de autenticación y autorización

// Rutas para los cursos
router.get("/", getAllCursos);
router.get("/:id", getCursoById);
router.get("/:id/alumnos", protect, getAlumnosPorCurso);
router.post("/", createCurso);
router.put("/:id", updateCurso);
router.delete("/:id", deleteCurso);
router.put("/:id/planeacion", protect, actualizarPlaneacion);
router.get("/:id/planeacion", protect, obtenerPlaneacion);

module.exports = router;
