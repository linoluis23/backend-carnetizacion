import { Router } from 'express';
import { SolicitudCarnetController } from '../controllers/solicitud-carnet.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';
//import { subirImagen } from '../middlewares/upload.middleware.js';
import { FirmaSolicitudController } from '../controllers/firma-solicitud.controller.js';


import { validarSolicitud, validarFotoObligatoria, normalizarBooleanos } from '../middlewares/validacion.middleware.js';
import { subirImagen } from '../middlewares/upload.middleware.js';

const router = Router();

router.get('/', autenticarToken, SolicitudCarnetController.listar);
router.get('/:id', autenticarToken, SolicitudCarnetController.obtenerPorId);
router.post('/', autenticarToken, subirImagen, validarFotoObligatoria, normalizarBooleanos, validarSolicitud, SolicitudCarnetController.crear);
router.put('/:id', autenticarToken, subirImagen, validarFotoObligatoria, normalizarBooleanos, validarSolicitud, SolicitudCarnetController.actualizar);
router.put('/:id/aprobar', autenticarToken, SolicitudCarnetController.aprobar);
router.put('/:id/rechazar', autenticarToken, SolicitudCarnetController.rechazar);
//router.put('/:id/emitir', autenticarToken, SolicitudCarnetController.emitir);
router.post('/:id/firmar', autenticarToken, FirmaSolicitudController.firmar);
router.post('/firma-masiva', autenticarToken, FirmaSolicitudController.firmaMasiva);
router.get('/:id/carnet-pdf', autenticarToken, SolicitudCarnetController.obtenerCarnetPdf);
router.put('/:id/emitir', autenticarToken, SolicitudCarnetController.emitir);
router.put('/:id/pdf', autenticarToken, SolicitudCarnetController.guardarPDF);

export default router;
