import { EstadisticasService } from '../services/estadisticas.service.js';

const estadisticasService = new EstadisticasService();

export class EstadisticasController {
  static async dashboard(req, res, next) {
    try {
      const datos = await estadisticasService.obtenerDashboard();
      res.status(200).json({ exito: true, datos });
    } catch (error) {
      next(error);
    }
  }
}