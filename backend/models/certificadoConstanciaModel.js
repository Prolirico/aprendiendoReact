const pool = require("../config/db");

const getCursosParaConstancias = async (idAlumno) => {
  try {
    const query = `
      SELECT 
        c.id_curso,
        c.nombre_curso,
        c.codigo_curso,
        c.descripcion_curso,
        u.id_universidad,
        u.nombre as nombre_universidad,
        u.logo_url as logo_universidad,
        i.calificacion_final,
        c.umbral_aprobatorio,
        COUNT(DISTINCT a.id_actividad) as total_actividades,
        COUNT(DISTINCT CASE WHEN e.calificacion IS NOT NULL THEN e.id_actividad END) as actividades_calificadas,
        CASE 
          WHEN i.calificacion_final >= c.umbral_aprobatorio 
          AND COUNT(DISTINCT a.id_actividad) = COUNT(DISTINCT CASE WHEN e.calificacion IS NOT NULL THEN e.id_actividad END)
          THEN 1 
          ELSE 0 
        END as puede_generar,
        ca.id_constancia,
        ca.ruta_constancia,
        ca.fecha_creacion as fecha_emitida,
        cr.id_credencial,
        (SELECT COUNT(*) FROM curso_credencial WHERE id_credencial = cr.id_credencial) as total_cursos_credencial
      FROM inscripcion i
      JOIN curso c ON i.id_curso = c.id_curso
      JOIN universidad u ON c.id_universidad = u.id_universidad
      LEFT JOIN actividad a ON c.id_curso = a.id_curso
      LEFT JOIN entrega e ON a.id_actividad = e.id_actividad AND e.id_alumno = ?
      LEFT JOIN constancia_alumno ca ON i.id_inscripcion = ca.id_inscripcion
      LEFT JOIN curso_credencial cc ON c.id_curso = cc.id_curso
      LEFT JOIN credencial cr ON cc.id_credencial = cr.id_credencial
      WHERE i.id_alumno = ?
      GROUP BY c.id_curso, u.id_universidad, ca.id_constancia, cr.id_credencial
      HAVING COUNT(DISTINCT a.id_actividad) > 0
      ORDER BY c.nombre_curso
    `;

    const [rows] = await pool.query(query, [idAlumno, idAlumno]);
    return rows;
  } catch (error) {
    console.error('Error en getCursosParaConstancias:', error);
    throw error;
  }
};

const getCredencialesParaCertificados = async (idAlumno) => {
  try {
    const query = `
      SELECT 
        cr.id_credencial,
        cr.nombre as nombre_credencial,
        cr.descripcion as descripcion_credencial,
        u.id_universidad,
        u.nombre as nombre_universidad,
        u.logo_url as logo_universidad,
        COUNT(DISTINCT cc.id_curso) as total_cursos_requeridos,
        COUNT(DISTINCT CASE WHEN i.calificacion_final >= c.umbral_aprobatorio THEN c.id_curso END) as cursos_aprobados,
        GROUP_CONCAT(DISTINCT CONCAT(c.nombre_curso, ' (', 
          CASE 
            WHEN i.calificacion_final >= c.umbral_aprobatorio THEN '✅ Aprobado' 
            ELSE '❌ Pendiente' 
          END, ')') 
          SEPARATOR '\n') as detalle_cursos,
        certa.id_certificado,
        certa.ruta_certificado,
        certa.fecha_emision,
        certa.fecha_vencimiento
      FROM credencial cr
      JOIN curso_credencial cc ON cr.id_credencial = cc.id_credencial
      JOIN curso c ON cc.id_curso = c.id_curso
      JOIN universidad u ON c.id_universidad = u.id_universidad
      LEFT JOIN inscripcion i ON c.id_curso = i.id_curso AND i.id_alumno = ?
      LEFT JOIN certificacion_alumno certa ON cr.id_credencial = certa.id_credencial AND certa.id_alumno = ?
      GROUP BY cr.id_credencial, u.id_universidad, certa.id_certificado
      HAVING total_cursos_requeridos > 0
      ORDER BY cr.nombre
    `;

    const [rows] = await pool.query(query, [idAlumno, idAlumno]);
    return rows;
  } catch (error) {
    console.error('Error en getCredencialesParaCertificados:', error);
    throw error;
  }
};

const getPublicStudentStatus = async (universityId, studentId) => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('🔍 Iniciando búsqueda de estudiante:', { universityId, studentId });

    // 1. Verificar si el alumno existe
    console.log('🔍 Buscando alumno con matrícula:', studentId);
    const [alumno] = await connection.query(
      'SELECT * FROM alumno WHERE matricula = ? AND id_universidad = ?', 
      [studentId, universityId]
    );
    
    if (alumno.length === 0) {
      console.error('❌ Alumno no encontrado');
      return null;
    }

    console.log('✅ Alumno encontrado:', {
      id: alumno[0].id_alumno,
      nombre: alumno[0].nombre_completo,
      matricula: alumno[0].matricula
    });

    // 2. Obtener todas las inscripciones del alumno
    console.log('🔍 Buscando inscripciones del alumno...');
    const [inscripciones] = await connection.query(`
      SELECT 
        i.*, 
        c.nombre_curso,
        c.id_curso,
        i.estatus_inscripcion,
        i.aprobado_curso,
        i.calificacion_final
      FROM inscripcion i
      JOIN curso c ON i.id_curso = c.id_curso
      WHERE i.id_alumno = ?
      ORDER BY i.fecha_finalizacion DESC
    `, [alumno[0].id_alumno]);

    console.log(`📋 Inscripciones encontradas: ${inscripciones.length}`);
    if (inscripciones.length === 0) {
      console.log('ℹ️ El alumno no tiene inscripciones');
    }

    // 3. Filtrar cursos completados
    const cursosCompletados = [];
    console.log('🔍 Analizando cursos completados...');
    
    for (const [index, insc] of inscripciones.entries()) {
      console.log(`\n📌 Curso ${index + 1}/${inscripciones.length}:`, {
        id_curso: insc.id_curso,
        nombre_curso: insc.nombre_curso,
        estatus: insc.estatus_inscripcion,
        calificacion: insc.calificacion_final
      });
      
      try {
        // Verificar si el curso está aprobado
        const estaAprobado = insc.estatus_inscripcion === 'aprobada';
        console.log(`  - Está aprobado: ${estaAprobado}`);
        
        // Verificar si tiene constancia generada
        const [constancias] = await connection.query(
          'SELECT * FROM constancia_alumno WHERE id_alumno = ? AND id_curso = ?',
          [alumno[0].id_alumno, insc.id_curso]
        );
        
        const tieneConstanciaGenerada = constancias.length > 0;
        console.log(`  - Tiene constancia generada: ${tieneConstanciaGenerada}`);
        
        // Si tiene constancia generada o está aprobado, lo consideramos un curso completado
        if (tieneConstanciaGenerada || estaAprobado) {
          console.log('  ✅ Curso marcado como completado');
          cursosCompletados.push({
            ...insc,
            calificacion_final: insc.calificacion_final || 100,
            fecha_finalizacion: insc.fecha_finalizacion || new Date()
          });
        }
      } catch (error) {
        console.error(`❌ Error al procesar curso ${insc.id_curso}:`, error);
        // Continuar con el siguiente curso en caso de error
        continue;
      }
    }

    console.log(`\n📊 Total de cursos completados: ${cursosCompletados.length}`);
    if (cursosCompletados.length === 0) {
      console.log('ℹ️ El alumno no tiene cursos completados y aprobados');
      return null;
    }

    // 4. Obtener información de la universidad
    console.log('🏫 Obteniendo información de la universidad...');
    const [universidad] = await connection.query(
      'SELECT nombre FROM universidad WHERE id_universidad = ?',
      [universityId]
    );

    if (!universidad || universidad.length === 0) {
      console.error('❌ No se encontró la universidad');
      return null;
    }

    // 5. Procesar constancias y certificaciones
    console.log('📄 Procesando constancias y certificaciones...');
    const cursos = [];
    
    for (const [index, insc] of cursosCompletados.entries()) {
      console.log(`\n📑 Procesando curso ${index + 1}/${cursosCompletados.length}: ${insc.nombre_curso}`);
      
      try {
        // Buscar constancia
        const [constancias] = await connection.query(
          'SELECT * FROM constancia_alumno WHERE id_alumno = ? AND id_curso = ?',
          [alumno[0].id_alumno, insc.id_curso]
        );
        console.log(`  - Constancias encontradas: ${constancias.length}`);

        // Buscar certificaciones
        const [certificaciones] = await connection.query(`
          SELECT ca.*, c.nombre as nombre_certificacion
          FROM certificacion_alumno ca
          JOIN requisitos_certificado rc ON ca.id_certificacion = rc.id_certificacion
          JOIN certificacion c ON c.id_certificacion = ca.id_certificacion
          WHERE ca.id_alumno = ? 
            AND rc.id_curso = ?
            AND ca.completada = 1
        `, [alumno[0].id_alumno, insc.id_curso]);
        
        console.log(`  - Certificaciones encontradas: ${certificaciones.length}`);

        cursos.push({
          courseName: insc.nombre_curso,
          completionDate: insc.fecha_finalizacion,
          recordUrl: constancias[0]?.ruta_constancia ? `/uploads/constancias/${constancias[0].ruta_constancia}` : null,
          certificateUrl: certificaciones[0]?.ruta_certificado ? `/uploads/certificados/${certificaciones[0].ruta_certificado}` : null
        });
      } catch (error) {
        console.error(`❌ Error al procesar documentos del curso ${insc.id_curso}:`, error);
        // Continuar con el siguiente curso en caso de error
        continue;
      }
    }

    // 6. Obtener credenciales del alumno
    console.log('🏆 Buscando credenciales del alumno...');
    let credenciales = [];
    try {
      const [credencialesData] = await connection.query(`
        SELECT 
          cr.id_credencial,
          cr.nombre as nombre_credencial,
          cr.descripcion as descripcion_credencial,
          certa.fecha_emision,
          certa.fecha_vencimiento,
          certa.ruta_certificado
        FROM credencial cr
        JOIN certificacion_alumno certa ON cr.id_credencial = certa.id_credencial
        WHERE certa.id_alumno = ? 
          AND certa.completada = 1
        ORDER BY certa.fecha_emision DESC
      `, [alumno[0].id_alumno]);

      console.log(`  - Credenciales encontradas: ${credencialesData.length}`);
      
      credenciales = credencialesData.map(credencial => ({
        id: credencial.id_credencial,
        nombre: credencial.nombre_credencial,
        descripcion: credencial.descripcion_credencial,
        fechaEmision: credencial.fecha_emision,
        fechaVencimiento: credencial.fecha_vencimiento,
        certificadoUrl: credencial.ruta_certificado ? `/uploads/certificados/${credencial.ruta_certificado}` : null
      }));
    } catch (error) {
      console.error('❌ Error al obtener credenciales:', error);
      // Continuar sin credenciales en caso de error
    }

    // 7. Preparar respuesta final
    const resultado = {
      studentName: alumno[0].nombre_completo,
      studentId: alumno[0].matricula,
      universityName: universidad[0]?.nombre || 'Universidad no encontrada',
      completedCourses: cursos,
      credentials: credenciales
    };

    console.log('✅ Proceso completado exitosamente');
    return resultado;

  } catch (error) {
    console.error('❌ Error en getPublicStudentStatus:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error; // Relanzar el error para manejarlo en el controlador
  } finally {
    if (connection) {
      try {
        await connection.release();
      } catch (e) {
        console.error('❌ Error al liberar la conexión:', e);
      }
    }
  }
};

module.exports = {
  getCursosParaConstancias,
  getCredencialesParaCertificados,
  getPublicStudentStatus
};
