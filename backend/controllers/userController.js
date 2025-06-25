const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

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
    return res
      .status(400)
      .json({ error: "Username, email, and password are required" });
  }
  if (!validTipoUsuario.includes(tipo_usuario)) {
    return res.status(400).json({ error: "Invalid tipo_usuario" });
  }
  if (!validEstatus.includes(estatus)) {
    return res.status(400).json({ error: "Invalid estatus" });
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
        .json({ error: "Username or email already exists" });
    }
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res
      .status(400)
      .json({ error: "Login ID and password are required" });
  }

  try {
    const db = await pool.getConnection();
    try {
      const [rows] = await db.execute(
        "SELECT * FROM usuario WHERE username = ? OR email = ?",
        [loginId, loginId],
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: "User not found" });
      }

      const user = rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
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
