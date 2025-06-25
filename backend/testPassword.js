const bcrypt = require("bcryptjs");
const pool = require("./config/db");

async function testPassword() {
  const username = "sedeq1"; // Cambia por cada usuario para probar
  const password = "Password123";

  try {
    const db = await pool.getConnection();
    const [rows] = await db.execute(
      "SELECT password_hash FROM usuario WHERE username = ?",
      [username],
    );
    db.release();

    if (rows.length === 0) {
      console.log(`Usuario ${username} no encontrado`);
      return;
    }

    const isValid = await bcrypt.compare(password, rows[0].password_hash);
    console.log(`Contraseña válida para ${username}: ${isValid}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

testPassword();
