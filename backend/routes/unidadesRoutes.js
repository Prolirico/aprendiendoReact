const express = require("express");
const router = express.Router();
const {
    getUnidadesByCursoId,
    createUnidad,
    updateUnidad,
    deleteUnidad,
    updateUnidadesOrden,
} = require("../controllers/unidadesController");

// Rutas para las unidades del curso

// Obtener todas las unidades de un curso específico
router.get("/curso/:id_curso", getUnidadesByCursoId);

// Crear una nueva unidad para un curso
router.post("/", createUnidad);

// Actualizar el orden de múltiples unidades (ideal para drag-and-drop)
router.put("/orden", updateUnidadesOrden);

// Actualizar una unidad existente por su ID
router.put("/:id", updateUnidad);

// Eliminar una unidad por su ID
router.delete("/:id", deleteUnidad);

module.exports = router;