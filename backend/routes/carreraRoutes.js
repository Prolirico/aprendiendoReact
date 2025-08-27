const express = require("express");
const router = express.Router();
const carreraController = require("../controllers/carreraController");

// Middleware de autenticación (si es necesario, se puede agregar aquí)
// const authMiddleware = require('../middleware/auth');

/**
 * @route   POST /api/carreras
 * @desc    Crear una nueva carrera
 * @access  Private (se asume que se necesitará autenticación)
 */
router.post("/", carreraController.createCarrera);

/**
 * @route   GET /api/carreras/facultad/:idFacultad
 * @desc    Obtener todas las carreras de una facultad
 * @access  Public or Private
 */
router.get("/facultad/:idFacultad", carreraController.getCarrerasByFacultad);

/**
 * @route   PUT /api/carreras/:id
 * @desc    Actualizar una carrera por su ID
 * @access  Private
 */
router.put("/:id", carreraController.updateCarrera);

/**
 * @route   DELETE /api/carreras/:id
 * @desc    Eliminar una carrera por su ID
 * @access  Private
 */
router.delete("/:id", carreraController.deleteCarrera);

/**
 * @route   GET /api/carreras/by-universidad/:id_universidad
 * @desc    Obtener carreras por ID de universidad
 * @access  Public
 */
router.get("/by-universidad/:id_universidad", carreraController.getCarrerasByUniversidad);

module.exports = router;
