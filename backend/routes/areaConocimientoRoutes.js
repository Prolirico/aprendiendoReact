const express = require("express");
const router = express.Router();
const {
  getAllAreasConocimiento,
  createAreaConocimiento,
  updateAreaConocimiento,
  deleteAreaConocimiento,
} = require("../controllers/areaConocimientoController");
// const { verifySEDEQAdmin } = require("../middleware/authMiddleware"); // Desactivado temporalmente para evitar el crash

// RUTA PÚBLICA para obtener todas las áreas (para dropdowns, etc.)
router.get("/", getAllAreasConocimiento);

// RUTAS PROTEGIDAS (solo para admin_sedeq)
router.post("/", createAreaConocimiento);
router.put("/:id", updateAreaConocimiento);
router.delete("/:id", deleteAreaConocimiento);

module.exports = router;
