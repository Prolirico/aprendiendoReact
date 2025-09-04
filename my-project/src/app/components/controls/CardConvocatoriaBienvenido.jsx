import styles from "./CardConvocatoriaBienvenido.module.css"

const CardConvocatoriaBienvenido = ({ nombreCompleto, nombreConvocatoria, fechaInicio, fechaFin }) => {
    // Función para formatear las fechas
    const formatearFecha = (fecha) => {
        if (!fecha) return ""
        const fechaObj = new Date(fecha)
        return fechaObj.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h2 className={styles.titulo}>¡Bienvenido!</h2>
            </div>

            <div className={styles.contenido}>
                <p className={styles.mensaje}>
                    <span className={styles.nombre}>{nombreCompleto}</span> a la Convocatoria{" "}
                    <span className={styles.convocatoria}>{nombreConvocatoria}</span> con periodo{" "}
                    <span className={styles.fecha}>{formatearFecha(fechaInicio)}</span> a{" "}
                    <span className={styles.fecha}>{formatearFecha(fechaFin)}</span>
                </p>

                <p className={styles.subtitulo}>Explora nuestros cursos y credenciales.</p>
            </div>

            <div className={styles.footer}>
                <button className={styles.botonExplorar}>Comenzar Exploración</button>
            </div>
        </div>
    )
}

export default CardConvocatoriaBienvenido
