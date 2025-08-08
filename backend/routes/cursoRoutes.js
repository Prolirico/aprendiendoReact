const express = require("express");
const router = express.Router();
const {
  getAllCursos,
  getCursoById,
  createCurso,
  updateCurso,
  deleteCurso,
} = require("../controllers/cursoController");

// Aquí se podrían añadir middlewares de autenticación y autorización

// Rutas para los cursos
router.get("/", getAllCursos);
router.get("/:id", getCursoById);
router.post("/", createCurso);
router.put("/:id", updateCurso);
router.delete("/:id", deleteCurso);

module.exports = router;
