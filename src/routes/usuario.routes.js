import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller.js';
import { autenticarToken } from '../middlewares/autenticacion.middleware.js';
import { validarRegistro, validarLogin, validarActualizacion, validarCambioPassword,validarResetPassword } from '../middlewares/validacion.middleware.js';
import { subirImagen } from '../middlewares/upload.middleware.js';
import { ResetPasswordController } from '../controllers/reset-password.controller.js';
import { validarResetPasswordExterno } from '../middlewares/validacion.middleware.js';
import { RolController } from '../controllers/rol.controller.js';
import { HistorialAccesosController } from '../controllers/historial-accesos.controller.js';
import { tienePermiso } from '../middlewares/permisos.middleware.js';

const router = Router();

// Rutas públicas
router.post('/registro', autenticarToken, tienePermiso('usuarios'), validarRegistro, UsuarioController.registrar);
router.post('/login', validarLogin, UsuarioController.iniciarSesion);

// Rutas protegidas
router.get('/perfil', autenticarToken, UsuarioController.obtenerPerfil);
router.put('/actualizar-perfil', autenticarToken, validarActualizacion, UsuarioController.actualizarPerfil);
router.put('/:id', autenticarToken, validarActualizacion, UsuarioController.actualizarUsuarioPorId);

// Listar usuarios (protegida)
router.get('/', autenticarToken, tienePermiso('usuarios'), UsuarioController.listarUsuarios);

// Acciones sobre usuarios específicos (protegidas)
router.put('/:id/activar', autenticarToken, tienePermiso('usuarios'), UsuarioController.activarUsuario);
router.put('/:id/inactivar', autenticarToken, tienePermiso('usuarios'), UsuarioController.inactivarUsuario);
router.delete('/:id', autenticarToken, tienePermiso('usuarios'), UsuarioController.eliminarUsuario);
router.put('/:id/bloquear', autenticarToken, tienePermiso('usuarios'), UsuarioController.bloquearUsuario);
router.get('/verificar-token', UsuarioController.verificarToken);
// Cambio de contraseña propia
router.put('/perfil/cambiar-password', autenticarToken, validarCambioPassword, UsuarioController.cambiarPassword);

// Resetear contraseña de cualquier usuario (administrativo)
router.put('/:id/resetear-password', autenticarToken, tienePermiso('usuarios'), validarResetPassword, UsuarioController.resetearPassword);

// Subir o actualizar foto (multipart/form-data)
router.post('/perfil/foto', autenticarToken, tienePermiso('usuarios'), subirImagen, UsuarioController.subirFoto);
router.put('/perfil/foto', autenticarToken, tienePermiso('usuarios'), subirImagen, UsuarioController.subirFoto); // misma funcionalidad

// Eliminar y ver foto se mantienen sin cambios
router.delete('/perfil/foto', autenticarToken, tienePermiso('usuarios'), UsuarioController.eliminarFoto);
router.get('/perfil/foto', autenticarToken, tienePermiso('usuarios'), UsuarioController.obtenerFoto);
router.get('/:id/foto', autenticarToken, tienePermiso('usuarios'), UsuarioController.obtenerFotoPorUsuario);

// Gestión de fotos de cualquier usuario por ID (admin)
router.post('/:id/foto', autenticarToken, tienePermiso('usuarios'), subirImagen, UsuarioController.subirFotoDeUsuario);
router.put('/:id/foto', autenticarToken, tienePermiso('usuarios'), subirImagen, UsuarioController.subirFotoDeUsuario);
router.delete('/:id/foto', autenticarToken, tienePermiso('usuarios'), UsuarioController.eliminarFotoDeUsuario);
// Rutas públicas de restablecimiento

router.post('/solicitar-reset', ResetPasswordController.solicitarReset);
router.post('/resetear-password', validarResetPasswordExterno, ResetPasswordController.resetearPassword);

router.get('/historial-accesos-fallidos', autenticarToken, HistorialAccesosController.obtenerUltimos);
router.get('/historial-accesos-fallidos/estadisticas', autenticarToken, HistorialAccesosController.obtenerEstadisticas);
router.get('/permisos', autenticarToken, UsuarioController.obtenerPermisos);
export default router;