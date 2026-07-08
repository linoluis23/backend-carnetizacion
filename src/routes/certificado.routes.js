import { Router } from 'express';
import { CertificadoController } from '../controllers/certificado.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';
//import { tienePermiso } from '../middlewares/permisos.middleware.js';

const router = Router();

// Solo administradores pueden generar certificados
router.post('/autoridades/:id/certificado', autenticarToken, CertificadoController.generar);
router.get(
  '/autoridades/:id/certificado',
  autenticarToken,
  CertificadoController.obtenerActivo
);

router.put(
  '/certificados/:id/revocar',
  autenticarToken,
  CertificadoController.revocar
);
export default router;