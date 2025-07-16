const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// Función auxiliar para manejar errores de forma consistente
const handleError = (res, error, message = "Error en el servidor") => {
  console.error(error);
  res.status(500).json({ error: message });
};

// Obtener todos los maestros con paginación y búsqueda
exports.getMaestros = async (req, res) => {
  const { page = 1, limit = 10, searchTerm = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    const db = await pool.getConnection();
    try {
      let countSql =
        "SELECT COUNT(*) AS total FROM maestro m JOIN usuario u ON m.id_usuario = u.id_usuario";
      let dataSql =
        "SELECT m.*, u.email, u.username, u.tipo_usuario, uni.nombre AS nombre_universidad FROM maestro m JOIN usuario u ON m.id_usuario = u.id_usuario JOIN universidad uni ON m.id_universidad = uni.id_universidad";
      let whereClauses = [];
      let params = [];

      if (searchTerm) {
        whereClauses.push(
          "(m.nombre_completo LIKE ? OR m.especialidad LIKE ? OR u.email LIKE ?)",
        );
        params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
      }

      if (whereClauses.length > 0) {
        countSql += " WHERE " + whereClauses.join(" AND ");
        dataSql += " WHERE " + whereClauses.join(" AND ");
      }

      dataSql += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [totalResult] = await db.execute(
        countSql,
        params.slice(0, params.length - 2),
      ); // Para el conteo no se usan limit y offset
      const total = totalResult[0].total;
      const totalPages = Math.ceil(total / limit);

      const [maestros] = await db.execute(dataSql, params);

      res.json({
        maestros,
        total,
        page: parseInt(page),
        totalPages,
      });
    } finally {
      db.release();
    }
  } catch (error) {
    handleError(res, error, "Error al obtener maestros");
  }
};

// Crear un nuevo maestro
exports.createMaestro = async (req, res) => {
  const {
    nombre_completo,
    email_institucional,
    especialidad,
    grado_academico,
    id_universidad,
    fecha_ingreso, // Frontend puede enviar o se genera aquí
    password, // Contraseña para el usuario asociado (se generará si no se provee)
  } = req.body;

  if (
    !nombre_completo ||
    !email_institucional ||
    !id_universidad ||
    !grado_academico
  ) {
    return res.status(400).json({
      error:
        "Nombre completo, email institucional, universidad y grado académico son requeridos.",
    });
  }

  const tipo_usuario = "maestro";
  const estatus_usuario = "activo"; // Maestros nuevos activos por defecto

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Crear el usuario asociado al maestro
    // Se usa el email institucional como username por defecto para unicidad
    const [existingUser] = await connection.execute(
      "SELECT id_usuario FROM usuario WHERE email = ? OR username = ?",
      [email_institucional, email_institucional],
    );

    if (existingUser.length > 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Ya existe un usuario con este email o username." });
    }

    // Generar una contraseña si no se provee, o hashear la provista
    const userPassword = password || Math.random().toString(36).slice(-10); // Contraseña aleatoria si no se da
    const password_hash = await bcrypt.hash(userPassword, 10);

    const [userResult] = await connection.execute(
      "INSERT INTO usuario (username, email, password_hash, tipo_usuario, estatus, id_universidad) VALUES (?, ?, ?, ?, ?, ?)",
      [
        email_institucional,
        email_institucional,
        password_hash,
        tipo_usuario,
        estatus_usuario,
        id_universidad,
      ],
    );
    const id_usuario = userResult.insertId;

    // 2. Crear el registro del maestro
    const [maestroResult] = await connection.execute(
      "INSERT INTO maestro (id_usuario, id_universidad, nombre_completo, email_institucional, especialidad, grado_academico, fecha_ingreso) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        id_usuario,
        id_universidad,
        nombre_completo,
        email_institucional,
        especialidad || null,
        grado_academico,
        fecha_ingreso || new Date().toISOString().slice(0, 10), // Fecha actual si no se provee
      ],
    );

    await connection.commit();
    res.status(201).json({
      message: "Maestro creado con éxito.",
      id_maestro: maestroResult.insertId,
      id_usuario: id_usuario,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        error: "Ya existe un maestro o usuario con este email institucional.",
      });
    }
    handleError(res, error, "Error al crear el maestro.");
  } finally {
    if (connection) connection.release();
  }
};

// Actualizar un maestro
exports.updateMaestro = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_completo,
    email_institucional,
    especialidad,
    grado_academico,
    id_universidad,
    password, // Opcional: para actualizar la contraseña del usuario asociado
  } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Obtener el maestro existente para su id_usuario
    const [existingMaestro] = await connection.execute(
      "SELECT id_usuario FROM maestro WHERE id_maestro = ?",
      [id],
    );

    if (existingMaestro.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Maestro no encontrado." });
    }
    const id_usuario = existingMaestro[0].id_usuario;

    // Actualizar la tabla de usuario si el email o la contraseña cambian
    const userUpdates = [];
    const userParams = [];

    if (email_institucional) {
      // Verificar unicidad del nuevo email/username si cambia
      const [duplicateUser] = await connection.execute(
        "SELECT id_usuario FROM usuario WHERE (email = ? OR username = ?) AND id_usuario != ?",
        [email_institucional, email_institucional, id_usuario],
      );
      if (duplicateUser.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: "El nuevo email o username ya está en uso por otro usuario.",
        });
      }
      userUpdates.push("email = ?", "username = ?");
      userParams.push(email_institucional, email_institucional);
    }
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      userUpdates.push("password_hash = ?");
      userParams.push(password_hash);
    }
    if (id_universidad) {
      // Se actualiza la universidad en la tabla de usuario también
      userUpdates.push("id_universidad = ?");
      userParams.push(id_universidad);
    }

    if (userUpdates.length > 0) {
      userParams.push(id_usuario);
      await connection.execute(
        `UPDATE usuario SET ${userUpdates.join(", ")} WHERE id_usuario = ?`,
        userParams,
      );
    }

    // Actualizar la tabla de maestro
    const maestroUpdates = [];
    const maestroParams = [];

    if (nombre_completo) {
      maestroUpdates.push("nombre_completo = ?");
      maestroParams.push(nombre_completo);
    }
    if (email_institucional) {
      maestroUpdates.push("email_institucional = ?");
      maestroParams.push(email_institucional);
    }
    if (especialidad !== undefined) {
      // Permite null
      maestroUpdates.push("especialidad = ?");
      maestroParams.push(especialidad);
    }
    if (grado_academico) {
      maestroUpdates.push("grado_academico = ?");
      maestroParams.push(grado_academico);
    }
    if (id_universidad) {
      maestroUpdates.push("id_universidad = ?");
      maestroParams.push(id_universidad);
    }

    if (maestroUpdates.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "No hay datos para actualizar." });
    }

    maestroParams.push(id);
    await connection.execute(
      `UPDATE maestro SET ${maestroUpdates.join(", ")} WHERE id_maestro = ?`,
      maestroParams,
    );

    await connection.commit();
    res.status(200).json({ message: "Maestro actualizado con éxito." });
  } catch (error) {
    if (connection) await connection.rollback();
    handleError(res, error, "Error al actualizar el maestro.");
  } finally {
    if (connection) connection.release();
  }
};

// Eliminar un maestro (y su usuario asociado)
exports.deleteMaestro = async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Obtener el id_usuario asociado al maestro
    const [maestroRows] = await connection.execute(
      "SELECT id_usuario FROM maestro WHERE id_maestro = ?",
      [id],
    );

    if (maestroRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Maestro no encontrado." });
    }
    const id_usuario_asociado = maestroRows[0].id_usuario;

    // Eliminar el registro del maestro
    await connection.execute("DELETE FROM maestro WHERE id_maestro = ?", [id]);

    // Eliminar el usuario asociado.
    // Esto es seguro si sabemos que este usuario solo existe para este maestro.
    // Si un usuario pudiera ser maestro y admin a la vez, esta lógica necesitaría revisión.
    await connection.execute("DELETE FROM usuario WHERE id_usuario = ?", [
      id_usuario_asociado,
    ]);

    await connection.commit();
    res
      .status(200)
      .json({ message: "Maestro y usuario asociado eliminados con éxito." });
  } catch (error) {
    if (connection) await connection.rollback();
    handleError(res, error, "Error al eliminar el maestro.");
  } finally {
    if (connection) connection.release();
  }
};
