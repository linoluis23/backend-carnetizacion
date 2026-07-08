import { Router } from 'express';
import { ProvinciaController } from '../controllers/provincia.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';

const router = Router();

router.get('/', autenticarToken, ProvinciaController.listar);
router.get('/codigo/:cod_prov', autenticarToken, ProvinciaController.obtenerPorCodigo);
router.get('/:id', autenticarToken, ProvinciaController.obtenerPorId);

export default router;