const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const {
    getAllConvocatorias,
    getConvocatoriaById,
    createConvocatoria,
    updateConvocatoria,
    deleteConvocatoria,
    getEstadoGeneralAlumno,
    solicitarInscripcionConvocatoria,
} = require("../controllers/convocatoriaController");

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "0d86c1e9aaf0192c1234673d06d6ed452beb5ca2a12014cfa913818b114444bd7a6ee2c64fde53f98503a98a153754becdf0fe8ec53304adb233f0c4fec0bf31";

// Middleware para verificar que el usuario es un administrador de SEDEQ.
const verifySEDEQAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({
                error: "Acceso denegado. Formato de token inválido o no proporcionado.",
            });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        if (req.user.tipo_usuario !== "admin_sedeq") {
            return res
                .status(403)
                .json({
                    error:
                        "Acceso prohibido. No tienes los permisos necesarios para esta acción.",
                });
        }
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res
                .status(401)
                .json({ error: "Token expirado. Por favor, inicia sesión de nuevo." });
        }
        res.status(401).json({ error: "Token no válido." });
    }
};

// Middleware para verificar que el usuario es un alumno.
const verifyAlumno = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({
                error: "Acceso denegado. Formato de token inválido o no proporcionado.",
            });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        if (req.user.tipo_usuario !== "alumno") {
            return res
                .status(403)
                .json({
                    error:
                        "Acceso prohibido. Solo los alumnos pueden realizar esta acción.",
                });
        }
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res
                .status(401)
                .json({ error: "Token expirado. Por favor, inicia sesión de nuevo." });
        }
        res.status(401).json({ error: "Token no válido." });
    }
};

// --- Definición de Rutas ---

// Rutas públicas
router.get("/", getAllConvocatorias);
router.get("/:id", getConvocatoriaById);
// Rutas protegidas (solo para admin_sedeq)
router.post("/", verifySEDEQAdmin, createConvocatoria);
router.put("/:id", verifySEDEQAdmin, updateConvocatoria);
router.delete("/:id", verifySEDEQAdmin, deleteConvocatoria);

module.exports = router;

// --- Rutas para Alumnos ---
router.get("/alumno/estado-general", verifyAlumno, getEstadoGeneralAlumno);
router.post("/:id/solicitar", verifyAlumno, solicitarInscripcionConvocatoria);

module.exports = router;
