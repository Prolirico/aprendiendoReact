// backend/controllers/userController.js
const db = require("../config/db"); // Asegúrate de crear un archivo de configuración para la base de datos

exports.getUsers = (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
};
