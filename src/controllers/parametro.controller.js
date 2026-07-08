import { ParametroSistemaRepository } from '../repositories/parametro-sistema.repository.js';

const repo = new ParametroSistemaRepository();

export class ParametroController {
  static async obtenerPorGrupo(req, res, next) {
    try {
      const grupo = req.query.grupo;
      if (!grupo) {
        return res.status(400).json({ exito: false, mensaje: 'Debe especificar un grupo.' });
      }
      const params = await repo.obtenerPorGrupo(grupo);
      // params tiene la forma { clave: valor, ... }
      res.status(200).json({ exito: true, datos: params });
    } catch (error) {
      next(error);
    }
  }
}