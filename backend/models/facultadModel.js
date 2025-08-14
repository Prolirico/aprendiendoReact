const db = require("../config/db");

const Facultad = {
  /**
   * Crea una nueva facultad en la base de datos.
   * @param {object} newFacultad - Objeto con los datos de la facultad { id_universidad, nombre }.
   * @returns {Promise<object>} - El objeto de la facultad creada.
   */
  create: async (newFacultad) => {
    const query =
      "INSERT INTO facultades (id_universidad, nombre) VALUES (?, ?)";
    try {
      const [result] = await db.query(query, [
        newFacultad.id_universidad,
        newFacultad.nombre,
      ]);
      return { id_facultad: result.insertId, ...newFacultad };
    } catch (err) {
      console.error("Error al crear la facultad:", err);
      throw err;
    }
  },

  /**
   * Busca todas las facultades de una universidad específica.
   * @param {number} universityId - ID de la universidad.
   * @returns {Promise<Array>} - Un array de facultades.
   */
  findByUniversityId: async (universityId) => {
    const query =
      "SELECT * FROM facultades WHERE id_universidad = ? ORDER BY nombre ASC";
    try {
      const [results] = await db.query(query, [universityId]);
      return results;
    } catch (err) {
      console.error("Error al buscar facultades por ID de universidad:", err);
      throw err;
    }
  },

  /**
   * Actualiza una facultad existente.
   * @param {number} id_facultad - ID de la facultad a actualizar.
   * @param {object} facultadData - Datos a actualizar { nombre }.
   * @returns {Promise<object>} - El resultado de la actualización.
   */
  update: async (id_facultad, facultadData) => {
    const query =
      "UPDATE facultades SET nombre = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_facultad = ?";
    try {
      const [result] = await db.query(query, [
        facultadData.nombre,
        id_facultad,
      ]);
      return result;
    } catch (err) {
      console.error("Error al actualizar la facultad:", err);
      throw err;
    }
  },

  /**
   * Elimina una facultad de la base de datos.
   * @param {number} id_facultad - ID de la facultad a eliminar.
   * @returns {Promise<object>} - El resultado de la eliminación.
   */
  remove: async (id_facultad) => {
    const query = "DELETE FROM facultades WHERE id_facultad = ?";
    try {
      const [result] = await db.query(query, [id_facultad]);
      return result;
    } catch (err) {
      console.error("Error al eliminar la facultad:", err);
      throw err;
    }
  },
};

module.exports = Facultad;