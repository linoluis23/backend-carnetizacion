// src/controllers/permiso.controller.js
import { PermisoService } from '../services/permiso.service.js';

const permisoService = new PermisoService();

export class PermisoController {
  static async listar(req, res, next) {
    try {
      const permisos = await permisoService.listar();
      res.status(200).json({ exito: true, datos: permisos });
    } catch (error) { next(error); }
  }

  static async obtenerPorId(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const permiso = await permisoService.obtenerPorId(id);
      res.status(200).json({ exito: true, datos: permiso });
    } catch (error) { next(error); }
  }

  static async crear(req, res, next) {
    try {
      const { codigo, nombre, descripcion } = req.body;
      const usuarioRegistro = req.usuario?.email || req.usuario?.id || 'sistema';
      const nuevo = await permisoService.crear({ codigo, nombre, descripcion }, usuarioRegistro);
      res.status(201).json({ exito: true, mensaje: 'Permiso creado.', datos: nuevo });
    } catch (error) { next(error); }
  }

  static async actualizar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const { codigo, nombre, descripcion, estado } = req.body;
      const usuarioModificacion = req.usuario?.email || req.usuario?.id || 'sistema';
      const actualizado = await permisoService.actualizar(id, { codigo, nombre, descripcion, estado }, usuarioModificacion);
      res.status(200).json({ exito: true, mensaje: 'Permiso actualizado.', datos: actualizado });
    } catch (error) { next(error); }
  }

  static async eliminar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificacion = req.usuario?.email || req.usuario?.id || 'sistema';
      const resultado = await permisoService.eliminar(id, usuarioModificacion);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) { next(error); }
  }

// permiso.controller.js
// src/controllers/permiso.controller.js
static async activar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const usuarioModificacion = req.usuario?.email || req.usuario?.id || 'sistema';
    const resultado = await permisoService.activar(id, usuarioModificacion);
    res.status(200).json({ exito: true, mensaje: resultado.mensaje });
  } catch (error) {
    next(error);
  }
}

static async inactivar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const usuarioModificacion = req.usuario?.email || req.usuario?.id || 'sistema';
    const resultado = await permisoService.inactivar(id, usuarioModificacion);
    res.status(200).json({ exito: true, mensaje: resultado.mensaje });
  } catch (error) {
    next(error);
  }
}
}