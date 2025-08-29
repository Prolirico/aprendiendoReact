const express = require("express");
const router = express.Router();
const {
  verifyAdmin,
  getDomains,
  addDomain,
  updateDomain,
  deleteDomain,
} = require("../controllers/domainController");

// Aplicamos el middleware verifyAdmin a todas las rutas de dominios
// para asegurar que solo los administradores puedan acceder.
router.use(verifyAdmin);

// Definimos las rutas para el CRUD de Dominios
router.get("/", getDomains);
router.post("/", addDomain);
router.put("/:id", updateDomain);
router.delete("/:id", deleteDomain);

module.exports = router;

