const pool = require("../config/db");

// @desc    Obtener todos los cursos con paginación, búsqueda y filtro
// @route   GET /api/cursos
const getAllCursos = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    searchTerm = "",
    id_maestro,
    id_facultad,
    exclude_assigned = "true",
    editing_credential_id,
    universidades,
    groupByCourse, // <-- Nuestro nuevo parámetro
    universidadId, // <-- Añadir estos parámetros que envía el frontend
    facultadId,
  } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereClauses = [];
    let queryParams = [];

    if (searchTerm) {
      whereClauses.push("c.nombre_curso LIKE ?");
      queryParams.push(`%${searchTerm}%`);
    }

    // Filtra por id_maestro si se proporciona y no es 'undefined'
    if (id_maestro && id_maestro !== "undefined") {
      whereClauses.push("c.id_maestro = ?");
      queryParams.push(id_maestro);
    }

    // **FILTRO POR UNIVERSIDADES** (puede venir como 'universidades' o 'universidadId')
    if (universidades) {
      const uniIds = universidades
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id)); // Filtrar valores inválidos

      if (uniIds.length > 0) {
        const placeholders = uniIds.map(() => '?').join(',');
        whereClauses.push(`c.id_universidad IN (${placeholders})`);
        queryParams.push(...uniIds); // Spread operator
      }
    } else if (
      universidadId &&
      universidadId !== "undefined" &&
      universidadId !== ""
    ) {
      whereClauses.push("c.id_universidad = ?");
      queryParams.push(universidadId);
    }

    // **FILTRO POR FACULTAD** (puede venir como 'id_facultad' o 'facultadId')
    if (id_facultad && id_facultad !== "undefined") {
      whereClauses.push("c.id_facultad = ?");
      queryParams.push(id_facultad);
    } else if (facultadId && facultadId !== "undefined" && facultadId !== "") {
      whereClauses.push("c.id_facultad = ?");
      queryParams.push(facultadId);
    }

    // Exclude courses already assigned to credentials
    if (exclude_assigned === "true") {
      if (editing_credential_id && editing_credential_id !== "undefined") {
        whereClauses.push(
          "c.id_curso NOT IN (SELECT rc.id_curso FROM requisitos_certificado rc WHERE rc.id_certificacion != ?)",
        );
        queryParams.push(editing_credential_id);
      } else {
        whereClauses.push(
          "c.id_curso NOT IN (SELECT rc.id_curso FROM requisitos_certificado rc)",
        );
      }
    }

    const whereString =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // **CONTEO CORREGIDO PARA CONSIDERAR GROUP BY**
    let countQuery, totalCursos;

    if (groupByCourse === "true") {
      // Para consultas agrupadas, necesitamos contar grupos únicos
      countQuery = `
        SELECT COUNT(DISTINCT c.id_curso) as total
        FROM curso c
        LEFT JOIN maestro m ON c.id_maestro = m.id_maestro
        LEFT JOIN universidad u ON c.id_universidad = u.id_universidad
        LEFT JOIN facultades f ON c.id_facultad = f.id_facultad
        LEFT JOIN carreras car ON c.id_carrera = car.id_carrera
        LEFT JOIN calificaciones_curso cc ON c.id_curso = cc.id_curso
        LEFT JOIN categoria_curso cat ON c.id_categoria = cat.id_categoria
        LEFT JOIN requisitos_certificado rc ON c.id_curso = rc.id_curso
        LEFT JOIN certificacion cert ON rc.id_certificacion = cert.id_certificacion
        ${whereString}
      `;
    } else {
      // Para consultas normales, conteo estándar
      countQuery = `SELECT COUNT(*) as total FROM curso c ${whereString}`;
    }

    const [countResult] = await pool.query(countQuery, queryParams);
    totalCursos = countResult[0].total;
    const totalPages = Math.ceil(totalCursos / limit);

    // Construcción dinámica de la consulta principal
    let selectFields,
      joins,
      groupByClause = "";

    if (groupByCourse === "true") {
      selectFields = `
            c.*,
            m.nombre_completo as nombre_maestro,
            u.nombre as nombre_universidad,
            f.nombre as nombre_facultad,
            car.nombre as nombre_carrera,
            cat.nombre_categoria,
            cc.umbral_aprobatorio,
            GROUP_CONCAT(DISTINCT cert.nombre SEPARATOR ', ') as nombre_credencial
        `;
      joins = `
            LEFT JOIN maestro m ON c.id_maestro = m.id_maestro
            LEFT JOIN universidad u ON c.id_universidad = u.id_universidad
            LEFT JOIN facultades f ON c.id_facultad = f.id_facultad
            LEFT JOIN carreras car ON c.id_carrera = car.id_carrera
            LEFT JOIN calificaciones_curso cc ON c.id_curso = cc.id_curso
            LEFT JOIN categoria_curso cat ON c.id_categoria = cat.id_categoria
            LEFT JOIN requisitos_certificado rc ON c.id_curso = rc.id_curso
            LEFT JOIN certificacion cert ON rc.id_certificacion = cert.id_certificacion
        `;
      groupByClause = "GROUP BY c.id_curso";
    } else {
      selectFields = `c.*, m.nombre_completo as nombre_maestro, u.nombre as nombre_universidad, f.nombre as nombre_facultad, cat.nombre_categoria, cat.id_area, cert.nombre as nombre_credencial, cert.id_certificacion as id_credencial`;
      joins = `
            LEFT JOIN maestro m ON c.id_maestro = m.id_maestro
            LEFT JOIN universidad u ON c.id_universidad = u.id_universidad
            LEFT JOIN facultades f ON c.id_facultad = f.id_facultad
            LEFT JOIN categoria_curso cat ON c.id_categoria = cat.id_categoria
            LEFT JOIN requisitos_certificado rc ON c.id_curso = rc.id_curso
            LEFT JOIN certificacion cert ON rc.id_certificacion = cert.id_certificacion
        `;
    }

    const dataQuery = `
            SELECT ${selectFields}
            FROM curso c ${joins}
            ${whereString}
            ${groupByClause}
            ORDER BY c.nombre_curso ASC
            LIMIT ? OFFSET ?
        `;
    const [cursos] = await pool.query(dataQuery, [
      ...queryParams,
      parseInt(limit),
      parseInt(offset),
    ]);

    res.json({
      cursos,
      totalPages,
      currentPage: parseInt(page),
      total: totalCursos,
    });
  } catch (error) {
    console.error("Error al obtener los cursos:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al obtener cursos." });
  }
};

// ... resto de funciones sin cambios
const getCursoById = async (req, res) => {
  const { id } = req.params;
  try {
    const [cursos] = await pool.query(
      "SELECT * FROM curso WHERE id_curso = ?",
      [id],
    );
    if (cursos.length === 0) {
      return res.status(404).json({ error: "Curso no encontrado." });
    }
    res.json(cursos[0]);
  } catch (error) {
    console.error(`Error al obtener el curso ${id}:`, error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

const createCurso = async (req, res) => {
  const {
    id_maestro,
    id_categoria,
    id_area,
    id_universidad,
    id_facultad,
    id_carrera,
    nombre_curso,
    descripcion,
    objetivos,
    prerequisitos,
    duracion_horas,
    nivel,
    cupo_maximo,
    fecha_inicio,
    fecha_fin,
    modalidad,
    tipo_costo,
    costo,
    horas_teoria,
    horas_practica,
  } = req.body;

  if (
    !id_maestro ||
    !nombre_curso ||
    !duracion_horas ||
    !nivel ||
    !fecha_inicio ||
    !fecha_fin
  ) {
    return res
      .status(400)
      .json({ error: "Faltan campos obligatorios para crear el curso." });
  }

  const totalHoras = parseInt(duracion_horas, 10);
  const teoriaHoras = parseInt(horas_teoria, 10) || 0;
  const practicaHoras = parseInt(horas_practica, 10) || 0;

  if (totalHoras > 0 && teoriaHoras + practicaHoras !== totalHoras) {
    return res.status(400).json({
      error:
        "La suma de las horas de teoría y práctica debe ser igual a la duración total del curso.",
    });
  }

  if (totalHoras > 0 && (teoriaHoras === 0 || practicaHoras === 0)) {
    return res.status(400).json({
      error:
        "Un curso debe tener al menos 1 hora de teoría y 1 hora de práctica.",
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO curso (id_maestro, id_area, id_categoria, id_universidad, id_facultad, id_carrera, nombre_curso, descripcion, objetivos, prerequisitos, duracion_horas, horas_teoria, horas_practica, nivel, cupo_maximo, fecha_inicio, fecha_fin, modalidad, tipo_costo, costo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_maestro,
        id_area || null,
        id_categoria || null,
        id_universidad || null,
        id_facultad || null,
        id_carrera || null,
        nombre_curso,
        descripcion,
        objetivos,
        prerequisitos,
        duracion_horas,
        teoriaHoras,
        practicaHoras,
        nivel,
        cupo_maximo || 30,
        fecha_inicio,
        fecha_fin,
        modalidad,
        tipo_costo || "gratuito",
        costo || null,
      ],
    );

    const newCursoId = result.insertId;
    const codigo_curso = `CURSO-${String(newCursoId).padStart(5, "0")}`;

    await connection.query(
      "UPDATE curso SET codigo_curso = ? WHERE id_curso = ?",
      [codigo_curso, newCursoId],
    );

    await connection.commit();

    res.status(201).json({
      message: "Curso creado con éxito",
      id_curso: newCursoId,
      codigo_curso: codigo_curso,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error al crear el curso:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al crear el curso." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const updateCurso = async (req, res) => {
  const { id } = req.params;
  const {
    id_maestro,
    id_categoria,
    id_area,
    id_universidad,
    id_facultad,
    id_carrera,
    nombre_curso,
    descripcion,
    objetivos,
    prerequisitos,
    duracion_horas,
    nivel,
    cupo_maximo,
    fecha_inicio,
    fecha_fin,
    estatus_curso,
    modalidad,
    tipo_costo,
    costo,
    horas_teoria,
    horas_practica,
  } = req.body;

  if (
    !id_maestro ||
    !nombre_curso ||
    !duracion_horas ||
    !nivel ||
    !fecha_inicio ||
    !fecha_fin
  ) {
    return res
      .status(400)
      .json({ error: "Faltan campos obligatorios para actualizar el curso." });
  }

  const totalHoras = parseInt(duracion_horas, 10);
  const teoriaHoras = parseInt(horas_teoria, 10) || 0;
  const practicaHoras = parseInt(horas_practica, 10) || 0;

  if (totalHoras > 0 && teoriaHoras + practicaHoras !== totalHoras) {
    return res.status(400).json({
      error:
        "La suma de las horas de teoría y práctica debe ser igual a la duración total del curso.",
    });
  }

  if (totalHoras > 0 && (teoriaHoras === 0 || practicaHoras === 0)) {
    return res.status(400).json({
      error:
        "Un curso debe tener al menos 1 hora de teoría y 1 hora de práctica.",
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE curso SET
                id_maestro = ?, id_categoria = ?, id_area = ?, id_universidad = ?, id_facultad = ?, id_carrera = ?,
                nombre_curso = ?, descripcion = ?, objetivos = ?, prerequisitos = ?, duracion_horas = ?, horas_teoria = ?, horas_practica = ?,
                nivel = ?, cupo_maximo = ?, fecha_inicio = ?, fecha_fin = ?, estatus_curso = ?, modalidad = ?,
                tipo_costo = ?, costo = ?
              WHERE id_curso = ?`,
      [
        id_maestro,
        id_categoria || null,
        id_area || null,
        id_universidad || null,
        id_facultad || null,
        id_carrera || null,
        nombre_curso,
        descripcion,
        objetivos,
        prerequisitos,
        duracion_horas,
        teoriaHoras,
        practicaHoras,
        nivel,
        cupo_maximo,
        fecha_inicio,
        fecha_fin,
        estatus_curso || "planificado",
        modalidad,
        tipo_costo,
        costo,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Curso no encontrado." });
    }

    res.json({ message: "Curso actualizado con éxito." });
  } catch (error) {
    console.error(`Error al actualizar el curso ${id}:`, error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al actualizar el curso." });
  }
};

const deleteCurso = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM curso WHERE id_curso = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Curso no encontrado." });
    }
    res.json({ message: "Curso eliminado con éxito." });
  } catch (error) {
    console.error(`Error al eliminar el curso ${id}:`, error);
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        error:
          "No se puede eliminar el curso porque tiene registros asociados (ej. alumnos inscritos).",
      });
    }
    res
      .status(500)
      .json({ error: "Error interno del servidor al eliminar el curso." });
  }
};

// @desc    Obtener todos los alumnos inscritos en un curso
// @route   GET /api/cursos/:id/alumnos
const getAlumnosPorCurso = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT
        a.id_alumno,
        u.id_usuario,
        a.nombre_completo,
        u.username,
        u.email,
        i.estatus_inscripcion
      FROM inscripcion i
      JOIN alumno a ON i.id_alumno = a.id_alumno
      JOIN usuario u ON a.id_usuario = u.id_usuario
      WHERE i.id_curso = ? AND i.estatus_inscripcion = 'aprobada'
      ORDER BY a.nombre_completo ASC;
    `;

    const [alumnos] = await pool.query(query, [id]);

    res.json(alumnos);
  } catch (error) {
    console.error(`Error al obtener alumnos para el curso ${id}:`, error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al obtener los alumnos." });
  }
};

module.exports = {
  getAllCursos,
  getCursoById,
  createCurso,
  updateCurso,
  deleteCurso,
  getAlumnosPorCurso,
};
