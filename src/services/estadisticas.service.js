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
}