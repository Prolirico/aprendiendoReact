const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "0d86c1e9aaf0192c1234673d06d6ed452beb5ca2a12014cfa913818b114444bd7a6ee2c64fde53f98503a98a153754becdf0fe8ec53304adb233f0c4fec0bf31";

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Obtener token del header
            token = req.headers.authorization.split(" ")[1];

            // Verificar el token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Obtener el id_alumno a partir del id_usuario del token
            const [alumnos] = await pool.query(
                "SELECT id_alumno FROM alumno WHERE id_usuario = ?",
                [decoded.id_usuario],
            );

            if (alumnos.length === 0) {
                return res.status(401).json({ error: "Usuario no es un alumno válido" });
            }

            // Adjuntar el id_alumno al objeto de la solicitud para usarlo después
            req.user = { id_alumno: alumnos[0].id_alumno, ...decoded };

            next(); // Si todo está bien, pasa a la siguiente función (el controlador)
        } catch (error) {
            return res.status(401).json({ error: "No autorizado, token falló" });
        }
    }

    if (!token) {
        return res.status(401).json({ error: "No autorizado, sin token" });
    }
};

module.exports = { protect };
