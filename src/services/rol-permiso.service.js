import { RolPermisoRepository } from '../repositories/rol-permiso.repository.js';
import { RolRepository } from '../repositories/rol.repository.js';
import { PermisoRepository } from '../repositories/permiso.repository.js';
import { UsuarioRolRepository } from '../repositories/usuario-rol.repository.js'; 
import { AppError } from '../utils/errores.util.js';

export class RolPermisoService {
  constructor() {
    this.rolPermisoRepo = new RolPermisoRepository();
    this.rolRepo = new RolRepository();
    this.permisoRepo = new PermisoRepository();
        this.usuarioRolRepo = new UsuarioRolRepository(); // ← agregar esta línea

  }

  async listarPermisosDeRol(rolId) {
    const rol = await this.rolRepo.buscarPorId(rolId);
    if (!rol) throw new AppError('Rol no encontrado.', 404);
    return this.rolPermisoRepo.listarPorRol(rolId);
  }

  async asignarPermiso(rolId, permisoId) {
    const rol = await this.rolRepo.buscarPorId(rolId);
    if (!rol) throw new AppError('Rol no encontrado.', 404);
    const permiso = await this.permisoRepo.buscarPorId(permisoId);
    if (!permiso) throw new AppError('Permiso no encontrado.', 404);
    await this.rolPermisoRepo.asignarPermiso(rolId, permisoId);
    return { mensaje: 'Permiso asignado al rol exitosamente.' };
  }

  async removerPermiso(rolId, permisoId) {
    const rol = await this.rolRepo.buscarPorId(rolId);
    if (!rol) throw new AppError('Rol no encontrado.', 404);
    const permiso = await this.permisoRepo.buscarPorId(permisoId);
    if (!permiso) throw new AppError('Permiso no encontrado.', 404);
    await this.rolPermisoRepo.removerPermiso(rolId, permisoId);
    return { mensaje: 'Permiso removido del rol.' };
  }

  /**
   * Obtiene los códigos de permiso de un usuario a partir de su rol activo.
   * @param {number} usuarioId - ID del usuario del sistema
   * @returns {Promise<string[]>} Arreglo de códigos de permiso (ej. ['gestionar_usuarios', 'firmar_solicitud'])
   */
    async obtenerCodigosPermisoDeUsuario(usuarioId) {
    const asignacionActiva = await this.usuarioRolRepo.findActiveAsignacionByUsuario(usuarioId);
    if (!asignacionActiva) return [];
    const permisos = await this.rolPermisoRepo.obtenerPermisosDeRol(asignacionActiva.rol_id);
    return permisos.map(p => p.codigo);
  }
}