const express = require("express");
const router = express.Router();
const facultadController = require("../controllers/facultadController");

// Middleware de autenticación (si es necesario, se puede agregar aquí)
// const authMiddleware = require('../middleware/auth');

/**
 * @route   POST /api/facultades
 * @desc    Crear una nueva facultad
 * @access  Private (se asume que se necesitará autenticación)
 */
router.post("/", facultadController.createFacultad);

/**
 * @route   GET /api/facultades/universidad/:idUniversidad
 * @desc    Obtener todas las facultades de una universidad
 * @access  Public or Private
 */
router.get(
  "/universidad/:idUniversidad",
  facultadController.getFacultadesByUniversidad,
);

/**
 * @route   PUT /api/facultades/:id
 * @desc    Actualizar una facultad por su ID
 * @access  Private
 */
router.put("/:id", facultadController.updateFacultad);

/**
 * @route   DELETE /api/facultades/:id
 * @desc    Eliminar una facultad por su ID
 * @access  Private
 */
router.delete("/:id", facultadController.deleteFacultad);

module.exports = router;
