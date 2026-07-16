import { RolPermisoService } from '../services/rol-permiso.service.js';

const rolPermisoService = new RolPermisoService();

export class RolPermisoController {
  static async listarPermisosDeRol(req, res, next) {
    try {
      const rolId = parseInt(req.params.rolId);
      const permisos = await rolPermisoService.listarPermisosDeRol(rolId);
      res.status(200).json({ exito: true, datos: permisos });
    } catch (error) { next(error); }
  }

  static async asignarPermiso(req, res, next) {
    try {
      const rolId = parseInt(req.params.rolId);
      const { permisoId } = req.body;
      const resultado = await rolPermisoService.asignarPermiso(rolId, permisoId);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) { next(error); }
  }

  static async removerPermiso(req, res, next) {
    try {
      const rolId = parseInt(req.params.rolId);
      const permisoId = parseInt(req.params.permisoId);
      const resultado = await rolPermisoService.removerPermiso(rolId, permisoId);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) { next(error); }
  }
}