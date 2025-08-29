const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const cache = require("../config/cache");
require("dotenv").config();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "0d86c1e9aaf0192c1234673d06d6ed452beb5ca2a12014cfa913818b114444bd7a6ee2c64fde53f98503a98a153754becdf0fe8ec53304adb233f0c4fec0bf31";

exports.verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token de autorización requerido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!["admin_universidad", "admin_sedeq"].includes(decoded.tipo_usuario)) {
      return res
        .status(403)
        .json({ error: "Acceso denegado: Solo administradores" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error("verifyAdmin: Error:", error.message);
    return res.status(401).json({ error: "Token inválido" });
  }
};

exports.getDomains = async (req, res) => {
  try {
    const db = await pool.getConnection();
    try {
      const [rows] = await db.execute(`
        SELECT d.id_dominio, d.dominio, d.estatus, d.id_universidad, u.nombre_universidad 
        FROM dominiosUniversidades d
        LEFT JOIN universidades u ON d.id_universidad = u.id_universidad
      `);
      res.json(rows);
    } finally {
      db.release();
    }
  } catch (error) {
    console.error("getDomains: Error:", error.message);
    res.status(500).json({ error: "Error al obtener dominios" });
  }
};

exports.addDomain = async (req, res) => {
  const { dominio, estatus, id_universidad } = req.body;

  if (!dominio) {
    return res.status(400).json({ error: "El dominio es requerido" });
  }
  if (estatus && !["activo", "inactivo"].includes(estatus)) {
    return res.status(400).json({ error: "Estado no válido" });
  }
  if (!id_universidad) {
    return res.status(400).json({ error: "La universidad es requerida" });
  }

  try {
    const db = await pool.getConnection();
    try {
      const [existing] = await db.execute(
        "SELECT * FROM dominiosUniversidades WHERE dominio = ?",
        [dominio],
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: "El dominio ya existe" });
      }

      const [result] = await db.execute(
        "INSERT INTO dominiosUniversidades (dominio, estatus, id_universidad) VALUES (?, ?, ?)",
        [dominio.toLowerCase(), estatus || "activo", id_universidad],
      );

      cache.clearDomainCache();

      res.status(201).json({
        message: "Dominio agregado exitosamente",
        id_dominio: result.insertId,
      });
    } finally {
      db.release();
    }
  } catch (error) {
    console.error("addDomain: Error:", error.message);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "El dominio ya existe" });
    }
    res.status(500).json({ error: "Error al agregar dominio" });
  }
};

exports.updateDomain = async (req, res) => {
  const { id } = req.params;
  const { dominio, estatus, id_universidad } = req.body;

  if (!dominio && !estatus && !id_universidad) {
    return res
      .status(400)
      .json({ error: "Se requiere al menos un campo para actualizar" });
  }
  if (estatus && !["activo", "inactivo"].includes(estatus)) {
    return res.status(400).json({ error: "Estado no válido" });
  }

  try {
    const db = await pool.getConnection();
    try {
      const [existing] = await db.execute(
        "SELECT * FROM dominiosUniversidades WHERE id_dominio = ?",
        [id],
      );
      if (existing.length === 0) {
        return res.status(404).json({ error: "Dominio no encontrado" });
      }

      const updates = [];
      const params = [];
      if (dominio) {
        updates.push("dominio = ?");
        params.push(dominio.toLowerCase());
      }
      if (estatus) {
        updates.push("estatus = ?");
        params.push(estatus);
      }
      if (id_universidad) {
        updates.push("id_universidad = ?");
        params.push(id_universidad);
      }
      params.push(id);

      await db.execute(
        `UPDATE dominiosUniversidades SET ${updates.join(", ")} WHERE id_dominio = ?`,
        params,
      );

      cache.clearDomainCache();

      res.json({ message: "Dominio actualizado exitosamente" });
    } finally {
      db.release();
    }
  } catch (error) {
    console.error("updateDomain: Error:", error.message);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "El dominio ya existe" });
    }
    res.status(500).json({ error: "Error al actualizar dominio" });
  }
};

exports.deleteDomain = async (req, res) => {
  const { id } = req.params;

  try {
    const db = await pool.getConnection();
    try {
      const [existing] = await db.execute(
        "SELECT * FROM dominiosUniversidades WHERE id_dominio = ?",
        [id],
      );
      if (existing.length === 0) {
        return res.status(404).json({ error: "Dominio no encontrado" });
      }

      await db.execute(
        "DELETE FROM dominiosUniversidades WHERE id_dominio = ?",
        [id],
      );

      cache.clearDomainCache();

      res.json({ message: "Dominio eliminado exitosamente" });
    } finally {
      db.release();
    }
  } catch (error) {
    console.error("deleteDomain: Error:", error.message);
    res.status(500).json({ error: "Error al eliminar dominio" });
  }
};

exports.clearDomainCache = cache.clearDomainCache;
