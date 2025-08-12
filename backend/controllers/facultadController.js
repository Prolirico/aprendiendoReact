const Facultad = require("../models/facultadModel");

/**
 * Crea una nueva facultad.
 * POST /api/facultades
 * Body: { "id_universidad": 1, "nombre": "Facultad de Ingeniería" }
 */
exports.createFacultad = (req, res) => {
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

  Facultad.create(newFacultad, (err, data) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message || "Ocurrió un error al crear la facultad.",
      });
    }
    res.status(201).json({ success: true, data });
  });
};

/**
 * Obtiene todas las facultades de una universidad específica.
 * GET /api/facultades/universidad/:idUniversidad
 */
exports.getFacultadesByUniversidad = (req, res) => {
  const { idUniversidad } = req.params;

  if (!idUniversidad) {
    return res.status(400).json({
      success: false,
      message: "El ID de la universidad es obligatorio.",
    });
  }

  Facultad.findByUniversityId(idUniversidad, (err, data) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message || "Ocurrió un error al obtener las facultades.",
      });
    }
    res.status(200).json({ success: true, data });
  });
};

/**
 * Actualiza una facultad existente.
 * PUT /api/facultades/:id
 * Body: { "nombre": "Facultad de Ingeniería y Ciencias" }
 */
exports.updateFacultad = (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({
      success: false,
      message: "El campo nombre no puede estar vacío.",
    });
  }

  Facultad.update(id, { nombre }, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: `Error al actualizar la facultad con ID ${id}.`,
      });
    }

    if (result.affectedRows === 0) {
      // No se encontró la facultad con ese ID
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
  });
};

/**
 * Elimina una facultad.
 * DELETE /api/facultades/:id
 */
exports.deleteFacultad = (req, res) => {
  const { id } = req.params;

  Facultad.remove(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: `Error al eliminar la facultad con ID ${id}.`,
      });
    }

    if (result.affectedRows === 0) {
      // No se encontró la facultad con ese ID
      return res.status(404).json({
        success: false,
        message: `No se encontró la facultad con ID ${id}.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Facultad eliminada correctamente.",
    });
  });
};
