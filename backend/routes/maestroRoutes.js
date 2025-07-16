const express = require("express");
const router = express.Router();
const maestroController = require("../controllers/maestroController");
// const authMiddleware = require('../middleware/authMiddleware'); // Si necesitas autenticación y autorización

// Rutas para la gestión de maestros
// Aplica middleware de autenticación/autorización si es necesario
router.get("/", maestroController.getMaestros);
router.post("/", maestroController.createMaestro);
router.put("/:id", maestroController.updateMaestro);
router.delete("/:id", maestroController.deleteMaestro);

module.exports = router;
