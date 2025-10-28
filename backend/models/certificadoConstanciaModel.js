const pool = require("../config/db");

/**
 * Obtiene los cursos del alumno donde puede generar constancias
 * @param {number} id_alumno - ID del alumno
 * @returns {Promise<Array>} - Lista de cursos con información completa
 */
const getCursosParaConstancias = async (id_alumno) => {
  const query = `
    SELECT
      -- Datos del alumno
      al.nombre_completo AS nombre_alumno,

      -- Total de actividades del curso
      (SELECT COUNT(*)
       FROM calificaciones_actividades a
       WHERE a.id_calificaciones_curso = cal.id_calificaciones
      ) AS total_actividades,

      -- Actividades entregadas y calificadas
      (SELECT COUNT(DISTINCT a.id_actividad)
       FROM entregas_estudiantes e
       INNER JOIN calificaciones_actividades a ON e.id_actividad = a.id_actividad
       WHERE e.id_inscripcion = i.id_inscripcion
       AND a.id_calificaciones_curso = cal.id_calificaciones
       AND e.estatus_entrega = 'calificada'
      ) AS actividades_calificadas,


      -- Datos del curso
      c.id_curso,
      c.nombre_curso,
      c.descripcion AS descripcion_curso,
      c.creditos_constancia AS creditos_otorgados,

      -- Datos de la universidad
      u.id_universidad,
      u.nombre AS nombre_universidad,
      u.logo_url AS logo_universidad,

      -- Calificación y aprobación
      cal.umbral_aprobatorio,
      COALESCE(
        (SELECT SUM(e.calificacion)
         FROM entregas_estudiantes e
         INNER JOIN calificaciones_actividades a ON e.id_actividad = a.id_actividad
         WHERE e.id_inscripcion = i.id_inscripcion
         AND e.estatus_entrega = 'calificada'
        ), 0
      ) AS calificacion_final,

      -- Información de constancia si ya existe
      co.id_constancia,
      co.ruta_constancia,
      co.fecha_emitida,

                  -- Información de credencial si aplica
                  rc.id_certificacion AS id_credencial,
                  (SELECT nombre FROM certificacion WHERE id_certificacion = rc.id_certificacion) AS nombre_credencial,
                  (SELECT descripcion FROM certificacion WHERE id_certificacion = rc.id_certificacion) AS descripcion_credencial,
                  (SELECT COUNT(*) FROM requisitos_certificado WHERE id_certificacion = rc.id_certificacion) AS total_cursos_credencial,
            -- Verificación de elegibilidad
            CASE
              WHEN co.id_constancia IS NOT NULL THEN FALSE        WHEN (
          -- Verifica si todas las actividades están calificadas
          (SELECT COUNT(*) FROM calificaciones_actividades
           WHERE id_calificaciones_curso = cal.id_calificaciones) =
          (SELECT COUNT(DISTINCT a.id_actividad)
           FROM entregas_estudiantes e
           INNER JOIN calificaciones_actividades a ON e.id_actividad = a.id_actividad
           WHERE e.id_inscripcion = i.id_inscripcion
           AND a.id_calificaciones_curso = cal.id_calificaciones
           AND e.estatus_entrega = 'calificada')
          AND
          -- Verifica si la calificación supera el umbral
          COALESCE(
            (SELECT SUM(e.calificacion)
             FROM entregas_estudiantes e
             INNER JOIN calificaciones_actividades a ON e.id_actividad = a.id_actividad
             WHERE e.id_inscripcion = i.id_inscripcion
             AND e.estatus_entrega = 'calificada'
            ), 0
          ) >= cal.umbral_aprobatorio
        ) THEN TRUE
        ELSE FALSE
      END AS puede_generar

    FROM inscripcion i
    INNER JOIN alumno al ON i.id_alumno = al.id_alumno
    INNER JOIN curso c ON i.id_curso = c.id_curso
    INNER JOIN universidad u ON c.id_universidad = u.id_universidad
    INNER JOIN calificaciones_curso cal ON c.id_curso = cal.id_curso
    LEFT JOIN constancia_alumno co ON co.id_alumno = i.id_alumno AND co.id_curso = c.id_curso
    LEFT JOIN requisitos_certificado rc ON rc.id_curso = c.id_curso
    WHERE i.id_alumno = ?
    AND i.estatus_inscripcion = 'aprobada'
    ORDER BY c.nombre_curso ASC
  `;

  const [rows] = await pool.query(query, [id_alumno]);
  return rows;
};
/**
 * Obtiene las credenciales del alumno donde puede generar certificados
 * @param {number} id_alumno - ID del alumno
 * @returns {Promise<Array>} - Lista de credenciales con información completa
 */
const getCredencialesParaCertificados = async (id_alumno) => {
  const query = `
    SELECT
      cert.id_certificacion AS id_credencial,
      cert.nombre AS nombre_credencial,
      cert.descripcion AS descripcion_credencial,
      u.id_universidad,
      u.nombre AS nombre_universidad,
      u.logo_url AS logo_universidad,

      -- Total de cursos requeridos
      (SELECT COUNT(*)
       FROM requisitos_certificado rc
       WHERE rc.id_certificacion = cert.id_certificacion
      ) AS total_cursos,

      -- Cursos completados (con constancia)
      (SELECT COUNT(*)
       FROM requisitos_certificado rc
       INNER JOIN constancia_alumno co ON co.id_curso = rc.id_curso AND co.id_alumno = ?
       WHERE rc.id_certificacion = cert.id_certificacion
      ) AS cursos_completados,

      -- Verificar si ya tiene certificado generado
      ca.id_cert_alumno AS id_certificacion_alumno,
      ca.ruta_certificado,
      ca.fecha_certificado,
      ca.completada,

      -- Verificar si puede generar (todos los cursos con constancia)
      CASE
        WHEN ca.id_cert_alumno IS NOT NULL AND ca.completada = 1 THEN FALSE
        WHEN (
          (SELECT COUNT(*)
           FROM requisitos_certificado rc
           WHERE rc.id_certificacion = cert.id_certificacion
          ) =
          (SELECT COUNT(*)
           FROM requisitos_certificado rc
           INNER JOIN constancia_alumno co ON co.id_curso = rc.id_curso AND co.id_alumno = ?
           WHERE rc.id_certificacion = cert.id_certificacion
          )
          AND
          (SELECT COUNT(*)
           FROM requisitos_certificado rc
           WHERE rc.id_certificacion = cert.id_certificacion
          ) > 0
        ) THEN TRUE
        ELSE FALSE
      END AS puede_generar

    FROM certificacion cert
    INNER JOIN universidad u ON cert.id_universidad = u.id_universidad
    LEFT JOIN certificacion_alumno ca ON ca.id_certificacion = cert.id_certificacion AND ca.id_alumno = ?
    WHERE cert.estatus = 'activa'
    AND EXISTS (
      -- Solo mostrar credenciales donde el alumno tiene al menos un curso inscrito
      SELECT 1
      FROM requisitos_certificado rc
      INNER JOIN inscripcion i ON i.id_curso = rc.id_curso
      WHERE rc.id_certificacion = cert.id_certificacion
      AND i.id_alumno = ?
    )
    ORDER BY cert.nombre ASC
  `;

  const [rows] = await pool.query(query, [
    id_alumno,
    id_alumno,
    id_alumno,
    id_alumno,
  ]);
  return rows;
};

/**
 * Obtiene los cursos requeridos de una credencial con su estado de completitud
 * @param {number} id_credencial - ID de la credencial
 * @param {number} id_alumno - ID del alumno
 * @returns {Promise<Array>} - Lista de cursos con estado
 */
const getCursosDeCredencial = async (id_credencial, id_alumno) => {
  const query = `
    SELECT
      c.id_curso,
      c.nombre_curso,
      c.codigo_curso,
      rc.obligatorio,
      CASE
        WHEN co.id_constancia IS NOT NULL THEN TRUE
        ELSE FALSE
      END AS completado,
      co.creditos_otorgados,
      co.fecha_emitida
    FROM requisitos_certificado rc
    INNER JOIN curso c ON rc.id_curso = c.id_curso
    LEFT JOIN constancia_alumno co ON co.id_curso = c.id_curso AND co.id_alumno = ?
    WHERE rc.id_certificacion = ?
    ORDER BY rc.obligatorio DESC, c.nombre_curso ASC
  `;

  const [rows] = await pool.query(query, [id_alumno, id_credencial]);
  return rows;
};

/**
 * Crea un registro de constancia para un alumno
 * @param {Object} data - Datos de la constancia
 * @returns {Promise<Object>} - Constancia creada
 */
const crearConstancia = async (data) => {
  const {
    id_alumno,
    id_curso,
    id_credencial,
    creditos_otorgados,
    ruta_constancia,
  } = data;

  const query = `
    INSERT INTO constancia_alumno
    (id_alumno, id_curso, id_credencial, progreso, creditos_otorgados, ruta_constancia)
    VALUES (?, ?, ?, 100.00, ?, ?)
  `;

  const [result] = await pool.query(query, [
    id_alumno,
    id_curso,
    id_credencial || null,
    creditos_otorgados,
    ruta_constancia,
  ]);

  return {
    id_constancia: result.insertId,
    ...data,
  };
};

/**
 * Crea un registro de certificado para un alumno
 * @param {Object} data - Datos del certificado
 * @returns {Promise<Object>} - Certificado creado
 */
const crearCertificado = async (data) => {
  const {
    id_alumno,
    id_certificacion,
    calificacion_promedio,
    ruta_certificado,
    descripcion,
  } = data;

  const query = `
    INSERT INTO certificacion_alumno
    (id_alumno, id_certificacion, progreso, completada, fecha_completada,
     certificado_emitido, fecha_certificado, ruta_certificado,
     calificacion_promedio, descripcion_certificado)
    VALUES (?, ?, 100.00, 1, NOW(), 1, NOW(), ?, ?, ?)
  `;

  const [result] = await pool.query(query, [
    id_alumno,
    id_certificacion,
    ruta_certificado,
    calificacion_promedio || null,
    descripcion || null,
  ]);

  return {
    id_cert_alumno: result.insertId,
    ...data,
  };
};

/**
 * Obtiene información de una constancia por ID
 * @param {number} id_constancia - ID de la constancia
 * @returns {Promise<Object>} - Datos de la constancia
 */
const getConstanciaPorId = async (id_constancia) => {
  const query = `
    SELECT
      co.*,
      c.nombre_curso,
      c.codigo_curso,
      u_user.username AS nombre_alumno,
      u.nombre AS nombre_universidad,
      u.logo_url AS logo_universidad
    FROM constancia_alumno co
    INNER JOIN curso c ON co.id_curso = c.id_curso
    INNER JOIN alumno al ON co.id_alumno = al.id_alumno
    INNER JOIN usuario u_user ON al.id_usuario = u_user.id_usuario
    INNER JOIN universidad u ON c.id_universidad = u.id_universidad
    WHERE co.id_constancia = ?
  `;

  const [rows] = await pool.query(query, [id_constancia]);
  return rows[0];
};

/**
 * Obtiene información de un certificado por ID
 * @param {number} id_cert_alumno - ID del certificado
 * @returns {Promise<Object>} - Datos del certificado
 */
const getCertificadoPorId = async (id_cert_alumno) => {
  const query = `
    SELECT
      ca.*,
      cert.nombre AS nombre_credencial,
      cert.descripcion AS descripcion_credencial,
      u_user.username AS nombre_alumno,
      u.nombre AS nombre_universidad,
      u.logo_url AS logo_universidad
    FROM certificacion_alumno ca
    INNER JOIN certificacion cert ON ca.id_certificacion = cert.id_certificacion
    INNER JOIN alumno al ON ca.id_alumno = al.id_alumno
    INNER JOIN usuario u_user ON al.id_usuario = u_user.id_usuario
    INNER JOIN universidad u ON cert.id_universidad = u.id_universidad
    WHERE ca.id_cert_alumno = ?
  `;

  const [rows] = await pool.query(query, [id_cert_alumno]);
  return rows[0];
};

module.exports = {
  getCursosParaConstancias,
  getCredencialesParaCertificados,
  getCursosDeCredencial,
  crearConstancia,
  crearCertificado,
  getConstanciaPorId,
  getCertificadoPorId,
};
