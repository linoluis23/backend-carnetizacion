import { Router } from 'express';
import { EstadisticasController } from '../controllers/estadisticas.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';

const router = Router();

router.get('/dashboard', autenticarToken, EstadisticasController.dashboard);
router.get('/solicitudes', autenticarToken, EstadisticasController.obtenerEstadisticasSolicitudes);
router.get('/regionales', autenticarToken, EstadisticasController.obtenerTodasRegionales);
router.get('/regionales/:codReg/comunidades', autenticarToken, EstadisticasController.obtenerComunidadesPorRegional);
export default router;