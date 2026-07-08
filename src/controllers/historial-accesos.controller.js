import { HistorialAccesosService } from '../services/historial-accesos.service.js';

const historialService = new HistorialAccesosService();

export class HistorialAccesosController {
  static async obtenerUltimos(req, res, next) {
    try {
      const limite = parseInt(req.query.limite) || 20;
      const datos = await historialService.obtenerUltimosAccesosFallidos(limite);
      res.status(200).json({ exito: true, datos });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerEstadisticas(req, res, next) {
    try {
      const dias = parseInt(req.query.dias) || 7;
      const datos = await historialService.obtenerEstadisticasPorDia(dias);
      res.status(200).json({ exito: true, datos });
    } catch (error) {
      next(error);
    }
  }
}