
const express = require('express');
const router = express.Router();
const { subirFirma, obtenerFirmas, eliminarFirma } = require('../controllers/firmasController');
const { protect, admin } = require('../middleware/authMiddleware');

// Proteger todas las rutas de firmas para que solo los administradores puedan acceder
// El middleware 'admin' debería verificar si el rol es 'admin_sedeq' o 'admin_universidad'
router.use(protect, admin);

// Definir las rutas
router.route('/')
  .post(subirFirma)
  .get(obtenerFirmas);

router.route('/:id')
  .delete(eliminarFirma);

module.exports = router;
