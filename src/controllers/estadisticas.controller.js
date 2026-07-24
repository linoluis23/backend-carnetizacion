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

    // ✅ NUEVO MÉTODO
  static async obtenerEstadisticasSolicitudes(req, res, next) {
    try {
      const datos = await estadisticasService.obtenerEstadisticasSolicitudes();
      res.status(200).json({ exito: true, datos });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerComunidadesPorRegional(req, res, next) {
  try {
    const { codReg } = req.params;
    const datos = await estadisticasService.obtenerComunidadesPorRegional(codReg);
    res.status(200).json({ exito: true, datos });
  } catch (error) {
    next(error);
  }
}

static async obtenerTodasRegionales(req, res, next) {
  try {
    const datos = await estadisticasService.obtenerTodasRegionales();
    res.status(200).json({ exito: true, datos });
  } catch (error) {
    next(error);
  }
}
}