const Facultad = require("../models/facultadModel");

/**
 * Crea una nueva facultad.
 * POST /api/facultades
 * Body: { "id_universidad": 1, "nombre": "Facultad de Ingeniería" }
 */
exports.createFacultad = async (req, res) => {
  const { id_universidad, nombre } = req.body;

  if (!id_universidad || !nombre) {
    return res.status(400).json({
      success: false,
      message: "El id_universidad y el nombre son obligatorios.",
    });
  }

  const newFacultad = {
    id_universidad,
    nombre,
  };

  try {
    const data = await Facultad.create(newFacultad);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Ocurrió un error al crear la facultad.",
    });
  }
};

/**
 * Obtiene todas las facultades de una universidad específica.
 * GET /api/facultades/universidad/:idUniversidad
 */
exports.getFacultadesByUniversidad = async (req, res) => {
  const { idUniversidad } = req.params;

  if (!idUniversidad) {
    return res.status(400).json({
      success: false,
      message: "El ID de la universidad es obligatorio.",
    });
  }

  try {
    const data = await Facultad.findByUniversityId(idUniversidad);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Ocurrió un error al obtener las facultades.",
    });
  }
};

/**
 * Actualiza una facultad existente.
 * PUT /api/facultades/:id
 * Body: { "nombre": "Facultad de Ingeniería y Ciencias" }
 */
exports.updateFacultad = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({
      success: false,
      message: "El campo nombre no puede estar vacío.",
    });
  }

  try {
    const result = await Facultad.update(id, { nombre });
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la facultad con ID ${id}.`,
      });
    }
    res.status(200).json({
      success: true,
      message: "Facultad actualizada correctamente.",
      data: { id: id, nombre: nombre },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Error al actualizar la facultad con ID ${id}.`,
    });
  }
};

/**
 * Elimina una facultad.
 * DELETE /api/facultades/:id
 */
exports.deleteFacultad = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Facultad.remove(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la facultad con ID ${id}.`,
      });
    }
    res.status(200).json({
      success: true,
      message: "Facultad eliminada correctamente.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Error al eliminar la facultad con ID ${id}.`,
    });
  }
};