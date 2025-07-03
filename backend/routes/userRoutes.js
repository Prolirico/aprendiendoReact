const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const domainController = require("../controllers/domainController");

router.get("/users", userController.getUsers);
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
