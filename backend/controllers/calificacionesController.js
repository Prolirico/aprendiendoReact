const pool = require("../config/db");

// @desc    Crear o actualizar la configuración de calificación de un curso y sus actividades
// @route   POST /api/calificaciones
// @access  Private (SEDEQ/Admin)
const upsertCalificacionCurso = async (req, res) => {
  const { id_curso, umbral_aprobatorio, actividades } = req.body;

  if (!id_curso || !umbral_aprobatorio || !actividades) {
    return res.status(400).json({ error: "Faltan datos requeridos." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Paso 1: Insertar o actualizar en `calificaciones_curso`
    const upsertCursoQuery = `
      INSERT INTO calificaciones_curso (id_curso, umbral_aprobatorio)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE umbral_aprobatorio = VALUES(umbral_aprobatorio)
    `;
    await connection.query(upsertCursoQuery, [id_curso, umbral_aprobatorio]);

    // Obtener el ID de la configuración de calificación (ya sea nueva o existente)
    const [califCursoRows] = await connection.query(
      "SELECT id_calificaciones FROM calificaciones_curso WHERE id_curso = ?",
      [id_curso]
    );
    const id_calificaciones_curso = califCursoRows[0].id_calificaciones;

    // Paso 2: Borrar las actividades antiguas para este curso para evitar duplicados
    await connection.query(
      "DELETE FROM calificaciones_actividades WHERE id_calificaciones_curso = ?",
      [id_calificaciones_curso]
    );

    // Paso 3: Si hay nuevas actividades, insertarlas
    if (actividades && actividades.length > 0) {
      const allowedTypes = ['pdf', 'link'];
      const actividadesValues = actividades.map(act => {
        // Validación de seguridad en el backend
        const tiposValidos = act.tipos_permitidos.every(tipo => allowedTypes.includes(tipo));
        if (!tiposValidos) {
          throw new Error(`Tipo de archivo no permitido en la actividad: ${act.nombre}`);
        }

        return [
          id_calificaciones_curso,
          act.nombre,
          act.porcentaje,
          act.fecha_limite || null,
          act.max_archivos,
          act.max_tamano_mb,
          JSON.stringify(act.tipos_permitidos) // Guardamos el array como un string JSON
        ];
      });

      const insertActividadesQuery = `
        INSERT INTO calificaciones_actividades (id_calificaciones_curso, nombre, porcentaje, fecha_limite, max_archivos, max_tamano_mb, tipos_archivo_permitidos)
        VALUES ?
      `;
      await connection.query(insertActividadesQuery, [actividadesValues]);
    }

    await connection.commit();
    res.status(200).json({ message: "Configuración de calificación guardada con éxito." });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error al guardar la configuración de calificación:", error);
    res.status(500).json({ error: "Error interno del servidor al guardar la configuración." });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { upsertCalificacionCurso };