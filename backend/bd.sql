/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.3-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: microCredenciales
-- ------------------------------------------------------
-- Server version	11.8.3-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `alumno`
--

DROP TABLE IF EXISTS `alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumno` (
  `id_alumno` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int(10) unsigned NOT NULL,
  `id_universidad` int(10) unsigned NOT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `matricula` varchar(20) NOT NULL,
  `correo_institucional` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `semestre_actual` tinyint(3) unsigned DEFAULT NULL,
  `estatus_academico` enum('regular','irregular','egresado','baja_temporal','baja_definitiva') DEFAULT 'regular',
  `fecha_registro` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `id_carrera` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id_alumno`),
  UNIQUE KEY `uk_id_usuario` (`id_usuario`),
  UNIQUE KEY `uk_matricula_universidad` (`matricula`,`id_universidad`),
  UNIQUE KEY `uk_correo_institucional` (`correo_institucional`),
  KEY `idx_universidad` (`id_universidad`),
  KEY `idx_estatus_academico` (`estatus_academico`),
  KEY `idx_nombre_completo` (`nombre_completo`),
  KEY `idx_alumno_busqueda` (`nombre_completo`,`matricula`),
  KEY `fk_alumno_carrera_idx` (`id_carrera`),
  CONSTRAINT `fk_alumno_carrera` FOREIGN KEY (`id_carrera`) REFERENCES `carreras` (`id_carrera`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_alumno_universidad` FOREIGN KEY (`id_universidad`) REFERENCES `universidad` (`id_universidad`) ON UPDATE CASCADE,
  CONSTRAINT `fk_alumno_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumno`
--

LOCK TABLES `alumno` WRITE;
/*!40000 ALTER TABLE `alumno` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `alumno` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `asistencia`
--

DROP TABLE IF EXISTS `asistencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `asistencia` (
  `id_asistencia` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_inscripcion` int(10) unsigned NOT NULL,
  `fecha_clase` date NOT NULL,
  `asistio` tinyint(1) NOT NULL DEFAULT 0,
  `registrado_por` int(10) unsigned NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_asistencia`),
  UNIQUE KEY `uk_inscripcion_fecha` (`id_inscripcion`,`fecha_clase`),
  KEY `idx_fecha_clase` (`fecha_clase`),
  KEY `idx_asistio` (`asistio`),
  KEY `idx_registrado_por` (`registrado_por`),
  CONSTRAINT `fk_asistencia_inscripcion` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripcion` (`id_inscripcion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_asistencia_maestro` FOREIGN KEY (`registrado_por`) REFERENCES `usuario` (`id_usuario`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asistencia`
--

LOCK TABLES `asistencia` WRITE;
/*!40000 ALTER TABLE `asistencia` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `asistencia` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `auditoria`
--

DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `id_auditoria` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tabla_afectada` varchar(50) NOT NULL,
  `id_registro` int(10) unsigned NOT NULL,
  `accion` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `datos_anteriores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_anteriores`)),
  `datos_nuevos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_nuevos`)),
  `id_usuario` int(10) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha_accion` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_auditoria`),
  KEY `idx_tabla_accion` (`tabla_afectada`,`accion`),
  KEY `idx_fecha_accion` (`fecha_accion`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_tabla_registro` (`tabla_afectada`,`id_registro`),
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `auditoria` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `carreras`
--

DROP TABLE IF EXISTS `carreras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `carreras` (
  `id_carrera` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_facultad` int(10) unsigned NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `clave_carrera` varchar(20) NOT NULL,
  `duracion_anos` int(11) DEFAULT NULL,
  `fecha_registro` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_carrera`),
  UNIQUE KEY `uk_clave_carrera` (`clave_carrera`),
  KEY `id_facultad` (`id_facultad`),
  KEY `idx_nombre_carrera` (`nombre`),
  CONSTRAINT `carreras_ibfk_1` FOREIGN KEY (`id_facultad`) REFERENCES `facultades` (`id_facultad`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carreras`
--

LOCK TABLES `carreras` WRITE;
/*!40000 ALTER TABLE `carreras` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `carreras` VALUES
(1,34,'Licenciatura en Informática','123',4,'2025-08-14 15:42:04','2025-08-14 15:42:04'),
(6,35,'Ingeniería en Software','111',4,'2025-08-15 14:54:46','2025-08-15 14:54:46'),
(7,34,'Ingeniería de Software','124',4,'2025-08-15 15:25:02','2025-08-15 15:25:02'),
(8,34,'Ingeniería en Ciencia y Analítica de Datos','125',4,'2025-08-15 15:25:28','2025-08-15 15:25:28'),
(9,36,'Ingeniería en Sistemas Computacionales','999',4,'2025-08-21 16:46:41','2025-08-21 16:46:41');
/*!40000 ALTER TABLE `carreras` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `categoria_curso`
--

DROP TABLE IF EXISTS `categoria_curso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria_curso` (
  `id_categoria` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estatus` enum('activa','inactiva') DEFAULT 'activa',
  `orden_prioridad` int(11) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `color_hex` varchar(7) DEFAULT NULL,
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `uk_nombre` (`nombre_categoria`),
  KEY `idx_estatus` (`estatus`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoria_curso`
--

LOCK TABLES `categoria_curso` WRITE;
/*!40000 ALTER TABLE `categoria_curso` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `categoria_curso` VALUES
(6,'Inteligencia Artificial','Uso de algoritmos y modelos para simular la inteligencia humana en máquinas.','activa',1,'2025-08-11 16:34:06',NULL),
(7,'Ciencia de Datos','Análisis e interpretación de datos para obtener información valiosa.','activa',2,'2025-08-11 16:34:32',NULL),
(8,'Cloud Computing','Uso de servicios y recursos informáticos a través de la nube.','activa',3,'2025-08-11 16:42:08',NULL),
(9,'Inglés','Desarrollo de habilidades lingüísticas para comunicación en inglés.','activa',4,'2025-08-11 16:46:21',NULL),
(10,'Análisis de Datos','Procesamiento y evaluación de datos para la toma de decisiones.','activa',5,'2025-08-11 16:47:17',NULL),
(11,'Habilidades Blandas','Competencias interpersonales para un mejor desempeño profesional.','activa',6,'2025-08-11 16:54:13',NULL),
(12,'Comunicación (Oral y Escrita)','Técnicas para expresar ideas de forma clara y efectiva.','activa',7,'2025-08-11 16:59:00',NULL),
(13,'Gestión de Tiempo','Estrategias para organizar y optimizar el uso del tiempo.','activa',8,'2025-08-11 17:00:20',NULL),
(14,'Liderazgo','Habilidades para guiar, motivar y coordinar equipos.','activa',9,'2025-08-11 17:00:34',NULL),
(15,'Salud y Bienestar','Prácticas para mejorar el estado físico, mental y emocional.','activa',10,'2025-08-11 17:01:05',NULL),
(16,'Herramientas Ofimáticas','Uso eficiente de software de oficina para tareas laborales.','activa',11,'2025-08-11 17:01:26',NULL),
(17,'Manejo de Proyectos','Planificación, ejecución y seguimiento de proyectos.','activa',12,'2025-08-11 17:01:43',NULL),
(18,'Marketing','Estrategias para promocionar y posicionar productos o servicios.','activa',13,'2025-08-11 17:01:57',NULL);
/*!40000 ALTER TABLE `categoria_curso` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `certificacion`
--

DROP TABLE IF EXISTS `certificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificacion` (
  `id_certificacion` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_universidad` int(10) unsigned DEFAULT NULL,
  `id_facultad` int(10) unsigned DEFAULT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `id_categoria` int(10) unsigned DEFAULT NULL,
  `requisitos_adicionales` text DEFAULT NULL,
  `estatus` enum('activa','inactiva') DEFAULT 'activa',
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_certificacion`),
  UNIQUE KEY `uk_nombre` (`nombre`),
  KEY `idx_categoria` (`id_categoria`),
  KEY `fk_certificacion_universidad` (`id_universidad`),
  KEY `fk_certificacion_facultad` (`id_facultad`),
  CONSTRAINT `fk_certificacion_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria_curso` (`id_categoria`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_certificacion_facultad` FOREIGN KEY (`id_facultad`) REFERENCES `facultades` (`id_facultad`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_certificacion_universidad` FOREIGN KEY (`id_universidad`) REFERENCES `universidad` (`id_universidad`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificacion`
--

LOCK TABLES `certificacion` WRITE;
/*!40000 ALTER TABLE `certificacion` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `certificacion` VALUES
(1,14,34,'IA','Credencial IA para principiantes',NULL,NULL,'activa','2025-08-19 16:10:15','2025-08-20 16:08:45');
/*!40000 ALTER TABLE `certificacion` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `certificacion_alumno`
--

DROP TABLE IF EXISTS `certificacion_alumno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificacion_alumno` (
  `id_cert_alumno` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_alumno` int(10) unsigned NOT NULL,
  `id_certificacion` int(10) unsigned NOT NULL,
  `progreso` decimal(5,2) DEFAULT 0.00,
  `completada` tinyint(1) DEFAULT 0,
  `fecha_completada` timestamp NULL DEFAULT NULL,
  `certificado_emitido` tinyint(1) DEFAULT 0,
  `fecha_certificado` timestamp NULL DEFAULT NULL,
  `ruta_certificado` varchar(500) DEFAULT NULL,
  `calificacion_promedio` decimal(5,2) DEFAULT NULL,
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_cert_alumno`),
  UNIQUE KEY `uk_alumno_certificacion` (`id_alumno`,`id_certificacion`),
  KEY `idx_alumno` (`id_alumno`),
  KEY `idx_certificacion` (`id_certificacion`),
  KEY `idx_completada` (`completada`),
  CONSTRAINT `fk_cert_alumno_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `alumno` (`id_alumno`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cert_alumno_certificacion` FOREIGN KEY (`id_certificacion`) REFERENCES `certificacion` (`id_certificacion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_calificacion_promedio` CHECK (`calificacion_promedio` >= 0 and `calificacion_promedio` <= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificacion_alumno`
--

LOCK TABLES `certificacion_alumno` WRITE;
/*!40000 ALTER TABLE `certificacion_alumno` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `certificacion_alumno` ENABLE KEYS */;
UNLOCK TABLES;
commit;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `auditar_certificado` AFTER UPDATE ON `certificacion_alumno`
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `curso`
--

DROP TABLE IF EXISTS `curso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `curso` (
  `id_curso` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_maestro` int(10) unsigned NOT NULL,
  `id_categoria` int(10) unsigned DEFAULT NULL,
  `id_universidad` int(10) unsigned DEFAULT NULL,
  `id_facultad` int(10) unsigned DEFAULT NULL,
  `id_carrera` int(10) unsigned DEFAULT NULL,
  `codigo_curso` varchar(20) DEFAULT NULL,
  `nombre_curso` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `objetivos` text DEFAULT NULL,
  `prerequisitos` text DEFAULT NULL,
  `duracion_horas` smallint(5) unsigned NOT NULL,
  `nivel` enum('basico','intermedio','avanzado') NOT NULL,
  `cupo_maximo` smallint(5) unsigned DEFAULT 30,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `horario` varchar(100) DEFAULT NULL,
  `link_clase` varchar(500) DEFAULT NULL,
  `estatus_curso` enum('planificado','abierto','en_curso','finalizado','cancelado') DEFAULT 'planificado',
  `aprobado_universidad` tinyint(1) DEFAULT 0,
  `aprobado_sedeq` tinyint(1) DEFAULT 0,
  `fecha_aprobacion_universidad` timestamp NULL DEFAULT NULL,
  `fecha_aprobacion_sedeq` timestamp NULL DEFAULT NULL,
  `observaciones_aprobacion` text DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_curso`),
  UNIQUE KEY `uk_codigo_curso` (`codigo_curso`),
  KEY `idx_maestro` (`id_maestro`),
  KEY `idx_categoria` (`id_categoria`),
  KEY `idx_estatus` (`estatus_curso`),
  KEY `idx_fechas` (`fecha_inicio`,`fecha_fin`),
  KEY `idx_nivel` (`nivel`),
  KEY `idx_aprobaciones` (`aprobado_universidad`,`aprobado_sedeq`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  KEY `idx_curso_universidad` (`id_maestro`,`estatus_curso`),
  KEY `idx_curso_filtros` (`id_categoria`,`nivel`,`fecha_inicio`),
  KEY `fk_curso_universidad` (`id_universidad`),
  KEY `fk_curso_facultad` (`id_facultad`),
  KEY `fk_curso_carrera` (`id_carrera`),
  CONSTRAINT `fk_curso_carrera` FOREIGN KEY (`id_carrera`) REFERENCES `carreras` (`id_carrera`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_curso_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria_curso` (`id_categoria`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_curso_facultad` FOREIGN KEY (`id_facultad`) REFERENCES `facultades` (`id_facultad`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_curso_maestro` FOREIGN KEY (`id_maestro`) REFERENCES `maestro` (`id_maestro`) ON UPDATE CASCADE,
  CONSTRAINT `fk_curso_universidad` FOREIGN KEY (`id_universidad`) REFERENCES `universidad` (`id_universidad`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_fechas_curso` CHECK (`fecha_fin` >= `fecha_inicio`),
  CONSTRAINT `chk_duracion_horas` CHECK (`duracion_horas` > 0 and `duracion_horas` <= 1000),
  CONSTRAINT `chk_cupo_maximo` CHECK (`cupo_maximo` > 0 and `cupo_maximo` <= 1000)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curso`
--

LOCK TABLES `curso` WRITE;
/*!40000 ALTER TABLE `curso` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `curso` VALUES
(1,5,6,14,34,1,'CURSO-00001','Dominando los Modelos LLM de IA','Curso especializado en el estudio y comprensión de los Modelos de Lenguaje de Gran Escala (LLM), abordando su arquitectura, funcionamiento, entrenamiento y aplicaciones prácticas en generación y análisis de texto.','Conocimientos básicos de Python y manejo de librerías para IA.\nFundamentos de redes neuronales y procesamiento de lenguaje natural (NLP).\nnociones de álgebra lineal y probabilidad.','Comprender la arquitectura y principios de funcionamiento de los LLM.\nAnalizar cómo se entrenan y optimizan estos modelos.\nImplementar ejemplos prácticos con APIs de LLM.\nEvaluar ventajas, limitaciones y consideraciones éticas en su uso.',30,'basico',80,'2025-08-13','2025-08-31','','','planificado',0,0,NULL,NULL,NULL,'2025-08-12 14:35:13','2025-08-18 15:48:30'),
(2,13,6,14,34,7,'CURSO-00002','Python Primeros pasos','Aprenderas la base de python para entender las redes neuronales.','Poder crear tu propia IA.','Saber  tipos de datos, arreglos y dominar un lenguaje de programacion, puede ser C++ o Java.',20,'basico',60,'2025-08-18','2025-08-29','','','planificado',0,0,NULL,NULL,NULL,'2025-08-15 16:28:52','2025-08-18 15:48:47'),
(3,15,10,15,35,6,'CURSO-00003','Bases de datos en mysql','Aprender mysql','Manejar bases de datos robustas para proyectos grandes.','Saber de entidad relacion y tipos de datos.',30,'basico',150,'2025-08-25','2025-08-31','','','planificado',0,0,NULL,NULL,NULL,'2025-08-15 17:41:23','2025-08-18 15:40:28'),
(4,5,8,14,34,1,'CURSO-00004','Edge Computing','Aprenderas edge computing','Aprender mejores bases para proyectos que necesitan enviar y recibir datos en distancias cortas.','Saber acerca de redes y conexiones.',60,'intermedio',120,'2025-09-01','2025-09-07','','','planificado',0,0,NULL,NULL,NULL,'2025-08-20 15:19:55','2025-08-20 15:19:55'),
(5,16,17,16,36,9,'CURSO-00005','Github desde 0','Con esto comprenderas como funciona un control de versiones para siempre respaldar tus proyectos.','Que puedas trabajar en un proyecto haciendo commits y push en equipo, dominaras los merge y podras estar preparado para proyectos mas robustos.','Dominar comandos basicos en terminal.\nTener cuenta en github.\nSaber que son conexiones por SSH.',45,'basico',80,'2025-09-15','2025-09-29','','','planificado',0,0,NULL,NULL,NULL,'2025-08-21 16:51:58','2025-08-21 16:51:58');
/*!40000 ALTER TABLE `curso` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `dominiosUniversidades`
--

DROP TABLE IF EXISTS `dominiosUniversidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `dominiosUniversidades` (
  `id_dominio` int(11) NOT NULL AUTO_INCREMENT,
  `id_universidad` int(10) unsigned DEFAULT NULL,
  `dominio` varchar(255) NOT NULL,
  `estatus` enum('activo','inactivo') DEFAULT 'activo',
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_dominio`),
  UNIQUE KEY `dominio` (`dominio`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dominiosUniversidades`
--

LOCK TABLES `dominiosUniversidades` WRITE;
/*!40000 ALTER TABLE `dominiosUniversidades` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `dominiosUniversidades` VALUES
(1,15,'upsrj.edu.mx','activo','2025-06-30 15:28:48','2025-08-26 15:04:35'),
(2,15,'upq.mx','activo','2025-06-30 15:28:48','2025-08-26 15:04:35'),
(3,NULL,'utcorregidora.edu.mx','activo','2025-06-30 15:28:48','2025-06-30 15:28:48'),
(4,NULL,'utsrj.edu.mx','activo','2025-06-30 15:28:48','2025-06-30 15:28:48'),
(5,NULL,'uteq.edu.mx','activo','2025-06-30 15:28:48','2025-06-30 15:28:48'),
(6,14,'soyunaq.mx','activo','2025-06-30 15:28:48','2025-08-26 15:04:35'),
(7,14,'unaq.mx','activo','2025-06-30 15:28:48','2025-08-26 15:04:35'),
(8,16,'queretaro.tecnm.mx','activo','2025-06-30 15:28:48','2025-08-26 15:04:35'),
(9,14,'uaq.mx','activo','2025-06-30 15:28:48','2025-08-26 15:04:35');
/*!40000 ALTER TABLE `dominiosUniversidades` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `evaluacion`
--

DROP TABLE IF EXISTS `evaluacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluacion` (
  `id_evaluacion` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_inscripcion` int(10) unsigned NOT NULL,
  `tipo_evaluacion` enum('examen','tarea','proyecto','participacion','ensayo','practica','final') NOT NULL,
  `nombre_evaluacion` varchar(100) NOT NULL,
  `calificacion` decimal(5,2) NOT NULL,
  `calificacion_maxima` decimal(5,2) DEFAULT 10.00,
  `peso_porcentual` decimal(5,2) DEFAULT 100.00,
  `fecha_evaluacion` date NOT NULL,
  `comentarios` text DEFAULT NULL,
  `evaluado_por` int(10) unsigned NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_evaluacion`),
  KEY `idx_inscripcion` (`id_inscripcion`),
  KEY `idx_tipo_evaluacion` (`tipo_evaluacion`),
  KEY `idx_fecha_evaluacion` (`fecha_evaluacion`),
  KEY `idx_evaluado_por` (`evaluado_por`),
  CONSTRAINT `fk_evaluacion_inscripcion` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripcion` (`id_inscripcion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_evaluacion_maestro` FOREIGN KEY (`evaluado_por`) REFERENCES `usuario` (`id_usuario`) ON UPDATE CASCADE,
  CONSTRAINT `chk_calificacion_evaluacion` CHECK (`calificacion` >= 0 and `calificacion` <= `calificacion_maxima`),
  CONSTRAINT `chk_peso_porcentual` CHECK (`peso_porcentual` > 0 and `peso_porcentual` <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluacion`
--

LOCK TABLES `evaluacion` WRITE;
/*!40000 ALTER TABLE `evaluacion` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `evaluacion` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `facultades`
--

DROP TABLE IF EXISTS `facultades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `facultades` (
  `id_facultad` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_universidad` int(10) unsigned NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_facultad`),
  KEY `id_universidad` (`id_universidad`),
  KEY `idx_nombre_facultad` (`nombre`),
  CONSTRAINT `facultades_ibfk_1` FOREIGN KEY (`id_universidad`) REFERENCES `universidad` (`id_universidad`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facultades`
--

LOCK TABLES `facultades` WRITE;
/*!40000 ALTER TABLE `facultades` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `facultades` VALUES
(34,14,'Informática','2025-08-14 15:39:39','2025-08-14 15:39:39'),
(35,15,'Software','2025-08-15 14:54:20','2025-08-15 14:54:20'),
(36,16,'Sistemas Computacionales','2025-08-21 16:46:30','2025-08-21 16:46:30');
/*!40000 ALTER TABLE `facultades` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `inscripcion`
--

DROP TABLE IF EXISTS `inscripcion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscripcion` (
  `id_inscripcion` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_alumno` int(10) unsigned NOT NULL,
  `id_curso` int(10) unsigned NOT NULL,
  `fecha_solicitud` timestamp NULL DEFAULT current_timestamp(),
  `fecha_aprobacion` timestamp NULL DEFAULT NULL,
  `aprobado_por` int(10) unsigned DEFAULT NULL,
  `estatus_inscripcion` enum('solicitada','aprobada','rechazada','completada','abandonada') DEFAULT 'solicitada',
  `motivo_rechazo` text DEFAULT NULL,
  `calificacion_final` decimal(5,2) DEFAULT NULL,
  `porcentaje_asistencia` decimal(5,2) DEFAULT NULL,
  `fecha_finalizacion` timestamp NULL DEFAULT NULL,
  `aprobado_curso` tinyint(1) DEFAULT 0,
  `constancia_emitida` tinyint(1) DEFAULT 0,
  `fecha_constancia` timestamp NULL DEFAULT NULL,
  `ruta_constancia` varchar(500) DEFAULT NULL,
  `comentarios_profesor` text DEFAULT NULL,
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_inscripcion`),
  UNIQUE KEY `uk_alumno_curso` (`id_alumno`,`id_curso`),
  KEY `idx_curso` (`id_curso`),
  KEY `idx_estatus` (`estatus_inscripcion`),
  KEY `idx_fecha_solicitud` (`fecha_solicitud`),
  KEY `idx_aprobado_por` (`aprobado_por`),
  KEY `idx_inscripcion_control` (`estatus_inscripcion`,`fecha_solicitud`),
  KEY `idx_constancia` (`constancia_emitida`),
  CONSTRAINT `fk_inscripcion_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `alumno` (`id_alumno`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_inscripcion_aprobador` FOREIGN KEY (`aprobado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_inscripcion_curso` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_calificacion_final` CHECK (`calificacion_final` >= 0 and `calificacion_final` <= 10),
  CONSTRAINT `chk_porcentaje_asistencia` CHECK (`porcentaje_asistencia` >= 0 and `porcentaje_asistencia` <= 100)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscripcion`
--

LOCK TABLES `inscripcion` WRITE;
/*!40000 ALTER TABLE `inscripcion` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `inscripcion` ENABLE KEYS */;
UNLOCK TABLES;
commit;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `actualizar_progreso_certificacion` 
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `auditar_constancia` AFTER UPDATE ON `inscripcion`
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `maestro`
--

DROP TABLE IF EXISTS `maestro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `maestro` (
  `id_maestro` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int(10) unsigned NOT NULL,
  `id_universidad` int(10) unsigned NOT NULL,
  `id_facultad` int(11) DEFAULT NULL,
  `id_carrera` int(11) DEFAULT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `email_institucional` varchar(100) NOT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  `grado_academico` enum('licenciatura','maestria','doctorado','posdoctorado') DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `fecha_registro` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_maestro`),
  UNIQUE KEY `uk_id_usuario` (`id_usuario`),
  UNIQUE KEY `uk_email_institucional` (`email_institucional`),
  KEY `idx_universidad` (`id_universidad`),
  KEY `idx_especialidad` (`especialidad`),
  KEY `idx_nombre_completo` (`nombre_completo`),
  CONSTRAINT `fk_maestro_universidad` FOREIGN KEY (`id_universidad`) REFERENCES `universidad` (`id_universidad`) ON UPDATE CASCADE,
  CONSTRAINT `fk_maestro_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maestro`
--

LOCK TABLES `maestro` WRITE;
/*!40000 ALTER TABLE `maestro` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `maestro` VALUES
(5,51,14,34,1,'Juan Manuel Hernandez','maestro_1752676672170@temp.com','Software','licenciatura','2025-07-16','2025-07-16 17:23:52','2025-08-14 17:24:33'),
(13,59,14,34,7,'prueba maestro','pruebaMaestro@gmail.com','Inteligencia artificial','maestria','2025-07-16','2025-07-16 17:54:27','2025-08-15 16:26:25'),
(14,61,14,34,8,'Prueba 2','prueba2@uaq.edu.mx','Inteligencia artificial','maestria','2025-08-14','2025-08-14 17:15:47','2025-08-15 16:26:38'),
(15,62,15,35,6,'Axel David Arevalo','axel@upsrj.edu.mx','Bases de Datos','licenciatura','2025-08-15','2025-08-15 17:39:54','2025-08-15 17:39:54'),
(16,63,16,36,9,'Oscar Alexandro Morales Galvan','OscarMaestro@itq.edu.mx','Github','licenciatura','2025-08-21','2025-08-21 16:48:12','2025-08-21 16:48:12');
/*!40000 ALTER TABLE `maestro` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `material_curso`
--

DROP TABLE IF EXISTS `material_curso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_curso` (
  `id_material` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_curso` int(10) unsigned NOT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `ruta_archivo` varchar(500) NOT NULL,
  `tipo_archivo` enum('pdf','imagen','video','documento') NOT NULL,
  `tamaño_archivo` int(10) unsigned DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_subida` timestamp NULL DEFAULT current_timestamp(),
  `subido_por` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id_material`),
  KEY `idx_curso` (`id_curso`),
  KEY `idx_tipo_archivo` (`tipo_archivo`),
  KEY `idx_fecha_subida` (`fecha_subida`),
  KEY `idx_subido_por` (`subido_por`),
  CONSTRAINT `fk_material_curso` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_material_usuario` FOREIGN KEY (`subido_por`) REFERENCES `usuario` (`id_usuario`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_curso`
--

LOCK TABLES `material_curso` WRITE;
/*!40000 ALTER TABLE `material_curso` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `material_curso` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `requisitos_certificado`
--

DROP TABLE IF EXISTS `requisitos_certificado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `requisitos_certificado` (
  `id_requisito` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_certificacion` int(10) unsigned NOT NULL,
  `id_curso` int(10) unsigned NOT NULL,
  `obligatorio` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_requisito`),
  UNIQUE KEY `uk_certificacion_curso` (`id_certificacion`,`id_curso`),
  UNIQUE KEY `uk_curso_unico` (`id_curso`),
  KEY `idx_certificacion` (`id_certificacion`),
  KEY `idx_curso` (`id_curso`),
  CONSTRAINT `fk_requisito_certificacion` FOREIGN KEY (`id_certificacion`) REFERENCES `certificacion` (`id_certificacion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_requisito_curso` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requisitos_certificado`
--

LOCK TABLES `requisitos_certificado` WRITE;
/*!40000 ALTER TABLE `requisitos_certificado` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `requisitos_certificado` VALUES
(11,1,1,1),
(12,1,2,1);
/*!40000 ALTER TABLE `requisitos_certificado` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `sesiones_usuario`
--

DROP TABLE IF EXISTS `sesiones_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesiones_usuario` (
  `id_sesion` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int(10) unsigned NOT NULL,
  `fecha_login` timestamp NULL DEFAULT current_timestamp(),
  `fecha_logout` timestamp NULL DEFAULT NULL,
  `duracion_sesion` int(10) unsigned DEFAULT NULL,
  `estatus_sesion` enum('activa','cerrada','expirada','forzada') DEFAULT 'activa',
  PRIMARY KEY (`id_sesion`),
  KEY `idx_usuario_fecha` (`id_usuario`,`fecha_login`),
  KEY `idx_estatus` (`estatus_sesion`),
  KEY `idx_sesiones_reporte` (`id_usuario`,`fecha_login`,`estatus_sesion`),
  CONSTRAINT `fk_sesion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sesiones_usuario`
--

LOCK TABLES `sesiones_usuario` WRITE;
/*!40000 ALTER TABLE `sesiones_usuario` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `sesiones_usuario` VALUES
(1,1,'2025-06-25 15:32:12',NULL,NULL,'activa'),
(2,1,'2025-06-25 15:37:11',NULL,NULL,'activa'),
(3,2,'2025-06-25 15:38:02',NULL,NULL,'activa'),
(4,3,'2025-06-25 15:38:19',NULL,NULL,'activa'),
(5,4,'2025-06-25 15:38:38',NULL,NULL,'activa'),
(6,1,'2025-06-25 15:47:43',NULL,NULL,'activa'),
(7,1,'2025-06-25 15:53:14',NULL,NULL,'activa'),
(8,2,'2025-06-25 15:53:32',NULL,NULL,'activa'),
(9,3,'2025-06-25 15:53:55',NULL,NULL,'activa'),
(10,4,'2025-06-25 15:54:22',NULL,NULL,'activa'),
(11,4,'2025-06-25 15:54:48',NULL,NULL,'activa'),
(12,4,'2025-06-25 16:31:14',NULL,NULL,'activa'),
(13,3,'2025-06-25 16:48:15',NULL,NULL,'activa'),
(14,1,'2025-06-26 14:48:21',NULL,NULL,'activa'),
(32,4,'2025-07-03 15:47:05',NULL,NULL,'activa'),
(33,3,'2025-07-03 15:47:38',NULL,NULL,'activa'),
(34,2,'2025-07-03 15:47:54',NULL,NULL,'activa'),
(38,2,'2025-07-04 15:41:49',NULL,NULL,'activa'),
(39,3,'2025-07-04 15:42:16',NULL,NULL,'activa'),
(40,3,'2025-07-04 15:42:33',NULL,NULL,'activa'),
(41,3,'2025-07-04 15:42:44',NULL,NULL,'activa'),
(45,2,'2025-07-04 17:46:53',NULL,NULL,'activa'),
(46,2,'2025-07-04 17:47:31',NULL,NULL,'activa'),
(48,4,'2025-07-07 16:06:28',NULL,NULL,'activa'),
(49,4,'2025-07-07 16:12:27',NULL,NULL,'activa'),
(51,2,'2025-07-09 16:22:27',NULL,NULL,'activa'),
(52,4,'2025-07-09 16:23:06',NULL,NULL,'activa'),
(53,4,'2025-07-10 16:05:30',NULL,NULL,'activa'),
(55,4,'2025-07-10 16:19:27',NULL,NULL,'activa'),
(56,4,'2025-07-10 16:56:28',NULL,NULL,'activa'),
(58,4,'2025-07-11 15:55:28',NULL,NULL,'activa'),
(60,4,'2025-07-11 16:15:22',NULL,NULL,'activa'),
(61,4,'2025-07-11 16:16:07',NULL,NULL,'activa'),
(62,4,'2025-07-14 16:38:45',NULL,NULL,'activa'),
(63,4,'2025-07-14 17:24:40',NULL,NULL,'activa'),
(64,4,'2025-07-14 17:26:02',NULL,NULL,'activa'),
(65,4,'2025-07-15 14:48:13',NULL,NULL,'activa'),
(66,2,'2025-08-04 15:14:57',NULL,NULL,'activa'),
(67,4,'2025-08-05 00:51:52',NULL,NULL,'activa'),
(69,4,'2025-08-07 14:19:06',NULL,NULL,'activa'),
(70,4,'2025-08-07 15:42:05',NULL,NULL,'activa'),
(71,4,'2025-08-08 14:09:12',NULL,NULL,'activa'),
(72,4,'2025-08-08 14:37:15',NULL,NULL,'activa'),
(73,4,'2025-08-08 14:44:01',NULL,NULL,'activa'),
(74,4,'2025-08-08 15:04:46',NULL,NULL,'activa'),
(75,4,'2025-08-08 16:54:19',NULL,NULL,'activa'),
(76,4,'2025-08-08 17:13:04',NULL,NULL,'activa'),
(77,4,'2025-08-11 14:47:58',NULL,NULL,'activa'),
(78,4,'2025-08-11 16:26:31',NULL,NULL,'activa'),
(79,4,'2025-08-11 16:57:18',NULL,NULL,'activa'),
(80,4,'2025-08-11 17:08:40',NULL,NULL,'activa'),
(81,4,'2025-08-12 14:08:22',NULL,NULL,'activa'),
(82,4,'2025-08-12 15:23:31',NULL,NULL,'activa'),
(83,4,'2025-08-12 16:42:26',NULL,NULL,'activa'),
(84,4,'2025-08-12 17:47:47',NULL,NULL,'activa'),
(85,4,'2025-08-12 21:10:06',NULL,NULL,'activa'),
(86,4,'2025-08-13 14:39:09',NULL,NULL,'activa'),
(87,4,'2025-08-13 16:16:29',NULL,NULL,'activa'),
(88,4,'2025-08-13 16:43:33',NULL,NULL,'activa'),
(89,4,'2025-08-13 17:02:04',NULL,NULL,'activa'),
(90,4,'2025-08-13 17:06:48',NULL,NULL,'activa'),
(91,4,'2025-08-13 17:21:37',NULL,NULL,'activa'),
(92,4,'2025-08-13 17:32:32',NULL,NULL,'activa'),
(93,4,'2025-08-13 17:32:35',NULL,NULL,'activa'),
(94,4,'2025-08-14 14:39:27',NULL,NULL,'activa'),
(95,4,'2025-08-14 14:41:32',NULL,NULL,'activa'),
(96,4,'2025-08-14 14:47:35',NULL,NULL,'activa'),
(97,4,'2025-08-14 15:01:36',NULL,NULL,'activa'),
(98,4,'2025-08-14 15:45:53',NULL,NULL,'activa'),
(99,4,'2025-08-14 16:30:40',NULL,NULL,'activa'),
(100,4,'2025-08-14 17:24:24',NULL,NULL,'activa'),
(101,4,'2025-08-15 14:31:12',NULL,NULL,'activa'),
(102,4,'2025-08-15 15:39:00',NULL,NULL,'activa'),
(103,4,'2025-08-15 16:10:52',NULL,NULL,'activa'),
(104,4,'2025-08-15 16:42:32',NULL,NULL,'activa'),
(105,4,'2025-08-18 14:49:04',NULL,NULL,'activa'),
(106,4,'2025-08-18 15:09:16',NULL,NULL,'activa'),
(107,4,'2025-08-18 15:18:54',NULL,NULL,'activa'),
(108,4,'2025-08-18 16:06:32',NULL,NULL,'activa'),
(109,4,'2025-08-18 16:16:09',NULL,NULL,'activa'),
(110,3,'2025-08-18 16:17:11',NULL,NULL,'activa'),
(111,4,'2025-08-18 16:22:41',NULL,NULL,'activa'),
(112,4,'2025-08-18 16:36:09',NULL,NULL,'activa'),
(113,4,'2025-08-18 16:40:02',NULL,NULL,'activa'),
(114,3,'2025-08-18 16:40:17',NULL,NULL,'activa'),
(115,4,'2025-08-18 16:40:50',NULL,NULL,'activa'),
(116,4,'2025-08-18 17:07:41',NULL,NULL,'activa'),
(117,4,'2025-08-18 17:36:01',NULL,NULL,'activa'),
(118,4,'2025-08-19 15:01:33',NULL,NULL,'activa'),
(119,4,'2025-08-19 15:36:10',NULL,NULL,'activa'),
(120,4,'2025-08-19 15:57:12',NULL,NULL,'activa'),
(121,4,'2025-08-20 03:56:04',NULL,NULL,'activa'),
(122,4,'2025-08-20 15:01:48',NULL,NULL,'activa'),
(123,4,'2025-08-20 15:23:28',NULL,NULL,'activa'),
(125,4,'2025-08-20 16:04:22',NULL,NULL,'activa'),
(127,4,'2025-08-20 16:44:42',NULL,NULL,'activa'),
(130,4,'2025-08-20 17:18:19',NULL,NULL,'activa'),
(132,4,'2025-08-21 15:07:20',NULL,NULL,'activa'),
(134,4,'2025-08-21 15:26:51',NULL,NULL,'activa'),
(136,4,'2025-08-21 16:35:24',NULL,NULL,'activa'),
(137,4,'2025-08-21 16:41:21',NULL,NULL,'activa'),
(140,4,'2025-08-21 17:34:43',NULL,NULL,'activa'),
(150,4,'2025-08-26 17:10:03',NULL,NULL,'activa'),
(151,4,'2025-08-26 17:11:31',NULL,NULL,'activa'),
(153,4,'2025-08-26 17:24:26',NULL,NULL,'activa');
/*!40000 ALTER TABLE `sesiones_usuario` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `universidad`
--

DROP TABLE IF EXISTS `universidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `universidad` (
  `id_universidad` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `clave_universidad` varchar(20) NOT NULL,
  `direccion` text DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email_contacto` varchar(100) DEFAULT NULL,
  `ubicacion` varchar(100) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `fecha_registro` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_universidad`),
  UNIQUE KEY `uk_clave_universidad` (`clave_universidad`),
  UNIQUE KEY `uk_email_contacto` (`email_contacto`),
  KEY `idx_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `universidad`
--

LOCK TABLES `universidad` WRITE;
/*!40000 ALTER TABLE `universidad` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `universidad` VALUES
(14,'Universidad Autonoma de Queretaro','UAQ123','uaq esquina uaq calle uaq','4444444444','UAQ1@gmail.com','https://maps.app.goo.gl/Cho4a1RcFjvY6dRWA','/uploads/logos/logo-1755009502925-66301552.svg','2025-07-11 16:13:25','2025-08-21 16:35:38'),
(15,'Universidad Politecnica de Santa Rosa Jauregui','daefsdrgfh','carretera san luis potosi','2222222222','upsrj@gmail.com','https://maps.app.goo.gl/E9jmxADCrYgJujT86','/uploads/logos/logo-1755185898508-292691154.png','2025-07-16 17:53:32','2025-08-14 15:38:18'),
(16,'Instituto Tecnologico de Mexico (Campus Queretaro)','itq','conocido','4421234567','itq@qro.edu.mx','https://maps.app.goo.gl/Cho4a1RcFjvY6dRWA','/uploads/logos/logo-1755009594765-67685697.png','2025-08-08 15:57:09','2025-08-12 14:39:54');
/*!40000 ALTER TABLE `universidad` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `tipo_usuario` enum('alumno','maestro','admin_universidad','admin_sedeq') NOT NULL,
  `estatus` enum('activo','inactivo','pendiente','suspendido') NOT NULL DEFAULT 'pendiente',
  `id_universidad` int(10) unsigned DEFAULT NULL,
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `google_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `google_id` (`google_id`),
  KEY `idx_tipo_estatus` (`tipo_usuario`,`estatus`),
  KEY `fk_usuario_universidad` (`id_universidad`),
  CONSTRAINT `fk_usuario_universidad` FOREIGN KEY (`id_universidad`) REFERENCES `universidad` (`id_universidad`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `usuario` VALUES
(1,'alumno1','alumno1@example.com','$2b$10$kxgP2sRaphnODaTOXZ55w.FhuiVI0Bul8.WsVdZXAF9.4yLs7S1YO','alumno','activo',NULL,NULL,'2025-06-25 14:53:53','2025-06-25 14:53:53',NULL),
(2,'maestro1','maestro1@example.com','$2b$10$ranuTl2bjZK3OmUFUXmkROGZy6sHe.veUwypQVhgNmV1ljybIVX8u','maestro','activo',NULL,NULL,'2025-06-25 14:53:53','2025-06-25 14:53:53',NULL),
(3,'adminuni1','adminuni1@example.com','$2b$10$VZ3hUHdfK7qtqhfuEMGjIuSEtx2cD6VnVhG.q1zrp.ecFHX.VknK6','admin_universidad','activo',NULL,NULL,'2025-06-25 14:53:53','2025-06-25 14:53:53',NULL),
(4,'sedeq1','sedeq1@example.com','$2b$10$jrD9xFptn9/a0SwgeooKN.VWmmQDO0BznzTDVhaPLqd6STPrXcU0W','admin_sedeq','activo',NULL,NULL,'2025-06-25 14:53:53','2025-06-25 14:53:53',NULL),
(47,'UaqAdmin@gmail.com','UaqAdmin@gmail.com','$2b$10$WnnlHqj/m8rhkSwvx/336uKAbVWrE59jnuPB28MR0rh0ZwU2dg7xW','admin_universidad','activo',14,NULL,'2025-07-16 14:44:59','2025-07-16 14:44:59',NULL),
(51,'maestro_1752676672170@temp.com','maestro_1752676672170@temp.com','$2b$10$vRScSGfQKZ7mOx75A.dc8e/EG.yc9BcH3Fs9eBEnL.7uhNaZmQ36K','maestro','activo',14,NULL,'2025-07-16 17:23:52','2025-07-16 17:23:52',NULL),
(59,'pruebaMaestro@gmail.com','pruebaMaestro@gmail.com','$2b$10$MwUgQu7SB2wsTSz1dUyIt.W2sa3OtbumkfTQWMkqiOW.ueNzE6CsO','maestro','activo',14,NULL,'2025-07-16 17:54:27','2025-08-15 16:26:25',NULL),
(60,'ItqAdmin@qro.edu.mx','ItqAdmin@qro.edu.mx','$2b$10$Vf1XZU9g5g93AdpCpmuz2eRQ7XZZUr25ABRPCkaNZAAh0f43uzkja','admin_universidad','activo',16,NULL,'2025-08-08 15:57:53','2025-08-08 15:57:53',NULL),
(61,'prueba2@uaq.edu.mx','prueba2@uaq.edu.mx','$2b$10$s/QX282yfZCnRev1.6LMYONgWBic4TsWlOgBo.rEwFaft3qgqvxWO','maestro','activo',14,NULL,'2025-08-14 17:15:47','2025-08-14 17:15:47',NULL),
(62,'axel@upsrj.edu.mx','axel@upsrj.edu.mx','$2b$10$QR6IngBSerO4UiKjseElIeeDfLLZY0c6uyTTqhJiFfHQqxmORr4sG','maestro','activo',15,NULL,'2025-08-15 17:39:54','2025-08-15 17:39:54',NULL),
(63,'OscarMaestro@itq.edu.mx','OscarMaestro@itq.edu.mx','$2b$10$J2tH7q8L7wgEqbgEx3Kep.Picql4GkTha0ckc4qC1jW30AcorALiW','maestro','activo',16,NULL,'2025-08-21 16:48:12','2025-08-21 16:48:12',NULL),
(70,'AXEL DAVID AREVALO GOMEZ','022000708@upsrj.edu.mx',NULL,'alumno','pendiente',NULL,NULL,'2025-08-27 15:52:48','2025-08-27 15:52:48','111960635237928893373');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
commit;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-08-27  9:57:04
