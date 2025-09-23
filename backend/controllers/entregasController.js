const pool = require("../config/db");
const logger = require("../config/logger");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");

// Configuración de almacenamiento para archivos de entregas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/entregas");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const hash = crypto
      .createHash("md5")
      .update(file.originalname + Date.now())
      .digest("hex")
      .substring(0, 8);
    cb(
      null,
      `entrega-${hash}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB límite por archivo
    files: 10, // máximo 10 archivos por entrega
  },
  fileFilter: (req, file, cb) => {
    // Tipos de archivo permitidos
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "application/x-rar-compressed",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
  },
});

// @desc    Crear una nueva entrega de tarea con archivos
// @route   POST /api/entregas
// @access  Private (Alumno)
const crearEntrega = async (req, res) => {
  let connection;
  try {
    const { id_material, comentario_estudiante } = req.body;
    const id_usuario = req.user.id_usuario;

    if (!id_material) {
      return res.status(400).json({
        error: "El ID del material es obligatorio.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Verificar que el material existe y es una actividad
    const [materialRows] = await connection.query(
      `SELECT m.*, c.nombre_curso
       FROM material_curso m
       INNER JOIN curso c ON m.id_curso = c.id_curso
       WHERE m.id_material = ? AND m.categoria_material = 'actividad' AND m.activo = 1`,
      [id_material],
    );

    if (materialRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        error: "Material de actividad no encontrado o no activo.",
      });
    }

    const material = materialRows[0];

    // 2. Verificar que el alumno está inscrito en el curso
    const [inscripcionRows] = await connection.query(
      `SELECT i.id_inscripcion
       FROM inscripcion i
       INNER JOIN alumno a ON i.id_alumno = a.id_alumno
       WHERE i.id_curso = ? AND a.id_usuario = ? AND i.estatus_inscripcion = 'aprobada'`,
      [material.id_curso, id_usuario],
    );

    if (inscripcionRows.length === 0) {
      await connection.rollback();
      return res.status(403).json({
        error:
          "No estás inscrito en este curso o tu inscripción no está aprobada.",
      });
    }

    const id_inscripcion = inscripcionRows[0].id_inscripcion;

    // 3. Verificar si ya existe una entrega para esta actividad
    const [entregaExistente] = await connection.query(
      "SELECT id_entrega FROM entregas_estudiantes WHERE id_material = ? AND id_inscripcion = ?",
      [id_material, id_inscripcion],
    );

    let id_entrega;
    let es_nueva_entrega = false;

    if (entregaExistente.length > 0) {
      // Actualizar entrega existente
      id_entrega = entregaExistente[0].id_entrega;

      // Verificar si ya fue calificada
      const [entregaInfo] = await connection.query(
        "SELECT estatus_entrega FROM entregas_estudiantes WHERE id_entrega = ?",
        [id_entrega],
      );

      if (entregaInfo[0].estatus_entrega === "calificada") {
        await connection.rollback();
        return res.status(400).json({
          error: "No puedes modificar una entrega que ya ha sido calificada.",
        });
      }

      // Actualizar comentario si se proporciona
      if (comentario_estudiante) {
        await connection.query(
          "UPDATE entregas_estudiantes SET comentario_estudiante = ?, fecha_entrega = NOW() WHERE id_entrega = ?",
          [comentario_estudiante, id_entrega],
        );
      }
    } else {
      // Crear nueva entrega
      es_nueva_entrega = true;

      // Verificar si está dentro del plazo
      const fecha_limite = material.fecha_limite;
      let es_extemporanea = false;

      if (fecha_limite) {
        const ahora = new Date();
        const limite = new Date(fecha_limite);
        es_extemporanea = ahora > limite;
      }

      const [insertResult] = await connection.query(
        `INSERT INTO entregas_estudiantes (
          id_material,
          id_inscripcion,
          comentario_estudiante,
          es_extemporanea,
          estatus_entrega
        ) VALUES (?, ?, ?, ?, 'entregada')`,
        [
          id_material,
          id_inscripcion,
          comentario_estudiante || null,
          es_extemporanea,
        ],
      );

      id_entrega = insertResult.insertId;
    }

    // 4. Procesar archivos subidos
    const archivosSubidos = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Calcular hash del archivo
        const fileBuffer = fs.readFileSync(file.path);
        const hash_archivo = crypto
          .createHash("sha256")
          .update(fileBuffer)
          .digest("hex");

        // Insertar información del archivo
        const [archivoResult] = await connection.query(
          `INSERT INTO archivos_entrega (
            id_entrega,
            nombre_archivo_original,
            nombre_archivo_sistema,
            ruta_archivo,
            tipo_archivo,
            tamano_archivo,
            hash_archivo
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id_entrega,
            file.originalname,
            file.filename,
            file.path,
            file.mimetype,
            file.size,
            hash_archivo,
          ],
        );

        archivosSubidos.push({
          id_archivo: archivoResult.insertId,
          nombre_original: file.originalname,
          tamano: file.size,
          tipo: file.mimetype,
        });
      }
    }

    // 5. Actualizar estatus de la entrega
    await connection.query(
      "UPDATE entregas_estudiantes SET estatus_entrega = 'entregada', fecha_entrega = NOW() WHERE id_entrega = ?",
      [id_entrega],
    );

    await connection.commit();

    logger.info(
      `Entrega ${es_nueva_entrega ? "creada" : "actualizada"}: ID ${id_entrega}, Material: ${id_material}, Usuario: ${id_usuario}`,
    );

    res.status(es_nueva_entrega ? 201 : 200).json({
      message: `Entrega ${es_nueva_entrega ? "enviada" : "actualizada"} con éxito.`,
      entrega: {
        id_entrega,
        id_material,
        nombre_actividad: material.nombre_archivo,
        fecha_entrega: new Date().toISOString(),
        archivos_subidos: archivosSubidos,
        total_archivos: archivosSubidos.length,
        es_nueva: es_nueva_entrega,
      },
    });
  } catch (error) {
    if (connection) await connection.rollback();

    // Limpiar archivos subidos si hay error
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    logger.error(`Error al crear/actualizar entrega: ${error.message}`);
    res.status(500).json({
      error: "Error interno del servidor al procesar la entrega.",
    });
  } finally {
    if (connection) connection.release();
  }
};

// @desc    Obtener entregas de un alumno para un curso
// @route   GET /api/entregas/alumno/:id_curso
// @access  Private (Alumno)
const getEntregasAlumno = async (req, res) => {
  try {
    const { id_curso } = req.params;
    const id_usuario = req.user.id_usuario;

    if (!id_curso) {
      return res.status(400).json({
        error: "El ID del curso es obligatorio.",
      });
    }

    // Verificar inscripción del alumno
    const [inscripcionRows] = await pool.query(
      `SELECT i.id_inscripcion
       FROM inscripcion i
       INNER JOIN alumno a ON i.id_alumno = a.id_alumno
       WHERE i.id_curso = ? AND a.id_usuario = ?`,
      [id_curso, id_usuario],
    );

    if (inscripcionRows.length === 0) {
      return res.status(403).json({
        error: "No estás inscrito en este curso.",
      });
    }

    const id_inscripcion = inscripcionRows[0].id_inscripcion;

    // Obtener entregas con información de archivos
    const [entregasRows] = await pool.query(
      `SELECT
        e.*,
        m.nombre_archivo as nombre_actividad,
        m.fecha_limite,
        COUNT(a.id_archivo_entrega) as total_archivos
       FROM entregas_estudiantes e
       INNER JOIN material_curso m ON e.id_material = m.id_material
       LEFT JOIN archivos_entrega a ON e.id_entrega = a.id_entrega
       WHERE e.id_inscripcion = ? AND m.id_curso = ?
       GROUP BY e.id_entrega
       ORDER BY e.fecha_entrega DESC`,
      [id_inscripcion, id_curso],
    );

    // Para cada entrega, obtener los archivos
    const entregas = [];
    for (const entrega of entregasRows) {
      const [archivosRows] = await pool.query(
        `SELECT
          id_archivo_entrega,
          nombre_archivo_original,
          tipo_archivo,
          tamano_archivo,
          fecha_subida
         FROM archivos_entrega
         WHERE id_entrega = ?`,
        [entrega.id_entrega],
      );

      entregas.push({
        id_entrega: entrega.id_entrega,
        nombre_actividad: entrega.nombre_actividad,
        fecha_entrega: entrega.fecha_entrega,
        fecha_limite: entrega.fecha_limite,
        comentario_estudiante: entrega.comentario_estudiante,
        comentario_profesor: entrega.comentario_profesor,
        calificacion: entrega.calificacion,
        estatus_entrega: entrega.estatus_entrega,
        es_extemporanea: entrega.es_extemporanea === 1,
        archivos: archivosRows,
        total_archivos: entrega.total_archivos,
      });
    }

    res.status(200).json({
      entregas,
      total: entregas.length,
    });
  } catch (error) {
    logger.error(`Error al obtener entregas del alumno: ${error.message}`);
    res.status(500).json({
      error: "Error interno del servidor al obtener las entregas.",
    });
  }
};

// @desc    Obtener entregas de todos los alumnos para una actividad específica
// @route   GET /api/entregas/actividad/:id_material
// @access  Private (Maestro)
const getEntregasActividad = async (req, res) => {
  try {
    const { id_material } = req.params;
    const id_usuario = req.user.id_usuario;

    // Verificar que el usuario es el maestro del curso
    const [permisoRows] = await pool.query(
      `SELECT c.id_curso
       FROM material_curso m
       INNER JOIN curso c ON m.id_curso = c.id_curso
       INNER JOIN maestro ma ON c.id_maestro = ma.id_maestro
       WHERE m.id_material = ? AND ma.id_usuario = ?`,
      [id_material, id_usuario],
    );

    if (permisoRows.length === 0) {
      return res.status(403).json({
        error: "No tienes permisos para ver las entregas de esta actividad.",
      });
    }

    // Obtener todas las entregas para esta actividad
    const [entregasRows] = await pool.query(
      `SELECT
        e.*,
        a.nombre_completo as nombre_alumno,
        a.matricula,
        COUNT(ar.id_archivo_entrega) as total_archivos
       FROM entregas_estudiantes e
       INNER JOIN inscripcion i ON e.id_inscripcion = i.id_inscripcion
       INNER JOIN alumno a ON i.id_alumno = a.id_alumno
       LEFT JOIN archivos_entrega ar ON e.id_entrega = ar.id_entrega
       WHERE e.id_material = ?
       GROUP BY e.id_entrega
       ORDER BY e.fecha_entrega DESC`,
      [id_material],
    );

    const entregas = [];
    for (const entrega of entregasRows) {
      const [archivosRows] = await pool.query(
        `SELECT
          id_archivo_entrega,
          nombre_archivo_original,
          tipo_archivo,
          tamano_archivo,
          fecha_subida
         FROM archivos_entrega
         WHERE id_entrega = ?`,
        [entrega.id_entrega],
      );

      entregas.push({
        id_entrega: entrega.id_entrega,
        nombre_alumno: entrega.nombre_alumno,
        matricula: entrega.matricula,
        fecha_entrega: entrega.fecha_entrega,
        comentario_estudiante: entrega.comentario_estudiante,
        comentario_profesor: entrega.comentario_profesor,
        calificacion: entrega.calificacion,
        estatus_entrega: entrega.estatus_entrega,
        es_extemporanea: entrega.es_extemporanea === 1,
        archivos: archivosRows,
        total_archivos: entrega.total_archivos,
      });
    }

    res.status(200).json({
      entregas,
      total: entregas.length,
    });
  } catch (error) {
    logger.error(`Error al obtener entregas de la actividad: ${error.message}`);
    res.status(500).json({
      error: "Error interno del servidor al obtener las entregas.",
    });
  }
};

// @desc    Calificar una entrega
// @route   PUT /api/entregas/:id_entrega/calificar
// @access  Private (Maestro)
const calificarEntrega = async (req, res) => {
  try {
    const { id_entrega } = req.params;
    const { calificacion, comentario_profesor } = req.body;
    const id_usuario = req.user.id_usuario;

    if (calificacion === undefined || calificacion === null) {
      return res.status(400).json({
        error: "La calificación es obligatoria.",
      });
    }

    if (calificacion < 0 || calificacion > 100) {
      return res.status(400).json({
        error: "La calificación debe estar entre 0 y 100.",
      });
    }

    // Verificar permisos del maestro
    const [permisoRows] = await pool.query(
      `SELECT e.id_entrega
       FROM entregas_estudiantes e
       INNER JOIN material_curso m ON e.id_material = m.id_material
       INNER JOIN curso c ON m.id_curso = c.id_curso
       INNER JOIN maestro ma ON c.id_maestro = ma.id_maestro
       WHERE e.id_entrega = ? AND ma.id_usuario = ?`,
      [id_entrega, id_usuario],
    );

    if (permisoRows.length === 0) {
      return res.status(403).json({
        error: "No tienes permisos para calificar esta entrega.",
      });
    }

    // Actualizar la entrega con la calificación
    await pool.query(
      `UPDATE entregas_estudiantes
       SET calificacion = ?,
           comentario_profesor = ?,
           estatus_entrega = 'calificada',
           fecha_calificacion = NOW(),
           calificado_por = ?
       WHERE id_entrega = ?`,
      [calificacion, comentario_profesor, id_usuario, id_entrega],
    );

    logger.info(
      `Entrega calificada: ID ${id_entrega}, Calificación: ${calificacion}, Profesor: ${id_usuario}`,
    );

    res.status(200).json({
      message: "Entrega calificada exitosamente",
      calificacion,
      comentario_profesor,
    });
  } catch (error) {
    logger.error(`Error al calificar entrega: ${error.message}`);
    res.status(500).json({
      error: "Error interno del servidor al calificar la entrega.",
    });
  }
};

// @desc    Descargar archivo de entrega
// @route   GET /api/entregas/download/:id_archivo
// @access  Private (Maestro del curso o alumno propietario)
const descargarArchivoEntrega = async (req, res) => {
  try {
    const { id_archivo } = req.params;
    const id_usuario = req.user.id_usuario;

    // Obtener información del archivo y verificar permisos
    const [archivoRows] = await pool.query(
      `SELECT
        a.*,
        e.id_inscripcion,
        m.id_curso,
        al.id_usuario as alumno_usuario_id,
        ma.id_usuario as maestro_usuario_id
       FROM archivos_entrega a
       INNER JOIN entregas_estudiantes e ON a.id_entrega = e.id_entrega
       INNER JOIN material_curso m ON e.id_material = m.id_material
       INNER JOIN curso c ON m.id_curso = c.id_curso
       INNER JOIN maestro ma ON c.id_maestro = ma.id_maestro
       INNER JOIN inscripcion i ON e.id_inscripcion = i.id_inscripcion
       INNER JOIN alumno al ON i.id_alumno = al.id_alumno
       WHERE a.id_archivo_entrega = ?`,
      [id_archivo],
    );

    if (archivoRows.length === 0) {
      return res.status(404).json({
        error: "Archivo no encontrado.",
      });
    }

    const archivo = archivoRows[0];

    // Verificar permisos: debe ser el alumno propietario o el maestro del curso
    if (
      id_usuario !== archivo.alumno_usuario_id &&
      id_usuario !== archivo.maestro_usuario_id
    ) {
      return res.status(403).json({
        error: "No tienes permisos para descargar este archivo.",
      });
    }

    // Verificar que el archivo existe en el sistema
    if (!fs.existsSync(archivo.ruta_archivo)) {
      return res.status(404).json({
        error: "El archivo no se encuentra en el servidor.",
      });
    }

    // Configurar headers para descarga
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${archivo.nombre_archivo_original}"`,
    );

    // Enviar archivo
    res.sendFile(path.resolve(archivo.ruta_archivo));

    logger.info(
      `Archivo de entrega descargado: ${archivo.nombre_archivo_original} por usuario ${id_usuario}`,
    );
  } catch (error) {
    logger.error(`Error al descargar archivo de entrega: ${error.message}`);
    res.status(500).json({
      error: "Error interno del servidor al descargar el archivo.",
    });
  }
};

module.exports = {
  upload,
  crearEntrega,
  getEntregasAlumno,
  getEntregasActividad,
  calificarEntrega,
  descargarArchivoEntrega,
};
