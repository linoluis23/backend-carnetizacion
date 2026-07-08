import { RegionalService } from '../services/regional.service.js';

const regionalService = new RegionalService();

export class RegionalController {
  static async listar(req, res, next) {
    try {
      const codProv = req.query.cod_prov ? parseInt(req.query.cod_prov) : null;
      const estado = req.query.estado || null;
      const datos = await regionalService.listarRegionales(codProv, estado);
      res.status(200).json({ exito: true, mensaje: 'Regionales obtenidas.', datos });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerPorId(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const datos = await regionalService.obtenerRegionalPorId(id);
      res.status(200).json({ exito: true, mensaje: 'Regional obtenida.', datos });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerPorCodigo(req, res, next) {
    try {
      const codReg = parseInt(req.params.cod_reg);
      const datos = await regionalService.obtenerRegionalPorCodigo(codReg);
      res.status(200).json({ exito: true, mensaje: 'Regional obtenida.', datos });
    } catch (error) {
      next(error);
    }
  }

    static async eliminar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const usuarioModificador = req.usuario.email;
    const resultado = await regionalService.eliminar(id, usuarioModificador);
    res.status(200).json({ exito: true, mensaje: 'Regional eliminada exitosamente.', datos: resultado });
  } catch (error) {
    next(error);
  }
}

  static async activar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const usuarioModificador = req.usuario.email;
    const resultado = await regionalService.activarRegional(id, usuarioModificador);
    res.status(200).json({ exito: true, mensaje: 'Regional activada exitosamente.', datos: resultado });
  } catch (error) {
    next(error);
  }
}
}