const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config(); // Para cargar variables de entorno

const app = express();
app.use(express.json());
app.use(cors());

// Rutas
const userRoutes = require("./routes/userRoutes");
app.use("/api", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`),
);

// Configuración LOCAL
const dbConfig = {
  host: "localhost",
  port: 3306,
  user: "Axel",
  password: "$Yy@pJB5Poqs", // Reemplaza con tu contraseña real o usa .env
  database: "microCredenciales",
  connectionLimit: 10, // Número máximo de conexiones en el pool
};
{
  /*
// COnfiguracion Servidor
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
};
*/
}
// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Database connected successfully");
    connection.release();
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error);
  });

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
