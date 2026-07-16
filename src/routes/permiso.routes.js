import { Router } from 'express';
import { PermisoController } from '../controllers/permiso.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';
import { validarPermiso } from '../middlewares/validacion.middleware.js';

import { tienePermiso } from '../middlewares/permisos.middleware.js';
import { usuarios } from '../utils/permisos.constants.js';


const router = Router();

router.get('/', autenticarToken, PermisoController.listar);
router.get('/:id', autenticarToken, PermisoController.obtenerPorId);
router.post('/', autenticarToken, validarPermiso, PermisoController.crear);
router.put('/:id', autenticarToken, validarPermiso, PermisoController.actualizar);
router.delete('/:id', autenticarToken, PermisoController.eliminar);
router.patch('/:id/inactivar', autenticarToken, tienePermiso, PermisoController.inactivar);
router.patch('/:id/activar', autenticarToken, tienePermiso, PermisoController.activar);
export default router;