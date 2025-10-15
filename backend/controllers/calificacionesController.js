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
        const tiposPermitidos =
          act.tipos_permitidos || act.tipos_archivo_permitidos || ["pdf", "link"];
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
          idsActividadesRecibidas.push(act.id_actividad);
          const updateQuery = `
            UPDATE calificaciones_actividades SET
              nombre = ?, porcentaje = ?, fecha_limite = ?, max_archivos = ?, 
              max_tamano_mb = ?, tipos_archivo_permitidos = ?, instrucciones = ?
            WHERE id_actividad = ? AND id_calificaciones_curso = ?
          `;
          await connection.query(updateQuery, [
            act.nombre,
            act.porcentaje,
            act.fecha_limite || null,
            act.max_archivos,
            act.max_tamano_mb,
            JSON.stringify(tiposArray),
            act.instrucciones || null,
            act.id_actividad,
            id_calificaciones_curso,
          ]);
        } else {
          // --- INSERT ---
          const insertQuery = `
            INSERT INTO calificaciones_actividades (
              id_calificaciones_curso, nombre, porcentaje, fecha_limite, 
              max_archivos, max_tamano_mb, tipos_archivo_permitidos, instrucciones
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const [result] = await connection.query(insertQuery, [
            id_calificaciones_curso,
            act.nombre,
            act.porcentaje,
            act.fecha_limite || null,
            act.max_archivos,
            act.max_tamano_mb,
            JSON.stringify(tiposArray),
            act.instrucciones || null,
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
  const { id_usuario, tipo_usuario, id_alumno: id_alumno_sesion } = req.user;
  const { id_alumno: id_alumno_query } = req.query; // <-- El profesor envía esto

  if (!id_curso) {
    return res.status(400).json({ error: "El ID del curso es obligatorio." });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [califCursoRows] = await connection.query(
      "SELECT * FROM calificaciones_curso WHERE id_curso = ?",
      [id_curso]
    );

    if (califCursoRows.length === 0) {
      return res.status(404).json({ error: "No se encontró configuración de calificación para este curso." });
    }
    const califCurso = califCursoRows[0];

    const [actividadesRows] = await connection.query(
      "SELECT id_actividad, nombre, instrucciones, porcentaje, fecha_limite, max_archivos, max_tamano_mb, tipos_archivo_permitidos FROM calificaciones_actividades WHERE id_calificaciones_curso = ?",
      [califCurso.id_calificaciones]
    );

    // ====== AQUÍ ESTÁ EL CAMBIO IMPORTANTE ======
    let id_alumno_para_buscar = null;

    // Si es alumno, usa su propio id
    if (tipo_usuario === 'alumno') {
      id_alumno_para_buscar = id_alumno_sesion;
    }
    // Si es maestro/admin Y viene id_alumno en query, úsalo
    else if (['maestro', 'admin_sedeq', 'admin_universidad', 'SEDEQ'].includes(tipo_usuario) && id_alumno_query) {
      id_alumno_para_buscar = parseInt(id_alumno_query); // <-- Asegurar que sea número
    }

    console.log('🔍 DEBUG: Buscando entregas para id_alumno:', id_alumno_para_buscar);
    // ============================================

    let id_inscripcion_objetivo = null;
    if (id_alumno_para_buscar) {
      const [inscripcionRows] = await connection.query(
        "SELECT id_inscripcion FROM inscripcion WHERE id_alumno = ? AND id_curso = ? AND estatus_inscripcion = 'aprobada'",
        [id_alumno_para_buscar, id_curso]
      );

      console.log('📋 DEBUG: Inscripciones encontradas:', inscripcionRows.length);

      if (inscripcionRows.length > 0) {
        id_inscripcion_objetivo = inscripcionRows[0].id_inscripcion;
        console.log('✅ DEBUG: id_inscripcion encontrado:', id_inscripcion_objetivo);
      } else {
        console.log('⚠️ DEBUG: No se encontró inscripción aprobada para este alumno en este curso');
      }
    }

    const actividadesConEntregas = [];
    for (const actividad of actividadesRows) {
      let entregaCompleta = null;
      if (id_inscripcion_objetivo) {
        const [entregaRows] = await connection.query(
          `SELECT id_entrega, fecha_entrega, calificacion, comentario_profesor
           FROM entregas_estudiantes
           WHERE id_actividad = ? AND id_inscripcion = ?
           ORDER BY fecha_entrega DESC
           LIMIT 1`,
          [actividad.id_actividad, id_inscripcion_objetivo]
        );

        console.log(`📦 DEBUG: Entregas para actividad ${actividad.id_actividad}:`, entregaRows.length);

        if (entregaRows.length > 0) {
          const entregaBase = entregaRows[0];
          const [archivosRows] = await connection.query(
            "SELECT id_archivo_entrega, nombre_archivo_original, ruta_archivo FROM archivos_entrega WHERE id_entrega = ?",
            [entregaBase.id_entrega]
          );

          console.log(`📎 DEBUG: Archivos para entrega ${entregaBase.id_entrega}:`, archivosRows.length);

          entregaCompleta = { ...entregaBase, archivos: archivosRows };
        }
      }
      actividadesConEntregas.push({
        ...actividad,
        entrega: entregaCompleta,
      });
    }

    let calificacionFinal = 0;
    for (const act of actividadesConEntregas) {
      if (act.entrega && act.entrega.calificacion !== null) {
        calificacionFinal += parseFloat(act.entrega.calificacion);
      }
    }

    const response = {
      id_curso: califCurso.id_curso,
      umbral_aprobatorio: califCurso.umbral_aprobatorio,
      actividades: actividadesConEntregas,
      calificacion_final: parseFloat(calificacionFinal.toFixed(2)),
      aprobado: calificacionFinal >= califCurso.umbral_aprobatorio,
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Error al obtener la configuración de calificación:", error);
    res.status(500).json({ error: "Error interno del servidor al obtener la configuración." });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { upsertCalificacionCurso, getCalificacionCurso };