import { Router } from 'express';
import { RolController } from '../controllers/rol.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';
import { validarRol } from '../middlewares/validacion.middleware.js';

const router = Router();

// Todas protegidas
router.get('/', autenticarToken, RolController.listarRoles);
router.get('/:id', autenticarToken, RolController.obtenerRol);
router.post('/', autenticarToken, validarRol, RolController.crearRol);
router.put('/:id', autenticarToken, validarRol, RolController.actualizarRol);
router.put('/:id/activar', autenticarToken, RolController.activarRol);
router.put('/:id/inactivar', autenticarToken, RolController.inactivarRol);

export default router;