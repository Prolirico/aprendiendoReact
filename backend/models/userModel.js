const pool = require("../config/db");
const bcrypt = require("bcryptjs");

class User {
  /**
   * Finds or creates a university administrator and associates them with a university.
   * This is designed to be run within a database transaction.
   * @param {number} id_universidad - The ID of the university.
   * @param {string} email - The email for the admin user.
   * @param {string|null} password - The new password. If null/empty, password is not updated.
   * @param {object} connection - The database connection from the transaction pool.
   * @returns {Promise<void>}
   */
  static async createOrUpdateAdmin(
    id_universidad,
    email,
    password,
    connection,
  ) {
    if (!email) {
      // If no email is provided, we don't create or update a user.
      // This can happen if a university is updated without changing admin details.
      return;
    }

    // Check for an existing admin for this university
    const [existingAdmins] = await connection.execute(
      "SELECT id_usuario, email FROM usuario WHERE id_universidad = ? AND tipo_usuario = 'admin_universidad'",
      [id_universidad],
    );

    if (existingAdmins.length > 0) {
      // Admin exists, update them
      const admin = existingAdmins[0];
      const updates = [];
      const values = [];

      if (email !== admin.email) {
        updates.push("email = ?");
        values.push(email);
        // Also update username to keep it consistent
        updates.push("username = ?");
        values.push(email);
      }

      if (password) {
        const password_hash = await bcrypt.hash(password, 10);
        updates.push("password_hash = ?");
        values.push(password_hash);
      }

      if (updates.length > 0) {
        values.push(admin.id_usuario);
        const sql = `UPDATE usuario SET ${updates.join(
          ", ",
        )} WHERE id_usuario = ?`;
        await connection.execute(sql, values);
      }
    } else {
      // No admin exists, create a new one
      if (!password) {
        throw new Error(
          "Password is required to create a new administrator user.",
        );
      }
      const password_hash = await bcrypt.hash(password, 10);
      await connection.execute(
        "INSERT INTO usuario (username, email, password_hash, tipo_usuario, estatus, id_universidad) VALUES (?, ?, ?, ?, ?, ?)",
        [
          email, // Use email as the username by default
          email,
          password_hash,
          "admin_universidad",
          "activo", // New admins are active by default
          id_universidad,
        ],
      );
    }
  }

  /**
   * Finds a user by their email.
   * @param {string} email - The user's email.
   * @returns {Promise<object|null>} The user object or null.
   */
  static async findByEmail(email) {
    const [rows] = await pool.execute("SELECT * FROM usuario WHERE email = ?", [
      email,
    ]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Finds a user by their ID.
   * @param {number} id - The user's ID.
   * @returns {Promise<object|null>} The user object or null.
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      "SELECT * FROM usuario WHERE id_usuario = ?",
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Deletes the admin user associated with a specific university.
   * To be used within a transaction.
   * @param {number} id_universidad - The ID of the university whose admin should be deleted.
   * @param {object} connection - The database connection from the transaction pool.
   * @returns {Promise<object>} The result of the delete operation.
   */
  static async deleteAdminByUniversityId(id_universidad, connection) {
    const [result] = await connection.execute(
      "DELETE FROM usuario WHERE id_universidad = ? AND tipo_usuario = 'admin_universidad'",
      [id_universidad],
    );
    return result;
  }
}

module.exports = User;
