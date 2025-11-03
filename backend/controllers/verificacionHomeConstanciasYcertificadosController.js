const verificacionModel = require("../models/verificacionHomeConstanciasYcertificadosModel");
const certificadoConstanciaModel = require("../models/certificadoConstanciaModel");

/**
 * Maneja la solicitud pública para verificar los documentos de un estudiante.
 * @param {Object} req - El objeto de solicitud de Express.
 * @param {Object} res - El objeto de respuesta de Express.
 */
const getStudentStatusPublic = async (req, res) => {
  const { universityId, studentId } = req.query;

  if (!universityId || !studentId) {
    return res.status(400).json({
      error: "Faltan parámetros: se requieren universityId y studentId.",
    });
  }

  try {
    const alumno = await verificacionModel.findAlumnoByMatriculaAndUniversidad(
      studentId,
      universityId
    );

    if (!alumno) {
      return res.status(404).json({
        error:
          "No se encontraron resultados para la matrícula y universidad proporcionadas.",
      });
    }

    const { id_alumno, nombre_completo, nombre_universidad } = alumno;

    // Reutilizamos los modelos existentes para obtener los datos
    const constanciasData =
      await certificadoConstanciaModel.getCursosParaConstancias(id_alumno);
    const certificadosData =
      await certificadoConstanciaModel.getCredencialesParaCertificados(
        id_alumno
      );

    // Formateamos la respuesta para que coincida con lo que espera el frontend
    const response = {
      studentName: nombre_completo,
      universityName: nombre_universidad,
      completedCourses: constanciasData
        .filter((c) => c.id_constancia) // Solo cursos con constancia generada
        .map((curso) => ({
          courseName: curso.nombre_curso,
          completionDate: curso.fecha_emitida,
          recordUrl: curso.ruta_constancia,
        })),
      credentials: certificadosData
        .filter((c) => c.id_certificacion_alumno) // Solo credenciales con certificado generado
        .map((cred) => ({
          nombre: cred.nombre_credencial,
          descripcion: cred.descripcion_credencial,
          fechaEmision: cred.fecha_certificado,
          certificadoUrl: cred.ruta_certificado,
        })),
    };

    res.json(response);
  } catch (error) {
    console.error("Error en la verificación pública de documentos:", error);
    res.status(500).json({
      error: "Ocurrió un error en el servidor al procesar la solicitud.",
    });
  }
};

module.exports = {
  getStudentStatusPublic,
};
