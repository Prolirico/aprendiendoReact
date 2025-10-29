const certificadoConstanciaModel = require("../models/certificadoConstanciaModel");
const Firmas = require("../models/firmasModel");
const { generatePdf } = require("../utils/pdfGenerator");
const path = require("path");
const fs = require("fs");

// getDocumentosDisponibles (sin cambios)
const getDocumentosDisponibles = async (req, res) => {
  try {
    const id_alumno = req.user.id_alumno;
    if (!id_alumno) {
      return res.status(400).json({
        error: "No se pudo identificar al alumno",
      });
    }
    const cursosConstancias =
      await certificadoConstanciaModel.getCursosParaConstancias(id_alumno);
    const constancias_disponibles = cursosConstancias.map((curso) => {
      let creditos;
      if (curso.id_credencial && curso.total_cursos_credencial > 0) {
        creditos = parseFloat((100 / curso.total_cursos_credencial).toFixed(2));
      } else {
        creditos = 100;
      }
      return {
        id_curso: curso.id_curso,
        nombre_curso: curso.nombre_curso,
        codigo_curso: curso.codigo_curso,
        descripcion_curso: curso.descripcion_curso,
        universidad: {
          id: curso.id_universidad,
          nombre: curso.nombre_universidad,
          logo_url: curso.logo_universidad,
        },
        calificacion_final: parseFloat(curso.calificacion_final || 0).toFixed(2),
        umbral_aprobatorio: curso.umbral_aprobatorio,
        creditos: creditos,
        total_actividades: curso.total_actividades,
        actividades_calificadas: curso.actividades_calificadas,
        puede_generar: Boolean(curso.puede_generar),
        ya_generada: Boolean(curso.id_constancia),
        id_constancia: curso.id_constancia,
        ruta_constancia: curso.ruta_constancia,
        fecha_emitida: curso.fecha_emitida,
        aprobado: parseFloat(curso.calificacion_final || 0) >= curso.umbral_aprobatorio,
        id_credencial: curso.id_credencial,
      };
    });
    const credencialesCertificados =
      await certificadoConstanciaModel.getCredencialesParaCertificados(id_alumno);
    const certificados_disponibles = await Promise.all(
      credencialesCertificados.map(async (credencial) => {
        const cursos = await certificadoConstanciaModel.getCursosDeCredencial(
          credencial.id_credencial,
          id_alumno
        );
        return {
          id_credencial: credencial.id_credencial,
          nombre_credencial: credencial.nombre_credencial,
          descripcion_credencial: credencial.descripcion_credencial,
          universidad: {
            id: credencial.id_universidad,
            nombre: credencial.nombre_universidad,
            logo_url: credencial.logo_universidad,
          },
          total_cursos: credencial.total_cursos,
          cursos_completados: credencial.cursos_completados,
          progreso_porcentaje:
            credencial.total_cursos > 0
              ? parseFloat(
                  ((credencial.cursos_completados / credencial.total_cursos) * 100).toFixed(2)
                )
              : 0,
          cursos_requeridos: cursos.map((c) => ({
            id_curso: c.id_curso,
            nombre_curso: c.nombre_curso,
            codigo_curso: c.codigo_curso,
            obligatorio: Boolean(c.obligatorio),
            completado: Boolean(c.completado),
            creditos_otorgados: c.creditos_otorgados,
            fecha_emitida: c.fecha_emitida,
          })),
          todos_completados:
            credencial.cursos_completados === credencial.total_cursos &&
            credencial.total_cursos > 0,
          puede_generar: Boolean(credencial.puede_generar),
          ya_generado:
            Boolean(credencial.id_certificacion_alumno) &&
            Boolean(credencial.completada),
          id_certificacion: credencial.id_certificacion_alumno,
          ruta_certificado: credencial.ruta_certificado,
          fecha_certificado: credencial.fecha_certificado,
        };
      })
    );
    res.json({
      constancias_disponibles,
      certificados_disponibles,
    });
  } catch (error) {
    console.error("Error al obtener documentos disponibles:", error);
    res.status(500).json({
      error: "Error al cargar los documentos disponibles",
      details: error.message,
    });
  }
};

// generarConstancia (sin cambios)
const generarConstancia = async (req, res) => {
  try {
    const id_alumno = req.user.id_alumno;
    const { id_curso } = req.params;
    if (!id_alumno || !id_curso) {
      return res.status(400).json({
        error: "Datos incompletos",
      });
    }
    const cursos =
      await certificadoConstanciaModel.getCursosParaConstancias(id_alumno);
    const curso = cursos.find((c) => c.id_curso === parseInt(id_curso));
    if (!curso) {
      return res.status(404).json({
        error: "Curso no encontrado o no estás inscrito",
      });
    }
    if (curso.id_constancia) {
      return res.status(400).json({
        error: "Ya tienes una constancia generada para este curso",
        id_constancia: curso.id_constancia,
        ruta_constancia: curso.ruta_constancia,
      });
    }
    if (!curso.puede_generar) {
      return res.status(400).json({
        error: "No cumples los requisitos para generar la constancia",
        mensaje: "Debes completar todas las actividades y aprobar el curso",
        actividades_calificadas: curso.actividades_calificadas,
        total_actividades: curso.total_actividades,
        calificacion_final: curso.calificacion_final,
        umbral_aprobatorio: curso.umbral_aprobatorio,
      });
    }
    let creditos_otorgados;
    if (curso.id_credencial && curso.total_cursos_credencial > 0) {
      creditos_otorgados = parseFloat(
        (100 / curso.total_cursos_credencial).toFixed(2)
      );
    } else {
      creditos_otorgados = 100;
    }
    const timestamp = Date.now();
    const relativePath = `/uploads/constancias/constancia_${id_alumno}_${id_curso}_${timestamp}.pdf`;
    const outputPath = path.resolve(__dirname, "..", relativePath.substring(1));
    const constancia = await certificadoConstanciaModel.crearConstancia({
      id_alumno,
      id_curso: parseInt(id_curso),
      id_credencial: curso.id_credencial || null,
      creditos_otorgados,
      ruta_constancia: relativePath,
    });
    const firmas = await Firmas.findForUniversity(curso.id_universidad);
    const firmaSEDEQ = firmas.find((f) => f.tipo_firma === "sedeq");
    const firmaUniversidad = firmas.find(
      (f) =>
        f.tipo_firma === "universidad" &&
        f.id_universidad === curso.id_universidad
    );
    const firmaCoordinador = firmas.find(
      (f) =>
        f.tipo_firma === "coordinador" &&
        f.id_universidad === curso.id_universidad
    );
    const firmaSEDEQBase64 = firmaSEDEQ
      ? `data:image/png;base64,${firmaSEDEQ.imagen_blob.toString("base64")}`
      : null;
    const firmaUniversidadBase64 = firmaUniversidad
      ? `data:image/png;base64,${firmaUniversidad.imagen_blob.toString("base64")}`
      : null;
    const firmaCoordinadorBase64 = firmaCoordinador
      ? `data:image/png;base64,${firmaCoordinador.imagen_blob.toString("base64")}`
      : null;
    let logoUniversidadBase64 = null;
    if (curso.logo_universidad) {
      const logoFullPath = path.resolve(__dirname, '..', curso.logo_universidad.substring(1));
      if (fs.existsSync(logoFullPath)) {
        const logoBuffer = fs.readFileSync(logoFullPath);
        const mimeType = path.extname(logoFullPath) === '.jpg' ? 'jpeg' : 'png';
        logoUniversidadBase64 = `data:image/${mimeType};base64,${logoBuffer.toString('base64')}`;
      } else {
        console.error(`Logo no encontrado en: ${logoFullPath}`);
      }
    }
    const pdfData = {
      nombreAlumno: curso.nombre_alumno,
      nombreMicrocredencial: curso.nombre_curso,
      totalCreditos: creditos_otorgados,
      credencialAsociada: curso.nombre_credencial || "N/A",
      logoUniversidad: logoUniversidadBase64,
      nombreUniversidad: curso.nombre_universidad,
      fechaEmision: new Date().toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      firmaSEDEQ: firmaSEDEQBase64,
      firmaUniversidad: firmaUniversidadBase64,
      firmaCoordinador: firmaCoordinadorBase64,
    };
    await generatePdf("constancia.html", pdfData, outputPath);
    res.status(201).json({
      mensaje: "Constancia generada exitosamente",
      id_constancia: constancia.id_constancia,
      ruta_constancia: constancia.ruta_constancia,
      creditos_otorgados: constancia.creditos_otorgados,
      nombre_curso: curso.nombre_curso,
    });
  } catch (error) {
    console.error("Error al generar constancia:", error);
    res.status(500).json({
      error: "Error al generar la constancia",
      details: error.message,
    });
  }
};

// generarCertificado (modificado para usar getCursosParaConstancias)
const generarCertificado = async (req, res) => {
  try {
    const id_alumno = req.user.id_alumno;
    const { id_credencial } = req.params;
    if (!id_alumno || !id_credencial) {
      return res.status(400).json({
        error: "Datos incompletos",
      });
    }
    const credenciales =
      await certificadoConstanciaModel.getCredencialesParaCertificados(id_alumno);
    const credencial = credenciales.find(
      (c) => c.id_credencial === parseInt(id_credencial)
    );
    if (!credencial) {
      return res.status(404).json({
        error: "Credencial no encontrada",
      });
    }
    if (credencial.id_certificacion_alumno && credencial.completada) {
      return res.status(400).json({
        error: "Ya tienes un certificado generado para esta credencial",
        id_certificacion: credencial.id_certificacion_alumno,
        ruta_certificado: credencial.ruta_certificado,
      });
    }
    if (!credencial.puede_generar) {
      return res.status(400).json({
        error: "No cumples los requisitos para generar el certificado",
        mensaje: `Debes completar todos los cursos de la credencial (${credencial.cursos_completados}/${credencial.total_cursos})`,
        cursos_completados: credencial.cursos_completados,
        total_cursos: credencial.total_cursos,
      });
    }
    const cursos = await certificadoConstanciaModel.getCursosDeCredencial(
      parseInt(id_credencial),
      id_alumno
    );
    let calificacion_promedio = null;
    if (cursos.filter((c) => c.completado).length > 0) {
      calificacion_promedio = 8.5; // TODO: Obtener calificaciones reales
    }
    const timestamp = Date.now();
    const relativePath = `/uploads/certificados/certificado_${id_alumno}_${id_credencial}_${timestamp}.pdf`;
    const outputPath = path.resolve(__dirname, "..", relativePath.substring(1));
    const certificado = await certificadoConstanciaModel.crearCertificado({
      id_alumno,
      id_certificacion: parseInt(id_credencial),
      calificacion_promedio,
      ruta_certificado: relativePath,
      descripcion: credencial.descripcion_credencial,
    });
    const firmas = await Firmas.findForUniversity(credencial.id_universidad);
    const firmaSEDEQ = firmas.find((f) => f.tipo_firma === "sedeq");
    const firmaUniversidad = firmas.find(
      (f) =>
        f.tipo_firma === "universidad" &&
        f.id_universidad === credencial.id_universidad
    );
    const firmaCoordinador = firmas.find(
      (f) =>
        f.tipo_firma === "coordinador" &&
        f.id_universidad === credencial.id_universidad
    );
    const firmaSEDEQBase64 = firmaSEDEQ
      ? `data:image/png;base64,${firmaSEDEQ.imagen_blob.toString("base64")}`
      : null;
    const firmaUniversidadBase64 = firmaUniversidad
      ? `data:image/png;base64,${firmaUniversidad.imagen_blob.toString("base64")}`
      : null;
    const firmaCoordinadorBase64 = firmaCoordinador
      ? `data:image/png;base64,${firmaCoordinador.imagen_blob.toString("base64")}`
      : null;
    let logoUniversidadBase64 = null;
    if (credencial.logo_universidad) {
      const logoFullPath = path.resolve(__dirname, '..', credencial.logo_universidad.substring(1));
      if (fs.existsSync(logoFullPath)) {
        const logoBuffer = fs.readFileSync(logoFullPath);
        const mimeType = path.extname(logoFullPath) === '.jpg' ? 'jpeg' : 'png';
        logoUniversidadBase64 = `data:image/${mimeType};base64,${logoBuffer.toString('base64')}`;
      } else {
        console.error(`Logo no encontrado en: ${logoFullPath}`);
      }
    }
    // Obtener nombre del alumno desde getCursosParaConstancias (como en constancias)
    const cursosParaNombre = await certificadoConstanciaModel.getCursosParaConstancias(id_alumno);
    const cursoEjemplo = cursosParaNombre[0]; // Tomamos el primer curso para obtener el nombre
    const nombreAlumno = cursoEjemplo?.nombre_alumno || "Nombre no disponible";
    const pdfData = {
      nombreAlumno: nombreAlumno,
      nombreCredencial: credencial.nombre_credencial,
      descripcionCredencial: credencial.descripcion_credencial,
      logoUniversidad: logoUniversidadBase64,
      nombreUniversidad: credencial.nombre_universidad,
      fechaEmision: new Date().toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      firmaSEDEQ: firmaSEDEQBase64,
      firmaUniversidad: firmaUniversidadBase64,
      firmaCoordinador: firmaCoordinadorBase64,
    };
    console.log("pdfData para certificado:", JSON.stringify(pdfData, null, 2));
    await generatePdf("certificado.html", pdfData, outputPath);
    res.status(201).json({
      mensaje: "Certificado generado exitosamente",
      id_certificacion: certificado.id_cert_alumno,
      ruta_certificado: certificado.ruta_certificado,
      calificacion_promedio: certificado.calificacion_promedio,
      nombre_credencial: credencial.nombre_credencial,
      creditos: 100,
    });
  } catch (error) {
    console.error("Error al generar certificado:", error);
    res.status(500).json({
      error: "Error al generar el certificado",
      details: error.message,
    });
  }
};

// descargarDocumento (sin cambios)
const descargarDocumento = async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const id_alumno = req.user.id_alumno;
    if (!["constancia", "certificado"].includes(tipo)) {
      return res.status(400).json({
        error: "Tipo de documento inválido. Debe ser 'constancia' o 'certificado'",
      });
    }
    let documento;
    if (tipo === "constancia") {
      documento = await certificadoConstanciaModel.getConstanciaPorId(id);
      if (!documento || documento.id_alumno !== id_alumno) {
        return res.status(404).json({
          error: "Constancia no encontrada o no tienes permisos para acceder",
        });
      }
    } else {
      documento = await certificadoConstanciaModel.getCertificadoPorId(id);
      if (!documento || documento.id_alumno !== id_alumno) {
        return res.status(404).json({
          error: "Certificado no encontrado o no tienes permisos para acceder",
        });
      }
    }
    const rutaArchivo = documento.ruta_constancia || documento.ruta_certificado;
    if (!rutaArchivo) {
      return res.status(404).json({
        error: "El documento no tiene archivo PDF asociado",
      });
    }
    const fullPath = path.resolve(__dirname, "..", rutaArchivo.substring(1));
    console.log(`[Diagnóstico] Intentando descargar: ${fullPath}`);
    if (!fs.existsSync(fullPath)) {
      console.error(`[Error] El archivo no existe en la ruta: ${fullPath}`);
      return res.status(404).json({
        error: "El archivo PDF no fue encontrado en el servidor. Puede que necesite ser generado de nuevo.",
      });
    }
    res.download(fullPath, (err) => {
      if (err) {
        console.error("Error al enviar el archivo con res.download:", err);
        if (!res.headersSent) {
          res.status(500).json({
            error: "Ocurrió un error al intentar enviar el archivo.",
            details: err.message,
          });
        }
      }
    });
  } catch (error) {
    console.error("Error al descargar documento:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Error interno al procesar la descarga",
        details: error.message,
      });
    }
  }
};
// getPublicUniversities
const getPublicUniversities = async (req, res) => {
  try {
    const universities = await certificadoConstanciaModel.getPublicUniversities();
    res.json({ universities });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener universidades públicas' });
  }
};

// getPublicStudentStatus
const getPublicStudentStatus = async (req, res) => {
  try {
    const { universityId, studentId } = req.query;
    console.log('Parámetros recibidos en el controlador:', { universityId, studentId });
    
    if (!universityId || !studentId) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const data = await certificadoConstanciaModel.getPublicStudentStatus(universityId, studentId);
    console.log('Datos obtenidos del modelo:', data);
    
    if (!data) {
      return res.status(404).json({ 
        error: 'No se encontraron resultados para la matrícula y universidad proporcionadas',
        details: { universityId, studentId }
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error en getPublicStudentStatus:', error);
    res.status(500).json({ 
      error: 'Error al obtener el estado del estudiante',
      details: error.message 
    });
  }
};

module.exports = {
  getDocumentosDisponibles,
  generarConstancia,
  generarCertificado,
  descargarDocumento,
  getPublicUniversities,
  getPublicStudentStatus
};