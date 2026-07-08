import { DepartamentoService } from '../services/departamento.service.js';

const departamentoService = new DepartamentoService();

export class DepartamentoController {
  static async listar(req, res, next) {
    try {
      const codPais = req.query.cod_pais ? parseInt(req.query.cod_pais) : null;
      const datos = await departamentoService.listarDepartamentos(codPais);
      res.status(200).json({ exito: true, mensaje: 'Departamentos obtenidos.', datos });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerPorId(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const datos = await departamentoService.obtenerDepartamentoPorId(id);
      res.status(200).json({ exito: true, mensaje: 'Departamento obtenido.', datos });
    } catch (error) {
      next(error);
    }
  }

    static async obtenerPorCodigo(req, res, next) {
    try {
      const codDep = parseInt(req.params.cod_dep);
      const datos = await departamentoService.obtenerDepartamentoPorCodigo(codDep);
      res.status(200).json({ exito: true, mensaje: 'Departamento obtenido.', datos });
    } catch (error) {
      next(error);
    }
  }
}