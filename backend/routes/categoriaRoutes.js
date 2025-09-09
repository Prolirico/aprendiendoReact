const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const authMiddleware = require('../middleware/authMiddleware');
const { protect } = authMiddleware;
// Ruta para obtener todas las categorías de un área específica
router.get('/area/:idArea', protect, categoriaController.getCategoriasByArea);

// Ruta para obtener todas las categorías activas (vista pública/alumno)
router.get('/activas', categoriaController.getActiveCategorias);

// Rutas CRUD para categorías (protegidas)
router.post('/', protect, categoriaController.createCategoria);
router.put('/:id', protect, categoriaController.updateCategoria);
router.delete('/:id', protect, categoriaController.deleteCategoria);

module.exports = router;