import { ProvinciaService } from '../services/provincia.service.js';

const provinciaService = new ProvinciaService();

export class ProvinciaController {
  static async listar(req, res, next) {
    try {
      const codDep = req.query.cod_dep ? parseInt(req.query.cod_dep) : null;
      const datos = await provinciaService.listarProvincias(codDep);
      res.status(200).json({ exito: true, mensaje: 'Provincias obtenidas.', datos });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerPorId(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const datos = await provinciaService.obtenerProvinciaPorId(id);
      res.status(200).json({ exito: true, mensaje: 'Provincia obtenida.', datos });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerPorCodigo(req, res, next) {
    try {
      const codProv = parseInt(req.params.cod_prov);
      const datos = await provinciaService.obtenerProvinciaPorCodigo(codProv);
      res.status(200).json({ exito: true, mensaje: 'Provincia obtenida.', datos });
    } catch (error) {
      next(error);
    }
  }
}