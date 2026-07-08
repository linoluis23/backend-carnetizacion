import { HistorialAccesosRepository } from '../repositories/historial-accesos.repository.js';

export class HistorialAccesosService {
  constructor() {
    this.historialRepo = new HistorialAccesosRepository();
  }

  async obtenerUltimosAccesosFallidos(limite = 20) {
    return await this.historialRepo.obtenerUltimos(limite);
  }

  async obtenerEstadisticasPorDia(dias = 7) {
    return await this.historialRepo.obtenerEstadisticasPorDia(dias);
  }
}