const express = require("express");
const router = express.Router();
const {
    getUnidadesByCursoId,
    createUnidad,
    updateUnidad,
    deleteUnidad,
    updateUnidadesOrden,
    crearSubtema,
    actualizarSubtema,
    eliminarSubtema,
    obtenerSubtemas,
} = require("../controllers/unidadesController");
const { protect } = require("../middleware/authMiddleware");

// Rutas para las unidades del curso

// Obtener todas las unidades de un curso específico
router.get("/curso/:id_curso", protect, getUnidadesByCursoId);

// Crear una nueva unidad para un curso
router.post("/", protect, createUnidad);

// Actualizar el orden de múltiples unidades (ideal para drag-and-drop)
router.put("/orden", protect, updateUnidadesOrden);

// Actualizar una unidad existente por su ID
router.put("/:id", protect, updateUnidad);

// Eliminar una unidad por su ID
router.delete("/:id", protect, deleteUnidad);

router.post('/:idUnidad/subtemas', protect, crearSubtema);
router.put('/subtemas/:idSubtema', protect, actualizarSubtema);
router.delete('/subtemas/:idSubtema', protect, eliminarSubtema);
router.get('/:idUnidad/subtemas', protect, obtenerSubtemas);

module.exports = router;