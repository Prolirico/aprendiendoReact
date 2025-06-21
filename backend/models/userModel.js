// backend/models/userModel.js
const db = require("../config/db");

class User {
  static getAllUsers() {
    return new Promise((resolve, reject) => {
      db.query("SELECT * FROM users", (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  }
}

module.exports = User;
