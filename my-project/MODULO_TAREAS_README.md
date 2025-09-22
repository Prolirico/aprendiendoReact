# Módulo AlumnoTareaYCalificaciones

## Descripción

El módulo `AlumnoTareaYCalificaciones` es un componente React independiente diseñado para que los estudiantes puedan interactuar con las tareas y calificaciones de sus cursos aprobados. Funciona como un CRUD completo integrado al dashboard del estudiante.

## Características Principales

### 🎯 Funcionalidades
- **Selector de Cursos**: Los estudiantes pueden ver y seleccionar entre sus cursos inscritos
- **Gestión de Tareas**: Visualización, descarga y entrega de tareas
- **Sistema de Calificaciones**: Vista detallada de calificaciones y retroalimentación
- **Subida de Archivos**: Sistema completo de drag & drop para entregas
- **Estados en Tiempo Real**: Indicadores de estado de entrega y calificación

### 🏗️ Arquitectura
- **Componente Independiente**: Funciona como módulo CRUD autónomo
- **Integración con Dashboard**: Se integra seamlessly con el StudentDashboard
- **Mock API**: Incluye simulación completa de endpoints para desarrollo
- **Responsive Design**: Optimizado para dispositivos móviles y desktop

## Estructura del Componente

### Props
```javascript
const AlumnoTareaYCalificaciones = ({ userId }) => {
  // Component logic
}
```

- `userId`: ID del usuario/estudiante para filtrar datos personalizados

### Estados Principales
- `cursosInscritos`: Array de cursos en los que está inscrito el estudiante
- `cursoSeleccionado`: Curso actualmente seleccionado
- `tareas`: Lista de tareas del curso seleccionado
- `calificaciones`: Datos de calificaciones y retroalimentación
- `loading`: Estados de carga para diferentes operaciones
- `fileUploads`: Gestión de archivos para subir

## Integración con StudentDashboard

### Implementación
```javascript
// En StudentDashboard.jsx
import AlumnoTareaYCalificaciones from "../modules/AlumnoTareaYCalificaciones";

// Sistema de pestañas principales
const [activeMainTab, setActiveMainTab] = useState("cursos"); // "cursos" o "tareas"

// Renderizado condicional
{activeMainTab === "tareas" && (
  <AlumnoTareaYCalificaciones userId={userId} />
)}
```

### Pestañas del Dashboard
1. **📚 Cursos y Credenciales**: Módulo original de cursos
2. **📝 Tareas y Calificaciones**: Nuevo módulo independiente

## Estructura de Datos

### Cursos Inscritos
```javascript
const cursosSimulados = [
  {
    id: "1",
    nombre: "Programación I",
    universidad: "Universidad A",
    estado: "en_curso" // "en_curso" | "finalizado"
  }
];
```

### Tareas
```javascript
const tarea = {
  id: "1001",
  nombre: "Ejercicios de Algoritmos",
  porcentaje: 20,
  fecha_limite: "2025-02-15",
  entregada: true,
  calificacion: 18,
  max_archivos: 3,
  max_tamano_mb: 10,
  tipos_archivo_permitidos: ["pdf", "zip"]
};
```

### Calificaciones
```javascript
const calificaciones = {
  evaluaciones: [
    {
      id: "1001",
      nombre: "Ejercicios de Algoritmos",
      porcentaje: 20,
      calificacion: 18,
      feedback: "¡Excelente trabajo! Tus algoritmos son eficientes."
    }
  ],
  total: 92,
  umbral_aprobatorio: 70,
  aprobado: true
};
```

## Funcionalidades Detalladas

### 1. Selector de Cursos
- **Vista de Tarjetas**: Cada curso se muestra en una tarjeta visual
- **Estados Visuales**: Diferenciación entre cursos "en curso" y "finalizados"
- **Selección Interactiva**: Click para seleccionar curso activo
- **Información Detallada**: Nombre del curso, universidad, estado

### 2. Sistema de Tareas
- **Lista Expandible**: Acordeones que muestran detalles de cada tarea
- **Metadatos**: Fecha límite, porcentaje de calificación, estado de entrega
- **Subida de Archivos**: 
  - Drag & drop interface
  - Validación de formatos
  - Límites de tamaño y cantidad
  - Preview de archivos seleccionados
- **Estados de Entrega**: Visual feedback sobre tareas entregadas

### 3. Sistema de Calificaciones
- **Vista Detallada**: Lista de todas las evaluaciones
- **Retroalimentación**: Comentarios del profesor para cada actividad
- **Calificación Final**: 
  - Barra de progreso visual
  - Estado de aprobación/reprobación
  - Umbral requerido para aprobar
- **Código de Colores**: Verde para aprobado, rojo para reprobado

### 4. Sistema de Archivos
- **Validaciones**:
  - Número máximo de archivos por tarea
  - Tamaño máximo por archivo
  - Tipos de archivo permitidos
- **Interface Intuitiva**:
  - Drag & drop zone
  - Botón de selección manual
  - Vista previa de archivos seleccionados
  - Botón para remover archivos

## Estilos y UX

### Tema Visual
- **Colores Primarios**: Azul institucional (#185d96)
- **Feedback Visual**: Verde para éxito, rojo para errores
- **Animaciones**: Transiciones suaves y efectos hover
- **Responsive**: Adaptable a móviles y desktop

### Componentes de UI
- **Toast Messages**: Notificaciones no intrusivas
- **Loading Spinners**: Indicadores de carga
- **Empty States**: Mensajes informativos cuando no hay datos
- **Progress Bars**: Indicadores visuales de progreso

## API Real

### Endpoints Utilizados
```javascript
const API_BASE_URL = "http://localhost:5000";

// Endpoints principales:
GET /api/inscripciones/alumno - Obtener cursos inscritos del alumno
GET /api/cursos - Obtener detalles de todos los cursos
GET /api/calificaciones/:cursoId - Obtener actividades y calificaciones de un curso
POST /api/entregas - Enviar entregas de tareas
```

### Autenticación
- Todas las llamadas requieren token JWT en header: `Authorization: Bearer ${token}`
- El token se obtiene del localStorage después del login
- Manejo de errores 401/403 para autenticación

## Próximas Mejoras

### Funcionalidades Planificadas
- [x] Integración con API real del backend
- [ ] Sistema de notificaciones push
- [ ] Chat en tiempo real con profesores
- [ ] Historial de entregas anteriores
- [ ] Sistema de calificaciones más granular
- [ ] Exportación de calificaciones a PDF
- [ ] Calendario de fechas límite
- [ ] Sistema de recordatorios automáticos
- [ ] Tracking de estado de entregas (entregado/no entregado)
- [ ] Descarga de archivos entregados anteriormente

### Mejoras de UX
- [ ] Modo oscuro/claro
- [ ] Personalización de interface
- [ ] Filtros avanzados de tareas
- [ ] Búsqueda en tiempo real
- [ ] Ordenamiento personalizable

## Archivos Relacionados

### Componentes
- `AlumnoTareaYCalificaciones.jsx`: Componente principal
- `StudentDashboard.jsx`: Dashboard integrado
- `CalificacionCurso.jsx`: Referencia para calificaciones

### Estilos
- `AlumnoTareaYCalificaciones.module.css`: Estilos específicos
- `Dashboard.module.css`: Estilos del dashboard (pestañas principales)

### Configuración
- `package.json`: Dependencias requeridas
- Font Awesome para iconografía
- CSS Modules para estilos encapsulados

## Uso y Desarrollo

### Instalación
```bash
cd aprendiendoReact/my-project
npm install
```

### Ejecución
```bash
npm run dev
```

### Testing
El módulo está integrado con el backend real. Para testing local:
1. Asegúrate de que el backend esté ejecutándose en localhost:5000
2. El alumno debe tener cursos inscritos y aprobados
3. Los profesores deben haber configurado actividades en los cursos

### Personalización
- Modifica `API_BASE_URL` para cambiar la URL del backend
- Ajusta estilos en el archivo CSS module
- Configura validaciones de archivo según necesidades del backend

---

**Nota**: Este módulo está diseñado para ser completamente independiente y puede ser reutilizado en otros proyectos con mínimas modificaciones.