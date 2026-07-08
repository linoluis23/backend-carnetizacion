import { Router } from 'express';
import { RegionalController } from '../controllers/regional.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';

const router = Router();

router.get('/', autenticarToken, RegionalController.listar);
router.get('/codigo/:cod_reg', autenticarToken, RegionalController.obtenerPorCodigo);
router.get('/:id', autenticarToken, RegionalController.obtenerPorId);
router.delete('/:id', autenticarToken, RegionalController.eliminar);

router.put('/:id/activar', autenticarToken, RegionalController.activar);


export default router;