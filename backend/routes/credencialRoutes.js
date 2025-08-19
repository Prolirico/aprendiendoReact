// backend/routes/credencialRoutes.js
const express = require("express");
const router = express.Router();
const {
    getAllCredenciales,
    getCredencialById,
    createCredencial,
    updateCredencial,
    deleteCredencial,
} = require("../controllers/credencialController");

// Rutas para /api/credenciales
router.route("/")
    .get(getAllCredenciales)
    .post(createCredencial);

// Rutas para /api/credenciales/:id
router.route("/:id")
    .get(getCredencialById)
    .put(updateCredencial)
    .delete(deleteCredencial);

module.exports = router;
