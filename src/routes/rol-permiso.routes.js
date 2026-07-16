import { Router } from 'express';
import { RolPermisoController } from '../controllers/rol-permiso.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';

const router = Router();

router.get('/roles/:rolId/permisos', autenticarToken, RolPermisoController.listarPermisosDeRol);
router.post('/roles/:rolId/permisos', autenticarToken, RolPermisoController.asignarPermiso);
router.delete('/roles/:rolId/permisos/:permisoId', autenticarToken, RolPermisoController.removerPermiso);

export default router;