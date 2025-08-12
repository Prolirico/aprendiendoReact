const db = require("../config/db");

const Carrera = {
  /**
   * Crea una nueva carrera en la base de datos.
   * @param {object} newCarrera - Objeto con los datos de la carrera.
   * @param {function} callback - Función de callback (err, result).
   */
  create: (newCarrera, callback) => {
    const query =
      "INSERT INTO carreras (id_facultad, nombre, clave_carrera, duracion_anos) VALUES (?, ?, ?, ?)";
    db.query(
      query,
      [
        newCarrera.id_facultad,
        newCarrera.nombre,
        newCarrera.clave_carrera,
        newCarrera.duracion_anos,
      ],
      (err, result) => {
        if (err) {
          console.error("Error al crear la carrera:", err);
          return callback(err, null);
        }
        callback(null, { id_carrera: result.insertId, ...newCarrera });
      },
    );
  },

  /**
   * Busca todas las carreras de una facultad específica.
   * @param {number} facultadId - ID de la facultad.
   * @param {function} callback - Función de callback (err, results).
   */
  findByFacultadId: (facultadId, callback) => {
    const query =
      "SELECT * FROM carreras WHERE id_facultad = ? ORDER BY nombre ASC";
    db.query(query, [facultadId], (err, results) => {
      if (err) {
        console.error("Error al buscar carreras por ID de facultad:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  /**
   * Actualiza una carrera existente.
   * @param {number} id_carrera - ID de la carrera a actualizar.
   * @param {object} carreraData - Datos a actualizar.
   * @param {function} callback - Función de callback (err, result).
   */
  update: (id_carrera, carreraData, callback) => {
    const query =
      "UPDATE carreras SET nombre = ?, clave_carrera = ?, duracion_anos = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_carrera = ?";
    db.query(
      query,
      [
        carreraData.nombre,
        carreraData.clave_carrera,
        carreraData.duracion_anos,
        id_carrera,
      ],
      (err, result) => {
        if (err) {
          console.error("Error al actualizar la carrera:", err);
          return callback(err, null);
        }
        callback(null, result);
      },
    );
  },

  /**
   * Elimina una carrera de la base de datos.
   * @param {number} id_carrera - ID de la carrera a eliminar.
   * @param {function} callback - Función de callback (err, result).
   */
  remove: (id_carrera, callback) => {
    const query = "DELETE FROM carreras WHERE id_carrera = ?";
    db.query(query, [id_carrera], (err, result) => {
      if (err) {
        console.error("Error al eliminar la carrera:", err);
        return callback(err, null);
      }
      callback(null, result);
    });
  },
};

module.exports = Carrera;
