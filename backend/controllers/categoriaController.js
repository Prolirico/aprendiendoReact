const pool = require("../config/db");

// @desc    Obtener todas las categorías
// @route   GET /api/categorias
// @access  Private (para admins)
const getAllCategorias = async (req, res) => {
  // Se podría añadir filtrado por tipo_categoria o estatus si es necesario en el futuro
  // ej: const { tipo, estatus } = req.query;
  try {
    const [categorias] = await pool.query(
      "SELECT * FROM categoria_curso ORDER BY nombre_categoria ASC",
    );
    res.json(categorias);
  } catch (error) {
    console.error("Error al obtener las categorías:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// @desc    Obtener solo las categorías activas (para dropdowns)
// @route   GET /api/categorias/activas
// @access  Public o Private
const getActiveCategorias = async (req, res) => {
  try {
    const [categorias] = await pool.query(
      "SELECT id_categoria, nombre_categoria, tipo_categoria FROM categoria_curso WHERE estatus = 'activa' ORDER BY nombre_categoria ASC",
    );
    res.json(categorias);
  } catch (error) {
    console.error("Error al obtener las categorías activas:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// @desc    Crear una nueva categoría
// @route   POST /api/categorias
// @access  Private (Solo SEDEQ)
const createCategoria = async (req, res) => {
  const {
    nombre_categoria,
    descripcion,
    tipo_categoria = "area_conocimiento",
  } = req.body;

  if (!nombre_categoria) {
    return res
      .status(400)
      .json({ error: "El nombre de la categoría es obligatorio." });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO categoria_curso (nombre_categoria, descripcion, tipo_categoria) VALUES (?, ?, ?)",
      [nombre_categoria, descripcion, tipo_categoria],
    );
    res.status(201).json({
      id_categoria: result.insertId,
      nombre_categoria,
      descripcion,
      tipo_categoria,
      estatus: "activa", // El default de la BD
    });
  } catch (error) {
    // Manejar error de entrada duplicada
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Ya existe una categoría con ese nombre y tipo." });
    }
    console.error("Error al crear la categoría:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al crear la categoría." });
  }
};

// @desc    Actualizar una categoría
// @route   PUT /api/categorias/:id
// @access  Private (Solo SEDEQ)
const updateCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre_categoria, descripcion, tipo_categoria, estatus } = req.body;

  if (!nombre_categoria || !tipo_categoria || !estatus) {
    return res
      .status(400)
      .json({ error: "Nombre, tipo y estatus son campos obligatorios." });
  }

  try {
    const [result] = await pool.query(
      "UPDATE categoria_curso SET nombre_categoria = ?, descripcion = ?, tipo_categoria = ?, estatus = ? WHERE id_categoria = ?",
      [nombre_categoria, descripcion, tipo_categoria, estatus, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Categoría no encontrada." });
    }

    res.json({ message: "Categoría actualizada con éxito." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Ya existe una categoría con ese nombre y tipo." });
    }
    console.error(`Error al actualizar la categoría ${id}:`, error);
    res
      .status(500)
      .json({
        error: "Error interno del servidor al actualizar la categoría.",
      });
  }
};

// @desc    Eliminar una categoría (soft delete)
// @route   DELETE /api/categorias/:id
// @access  Private (Solo SEDEQ)
const deleteCategoria = async (req, res) => {
  const { id } = req.params;

  try {
    // En lugar de un DELETE, hacemos un UPDATE para cambiar el estatus a 'inactiva'
    const [result] = await pool.query(
      "UPDATE categoria_curso SET estatus = 'inactiva' WHERE id_categoria = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Categoría no encontrada." });
    }

    res.json({ message: "Categoría desactivada con éxito." });
  } catch (error) {
    console.error(`Error al desactivar la categoría ${id}:`, error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

module.exports = {
  getAllCategorias,
  getActiveCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
};
