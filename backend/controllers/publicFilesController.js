const publicFilesModel = require("../models/publicFilesModel");
const path = require("path");
const fs = require("fs");

// Directorio base donde se almacenan los archivos subidos.
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

/**
 * Obtiene los metadatos de un documento público (constancia o certificado).
 * @param {Object} req - El objeto de solicitud de Express.
 * @param {Object} res - El objeto de respuesta de Express.
 */
const getMetadatos = async (req, res) => {
  const { tipo, filename } = req.params;

  if (!tipo || !filename || !["constancia", "certificado"].includes(tipo)) {
    return res.status(400).json({ error: "Parámetros inválidos." });
  }

  try {
    const metadata = await publicFilesModel.findDocumentByFilename(
      tipo,
      filename,
    );

    if (!metadata) {
      return res
        .status(404)
        .json({ error: "Documento no encontrado o no válido." });
    }

    res.json(metadata);
  } catch (error) {
    console.error("Error al obtener metadatos:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al buscar el documento." });
  }
};

/**
 * Sirve el archivo PDF de un documento público.
 * @param {Object} req - El objeto de solicitud de Express.
 * @param {Object} res - El objeto de respuesta de Express.
 */
const getDocumento = (req, res) => {
  const { tipo, filename } = req.params;

  if (!tipo || !filename) {
    return res.status(400).json({ error: "Parámetros inválidos." });
  }

  // Construye la ruta al archivo de forma segura
  let filePath;
  if (tipo === "constancia") {
    filePath = path.join(UPLOADS_DIR, "constancias", path.basename(filename));
  } else if (tipo === "certificado") {
    filePath = path.join(UPLOADS_DIR, "certificados", path.basename(filename));
  } else {
    return res.status(400).json({ error: "Tipo de documento no válido." });
  }

  // Verifica si el archivo existe antes de intentar enviarlo
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("Archivo no encontrado en la ruta:", filePath);
      return res.status(404).json({ error: "Archivo no encontrado." });
    }
    res.sendFile(filePath);
  });
};

module.exports = {
  getMetadatos,
  getDocumento,
};
