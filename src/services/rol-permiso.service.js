import { UsuarioRolRepository } from '../repositories/usuario-rol.repository.js';
import { RolPermisoRepository } from '../repositories/rol-permiso.repository.js';

export class RolPermisoService {
  constructor() {
    this.usuarioRolRepo = new UsuarioRolRepository();
    this.rolPermisoRepo = new RolPermisoRepository();
  }

  /**
   * Obtiene los códigos de permiso de un usuario a partir de su rol activo.
   * @param {number} usuarioId - ID del usuario del sistema
   * @returns {Promise<string[]>} Arreglo de códigos de permiso (ej. ['gestionar_usuarios', 'firmar_solicitud'])
   */
  async obtenerCodigosPermisoDeUsuario(usuarioId) {
    // Buscar la asignación de rol activa del usuario
    const asignacionActiva = await this.usuarioRolRepo.findActiveAsignacionByUsuario(usuarioId);
    if (!asignacionActiva) return [];

    // Obtener los permisos asociados a ese rol
    const permisos = await this.rolPermisoRepo.obtenerPermisosDeRol(asignacionActiva.rol_id);
    return permisos.map(p => p.codigo);
  }
}