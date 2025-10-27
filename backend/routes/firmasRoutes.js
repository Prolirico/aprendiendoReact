const express = require("express");
const router = express.Router();
const {
  subirFirma,
  obtenerFirmas,
  eliminarFirma,
  verificarFirmaExistente,
  reemplazarFirma,
} = require("../controllers/firmasController");
const { protect, admin } = require("../middleware/authMiddleware");

// Proteger todas las rutas de firmas para que solo los administradores puedan acceder
// El middleware 'admin' debería verificar si el rol es 'admin_sedeq' o 'admin_universidad'
router.use(protect, admin);

// Definir las rutas
router.route("/").post(subirFirma).get(obtenerFirmas);

// Verificar si existe una firma del mismo tipo
router.route("/verificar").get(verificarFirmaExistente);

// Reemplazar una firma existente
router.route("/reemplazar").post(reemplazarFirma);

router.route("/:id").delete(eliminarFirma);

module.exports = router;
