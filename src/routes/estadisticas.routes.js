import { Router } from 'express';
import { EstadisticasController } from '../controllers/estadisticas.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';

const router = Router();

router.get('/dashboard', autenticarToken, EstadisticasController.dashboard);

export default router;