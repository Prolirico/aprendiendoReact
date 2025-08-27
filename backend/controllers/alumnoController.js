const pool = require("../config/db");

exports.completeStudentProfile = async (req, res) => {
    const {
        id_usuario,
        nombre_completo,
        matricula,
        id_universidad,
        id_carrera,
        semestre_actual,
    } = req.body;

    if (
        !id_usuario ||
        !nombre_completo ||
        !matricula ||
        !id_universidad ||
        !id_carrera ||
        !semestre_actual
    ) {
        return res
            .status(400)
            .json({ error: "Todos los campos del perfil son requeridos." });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [userRows] = await connection.execute(
            "SELECT email, estatus FROM usuario WHERE id_usuario = ? AND tipo_usuario = 'alumno'",
            [id_usuario],
        );

        if (userRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Usuario de alumno no encontrado." });
        }

        const user = userRows[0];
        if (user.estatus !== "pendiente") {
            await connection.rollback();
            return res.status(400).json({
                error: "El perfil de este usuario ya fue completado o está inactivo.",
            });
        }

        const [alumnoRows] = await connection.execute(
            "SELECT id_alumno FROM alumno WHERE id_usuario = ?",
            [id_usuario],
        );

        if (alumnoRows.length > 0) {
            await connection.rollback();
            return res
                .status(400)
                .json({ error: "Ya existe un perfil de alumno para este usuario." });
        }

        await connection.execute(
            `INSERT INTO alumno (id_usuario, id_universidad, nombre_completo, matricula, correo_institucional, id_carrera, semestre_actual, estatus_academico)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'regular')`,
            [
                id_usuario,
                id_universidad,
                nombre_completo,
                matricula,
                user.email,
                id_carrera,
                semestre_actual,
            ],
        );

        await connection.execute(
            "UPDATE usuario SET estatus = 'activo' WHERE id_usuario = ?",
            [id_usuario],
        );

        await connection.commit();

        res
            .status(200)
            .json({ message: "Perfil de alumno completado exitosamente." });
    } catch (error) {
        if (connection) await connection.rollback();
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                error:
                    "La matrícula o el correo institucional ya están en uso por otro alumno.",
            });
        }
        console.error("Error completando perfil de alumno:", error);
        res
            .status(500)
            .json({ error: "Error en el servidor al completar el perfil." });
    } finally {
        if (connection) connection.release();
    }
};
