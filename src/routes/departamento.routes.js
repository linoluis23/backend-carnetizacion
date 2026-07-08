import { Router } from 'express';
import { DepartamentoController } from '../controllers/departamento.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';

const router = Router();

router.get('/', autenticarToken, DepartamentoController.listar);
router.get('/:id', autenticarToken, DepartamentoController.obtenerPorId);
router.get('/codigo/:cod_dep', autenticarToken, DepartamentoController.obtenerPorCodigo);


export default router;