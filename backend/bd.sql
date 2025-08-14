-- Base de Datos: Microcredenciales - Versión Final
-- Sistema de cursos gratuitos en línea con control de SEDEQ
-- Fecha: 2025-06-24

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS `microCredenciales`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE `microCredenciales`;

-- --------------------------------------------------------
-- Tabla: universidad
-- Descripción: Almacena información de las universidades participantes
-- --------------------------------------------------------

CREATE TABLE `universidad` (
  `id_universidad` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `clave_universidad` VARCHAR(20) NOT NULL,
  `direccion` TEXT,
  `telefono` VARCHAR(20),
  `email_contacto` VARCHAR(100),
  `ubicacion` VARCHAR(100),
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_universidad`),
  UNIQUE KEY `uk_clave_universidad` (`clave_universidad`),
  UNIQUE KEY `uk_email_contacto` (`email_contacto`),
  COLUMN 'logo_url' VARCHAR(255) NULL AFTER 'ubicacion',
  INDEX `idx_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: Facultades
-- Descripción: Almacena información de las facultades que tienes las universidades
-- --------------------------------------------------------
CREATE TABLE `facultades` (
  `id_facultad` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_universidad` INT UNSIGNED NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_facultad`),
  FOREIGN KEY (`id_universidad`) REFERENCES `universidad`(`id_universidad`) ON DELETE CASCADE,
  INDEX `idx_nombre_facultad` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: Carreras
-- Descripción: Almacena información de las carreras que tienes las universidades
-- --------------------------------------------------------
CREATE TABLE `carreras` (
  `id_carrera` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_facultad` INT UNSIGNED NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `clave_carrera` VARCHAR(20) NOT NULL,
  `duracion_anos` INT,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_carrera`),
  FOREIGN KEY (`id_facultad`) REFERENCES `facultades`(`id_facultad`) ON DELETE CASCADE,
  INDEX `idx_nombre_carrera` (`nombre`),
  UNIQUE KEY `uk_clave_carrera` (`clave_carrera`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- --------------------------------------------------------
-- Tabla: usuario
-- Descripción: Sistema de autenticación y autorización
-- --------------------------------------------------------

CREATE TABLE `usuario` (
  `id_usuario` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  `tipo_usuario` ENUM('alumno', 'maestro', 'admin_universidad', 'admin_sedeq') NOT NULL,
  `estatus` ENUM('activo', 'inactivo', 'pendiente', 'suspendido') NOT NULL DEFAULT 'pendiente',
  `ultimo_acceso` TIMESTAMP NULL,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  INDEX `idx_tipo_estatus` (`tipo_usuario`, `estatus`),
  COLUMN 'id_universidad' INT UNSIGNED NULL DEFAULT NULL AFTER 'estatus',
  CONSTRAINT `fk_usuario_universidad` FOREIGN KEY (`id_universidad`) REFERENCES `universidad` (`id_universidad`) ON DELETE SET NULL ON UPDATE CASCADE,
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: sesiones_usuario
-- Descripción: Control detallado de conexiones para auditoría
-- --------------------------------------------------------

CREATE TABLE `sesiones_usuario` (
  `id_sesion` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_usuario` INT UNSIGNED NOT NULL,
  `fecha_login` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_logout` TIMESTAMP NULL,
  `duracion_sesion` INT UNSIGNED, -- en minutos
  `estatus_sesion` ENUM('activa', 'cerrada', 'expirada', 'forzada') DEFAULT 'activa',
  PRIMARY KEY (`id_sesion`),
  INDEX `idx_usuario_fecha` (`id_usuario`, `fecha_login`),
  INDEX `idx_estatus` (`estatus_sesion`),
  CONSTRAINT `fk_sesion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: alumno
-- Descripción: Información específica de estudiantes
-- --------------------------------------------------------

CREATE TABLE `alumno` (
  `id_alumno` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_usuario` INT UNSIGNED NOT NULL,
  `id_universidad` INT UNSIGNED NOT NULL,
  `nombre_completo` VARCHAR(100) NOT NULL,
  `matricula` VARCHAR(20) NOT NULL,
  `correo_institucional` VARCHAR(100),
  `carrera` VARCHAR(100),
  `telefono` VARCHAR(20),
  `semestre_actual` TINYINT UNSIGNED,
  `estatus_academico` ENUM('regular', 'irregular', 'egresado', 'baja_temporal', 'baja_definitiva') DEFAULT 'regular',
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_alumno`),
  UNIQUE KEY `uk_id_usuario` (`id_usuario`),
  UNIQUE KEY `uk_matricula` (`matricula`),
  UNIQUE KEY `uk_correo_institucional` (`correo_institucional`),
  INDEX `idx_universidad` (`id_universidad`),
  INDEX `idx_estatus_academico` (`estatus_academico`),
  INDEX `idx_nombre_completo` (`nombre_completo`),
  INDEX `idx_carrera` (`carrera`),
  CONSTRAINT `fk_alumno_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_alumno_universidad` FOREIGN KEY (`id_universidad`) REFERENCES `universidad` (`id_universidad`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: maestro
-- Descripción: Información específica de profesores
-- --------------------------------------------------------

CREATE TABLE `maestro` (
  `id_maestro` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_usuario` INT UNSIGNED NOT NULL,
  `id_universidad` INT UNSIGNED NOT NULL,
  `nombre_completo` VARCHAR(100) NOT NULL,
  `email_institucional` VARCHAR(100) NOT NULL,
  `especialidad` VARCHAR(100),
  `grado_academico` ENUM('licenciatura', 'maestria', 'doctorado', 'posdoctorado'),
  `fecha_ingreso` DATE,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_maestro`),
  UNIQUE KEY `uk_id_usuario` (`id_usuario`),
  UNIQUE KEY `uk_email_institucional` (`email_institucional`),
  INDEX `idx_universidad` (`id_universidad`),
  INDEX `idx_especialidad` (`especialidad`),
  INDEX `idx_nombre_completo` (`nombre_completo`),
  CONSTRAINT `fk_maestro_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_maestro_universidad` FOREIGN KEY (`id_universidad`) REFERENCES `universidad` (`id_universidad`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: categoria_curso
-- Descripción: Categorización por carrera, tipo de apoyo, etc.
-- --------------------------------------------------------

CREATE TABLE `categoria_curso` (
  `id_categoria` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre_categoria` VARCHAR(100) NOT NULL,
  `descripcion` TEXT,
  `estatus` ENUM('activa', 'inactiva') DEFAULT 'activa',
  `orden_prioridad` INT NULL,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `uk_nombre_tipo` (`nombre_categoria`),
  INDEX `idx_estatus` (`estatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: curso
-- Descripción: Cursos gratuitos en línea
-- --------------------------------------------------------

CREATE TABLE `curso` (
  `id_curso` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_maestro` INT UNSIGNED NOT NULL,
  `id_categoria` INT UNSIGNED,
  `codigo_curso` VARCHAR(20) NULL,
  `nombre_curso` VARCHAR(150) NOT NULL,
  `descripcion` TEXT,
  `objetivos` TEXT,
  `prerequisitos` TEXT,
  `duracion_horas` SMALLINT UNSIGNED NOT NULL,
  `nivel` ENUM('basico', 'intermedio', 'avanzado') NOT NULL,
  `cupo_maximo` SMALLINT UNSIGNED DEFAULT 30,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `horario` VARCHAR(100),
  `link_clase` VARCHAR(500), -- Google Meet, Zoom, etc.
  `estatus_curso` ENUM('planificado', 'abierto', 'en_curso', 'finalizado', 'cancelado') DEFAULT 'planificado',
  `aprobado_universidad` BOOLEAN DEFAULT FALSE,
  `aprobado_sedeq` BOOLEAN DEFAULT FALSE,
  `fecha_aprobacion_universidad` TIMESTAMP NULL,
  `fecha_aprobacion_sedeq` TIMESTAMP NULL,
  `observaciones_aprobacion` TEXT,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_curso`),
  UNIQUE KEY `uk_codigo_curso` (`codigo_curso`),
  INDEX `idx_maestro` (`id_maestro`),
  INDEX `idx_categoria` (`id_categoria`),
  INDEX `idx_estatus` (`estatus_curso`),
  INDEX `idx_fechas` (`fecha_inicio`, `fecha_fin`),
  INDEX `idx_nivel` (`nivel`),
  INDEX `idx_aprobaciones` (`aprobado_universidad`, `aprobado_sedeq`),
  INDEX `idx_fecha_creacion` (`fecha_creacion`), -- Para filtro "más recientes"
  CONSTRAINT `fk_curso_maestro` FOREIGN KEY (`id_maestro`) REFERENCES `maestro` (`id_maestro`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_curso_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria_curso` (`id_categoria`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_fechas_curso` CHECK (`fecha_fin` >= `fecha_inicio`),
  CONSTRAINT `chk_duracion_horas` CHECK (`duracion_horas` > 0 AND `duracion_horas` <= 1000),
  CONSTRAINT `chk_cupo_maximo` CHECK (`cupo_maximo` > 0 AND `cupo_maximo` <= 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: inscripcion
-- Descripción: Solicitudes y inscripciones de alumnos
-- --------------------------------------------------------

CREATE TABLE `inscripcion` (
  `id_inscripcion` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_alumno` INT UNSIGNED NOT NULL,
  `id_curso` INT UNSIGNED NOT NULL,
  `fecha_solicitud` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_aprobacion` TIMESTAMP NULL,
  `aprobado_por` INT UNSIGNED NULL, -- ID del usuario que aprobó (maestro o admin universidad)
  `estatus_inscripcion` ENUM('solicitada', 'aprobada', 'rechazada', 'completada', 'abandonada') DEFAULT 'solicitada',
  `motivo_rechazo` TEXT,
  `calificacion_final` DECIMAL(5,2),
  `porcentaje_asistencia` DECIMAL(5,2),
  `fecha_finalizacion` TIMESTAMP NULL,
  `aprobado_curso` BOOLEAN DEFAULT FALSE, -- Si pasó el curso
  `constancia_emitida` BOOLEAN DEFAULT FALSE,
  `fecha_constancia` TIMESTAMP NULL,
  `comentarios_profesor` TEXT,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ruta_constancia` VARCHAR(500) NULL AFTER `fecha_constancia`,
  PRIMARY KEY (`id_inscripcion`),
  UNIQUE KEY `uk_alumno_curso` (`id_alumno`, `id_curso`),
  INDEX `idx_curso` (`id_curso`),
  INDEX `idx_estatus` (`estatus_inscripcion`),
  INDEX `idx_fecha_solicitud` (`fecha_solicitud`),
  INDEX `idx_aprobado_por` (`aprobado_por`),
  INDEX `idx_constancia` (`constancia_emitida`),
  CONSTRAINT `fk_inscripcion_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `alumno` (`id_alumno`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_inscripcion_curso` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_inscripcion_aprobador` FOREIGN KEY (`aprobado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_calificacion_final` CHECK (`calificacion_final` >= 0 AND `calificacion_final` <= 10),
  CONSTRAINT `chk_porcentaje_asistencia` CHECK (`porcentaje_asistencia` >= 0 AND `porcentaje_asistencia` <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: material_curso
-- Descripción: PDFs e imágenes subidas por el maestro
-- --------------------------------------------------------

CREATE TABLE `material_curso` (
  `id_material` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_curso` INT UNSIGNED NOT NULL,
  `nombre_archivo` VARCHAR(255) NOT NULL,
  `ruta_archivo` VARCHAR(500) NOT NULL,
  `tipo_archivo` ENUM('pdf', 'imagen', 'video', 'documento') NOT NULL,
  `tamaño_archivo` INT UNSIGNED, -- en bytes
  `descripcion` TEXT,
  `fecha_subida` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `subido_por` INT UNSIGNED NOT NULL, -- ID del maestro
  PRIMARY KEY (`id_material`),
  INDEX `idx_curso` (`id_curso`),
  INDEX `idx_tipo_archivo` (`tipo_archivo`),
  INDEX `idx_fecha_subida` (`fecha_subida`),
  INDEX `idx_subido_por` (`subido_por`),
  CONSTRAINT `fk_material_curso` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_material_usuario` FOREIGN KEY (`subido_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: evaluacion
-- Descripción: Calificaciones y comentarios del maestro
-- --------------------------------------------------------

CREATE TABLE `evaluacion` (
  `id_evaluacion` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_inscripcion` INT UNSIGNED NOT NULL,
  `tipo_evaluacion` ENUM('examen', 'tarea', 'proyecto', 'participacion', 'ensayo', 'practica', 'final') NOT NULL,
  `nombre_evaluacion` VARCHAR(100) NOT NULL,
  `calificacion` DECIMAL(5,2) NOT NULL,
  `calificacion_maxima` DECIMAL(5,2) DEFAULT 10.00,
  `peso_porcentual` DECIMAL(5,2) DEFAULT 100.00,
  `fecha_evaluacion` DATE NOT NULL,
  `comentarios` TEXT,
  `evaluado_por` INT UNSIGNED NOT NULL, -- ID del maestro
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_evaluacion`),
  INDEX `idx_inscripcion` (`id_inscripcion`),
  INDEX `idx_tipo_evaluacion` (`tipo_evaluacion`),
  INDEX `idx_fecha_evaluacion` (`fecha_evaluacion`),
  INDEX `idx_evaluado_por` (`evaluado_por`),
  CONSTRAINT `fk_evaluacion_inscripcion` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripcion` (`id_inscripcion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_evaluacion_maestro` FOREIGN KEY (`evaluado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_calificacion_evaluacion` CHECK (`calificacion` >= 0 AND `calificacion` <= `calificacion_maxima`),
  CONSTRAINT `chk_peso_porcentual` CHECK (`peso_porcentual` > 0 AND `peso_porcentual` <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Tabla: asistencia
-- Descripción: Control simple de asistencia (vino/no vino)
-- --------------------------------------------------------

CREATE TABLE `asistencia` (
  `id_asistencia` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_inscripcion` INT UNSIGNED NOT NULL,
  `fecha_clase` DATE NOT NULL,
  `asistio` BOOLEAN NOT NULL DEFAULT FALSE,
  `registrado_por` INT UNSIGNED NOT NULL, -- ID del maestro
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_asistencia`),
  UNIQUE KEY `uk_inscripcion_fecha` (`id_inscripcion`, `fecha_clase`),
  INDEX `idx_fecha_clase` (`fecha_clase`),
  INDEX `idx_asistio` (`asistio`),
  INDEX `idx_registrado_por` (`registrado_por`),
  CONSTRAINT `fk_asistencia_inscripcion` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripcion` (`id_inscripcion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_asistencia_maestro` FOREIGN KEY (`registrado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: certificacion (Define certificados mayores, ej. "Certificado de IA")
CREATE TABLE `certificacion` (
  `id_certificacion` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT,
  `id_categoria` INT UNSIGNED NULL, -- Opcional: Liga a categoria_curso para agrupar por tema
  `requisitos_adicionales` TEXT, -- Ej. "Promedio mínimo 80%"
  `estatus` ENUM('activa', 'inactiva') DEFAULT 'activa',
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_certificacion`),
  UNIQUE KEY `uk_nombre` (`nombre`),
  INDEX `idx_categoria` (`id_categoria`),
  CONSTRAINT `fk_certificacion_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria_curso` (`id_categoria`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: requisitos_certificado (Relaciona cursos con certificaciones)
CREATE TABLE `requisitos_certificado` (
  `id_requisito` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_certificacion` INT UNSIGNED NOT NULL,
  `id_curso` INT UNSIGNED NOT NULL,
  `obligatorio` BOOLEAN DEFAULT TRUE, -- Para requisitos opcionales en el futuro
  PRIMARY KEY (`id_requisito`),
  UNIQUE KEY `uk_certificacion_curso` (`id_certificacion`, `id_curso`),
  INDEX `idx_certificacion` (`id_certificacion`),
  INDEX `idx_curso` (`id_curso`),
  CONSTRAINT `fk_requisito_certificacion` FOREIGN KEY (`id_certificacion`) REFERENCES `certificacion` (`id_certificacion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_requisito_curso` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla: certificacion_alumno (Rastrea progreso y emisión de certificados por alumno)
CREATE TABLE `certificacion_alumno` (
  `id_cert_alumno` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_alumno` INT UNSIGNED NOT NULL,
  `id_certificacion` INT UNSIGNED NOT NULL,
  `progreso` DECIMAL(5,2) DEFAULT 0.00, -- Porcentaje de cursos completados
  `completada` BOOLEAN DEFAULT FALSE, -- True si todos los cursos están completados
  `fecha_completada` TIMESTAMP NULL,
  `certificado_emitido` BOOLEAN DEFAULT FALSE, -- True si el certificado mayor fue generado
  `fecha_certificado` TIMESTAMP NULL,
  `calificacion_promedio` DECIMAL(5,2) NULL, -- Promedio de calificaciones de cursos requeridos
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ruta_certificado` VARCHAR(500) NULL AFTER `fecha_certificado`,
  PRIMARY KEY (`id_cert_alumno`),
  UNIQUE KEY `uk_alumno_certificacion` (`id_alumno`, `id_certificacion`),
  INDEX `idx_alumno` (`id_alumno`),
  INDEX `idx_certificacion` (`id_certificacion`),
  INDEX `idx_completada` (`completada`),
  CONSTRAINT `fk_cert_alumno_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `alumno` (`id_alumno`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cert_alumno_certificacion` FOREIGN KEY (`id_certificacion`) REFERENCES `certificacion` (`id_certificacion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_calificacion_promedio` CHECK (`calificacion_promedio` >= 0 AND `calificacion_promedio` <= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Trigger para actualizar progreso automáticamente
DELIMITER //
CREATE TRIGGER `actualizar_progreso_certificacion`
AFTER UPDATE ON `inscripcion`
FOR EACH ROW
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE id_cert INT UNSIGNED;
    DECLARE cur CURSOR FOR
        SELECT id_certificacion
        FROM `requisitos_certificado`
        WHERE id_curso = NEW.id_curso;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    IF NEW.aprobado_curso = TRUE AND NEW.constancia_emitida = TRUE THEN
        OPEN cur;
        read_loop: LOOP
            FETCH cur INTO id_cert;
            IF done THEN
                LEAVE read_loop;
            END IF;

            INSERT INTO `certificacion_alumno` (`id_alumno`, `id_certificacion`, `progreso`)
            VALUES (NEW.id_alumno, id_cert, 0.00)
            ON DUPLICATE KEY UPDATE
                progreso = (
                    SELECT (COUNT(*) / (SELECT COUNT(*)
                                        FROM `requisitos_certificado`
                                        WHERE id_certificacion = id_cert)) * 100
                    FROM `inscripcion` i
                    JOIN `requisitos_certificado` cr
                        ON i.id_curso = cr.id_curso
                    WHERE i.id_alumno = NEW.id_alumno
                      AND cr.id_certificacion = id_cert
                      AND i.aprobado_curso = TRUE
                      AND i.constancia_emitida = TRUE
                ),
                completada = (progreso = 100),
                fecha_completada = IF(progreso = 100, CURRENT_TIMESTAMP, NULL),
                calificacion_promedio = (
                    SELECT AVG(i.calificacion_final)
                    FROM `inscripcion` i
                    JOIN `requisitos_certificado` cr
                        ON i.id_curso = cr.id_curso
                    WHERE i.id_alumno = NEW.id_alumno
                      AND cr.id_certificacion = id_cert
                      AND i.aprobado_curso = TRUE
                );
        END LOOP;
        CLOSE cur;
    END IF;
END //
DELIMITER ;

-- --------------------------------------------------------
-- Tabla: auditoria
-- Descripción: Registro de cambios críticos para reclamos y seguridad
-- --------------------------------------------------------

CREATE TABLE `auditoria` (
  `id_auditoria` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tabla_afectada` VARCHAR(50) NOT NULL,
  `id_registro` INT UNSIGNED NOT NULL,
  `accion` ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  `datos_anteriores` JSON, -- Cómo estaba antes del cambio
  `datos_nuevos` JSON, -- Cómo quedó después del cambio
  `id_usuario` INT UNSIGNED,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `descripcion` VARCHAR(255), -- Descripción legible del cambio
  `fecha_accion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_auditoria`),
  INDEX `idx_tabla_accion` (`tabla_afectada`, `accion`),
  INDEX `idx_fecha_accion` (`fecha_accion`),
  INDEX `idx_usuario` (`id_usuario`),
  INDEX `idx_tabla_registro` (`tabla_afectada`, `id_registro`),
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Trigger: Certificados y constancias
-- Descripción: Registro de cambios para certificaciones y constancias
-- --------------------------------------------------------
DELIMITER //
CREATE TRIGGER `auditar_constancia` AFTER UPDATE ON `inscripcion`
FOR EACH ROW
BEGIN
  IF NEW.constancia_emitida = TRUE AND OLD.constancia_emitida = FALSE THEN
    INSERT INTO `auditoria` (`tabla_afectada`, `id_registro`, `accion`, `datos_anteriores`, `datos_nuevos`, `id_usuario`, `descripcion`, `fecha_accion`)
    VALUES (
      'inscripcion',
      NEW.id_inscripcion,
      'UPDATE',
      JSON_OBJECT('constancia_emitida', OLD.constancia_emitida, 'fecha_constancia', OLD.fecha_constancia),
      JSON_OBJECT('constancia_emitida', NEW.constancia_emitida, 'fecha_constancia', NEW.fecha_constancia),
      NEW.aprobado_por,
      'Emisión de constancia para curso',
      CURRENT_TIMESTAMP
    );
  END IF;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER `auditar_certificado` AFTER UPDATE ON `certificacion_alumno`
FOR EACH ROW
BEGIN
  IF NEW.certificado_emitido = TRUE AND OLD.certificado_emitido = FALSE THEN
    INSERT INTO `auditoria` (`tabla_afectada`, `id_registro`, `accion`, `datos_anteriores`, `datos_nuevos`, `id_usuario`, `descripcion`, `fecha_accion`)
    VALUES (
      'certificacion_alumno',
      NEW.id_cert_alumno,
      'UPDATE',
      JSON_OBJECT('certificado_emitido', OLD.certificado_emitido, 'fecha_certificado', OLD.fecha_certificado),
      JSON_OBJECT('certificado_emitido', NEW.certificado_emitido, 'fecha_certificado', NEW.fecha_certificado),
      NULL, -- Ajustar según quién emite
      'Emisión de certificado mayor',
      CURRENT_TIMESTAMP
    );
  END IF;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- Tabla de los domminios aceptados para registro en el Login de alumnos
-- ---------------------------------------------------------------------

CREATE TABLE dominiosUniversidades (
    id_dominio INT AUTO_INCREMENT PRIMARY KEY,
    dominio VARCHAR(255) NOT NULL UNIQUE,
    estatus ENUM('activo', 'inactivo') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserting initial Querétaro university domains
INSERT INTO dominiosUniversidades (dominio, estatus) VALUES
('upsrj.edu.mx', 'activo'),
('upq.mx', 'activo'),
('utcorregidora.edu.mx', 'activo'),
('utsrj.edu.mx', 'activo'),
('uteq.edu.mx', 'activo'),
('soyunaq.mx', 'activo'),
('unaq.mx', 'activo'),
('queretaro.tecnm.mx', 'activo'),
('uaq.mx', 'activo');


-- Crear usuario administrador SEDEQ por defecto
-- --------------------------------------------------------

INSERT INTO `usuario` (`username`, `email`, `password_hash`, `tipo_usuario`, `estatus`) VALUES
('admin_sedeq', 'admin@sedeq.gob.mx', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin_sedeq', 'activo');

-- --------------------------------------------------------
-- Índices adicionales para filtros y búsquedas
-- --------------------------------------------------------

-- Para filtros de cursos
CREATE INDEX `idx_curso_universidad` ON `curso` (`id_maestro`, `estatus_curso`);
CREATE INDEX `idx_curso_filtros` ON `curso` (`id_categoria`, `nivel`, `fecha_inicio`);

-- Para búsquedas de alumnos
CREATE INDEX `idx_alumno_busqueda` ON `alumno` (`nombre_completo`, `matricula`, `carrera`);

-- Para reportes de conexiones
CREATE INDEX `idx_sesiones_reporte` ON `sesiones_usuario` (`id_usuario`, `fecha_login`, `estatus_sesion`);

-- Para control de inscripciones
CREATE INDEX `idx_inscripcion_control` ON `inscripcion` (`estatus_inscripcion`, `fecha_solicitud`);

-- Almacena el Google sub ID de los usuarios que se registran a través de Google para evitar registros duplicados.
ALTER TABLE usuario ADD COLUMN google_id VARCHAR(255) UNIQUE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
