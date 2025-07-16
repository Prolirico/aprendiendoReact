const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const domainController = require("../controllers/domainController");

router.get("/usuarios", userController.getUsers); // Ruta para obtener usuarios (incluyendo administradores)
router.post("/usuarios", userController.createUser); // Ruta para crear nuevos usuarios (incluye admins)
router.put("/usuarios/:id", userController.updateUser); // Ruta para actualizar usuarios
router.delete("/usuarios/:id", userController.deleteUser); // Ruta para eliminar usuarios
router.post("/auth/google", userController.googleAuth);
router.post("/auth/google-signup", userController.googleSignUp);
router.post("/admin_login", userController.login);

router.get(
  "/admin/domains",
  domainController.verifyAdmin,
  domainController.getDomains,
);
router.post(
  "/admin/domains",
  domainController.verifyAdmin,
  domainController.addDomain,
);
router.put(
  "/admin/domains/:id",
  domainController.verifyAdmin,
  domainController.updateDomain,
);
router.delete(
  "/admin/domains/:id",
  domainController.verifyAdmin,
  domainController.deleteDomain,
);

module.exports = router;
