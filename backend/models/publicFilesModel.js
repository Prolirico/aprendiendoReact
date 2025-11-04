const pool = require("../config/db");
const path = require("path");

/**
 * Busca los metadatos de un documento (constancia o certificado) por su nombre de archivo.
 * @param {string} tipo - 'constancia' o 'certificado'.
 * @param {string} filename - El nombre del archivo del documento.
 * @returns {Promise<Object|null>} - El objeto con los metadatos del documento o null si no se encuentra.
 */
const findDocumentByFilename = async (tipo, filename) => {
  let query;
  const searchTerm = `%${path.basename(filename)}%`;

  if (tipo === "constancia") {
    query = `
      SELECT
        co.id_constancia AS id_documento,
        'constancia' AS tipo_documento,
        al.nombre_completo AS nombre_alumno,
        c.nombre_curso AS nombre_item,
        u.nombre AS nombre_universidad,
        co.fecha_emitida
      FROM constancia_alumno co
      INNER JOIN alumno al ON co.id_alumno = al.id_alumno
      INNER JOIN curso c ON co.id_curso = c.id_curso
      INNER JOIN universidad u ON c.id_universidad = u.id_universidad
      WHERE co.ruta_constancia LIKE ?
      LIMIT 1;
    `;
  } else if (tipo === "certificado") {
    query = `
      SELECT
        ca.id_cert_alumno AS id_documento,
        'certificado' AS tipo_documento,
        al.nombre_completo AS nombre_alumno,
        cert.nombre AS nombre_item,
        u.nombre AS nombre_universidad,
        ca.fecha_certificado AS fecha_emitida
      FROM certificacion_alumno ca
      INNER JOIN certificacion cert ON ca.id_certificacion = cert.id_certificacion
      INNER JOIN alumno al ON ca.id_alumno = al.id_alumno
      INNER JOIN universidad u ON cert.id_universidad = u.id_universidad
      WHERE ca.ruta_certificado LIKE ?
      LIMIT 1;
    `;
  } else {
    return null;
  }

  try {
    const [rows] = await pool.query(query, [searchTerm]);
    return rows[0] || null;
  } catch (error) {
    console.error("Error al buscar documento por filename:", error);
    throw error;
  }
};

module.exports = {
  findDocumentByFilename,
};
