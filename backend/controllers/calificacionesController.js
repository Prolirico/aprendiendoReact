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
      [id_curso],
    );
    const id_calificaciones_curso = califCursoRows[0].id_calificaciones;

    // Paso 2: Procesar actividades (Upsert: Update, Insert, Delete)
    const idsActividadesRecibidas = [];

    if (actividades && actividades.length > 0) {
      const allowedTypes = ["pdf", "link"];

      for (const act of actividades) {
        // Validar que tipos_permitidos existe y es un array
        const tiposPermitidos = act.tipos_permitidos ||
          act.tipos_archivo_permitidos || ["pdf", "link"];
        const tiposArray = Array.isArray(tiposPermitidos)
          ? tiposPermitidos
          : JSON.parse(tiposPermitidos || '["pdf", "link"]');

        const tiposValidos = tiposArray.every((tipo) =>
          allowedTypes.includes(tipo),
        );
        if (!tiposValidos) {
          throw new Error(
            `Tipo de archivo no permitido en la actividad: ${act.nombre}`,
          );
        }

        if (act.id_actividad) {
          // --- UPDATE ---
          // Es una actividad existente, la actualizamos
          idsActividadesRecibidas.push(act.id_actividad);
          const updateQuery = `
            UPDATE calificaciones_actividades SET
              nombre = ?, porcentaje = ?, fecha_limite = ?, max_archivos = ?, max_tamano_mb = ?, tipos_archivo_permitidos = ?
            WHERE id_actividad = ? AND id_calificaciones_curso = ?
          `;
          await connection.query(updateQuery, [
            act.nombre,
            act.porcentaje,
            act.fecha_limite || null,
            act.max_archivos,
            act.max_tamano_mb,
            JSON.stringify(tiposArray),
            act.id_actividad,
            id_calificaciones_curso,
          ]);
        } else {
          // --- INSERT ---
          // Es una actividad nueva, la insertamos
          const insertQuery = `
            INSERT INTO calificaciones_actividades (id_calificaciones_curso, nombre, porcentaje, fecha_limite, max_archivos, max_tamano_mb, tipos_archivo_permitidos)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          const [result] = await connection.query(insertQuery, [
            id_calificaciones_curso,
            act.nombre,
            act.porcentaje,
            act.fecha_limite || null,
            act.max_archivos,
            act.max_tamano_mb,
            JSON.stringify(tiposArray),
          ]);
          idsActividadesRecibidas.push(result.insertId);
        }
      }
    }

    // Paso 3: --- DELETE ---
    // Eliminar actividades que ya no están en la lista enviada por el frontend
    if (idsActividadesRecibidas.length > 0) {
      const deleteQuery = `DELETE FROM calificaciones_actividades WHERE id_calificaciones_curso = ? AND id_actividad NOT IN (?)`;
      await connection.query(deleteQuery, [
        id_calificaciones_curso,
        idsActividadesRecibidas,
      ]);
    } else {
      // Si no se recibieron actividades, se borran todas las del curso
      const deleteAllQuery = `DELETE FROM calificaciones_actividades WHERE id_calificaciones_curso = ?`;
      await connection.query(deleteAllQuery, [id_calificaciones_curso]);
    }

    await connection.commit();

    // Paso 4: Devolver la lista actualizada de actividades
    const [actividadesActualizadas] = await pool.query(
      "SELECT * FROM calificaciones_actividades WHERE id_calificaciones_curso = ?",
      [id_calificaciones_curso],
    );

    res.status(200).json({
      message: "Configuración de calificación guardada con éxito.",
      actividades: actividadesActualizadas,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error al guardar la configuración de calificación:", error);
    res.status(500).json({
      error: "Error interno del servidor al guardar la configuración.",
    });
  } finally {
    if (connection) connection.release();
  }
};

// @desc    Obtener la configuración de calificación de un curso y sus actividades
// @route   GET /api/calificaciones/:id_curso
// @access  Private (Alumno/Maestro)
const getCalificacionCurso = async (req, res) => {
  const { id_curso } = req.params;
  const { id_usuario, tipo_usuario } = req.user; // Obtenemos el usuario de la sesión

  if (!id_curso) {
    return res.status(400).json({ error: "El ID del curso es obligatorio." });
  }

  try {
    // Obtener la configuración de calificación del curso
    const [califCursoRows] = await pool.query(
      "SELECT * FROM calificaciones_curso WHERE id_curso = ?",
      [id_curso],
    );

    if (califCursoRows.length === 0) {
      return res.status(404).json({
        error: "No se encontró configuración de calificación para este curso.",
      });
    }

    const califCurso = califCursoRows[0];

    // Obtener las actividades configuradas para el curso
    const [actividadesRows] = await pool.query(
      "SELECT * FROM calificaciones_actividades WHERE id_calificaciones_curso = ?",
      [califCurso.id_calificaciones],
    );

    let calificacionFinal = 0;
    const actividadesConCalificacion = [];

    // Si el usuario es un alumno, buscamos sus calificaciones específicas
    if (tipo_usuario === "alumno") {
      const [inscripcionRows] = await pool.query(
        `SELECT id_inscripcion FROM inscripcion i
         JOIN alumno a ON i.id_alumno = a.id_alumno
         WHERE i.id_curso = ? AND a.id_usuario = ?`,
        [id_curso, id_usuario],
      );

      if (inscripcionRows.length > 0) {
        const id_inscripcion = inscripcionRows[0].id_inscripcion;

        for (const actividad of actividadesRows) {
          // Para cada actividad, buscamos la entrega y calificación del alumno
          const [entregaRows] = await pool.query(
            `SELECT ee.calificacion, ee.comentario_profesor as feedback
             FROM entregas_estudiantes ee
             JOIN material_curso mc ON ee.id_material = mc.id_material
             WHERE mc.id_actividad = ? AND ee.id_inscripcion = ?
             ORDER BY ee.fecha_calificacion DESC
             LIMIT 1`,
            [actividad.id_actividad, id_inscripcion],
          );

          const calificacionObtenida =
            entregaRows.length > 0 ? entregaRows[0].calificacion : null;
          const feedback =
            entregaRows.length > 0 ? entregaRows[0].feedback : null;

          actividadesConCalificacion.push({
            ...actividad,
            calificacion_obtenida: calificacionObtenida,
            feedback: feedback,
            tipos_permitidos: JSON.parse(
              actividad.tipos_archivo_permitidos || "[]",
            ),
          });

          // Sumar a la calificación final si hay nota
          if (calificacionObtenida !== null) {
            calificacionFinal += parseFloat(calificacionObtenida);
          }
        }
      } else {
        // El alumno no está inscrito, devolver actividades sin calificación
        actividadesRows.forEach((act) => actividadesConCalificacion.push(act));
      }
    } else {
      // Para maestros o admins, devolvemos las actividades sin calificación de alumno
      actividadesRows.forEach((act) =>
        actividadesConCalificacion.push({
          ...act,
          tipos_permitidos: JSON.parse(act.tipos_archivo_permitidos || "[]"),
        }),
      );
    }

    const response = {
      id_curso: califCurso.id_curso,
      umbral_aprobatorio: califCurso.umbral_aprobatorio,
      actividades: actividadesConCalificacion,
      calificacion_final: parseFloat(calificacionFinal.toFixed(2)),
      aprobado: calificacionFinal >= califCurso.umbral_aprobatorio,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error al obtener la configuración de calificación:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener la configuración.",
    });
  }
};

module.exports = { upsertCalificacionCurso, getCalificacionCurso };
