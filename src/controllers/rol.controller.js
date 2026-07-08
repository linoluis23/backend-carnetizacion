import { RolService } from '../services/rol.service.js';
import { RolDTO } from '../dtos/rol.dto.js';
import { AppError } from '../utils/errores.util.js';


const rolService = new RolService();

export class RolController {
  static async listarRoles(req, res, next) {
    try {
      const roles = await rolService.listarRoles();
      res.status(200).json({ exito: true, 
        mensaje: 'Roles obtenidos exitosamente.',
        datos: roles});
    } catch (error) {
      next(error);
    }
  }

  static async obtenerRol(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const rol = await rolService.obtenerRolPorId(id);
      res.status(200).json({ exito: true, mensaje: 'Roles obtenidos exitosamente.', datos: rol });
    } catch (error) {
      next(error);
    }
  }

  static async crearRol(req, res, next) {
    try {
      const dto = new RolDTO(req.body);
      const usuarioRegistrador = req.usuario.email;
      const nuevo = await rolService.crearRol(dto, usuarioRegistrador);
      res.status(201).json({ exito: true, mensaje: 'Rol creado exitosamente.', datos: nuevo });
    } catch (error) {
      next(error);
    }
  }

  static async actualizarRol(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const dto = new RolDTO(req.body);
      const usuarioModificador = req.usuario.email;
      const actualizado = await rolService.actualizarRol(id, dto, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: 'Rol actualizado exitosamente.', datos: actualizado });
    } catch (error) {
      next(error);
    }
  }

  static async activarRol(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await rolService.activarRol(id, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: 'Rol activado exitosamente.', datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  static async inactivarRol(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await rolService.inactivarRol(id, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: 'Rol inactivado exitosamente.', datos: resultado });
    } catch (error) {
      next(error);
    }
  }
}