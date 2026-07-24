/*import { Router } from 'express';
import { SolicitudCarnetController } from '../controllers/solicitud-carnet.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';
import { FirmaSolicitudController } from '../controllers/firma-solicitud.controller.js';
import { validarSolicitud, validarFotoObligatoria, normalizarBooleanos } from '../middlewares/validacion.middleware.js';
import { subirImagen } from '../middlewares/upload.middleware.js';
import { uploadP12 } from '../middlewares/upload.middleware.js'; 
const router = Router();

router.get('/', autenticarToken, SolicitudCarnetController.listar);
router.get('/:id', autenticarToken, SolicitudCarnetC, ontroller.obtenerPorId);
router.post('/', autenticarToken, subirImagen, validarFotoObligatoria, normalizarBooleanos, validarSolicitud, SolicitudCarnetController.crear);
router.put('/:id', autenticarToken, subirImagen, validarFotoObligatoria, normalizarBooleanos, validarSolicitud, SolicitudCarnetController.actualizar);
router.put('/:id/aprobar', autenticarToken, SolicitudCarnetController.aprobar);
router.put('/:id/rechazar', autenticarToken, SolicitudCarnetController.rechazar);
router.put('/:id/emitir', autenticarToken, SolicitudCarnetController.emitir);
router.put('/:id/pdf', autenticarToken, SolicitudCarnetController.guardarPDF);

// Rutas de firma digital
router.post('/:id/firmar', autenticarToken, FirmaSolicitudController.firmar);
router.post('/firma-masiva', autenticarToken, FirmaSolicitudController.firmaMasiva);
router.post('/verificar-firma', autenticarToken, FirmaSolicitudController.verificarFirma);
router.post(
  '/:id/firmar-con-p12',
  autenticarToken,
  uploadP12.single('p12File'), // middleware para recibir el archivo
  FirmaSolicitudController.firmarConP12
);
export default router;*/



import { Router } from 'express';
import { SolicitudCarnetController } from '../controllers/solicitud-carnet.controller.js';
import { FirmaSolicitudController } from '../controllers/firma-solicitud.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';
import { uploadP12 } from '../middlewares/upload.middleware.js';
import { subirImagen } from '../middlewares/upload.middleware.js';
import { validarSolicitud, validarFotoObligatoria, normalizarBooleanos } from '../middlewares/validacion.middleware.js';

const router = Router();

// ===================== RUTAS DE SOLICITUDES =====================
router.get('/', autenticarToken, SolicitudCarnetController.listar);
router.get('/:id', autenticarToken, SolicitudCarnetController.obtenerPorId);
router.post('/', autenticarToken, subirImagen, validarFotoObligatoria, normalizarBooleanos, validarSolicitud, SolicitudCarnetController.crear);
//router.put('/:id', autenticarToken, subirImagen, validarFotoObligatoria, normalizarBooleanos, validarSolicitud, SolicitudCarnetController.actualizar);
router.put('/:id', autenticarToken, subirImagen, normalizarBooleanos, validarSolicitud, SolicitudCarnetController.actualizar);
router.put('/:id/aprobar', autenticarToken, SolicitudCarnetController.aprobar);
router.put('/:id/rechazar', autenticarToken, SolicitudCarnetController.rechazar);
router.put('/:id/emitir', autenticarToken, SolicitudCarnetController.emitir);
router.put('/:id/pdf', autenticarToken, SolicitudCarnetController.guardarPDF);
router.get('/:id/carnet-pdf', autenticarToken, SolicitudCarnetController.obtenerCarnetPdf);

// ===================== RUTAS DE FIRMA =====================
router.post('/:id/firmar', autenticarToken, FirmaSolicitudController.firmar);
router.post('/firma-masiva', autenticarToken, FirmaSolicitudController.firmaMasiva);

// ✅ NUEVA RUTA: Firmar con archivo .p12
router.post(
  '/:id/firmar-con-p12',
  autenticarToken,
  uploadP12.single('p12File'),
  FirmaSolicitudController.firmarConP12
);

// ✅ NUEVO: Verificar firma de una solicitud
router.get(
  '/:id/verificar-firma',
  autenticarToken,
  FirmaSolicitudController.verificarFirma
);

// También podemos tener una versión pública (sin autenticación, solo para verificación)
router.get(
  '/:id/verificar-firma-publica',
  SolicitudCarnetController.verificarFirmaPublica
);
// src/routes/solicitud-carnet.routes.js
router.get(
  '/:id/verificar-firma2',
  autenticarToken,
  FirmaSolicitudController.verificarFirmaSolicitud
);
router.post('/:id/firmar-con-pem', autenticarToken, FirmaSolicitudController.firmarConPem);

router.get('/:id/previsualizar', autenticarToken, SolicitudCarnetController.previsualizar);


export default router;