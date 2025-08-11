const pool = require("../config/db");

// @desc    Obtener todas las categorías
// @route   GET /api/categorias
// @access  Private (para admins)
const getAllCategorias = async (req, res) => {
  try {
    const [categorias] = await pool.query(
      "SELECT * FROM categoria_curso ORDER BY orden_prioridad ASC, nombre_categoria ASC",
    );
    res.json(categorias);
  } catch (error) {
    console.error("Error al obtener las categorías:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// @desc    Obtener solo las categorías activas (para dropdowns), priorizadas
// @route   GET /api/categorias/activas
// @access  Public o Private
const getActiveCategorias = async (req, res) => {
  try {
    const [categorias] = await pool.query(
      "SELECT id_categoria, nombre_categoria FROM categoria_curso WHERE estatus = 'activa' ORDER BY orden_prioridad ASC, nombre_categoria ASC",
    );
    res.json(categorias);
  } catch (error) {
    console.error("Error al obtener las categorías activas:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// @desc    Crear una nueva categoría con orden de prioridad automático
// @route   POST /api/categorias
// @access  Private (Solo SEDEQ)
const createCategoria = async (req, res) => {
  const { nombre_categoria, descripcion } = req.body;

  if (!nombre_categoria) {
    return res
      .status(400)
      .json({ error: "El nombre de la categoría es obligatorio." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Obtener el valor máximo actual de orden_prioridad
    const [maxOrderResult] = await connection.query(
      "SELECT MAX(orden_prioridad) as max_orden FROM categoria_curso",
    );
    const newOrder = (maxOrderResult[0].max_orden || 0) + 1;

    // 2. Insertar la nueva categoría con la prioridad calculada
    const [result] = await connection.query(
      "INSERT INTO categoria_curso (nombre_categoria, descripcion, orden_prioridad) VALUES (?, ?, ?)",
      [nombre_categoria, descripcion, newOrder],
    );

    await connection.commit();

    res.status(201).json({
      id_categoria: result.insertId,
      nombre_categoria,
      descripcion,
      orden_prioridad: newOrder,
      estatus: "activa",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Ya existe una categoría con ese nombre." });
    }
    console.error("Error al crear la categoría:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al crear la categoría." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// @desc    Actualizar una categoría, con reordenamiento automático de prioridad
// @route   PUT /api/categorias/:id
// @access  Private (Solo SEDEQ)
const updateCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre_categoria, descripcion, estatus, orden_prioridad } = req.body;
  const newOrder = orden_prioridad ? parseInt(orden_prioridad, 10) : undefined;

  if (!nombre_categoria || !estatus) {
    return res
      .status(400)
      .json({ error: "Nombre y estatus son campos obligatorios." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Obtener el orden actual de la categoría que se mueve
    const [currentCategory] = await connection.query(
      "SELECT orden_prioridad FROM categoria_curso WHERE id_categoria = ?",
      [id],
    );

    if (currentCategory.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Categoría no encontrada." });
    }
    const oldOrder = currentCategory[0].orden_prioridad;

    // 2. Solo reordenar si se provee un nuevo orden y es diferente al anterior
    if (newOrder !== undefined && newOrder !== oldOrder) {
      if (newOrder < oldOrder) {
        // Mover hacia ARRIBA (ej. de 5 a 2): los que están entre 2 y 4 suben (se les suma 1)
        await connection.query(
          "UPDATE categoria_curso SET orden_prioridad = orden_prioridad + 1 WHERE orden_prioridad >= ? AND orden_prioridad < ?",
          [newOrder, oldOrder],
        );
      } else {
        // newOrder > oldOrder
        // Mover hacia ABAJO (ej. de 2 a 5): los que están entre 3 y 5 bajan (se les resta 1)
        await connection.query(
          "UPDATE categoria_curso SET orden_prioridad = orden_prioridad - 1 WHERE orden_prioridad > ? AND orden_prioridad <= ?",
          [oldOrder, newOrder],
        );
      }
    }

    // 3. Finalmente, actualizar la categoría con sus nuevos datos
    // Si no se proveyó un nuevo orden, se mantiene el antiguo (oldOrder)
    await connection.query(
      "UPDATE categoria_curso SET nombre_categoria = ?, descripcion = ?, estatus = ?, orden_prioridad = ? WHERE id_categoria = ?",
      [
        nombre_categoria,
        descripcion,
        estatus,
        newOrder !== undefined ? newOrder : oldOrder,
        id,
      ],
    );

    await connection.commit();
    res.json({ message: "Categoría actualizada y reordenada con éxito." });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Ya existe una categoría con ese nombre." });
    }
    console.error(`Error al actualizar la categoría ${id}:`, error);
    res.status(500).json({
      error: "Error interno del servidor al actualizar la categoría.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// @desc    Eliminar una categoría y reordenar las siguientes
// @route   DELETE /api/categorias/:id
// @access  Private (Solo SEDEQ)
const deleteCategoria = async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Obtener el orden de la categoría que se va a eliminar
    const [categoryToDelete] = await connection.query(
      "SELECT orden_prioridad FROM categoria_curso WHERE id_categoria = ?",
      [id],
    );

    if (categoryToDelete.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Categoría no encontrada." });
    }
    const orderOfDeleted = categoryToDelete[0].orden_prioridad;

    // 2. Eliminar la categoría
    await connection.query(
      "DELETE FROM categoria_curso WHERE id_categoria = ?",
      [id],
    );

    // 3. Reordenar las categorías que quedaron después para cerrar el hueco
    await connection.query(
      "UPDATE categoria_curso SET orden_prioridad = orden_prioridad - 1 WHERE orden_prioridad > ?",
      [orderOfDeleted],
    );

    await connection.commit();
    res.json({ message: "Categoría eliminada y lista reordenada con éxito." });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error(`Error al eliminar la categoría ${id}:`, error);
    res.status(500).json({ error: "Error interno del servidor." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  getAllCategorias,
  getActiveCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
};
