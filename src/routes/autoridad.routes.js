import { Router } from 'express';
import { AutoridadController } from '../controllers/autoridad.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';
import { tienePermiso } from '../middlewares/permisos.middleware.js';
import { validarAutoridad } from '../middlewares/validacion.middleware.js';

const router = Router();

router.get('/:id/usuario', autenticarToken, AutoridadController.obtenerUsuario);
console.log('✅ Ruta /:id/usuario REGISTRADA');

// ==================== LECTURA ====================
// Cualquier usuario autenticado puede ver autoridades
router.get('/', autenticarToken, AutoridadController.listar);
router.get('/:id', autenticarToken, AutoridadController.obtenerPorId);

// ==================== ESCRITURA ====================
// Solo administradores pueden crear y modificar autoridades
router.post('/', autenticarToken, tienePermiso('usuarios'), validarAutoridad, AutoridadController.crear);
router.put('/:id', autenticarToken, tienePermiso('usuarios'), validarAutoridad, AutoridadController.actualizar);

// ==================== CAMBIOS DE ESTADO ====================
// Solo administradores o presidentes (del mismo nivel) pueden cambiar estados
router.put('/:id/activar', autenticarToken, tienePermiso('usuarios'), AutoridadController.activar);
router.put('/:id/inactivar', autenticarToken, tienePermiso('usuarios'), AutoridadController.inactivar);
router.put('/:id/suspender', autenticarToken, tienePermiso('usuarios'), AutoridadController.suspender);
router.delete('/:id', autenticarToken, tienePermiso('usuarios'), AutoridadController.eliminar);
router.get('/mi-autoridad', autenticarToken, AutoridadController.obtenerPorUsuario);
router.get('/:id/usuario', autenticarToken, AutoridadController.obtenerUsuario);
router.get('/usuario/actual', autenticarToken, AutoridadController.obtenerPorUsuario);


export default router;