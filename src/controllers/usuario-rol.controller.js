import { UsuarioRolService } from '../services/usuario-rol.service.js';
import { AsignarRolDTO } from '../dtos/usuario-rol.dto.js';
import { AppError } from '../utils/errores.util.js';

const usuarioRolService = new UsuarioRolService();

export class UsuarioRolController {
  // Asignar rol a usuario: POST /api/usuarios/:usuarioId/roles
  static async asignarRol(req, res, next) {
    try {
      const usuarioId = parseInt(req.params.usuarioId);
      const dto = new AsignarRolDTO(req.body);
      const usuarioModificador = req.usuario.email;
      const resultado = await usuarioRolService.asignarRol(usuarioId, dto, usuarioModificador);
      res.status(201).json({ exito: true, datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  // Inactivar asignación: DELETE /api/usuarios/:usuarioId/roles/:rolId
  static async inactivarAsignacion(req, res, next) {
    try {
      const usuarioId = parseInt(req.params.usuarioId);
      const rolId = parseInt(req.params.rolId);
      const usuarioModificador = req.usuario.email;
      const resultado = await usuarioRolService.inactivarAsignacion(usuarioId, rolId, usuarioModificador);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  // Listar roles de un usuario: GET /api/usuarios/:usuarioId/roles
  static async listarRolesDeUsuario(req, res, next) {
    try {
      const usuarioId = parseInt(req.params.usuarioId);
      const soloActivos = req.query.solo_activos === 'true';
      const roles = await usuarioRolService.listarRolesDeUsuario(usuarioId, soloActivos);
      res.status(200).json({ exito: true, datos: roles });
    } catch (error) {
      next(error);
    }
  }

  // Listar usuarios por rol: GET /api/roles/:rolId/usuarios
  static async listarUsuariosDeRol(req, res, next) {
    try {
      const rolId = parseInt(req.params.rolId);
      const usuarios = await usuarioRolService.listarUsuariosDeRol(rolId);
      res.status(200).json({ exito: true, datos: usuarios });
    } catch (error) {
      next(error);
    }
  }
}