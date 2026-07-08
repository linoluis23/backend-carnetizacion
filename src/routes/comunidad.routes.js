import { Router } from 'express';
import { ComunidadController } from '../controllers/comunidad.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';
import { validarComunidad } from '../middlewares/validacion.middleware.js';
import { tienePermiso } from '../middlewares/permisos.middleware.js';

const router = Router();

router.get('/', autenticarToken,tienePermiso('usuarios'), ComunidadController.listar);
router.get('/codigo/:cod_com', autenticarToken,tienePermiso('usuarios'), ComunidadController.obtenerPorCodigo);
router.get('/:id', autenticarToken,tienePermiso('usuarios'), ComunidadController.obtenerPorId);
router.post('/', autenticarToken,tienePermiso('usuarios'), validarComunidad, ComunidadController.registrar);
router.put('/:id', autenticarToken, tienePermiso('usuarios'),validarComunidad, ComunidadController.actualizar);
router.delete('/:id', autenticarToken,tienePermiso('usuarios'), ComunidadController.eliminar);
router.put('/:id/activar', autenticarToken,tienePermiso('usuarios'), ComunidadController.activar);


export default router;