import { Router } from 'express';
import { PersonaController } from '../controllers/persona.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';
import { validarPersona } from '../middlewares/validacion.middleware.js';
import { subirExcel } from '../middlewares/upload.middleware.js';
import { tienePermiso } from '../middlewares/permisos.middleware.js';

const router = Router();

router.get('/', autenticarToken, tienePermiso('usuarios'), PersonaController.listar);
router.get('/cod-persona/:cod_persona', autenticarToken, tienePermiso('usuarios'), PersonaController.obtenerPorCodPersona);
router.get('/cod-socio/:cod_socio', autenticarToken, tienePermiso('usuarios'), PersonaController.obtenerPorCodSocio);
router.get('/documento', autenticarToken, tienePermiso('usuarios'), PersonaController.obtenerPorDocumento);
router.get('/:id', autenticarToken, tienePermiso('usuarios'), PersonaController.obtenerPorId);
router.post('/', autenticarToken, tienePermiso('usuarios'), validarPersona, PersonaController.registrar);
router.put('/:id', autenticarToken, tienePermiso('usuarios'), validarPersona, PersonaController.actualizar);
router.delete('/:id', autenticarToken, tienePermiso('usuarios'), PersonaController.eliminar);
router.put('/:id/activar', autenticarToken, tienePermiso('usuarios'), PersonaController.activar);
router.post('/carga-masiva', autenticarToken, tienePermiso('usuarios'), PersonaController.cargaMasiva);
router.post('/carga-excel', autenticarToken, tienePermiso('usuarios'), subirExcel, PersonaController.cargaMasivaExcel);
router.get('/:id/historial', autenticarToken, tienePermiso('usuarios'), PersonaController.obtenerHistorial);


export default router;