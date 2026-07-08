import { Router } from 'express';
import { ProgramacionController } from '../controllers/programacion.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';
import { validarProgramacion } from '../middlewares/validacion.middleware.js';

const router = Router();

router.get('/', autenticarToken, ProgramacionController.listar);
router.get('/:id', autenticarToken, ProgramacionController.obtenerPorId);
router.post('/', autenticarToken, validarProgramacion, ProgramacionController.crear);
router.put('/:id', autenticarToken, validarProgramacion, ProgramacionController.actualizar);
router.put('/:id/activar', autenticarToken, ProgramacionController.activar);
router.put('/:id/inactivar', autenticarToken, ProgramacionController.inactivar);
router.delete('/:id', autenticarToken, ProgramacionController.eliminar);

export default router;