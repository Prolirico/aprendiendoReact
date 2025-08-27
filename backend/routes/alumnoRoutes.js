const express = require("express");
const router = express.Router();
const alumnoController = require("../controllers/alumnoController");

router.post("/complete-profile", alumnoController.completeStudentProfile);

module.exports = router;
