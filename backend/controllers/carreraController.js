const Carrera = require("../models/carreraModel");

/**
 * Crea una nueva carrera.
 * POST /api/carreras
 * Body: { "id_facultad": 1, "nombre": "Ingeniería de Software", "clave_carrera": "IS-2024", "duracion_anos": 5 }
 */
exports.createCarrera = (req, res) => {
  const { id_facultad, nombre, clave_carrera, duracion_anos } = req.body;

  if (!id_facultad || !nombre || !clave_carrera) {
    return res.status(400).json({
      success: false,
      message: "id_facultad, nombre y clave_carrera son campos obligatorios.",
    });
  }

  const newCarrera = {
    id_facultad,
    nombre,
    clave_carrera,
    duracion_anos: duracion_anos || null, // Permite que duracion_anos sea opcional
  };

  Carrera.create(newCarrera, (err, data) => {
    if (err) {
      // Manejo de error de clave única duplicada
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: `La clave de carrera '${clave_carrera}' ya existe.`,
        });
      }
      return res.status(500).json({
        success: false,
        message: err.message || "Ocurrió un error al crear la carrera.",
      });
    }
    res.status(201).json({ success: true, data });
  });
};

/**
 * Obtiene todas las carreras de una facultad específica.
 * GET /api/carreras/facultad/:idFacultad
 */
exports.getCarrerasByFacultad = (req, res) => {
  const { idFacultad } = req.params;

  if (!idFacultad) {
    return res.status(400).json({
      success: false,
      message: "El ID de la facultad es obligatorio.",
    });
  }

  Carrera.findByFacultadId(idFacultad, (err, data) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message || "Ocurrió un error al obtener las carreras.",
      });
    }
    res.status(200).json({ success: true, data });
  });
};

/**
 * Actualiza una carrera existente.
 * PUT /api/carreras/:id
 * Body: { "nombre": "Ing. de Software y Sistemas", "clave_carrera": "ISS-2024", "duracion_anos": 4 }
 */
exports.updateCarrera = (req, res) => {
  const { id } = req.params;
  const { nombre, clave_carrera, duracion_anos } = req.body;

  if (!nombre || !clave_carrera) {
    return res.status(400).json({
      success: false,
      message: "Los campos nombre y clave_carrera no pueden estar vacíos.",
    });
  }

  const carreraData = {
    nombre,
    clave_carrera,
    duracion_anos: duracion_anos || null,
  };

  Carrera.update(id, carreraData, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: `La clave de carrera '${clave_carrera}' ya pertenece a otra carrera.`,
        });
      }
      return res.status(500).json({
        success: false,
        message: `Error al actualizar la carrera con ID ${id}.`,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la carrera con ID ${id}.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Carrera actualizada correctamente.",
      data: { id: id, ...carreraData },
    });
  });
};

/**
 * Elimina una carrera.
 * DELETE /api/carreras/:id
 */
exports.deleteCarrera = (req, res) => {
  const { id } = req.params;

  Carrera.remove(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: `Error al eliminar la carrera con ID ${id}.`,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la carrera con ID ${id}.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Carrera eliminada correctamente.",
    });
  });
};
