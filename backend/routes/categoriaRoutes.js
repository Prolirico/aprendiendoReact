const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const {
  getAllCategorias,
  getActiveCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} = require("../controllers/categoriaController");

// La clave secreta debe ser la misma que usas para firmar los tokens en server.js
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "0d86c1e9aaf0192c1234673d06d6ed452beb5ca2a12014cfa913818b114444bd7a6ee2c64fde53f98503a98a153754becdf0fe8ec53304adb233f0c4fec0bf31";

/**
 * Middleware para verificar que el usuario es un administrador de SEDEQ.
 * Se ejecutará antes de cualquier controlador de ruta que requiera estos permisos.
 */
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
    // Verificamos y decodificamos el token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Adjuntamos la información del usuario al objeto `req` para uso posterior
    req.user = decoded;

    // Comprobamos si el rol del usuario es el requerido
    if (req.user.tipo_usuario !== "admin_sedeq") {
      return res
        .status(403)
        .json({
          error:
            "Acceso prohibido. No tienes los permisos necesarios para esta acción.",
        });
    }

    // Si todo está correcto, pasamos al siguiente middleware o al controlador
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

// RUTA PÚBLICA (o para cualquier usuario autenticado)
// Obtiene solo las categorías activas. Ideal para llenar los <select> en los formularios.
router.get("/activas", getActiveCategorias);

// RUTAS PROTEGIDAS (solo para admin_sedeq)

// Obtiene TODAS las categorías, incluyendo las 'inactivas'.
// Ideal para la tabla de gestión principal del administrador.
router.get("/", verifySEDEQAdmin, getAllCategorias);

// Crea una nueva categoría.
router.post("/", verifySEDEQAdmin, createCategoria);

// Actualiza una categoría existente (nombre, descripción, estatus, etc.).
router.put("/:id", verifySEDEQAdmin, updateCategoria);

// Desactiva una categoría (soft delete).
router.delete("/:id", verifySEDEQAdmin, deleteCategoria);

module.exports = router;
