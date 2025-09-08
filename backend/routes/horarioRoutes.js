const express = require("express");
const router = express.Router();
const {
  getHorariosByCursoId,
  createHorario,
  updateHorario,
  deleteHorario,
} = require("../controllers/horarioController");

// Rutas para los horarios

// Obtener todos los horarios de un curso específico
router.get("/curso/:id_curso", getHorariosByCursoId);

// Crear un nuevo horario para un curso
router.post("/", createHorario);

// Actualizar un horario existente por su ID
router.put("/:id", updateHorario);

// Eliminar un horario por su ID
router.delete("/:id", deleteHorario);

module.exports = router;