const pool = require("../config/db");
const logger = require("../config/logger");

// @desc    Obtener todas las áreas de conocimiento
// @route   GET /api/areas-conocimiento
// @access  Public
const getAllAreasConocimiento = async (req, res) => {
  try {
    const [areas] = await pool.query(
      "SELECT id_area, nombre AS nombre_area, descripcion FROM areas_conocimiento ORDER BY nombre ASC",
    );
    res.json(areas);
  } catch (error) {
    logger.error("Error al obtener las áreas de conocimiento:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// @desc    Crear una nueva área de conocimiento
// @route   POST /api/areas-conocimiento
// @access  Private (Admin)
const createAreaConocimiento = async (req, res) => {
  const { nombre_area, descripcion } = req.body; // El frontend envía nombre_area
  if (!nombre_area) {
    return res
      .status(400)
      .json({ error: "El nombre del área es obligatorio." });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO areas_conocimiento (nombre, descripcion) VALUES (?, ?)",
      [nombre_area, descripcion],
    );
    res.status(201).json({
      id_area: result.insertId,
      nombre_area,
      descripcion,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Ya existe un área de conocimiento con ese nombre." });
    }
    logger.error("Error al crear área de conocimiento:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// @desc    Actualizar un área de conocimiento
// @route   PUT /api/areas-conocimiento/:id
// @access  Private (Admin)
const updateAreaConocimiento = async (req, res) => {
  const { id } = req.params;
  const { nombre_area, descripcion } = req.body; // El frontend envía nombre_area

  try {
    const [result] = await pool.query(
      "UPDATE areas_conocimiento SET nombre = ?, descripcion = ? WHERE id_area = ?",
      [nombre_area, descripcion, id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Área no encontrada." });
    }
    res.json({ message: "Área de conocimiento actualizada con éxito." });
  } catch (error) {
    logger.error("Error al actualizar área de conocimiento:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// @desc    Eliminar un área de conocimiento
// @route   DELETE /api/areas-conocimiento/:id
// @access  Private (Admin)
const deleteAreaConocimiento = async (req, res) => {
  const { id } = req.params;
  try {
    // Aquí podrías añadir una verificación para no borrar si tiene categorías asociadas
    const [result] = await pool.query(
      "DELETE FROM areas_conocimiento WHERE id_area = ?",
      [id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Área no encontrada." });
    }
    res.json({ message: "Área de conocimiento eliminada con éxito." });
  } catch (error) {
    logger.error("Error al eliminar área de conocimiento:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

module.exports = {
  getAllAreasConocimiento,
  createAreaConocimiento,
  updateAreaConocimiento,
  deleteAreaConocimiento,
};
