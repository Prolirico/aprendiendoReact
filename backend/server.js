const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
require("dotenv").config(); // Para cargar variables de entorno

const app = express();
app.use(express.json());
app.use(cors());

// Servir archivos estáticos (para los logos)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas
const userRoutes = require("./routes/userRoutes");
const universidadRoutes = require("./routes/universidadRoutes");
const maestroRoutes = require("./routes/maestroRoutes"); // Importar rutas de maestros

app.use("/api", userRoutes);
app.use("/api/universidades", universidadRoutes);
app.use("/api/maestros", maestroRoutes); // Usar rutas de maestros

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// El pool de conexiones ahora se importa desde su propio módulo en config/db.js
const pool = require("./config/db");

// Clave JWT desde variable de entorno
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "0d86c1e9aaf0192c1234673d06d6ed452beb5ca2a12014cfa913818b114444bd7a6ee2c64fde53f98503a98a153754becdf0fe8ec53304adb233f0c4fec0bf31";

// Validar tipo_usuario y estatus
const validTipoUsuario = [
  "alumno",
  "maestro",
  "admin_universidad",
  "admin_sedeq",
];
const validEstatus = ["activo", "inactivo", "pendiente", "suspendido"];

// Middleware para manejar errores
const handleError = (res, error, message = "Server error") => {
  console.error(error);
  res.status(500).json({ error: message });
};

// Signup endpoint
app.post("/signup", async (req, res) => {
  const { username, email, password, tipo_usuario, estatus } = req.body;

  // Validaciones
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
      // Verificar si username o email ya existen
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
      db.release(); // Liberar la conexión al pool
    }
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }
    handleError(res, error, "Registration failed");
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Validaciones
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const db = await pool.getConnection();
    try {
      const [rows] = await db.execute(
        "SELECT * FROM usuario WHERE username = ?",
        [username],
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
      res.json({ message: "Login successful", token });
    } finally {
      db.release(); // Liberar la conexión al pool
    }
  } catch (error) {
    handleError(res, error, "Login failed");
  }
});
