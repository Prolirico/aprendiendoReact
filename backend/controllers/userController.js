const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const mysql = require("mysql2/promise");
require("dotenv").config();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "0d86c1e9aaf0192c1234673d06d6ed452beb5ca2a12014cfa913818b114444bd7a6ee2c64fde53f98503a98a153754becdf0fe8ec53304adb233f0c4fec0bf31";

const validTipoUsuario = [
  "alumno",
  "maestro",
  "admin_universidad",
  "admin_sedeq",
];

const validEstatus = ["activo", "inactivo", "pendiente", "suspendido"];

const UNIVERSIDADES_QUERETARO = [
  "upsrj.edu.mx",
  "upq.mx",
  "utcorregidora.edu.mx",
  "utsrj.edu.mx",
  "uteq.edu.mx",
  "soyunaq.mx",
  "unaq.mx",
  "queretaro.tecnm.mx",
  "uaq.mx",
];

const esCorreoInstitucional = (email) => {
  const dominio = email.split("@")[1]?.toLowerCase();
  return UNIVERSIDADES_QUERETARO.includes(dominio);
};

exports.getUsers = async (req, res) => {
  try {
    const db = await pool.getConnection();
    try {
      const [rows] = await db.execute("SELECT * FROM usuario");
      res.json(rows);
    } finally {
      db.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching users" });
  }
};

exports.signup = async (req, res) => {
  const { username, email, password, tipo_usuario, estatus } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      error: "Nombre de usuario, correo, y contraseña son requeridos",
    });
  }
  if (!validTipoUsuario.includes(tipo_usuario)) {
    return res.status(400).json({ error: "Tipo de usuario no válido" });
  }
  if (!validEstatus.includes(estatus)) {
    return res.status(400).json({ error: "Estado no válido" });
  }

  try {
    const db = await pool.getConnection();
    try {
      const [existingUser] = await db.execute(
        "SELECT * FROM usuario WHERE username = ? OR email = ?",
        [username, email],
      );
      if (existingUser.length > 0) {
        return res
          .status(400)
          .json({ error: "Username or email already exists" });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const [result] = await db.execute(
        "INSERT INTO usuario (username, email, password_hash, tipo_usuario, estatus) VALUES (?, ?, ?, ?, ?)",
        [
          username,
          email,
          password_hash,
          tipo_usuario || "alumno",
          estatus || "pendiente",
        ],
      );

      res.status(201).json({
        message: "User registered successfully",
        userId: result.insertId,
      });
    } finally {
      db.release();
    }
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ error: "Usuario o correo electrónico ya existen" });
    }
    console.error(error);
    res.status(500).json({ error: "Registro fallido" });
  }
};

exports.login = async (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res
      .status(400)
      .json({ error: "ID de usuario y contraseña son requeridos" });
  }

  try {
    const db = await pool.getConnection();
    try {
      const [rows] = await db.execute(
        "SELECT * FROM usuario WHERE username = ? OR email = ?",
        [loginId, loginId],
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: "Usuario no encontrado" });
      }

      const user = rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return res
          .status(401)
          .json({ error: "Usuario o contraseña incorrectos" });
      }

      const token = jwt.sign(
        {
          id_usuario: user.id_usuario,
          username: user.username,
          tipo_usuario: user.tipo_usuario,
        },
        JWT_SECRET,
        { expiresIn: "1h" },
      );

      await db.execute(
        "INSERT INTO sesiones_usuario (id_usuario, fecha_login, estatus_sesion) VALUES (?, NOW(), 'activa')",
        [user.id_usuario],
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id_usuario: user.id_usuario,
          username: user.username,
          tipo_usuario: user.tipo_usuario,
        },
      });
    } finally {
      db.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.googleSignUp = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Google token es requerido" });
  }

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    if (!esCorreoInstitucional(email)) {
      return res.status(403).json({
        error:
          "Correo no institucional. Usa un correo de una universidad de Querétaro.",
      });
    }

    const db = await pool.getConnection();
    try {
      const [existingUser] = await db.execute(
        "SELECT * FROM usuario WHERE email = ? OR google_id = ?",
        [email, googleId],
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Usuario ya registrado" });
      }

      const username = name || email.split("@")[0];
      const [result] = await db.execute(
        "INSERT INTO usuario (username, email, google_id, tipo_usuario, estatus) VALUES (?, ?, ?, ?, ?)",
        [username, email, googleId, "alumno", "pendiente"],
      );

      const token = jwt.sign(
        {
          id_usuario: result.insertId,
          username,
          tipo_usuario: "alumno",
        },
        JWT_SECRET,
        { expiresIn: "1h" },
      );

      await db.execute(
        "INSERT INTO sesiones_usuario (id_usuario, fecha_login, estatus_sesion) VALUES (?, NOW(), 'activa')",
        [result.insertId],
      );

      res.status(200).json({
        message: "Google Sign-Up successful",
        token,
        user: {
          id_usuario: result.insertId,
          username,
          tipo_usuario: "alumno",
        },
      });
    } finally {
      db.release();
    }
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.message.includes("Token de Google inválido")
    ) {
      return res.status(401).json({ error: "Token de Google inválido" });
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Usuario ya registrado" });
    }
    console.error("Error en Google Sign-Up:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
