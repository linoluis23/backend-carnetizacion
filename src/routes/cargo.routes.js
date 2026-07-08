import { Router } from 'express';
import { CargoController } from '../controllers/cargo.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';

const router = Router();

router.get('/', autenticarToken, CargoController.listar);

export default router;