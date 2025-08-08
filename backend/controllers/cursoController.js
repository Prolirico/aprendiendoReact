const pool = require("../config/db");

// @desc    Obtener todos los cursos con paginación, búsqueda y filtro
// @route   GET /api/cursos
const getAllCursos = async (req, res) => {
  const { page = 1, limit = 10, searchTerm = "", id_maestro } = req.query;
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

    const whereString =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Conteo total para paginación
    const countQuery = `SELECT COUNT(*) as total FROM curso c ${whereString}`;
    const [countResult] = await pool.query(countQuery, queryParams);
    const totalCursos = countResult[0].total;
    const totalPages = Math.ceil(totalCursos / limit);

    // Obtener los cursos de la página actual
    const dataQuery = `
            SELECT c.*, m.nombre_completo as nombre_maestro
            FROM curso c
            LEFT JOIN maestro m ON c.id_maestro = m.id_maestro
            ${whereString}
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

// @desc    Obtener un curso por su ID
// @route   GET /api/cursos/:id
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

// @desc    Crear un nuevo curso
// @route   POST /api/cursos
const createCurso = async (req, res) => {
  const {
    id_maestro,
    id_categoria,
    // codigo_curso se genera automáticamente
    nombre_curso,
    descripcion,
    objetivos,
    prerequisitos,
    duracion_horas,
    nivel,
    cupo_maximo,
    fecha_inicio,
    fecha_fin,
    horario,
    link_clase,
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

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Insertar el curso sin el código
    const [result] = await connection.query(
      `INSERT INTO curso (id_maestro, id_categoria, nombre_curso, descripcion, objetivos, prerequisitos, duracion_horas, nivel, cupo_maximo, fecha_inicio, fecha_fin, horario, link_clase)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_maestro,
        id_categoria || null,
        nombre_curso,
        descripcion,
        objetivos,
        prerequisitos,
        duracion_horas,
        nivel,
        cupo_maximo || 30,
        fecha_inicio,
        fecha_fin,
        horario,
        link_clase,
      ],
    );

    const newCursoId = result.insertId;

    // 2. Generar el código del curso
    const codigo_curso = `CURSO-${String(newCursoId).padStart(5, "0")}`;

    // 3. Actualizar el curso con el código generado
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

// @desc    Actualizar un curso
// @route   PUT /api/cursos/:id
const updateCurso = async (req, res) => {
  const { id } = req.params;
  const {
    id_maestro,
    id_categoria,
    // codigo_curso no se puede actualizar
    nombre_curso,
    descripcion,
    objetivos,
    prerequisitos,
    duracion_horas,
    nivel,
    cupo_maximo,
    fecha_inicio,
    fecha_fin,
    horario,
    link_clase,
    estatus_curso,
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

  try {
    const [result] = await pool.query(
      `UPDATE curso SET
                id_maestro = ?, id_categoria = ?, nombre_curso = ?, descripcion = ?,
                objetivos = ?, prerequisitos = ?, duracion_horas = ?, nivel = ?, cupo_maximo = ?,
                fecha_inicio = ?, fecha_fin = ?, horario = ?, link_clase = ?, estatus_curso = ?
             WHERE id_curso = ?`,
      [
        id_maestro,
        id_categoria || null,
        nombre_curso,
        descripcion,
        objetivos,
        prerequisitos,
        duracion_horas,
        nivel,
        cupo_maximo,
        fecha_inicio,
        fecha_fin,
        horario,
        link_clase,
        estatus_curso,
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

// @desc    Eliminar un curso
// @route   DELETE /api/cursos/:id
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
    // ER_ROW_IS_REFERENCED_2 es el código de error de MySQL para violación de foreign key
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

module.exports = {
  getAllCursos,
  getCursoById,
  createCurso,
  updateCurso,
  deleteCurso,
};
