import styles from "./Home.module.css";

export default function HomePage() {
  return (
    <div className={styles.contenidoHome}>
      <div className={styles.filtrosCursos}>
        <h3>Todo</h3>
        <h3>Cursos Gratuitos</h3>
        <h3>Por Escuela</h3>
        <h3>Tipo de Apoyo</h3>
        <h3>Fecha</h3>
      </div>
      <p className="text-center text-gray-600">
        Selecciona un filtro para explorar los cursos disponibles.
      </p>
    </div>
  );
}
