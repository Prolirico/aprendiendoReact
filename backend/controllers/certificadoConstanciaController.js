const certificadoConstanciaModel = require("../models/certificadoConstanciaModel");
const { generatePdf } = require("../utils/pdfGenerator");
const path = require("path");
const fs = require("fs");

/**
 * Obtiene todos los documentos disponibles para el alumno
 * (constancias y certificados)
 */
const getDocumentosDisponibles = async (req, res) => {
  try {
    const id_alumno = req.user.id_alumno;

    if (!id_alumno) {
      return res.status(400).json({
        error: "No se pudo identificar al alumno",
      });
    }

    // Obtener cursos donde puede generar constancias
    const cursosConstancias =
      await certificadoConstanciaModel.getCursosParaConstancias(id_alumno);

    // Procesar datos de constancias con cálculo de créditos
    const constancias_disponibles = cursosConstancias.map((curso) => {
      // Calcular créditos según pertenezca o no a una credencial
      let creditos;
      if (curso.id_credencial && curso.total_cursos_credencial > 0) {
        // Si pertenece a credencial: 100 / total_cursos
        creditos = parseFloat((100 / curso.total_cursos_credencial).toFixed(2));
      } else {
        // Si NO pertenece a credencial: 100
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
        calificacion_final: parseFloat(curso.calificacion_final || 0).toFixed(
          2,
        ),
        umbral_aprobatorio: curso.umbral_aprobatorio,
        creditos: creditos,
        total_actividades: curso.total_actividades,
        actividades_calificadas: curso.actividades_calificadas,
        puede_generar: Boolean(curso.puede_generar),
        ya_generada: Boolean(curso.id_constancia),
        id_constancia: curso.id_constancia,
        ruta_constancia: curso.ruta_constancia,
        fecha_emitida: curso.fecha_emitida,
        aprobado:
          parseFloat(curso.calificacion_final || 0) >= curso.umbral_aprobatorio,
        id_credencial: curso.id_credencial,
      };
    });

    // Obtener credenciales donde puede generar certificados
    const credencialesCertificados =
      await certificadoConstanciaModel.getCredencialesParaCertificados(
        id_alumno,
      );

    // Procesar datos de certificados
    const certificados_disponibles = await Promise.all(
      credencialesCertificados.map(async (credencial) => {
        // Obtener cursos de la credencial con su estado
        const cursos = await certificadoConstanciaModel.getCursosDeCredencial(
          credencial.id_credencial,
          id_alumno,
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
                  (
                    (credencial.cursos_completados / credencial.total_cursos) *
                    100
                  ).toFixed(2),
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
      }),
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

/**
 * Genera una constancia para un curso específico
 */
const generarConstancia = async (req, res) => {
  try {
    const id_alumno = req.user.id_alumno;
    const { id_curso } = req.params;

    if (!id_alumno || !id_curso) {
      return res.status(400).json({
        error: "Datos incompletos",
      });
    }

    // Verificar que el alumno puede generar la constancia
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

    // Calcular créditos según pertenezca o no a una credencial
    let creditos_otorgados;
    if (curso.id_credencial && curso.total_cursos_credencial > 0) {
      creditos_otorgados = parseFloat(
        (100 / curso.total_cursos_credencial).toFixed(2),
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

    // Datos para la plantilla PDF
    const pdfData = {
      nombreAlumno: curso.nombre_alumno,
      nombreMicrocredencial: curso.nombre_curso,
      totalCreditos: creditos_otorgados,
      credencialAsociada: curso.nombre_credencial || "N/A",
      logoUniversidad: curso.logo_universidad,
      nombreUniversidad: curso.nombre_universidad,
      fechaEmision: new Date().toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      // Aquí puedes añadir las rutas a las firmas si las tienes
      // firmaSEDEQ: '/path/to/firma.png',
      // firmaUniversidad: '/path/to/firma.png',
      // firmaCoordinador: '/path/to/firma.png',
    };

    // Generar el PDF
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

/**
 * Genera un certificado para una credencial específica
 */
const generarCertificado = async (req, res) => {
  try {
    const id_alumno = req.user.id_alumno;
    const { id_credencial } = req.params;

    if (!id_alumno || !id_credencial) {
      return res.status(400).json({
        error: "Datos incompletos",
      });
    }

    // Verificar que el alumno puede generar el certificado
    const credenciales =
      await certificadoConstanciaModel.getCredencialesParaCertificados(
        id_alumno,
      );
    const credencial = credenciales.find(
      (c) => c.id_credencial === parseInt(id_credencial),
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

    // Obtener cursos completados para calcular promedio
    const cursos = await certificadoConstanciaModel.getCursosDeCredencial(
      parseInt(id_credencial),
      id_alumno,
    );

    // Calcular calificación promedio de las constancias
    const cursosConCalificacion = cursos.filter((c) => c.completado);
    let calificacion_promedio = null;

    if (cursosConCalificacion.length > 0) {
      // TODO: Obtener calificaciones reales de cada curso
      // Por ahora usamos un promedio de ejemplo
      calificacion_promedio = 8.5;
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

    // Datos para la plantilla PDF
    const pdfData = {
      nombreAlumno: req.user.nombre_completo, // Asumiendo que tienes el nombre en req.user
      nombreCredencial: credencial.nombre_credencial,
      descripcionCredencial: credencial.descripcion_credencial,
      logoUniversidad: credencial.logo_universidad,
      nombreUniversidad: credencial.nombre_universidad,
      fechaEmision: new Date().toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    // Generar el PDF
    await generatePdf("certificado.html", pdfData, outputPath);

    res.status(201).json({
      mensaje: "Certificado generado exitosamente",
      id_certificacion: certificado.id_cert_alumno,
      ruta_certificado: certificado.ruta_certificado,
      calificacion_promedio: certificado.calificacion_promedio,
      nombre_credencial: credencial.nombre_credencial,
      creditos: 100, // Siempre 100/100 para certificados
    });
  } catch (error) {
    console.error("Error al generar certificado:", error);
    res.status(500).json({
      error: "Error al generar el certificado",
      details: error.message,
    });
  }
};

/**
 * Descarga una constancia o certificado
 */
const descargarDocumento = async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const id_alumno = req.user.id_alumno;

    if (!["constancia", "certificado"].includes(tipo)) {
      return res.status(400).json({
        error:
          "Tipo de documento inválido. Debe ser 'constancia' o 'certificado'",
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

    // --- INICIO: Código de diagnóstico ---
    console.log(`[Diagnóstico] Intentando descargar: ${fullPath}`);
    if (!fs.existsSync(fullPath)) {
      console.error(`[Error] El archivo no existe en la ruta: ${fullPath}`);
      return res.status(404).json({
        error:
          "El archivo PDF no fue encontrado en el servidor. Puede que necesite ser generado de nuevo.",
      });
    }
    // --- FIN: Código de diagnóstico ---

    // Enviar el archivo para descarga
    res.download(fullPath, (err) => {
      if (err) {
        console.error("Error al enviar el archivo con res.download:", err);
        // Es importante verificar si las cabeceras ya se enviaron
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

module.exports = {
  getDocumentosDisponibles,
  generarConstancia,
  generarCertificado,
  descargarDocumento,
};
