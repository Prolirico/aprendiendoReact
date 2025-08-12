const db = require("../config/db");

const Facultad = {
  /**
   * Crea una nueva facultad en la base de datos.
   * @param {object} newFacultad - Objeto con los datos de la facultad { id_universidad, nombre }.
   * @param {function} callback - Función de callback (err, result).
   */
  create: (newFacultad, callback) => {
    const query =
      "INSERT INTO facultades (id_universidad, nombre) VALUES (?, ?)";
    db.query(
      query,
      [newFacultad.id_universidad, newFacultad.nombre],
      (err, result) => {
        if (err) {
          console.error("Error al crear la facultad:", err);
          return callback(err, null);
        }
        // Devuelve el ID insertado junto con los datos originales
        callback(null, { id_facultad: result.insertId, ...newFacultad });
      },
    );
  },

  /**
   * Busca todas las facultades de una universidad específica.
   * @param {number} universityId - ID de la universidad.
   * @param {function} callback - Función de callback (err, results).
   */
  findByUniversityId: (universityId, callback) => {
    const query =
      "SELECT * FROM facultades WHERE id_universidad = ? ORDER BY nombre ASC";
    db.query(query, [universityId], (err, results) => {
      if (err) {
        console.error("Error al buscar facultades por ID de universidad:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  /**
   * Actualiza una facultad existente.
   * @param {number} id_facultad - ID de la facultad a actualizar.
   * @param {object} facultadData - Datos a actualizar { nombre }.
   * @param {function} callback - Función de callback (err, result).
   */
  update: (id_facultad, facultadData, callback) => {
    const query =
      "UPDATE facultades SET nombre = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_facultad = ?";
    db.query(query, [facultadData.nombre, id_facultad], (err, result) => {
      if (err) {
        console.error("Error al actualizar la facultad:", err);
        return callback(err, null);
      }
      callback(null, result);
    });
  },

  /**
   * Elimina una facultad de la base de datos.
   * @param {number} id_facultad - ID de la facultad a eliminar.
   * @param {function} callback - Función de callback (err, result).
   */
  remove: (id_facultad, callback) => {
    // La FK en la tabla `carreras` tiene `ON DELETE CASCADE`, por lo que las carreras asociadas se eliminarán automáticamente.
    const query = "DELETE FROM facultades WHERE id_facultad = ?";
    db.query(query, [id_facultad], (err, result) => {
      if (err) {
        console.error("Error al eliminar la facultad:", err);
        return callback(err, null);
      }
      callback(null, result);
    });
  },
};

module.exports = Facultad;
