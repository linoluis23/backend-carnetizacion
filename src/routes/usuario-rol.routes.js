import { Router } from 'express';
import { UsuarioRolController } from '../controllers/usuario-rol.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';
import { validarAsignacionRol } from '../middlewares/validacion.middleware.js';

const router = Router();

// Todas protegidas
router.post('/usuarios/:usuarioId/roles', autenticarToken, validarAsignacionRol, UsuarioRolController.asignarRol);
router.delete('/usuarios/:usuarioId/roles/:rolId', autenticarToken, UsuarioRolController.inactivarAsignacion);
router.get('/usuarios/:usuarioId/roles', autenticarToken, UsuarioRolController.listarRolesDeUsuario);
router.get('/roles/:rolId/usuarios', autenticarToken, UsuarioRolController.listarUsuariosDeRol);

export default router;