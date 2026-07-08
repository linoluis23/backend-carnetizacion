import { Router } from 'express';
import { ParametroController } from '../controllers/parametro.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';

const router = Router();

router.get('/', autenticarToken, ParametroController.obtenerPorGrupo);

export default router;