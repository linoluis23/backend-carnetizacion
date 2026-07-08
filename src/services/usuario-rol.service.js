import { UsuarioRolRepository } from '../repositories/usuario-rol.repository.js';
import { UsuarioRepository } from '../repositories/usuario.repository.js';
import { RolRepository } from '../repositories/rol.repository.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';

export class UsuarioRolService {
  constructor() {
    this.usuarioRolRepo = new UsuarioRolRepository();
    this.usuarioRepo = new UsuarioRepository();
    this.rolRepo = new RolRepository();
  }

  /**
   * Asigna un rol a un usuario (o reactiva si ya existe una asignación inactiva).
   */
async asignarRol(usuarioId, dto, usuarioModificador) {
    const usuario = await this.usuarioRepo.buscarPorId(usuarioId);
    if (!usuario) throw new AppError('Usuario no encontrado.', 404);

    const rol = await this.rolRepo.buscarPorId(dto.rol_id);
    if (!rol) throw new AppError('Rol no encontrado.', 404);
    if (rol.estado_rol !== config.ESTADOS_ROL.ACTIVO) {
        throw new AppError('El rol no está activo.', 400);
    }

    // Verificar si el usuario ya tiene exactamente este rol activo
    const asignacionActivaMismoRol = await this.usuarioRolRepo.findActiveAsignacion(usuarioId, dto.rol_id);
    if (asignacionActivaMismoRol) {
        throw new AppError('El usuario ya tiene asignado este rol activo.', 400);
    }

    // Si tiene cualquier otro rol activo, se inactivan todos (para que solo quede uno activo)
    await this.usuarioRolRepo.inactivarTodosRolesActivos(usuarioId, usuarioModificador);

    // Crear nueva asignación activa
    await this.usuarioRolRepo.crearAsignacion(
        usuarioId,
        dto.rol_id,
        usuarioModificador,
        dto.fecha_desde,
        dto.fecha_hasta
    );

    return { mensaje: 'Rol asignado correctamente.' };
}
  /**
   * Inactiva una asignación de rol (estado INA).
   */
  async inactivarAsignacion(usuarioId, rolId, usuarioModificador) {
    const asignacion = await this.usuarioRolRepo.findAsignacion(usuarioId, rolId);
    if (!asignacion) throw new AppError('Asignación no encontrada.', 404);
    if (asignacion.estado_usuario_rol === config.ESTADOS_USUARIO_ROL.INACTIVO) {
      throw new AppError('La asignación ya está inactiva.', 400);
    }
    await this.usuarioRolRepo.desactivarAsignacion(usuarioId, rolId, usuarioModificador);
    return { mensaje: 'Asignación desactivada.' };
  }

  /**
   * Lista los roles asignados a un usuario (solo los activos o todos).
   */
  async listarRolesDeUsuario(usuarioId, soloActivos = false) {
    const rows = await this.usuarioRolRepo.listarPorUsuario(usuarioId);
    let asignaciones = rows.map(row => ({
      id: row.id,
      rol_id: row.rol_id,
      rol_nombre: row.rol_nombre,
      estado_usuario_rol: row.estado_usuario_rol,
      fecha_asignacion: row.fecha_asignacion,
      fecha_desde: row.fecha_desde,
      fecha_hasta:row.fecha_hasta,
    }));
    if (soloActivos) {
      asignaciones = asignaciones.filter(a => a.estado_usuario_rol === config.ESTADOS_USUARIO_ROL.ACTIVO);
    }
    return asignaciones;
  }

  /**
   * Lista los usuarios que tienen un rol específico.
   */
  async listarUsuariosDeRol(rolId) {
    const rows = await this.usuarioRolRepo.listarPorRol(rolId);
    return rows.map(row => ({
      id: row.id,
      usuario_id: row.usuario_id,
      nombres: row.nombres, 
      email: row.email,
      rolId: rolId,
      estado_usuario_rol: row.estado_usuario_rol,
      fecha_asignacion: row.fecha_asignacion,
      fecha_desde: row.fecha_desde,
      fecha_hasta: row.fecha_hasta,
    }));
  }
}