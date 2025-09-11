import styles from "./CardConvocatoriaBienvenido.module.css"

const CardConvocatoriaBienvenido = ({ convocatoria, onSolicitar }) => {
  // Función para formatear las fechas
  const formatearFecha = (fecha) => {
    if (!fecha) return "No especificada";
    // Aseguramos que la fecha se interprete en UTC para evitar desfases de un día
    const fechaObj = new Date(fecha.split("T")[0] + "T00:00:00");
    return fechaObj.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.titulo}>Convocatoria Disponible</h2>
      </div>

      <div className={styles.contenido}>
        <p className={styles.mensaje}>
          Te invitamos a participar en la{" "}
          <span className={styles.convocatoria}>{convocatoria.nombre}</span>.
        </p>
        <p className={styles.subtitulo}>
          Periodo de ejecución: del{" "}
          <span className={styles.fecha}>
            {formatearFecha(convocatoria.fecha_ejecucion_inicio)}
          </span>{" "}
          al{" "}
          <span className={styles.fecha}>{formatearFecha(convocatoria.fecha_ejecucion_fin)}</span>.
        </p>
      </div>

      <div className={styles.footer}>
        <button onClick={() => onSolicitar(convocatoria.id)} className={styles.botonExplorar}>Solicitar Inscripción</button>
      </div>
    </div>
  );
};

export default CardConvocatoriaBienvenido
