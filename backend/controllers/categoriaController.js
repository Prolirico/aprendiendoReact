const db = require('../config/db');

// Obtener todas las categorías de un área específica
exports.getCategoriasByArea = async (req, res) => {
    const { idArea } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM categoria_curso WHERE id_area = ? ORDER BY orden_prioridad ASC', [idArea]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener las categorías.' });
    }
};

// Obtener todas las categorías activas (para vistas de alumno)
exports.getActiveCategorias = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id_categoria, nombre_categoria FROM categoria_curso WHERE estatus = 'activa' ORDER BY nombre_categoria ASC");
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener categorías activas:', error);
        res.status(500).json({ error: 'Error al obtener las categorías activas.' });
    }
};

// Crear una nueva categoría
exports.createCategoria = async (req, res) => {
    const { id_area, nombre_categoria, descripcion } = req.body;

    if (!id_area || !nombre_categoria) {
        return res.status(400).json({ error: 'El id_area y el nombre_categoria son requeridos.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Calcular el siguiente orden_prioridad para el área específica
        const [result] = await connection.query(
            'SELECT MAX(orden_prioridad) as max_orden FROM categoria_curso WHERE id_area = ?',
            [id_area]
        );

        const max_orden = result[0].max_orden || 0;
        const nuevo_orden = max_orden + 1;

        // Insertar la nueva categoría con el orden calculado
        const [insertResult] = await connection.query(
            'INSERT INTO categoria_curso (id_area, nombre_categoria, descripcion, orden_prioridad, estatus) VALUES (?, ?, ?, ?, ?)',
            [id_area, nombre_categoria, descripcion || null, nuevo_orden, 'activa']
        );

        await connection.commit();

        res.status(201).json({
            id_categoria: insertResult.insertId,
            id_area,
            nombre_categoria,
            descripcion: descripcion || null,
            orden_prioridad: nuevo_orden,
            estatus: 'activa',
            fecha_creacion: new Date().toISOString(),
            color_hex: null
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear categoría:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.message.includes('uk_nombre')) {
                return res.status(409).json({ error: `La categoría '${nombre_categoria}' ya existe.` });
            }
            if (error.message.includes('uk_area_orden')) {
                return res.status(409).json({ error: 'Error de consistencia en el orden de prioridad.' });
            }
        }
        res.status(500).json({ error: 'Error al crear la categoría.' });
    } finally {
        connection.release();
    }
};

// Actualizar una categoría existente
exports.updateCategoria = async (req, res) => {
    const { id } = req.params;
    const { nombre_categoria, descripcion, estatus, orden_prioridad } = req.body;
    const nuevo_orden = parseInt(orden_prioridad, 10);

    if (!nombre_categoria || !estatus || isNaN(nuevo_orden)) {
        return res.status(400).json({ error: 'Nombre, estatus y orden son requeridos y orden debe ser numérico.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Obtener el estado actual de la categoría que se va a mover (con lock)
        const [rows] = await connection.query(
            'SELECT id_area, orden_prioridad FROM categoria_curso WHERE id_categoria = ? FOR UPDATE',
            [id]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Categoría no encontrada.' });
        }

        const categoriaActual = rows[0];
        const id_area = categoriaActual.id_area;
        const orden_viejo = categoriaActual.orden_prioridad;

        // 2. Validar nuevo_orden: Debe estar entre 1 y N (número de categorías en el área)
        const [countResult] = await connection.query(
            'SELECT COUNT(*) as total FROM categoria_curso WHERE id_area = ?',
            [id_area]
        );
        const totalCategorias = countResult[0].total;
        if (nuevo_orden < 1 || nuevo_orden > totalCategorias) {
            await connection.rollback();
            return res.status(400).json({ error: `El orden debe estar entre 1 y ${totalCategorias}.` });
        }

        // Si el orden no ha cambiado, solo actualizamos los otros campos
        if (nuevo_orden === orden_viejo) {
            await connection.query(
                'UPDATE categoria_curso SET nombre_categoria = ?, descripcion = ?, estatus = ? WHERE id_categoria = ?',
                [nombre_categoria, descripcion || null, estatus, id]
            );
        } else {
            // El orden ha cambiado, necesitamos reordenar

            // 3. Apartar temporalmente la categoría que se mueve (set a NULL)
            await connection.query(
                'UPDATE categoria_curso SET orden_prioridad = NULL WHERE id_categoria = ?',
                [id]
            );

            // 4. Obtener filas afectadas para reordenar
            let affectedRows;
            if (nuevo_orden < orden_viejo) {
                // Movimiento hacia ARRIBA (e.g., de 4 a 2): Incrementar órdenes >= nuevo y < viejo
                [affectedRows] = await connection.query(
                    'SELECT id_categoria, orden_prioridad FROM categoria_curso WHERE id_area = ? AND orden_prioridad >= ? AND orden_prioridad < ? ORDER BY orden_prioridad DESC FOR UPDATE',
                    [id_area, nuevo_orden, orden_viejo]
                );
                // Actualizar de mayor a menor para evitar colisiones
                for (const row of affectedRows) {
                    await connection.query(
                        'UPDATE categoria_curso SET orden_prioridad = ? WHERE id_categoria = ?',
                        [row.orden_prioridad + 1, row.id_categoria]
                    );
                }
            } else {
                // Movimiento hacia ABAJO (e.g., de 2 a 4): Decrementar órdenes > viejo y <= nuevo
                [affectedRows] = await connection.query(
                    'SELECT id_categoria, orden_prioridad FROM categoria_curso WHERE id_area = ? AND orden_prioridad > ? AND orden_prioridad <= ? ORDER BY orden_prioridad ASC FOR UPDATE',
                    [id_area, orden_viejo, nuevo_orden]
                );
                // Actualizar de menor a mayor
                for (const row of affectedRows) {
                    await connection.query(
                        'UPDATE categoria_curso SET orden_prioridad = ? WHERE id_categoria = ?',
                        [row.orden_prioridad - 1, row.id_categoria]
                    );
                }
            }

            // 5. Actualizar la categoría movida a su nuevo orden
            await connection.query(
                'UPDATE categoria_curso SET nombre_categoria = ?, descripcion = ?, estatus = ?, orden_prioridad = ? WHERE id_categoria = ?',
                [nombre_categoria, descripcion || null, estatus, nuevo_orden, id]
            );
        }

        await connection.commit();
        res.json({ message: 'Categoría actualizada y reordenada con éxito.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error en la transacción de reordenamiento:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.message.includes('uk_area_orden')) {
                return res.status(409).json({ error: 'Error de consistencia: El orden de prioridad ya está en uso para esta área. Intente de nuevo.' });
            }
            if (error.message.includes('uk_nombre')) {
                return res.status(409).json({ error: `El nombre de categoría '${nombre_categoria}' ya existe.` });
            }
        }
        res.status(500).json({ error: 'Error al actualizar la categoría.' });
    } finally {
        connection.release();
    }
};

// Eliminar una categoría
exports.deleteCategoria = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Obtener orden_prioridad de la categoría a borrar
        const [rows] = await connection.query(
            'SELECT id_area, orden_prioridad FROM categoria_curso WHERE id_categoria = ? FOR UPDATE',
            [id]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Categoría no encontrada.' });
        }

        const { id_area, orden_prioridad } = rows[0];

        // 2. Borrar la categoría
        const [deleteResult] = await connection.query(
            'DELETE FROM categoria_curso WHERE id_categoria = ?',
            [id]
        );

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Categoría no encontrada.' });
        }

        // 3. Reordenar categorías posteriores para cerrar el gap
        const [affectedRows] = await connection.query(
            'SELECT id_categoria, orden_prioridad FROM categoria_curso WHERE id_area = ? AND orden_prioridad > ? ORDER BY orden_prioridad ASC FOR UPDATE',
            [id_area, orden_prioridad]
        );

        // Decrementar en orden ASC para evitar colisiones
        for (const row of affectedRows) {
            await connection.query(
                'UPDATE categoria_curso SET orden_prioridad = ? WHERE id_categoria = ?',
                [row.orden_prioridad - 1, row.id_categoria]
            );
        }

        await connection.commit();
        res.json({ message: 'Categoría eliminada y órdenes ajustados con éxito.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ error: 'Error al eliminar la categoría.' });
    } finally {
        connection.release();
    }
};