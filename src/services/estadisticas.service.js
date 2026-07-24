import { EstadisticasRepository } from '../repositories/estadisticas.repository.js';

export class EstadisticasService {
  constructor() {
    this.estadisticasRepo = new EstadisticasRepository();
  }

  async obtenerDashboard() {
    const [usuariosActivos, rolesActivos, comunidadesActivas, ultimosUsuarios] =
      await Promise.all([
        this.estadisticasRepo.contarUsuariosActivos(),
        this.estadisticasRepo.contarRolesActivos(),
        this.estadisticasRepo.contarComunidadesActivas(),
        this.estadisticasRepo.obtenerUltimosUsuarios(5),
      ]);

    return {
      usuarios_activos: usuariosActivos,
      roles_activos: rolesActivos,
      comunidades_activas: comunidadesActivas,
      ultimos_usuarios: ultimosUsuarios,
    };
  }

    async obtenerEstadisticasSolicitudes() {
    const [totalesPorEstado, solicitudesPorRegional, personasPorGeografia] =
      await Promise.all([
        this.estadisticasRepo.obtenerTotalesPorEstado(),
        this.estadisticasRepo.obtenerSolicitudesPorRegional(),
        this.estadisticasRepo.obtenerPersonasPorGeografia(),
      ]);

    return {
      totalesPorEstado,
      solicitudesPorRegional,
      personasPorGeografia,
    };
  }

  async obtenerComunidadesPorRegional(codReg) {
  return this.estadisticasRepo.obtenerComunidadesPorRegional(codReg);
}

async obtenerTodasRegionales() {
  return this.estadisticasRepo.obtenerTodasRegionales();
}
}