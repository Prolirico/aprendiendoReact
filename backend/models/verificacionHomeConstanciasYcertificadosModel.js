const pool = require("../config/db");

/**
 * Busca un alumno por su matrícula y el ID de su universidad.
 * @param {string} matricula - La matrícula del alumno.
 * @param {number} id_universidad - El ID de la universidad.
 * @returns {Promise<Object|null>} - El objeto del alumno si se encuentra, o null.
 */
const findAlumnoByMatriculaAndUniversidad = async (
  matricula,
  id_universidad
) => {
  const query = `
    SELECT
      al.id_alumno,
      al.nombre_completo,
      u.nombre AS nombre_universidad
    FROM alumno al
    INNER JOIN universidad u ON al.id_universidad = u.id_universidad
    WHERE al.matricula = ? AND al.id_universidad = ?
    LIMIT 1;
  `;

  try {
    const [rows] = await pool.query(query, [matricula, id_universidad]);
    return rows[0] || null;
  } catch (error) {
    console.error(
      "Error al buscar alumno por matrícula y universidad:",
      error
    );
    throw error;
  }
};

module.exports = {
  findAlumnoByMatriculaAndUniversidad,
};
