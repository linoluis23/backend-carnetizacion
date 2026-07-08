import { RolRepository } from '../repositories/rol.repository.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';

export class RolService {
  constructor() {
    this.rolRepo = new RolRepository();
  }

  async crearRol(dto, usuarioRegistrador) {
    if (!dto.nombre) throw new AppError('El nombre del rol es obligatorio.', 400);
    const existente = await this.rolRepo.buscarPorNombre(dto.nombre);
    if (existente) throw new AppError('El nombre del rol ya existe.', 409);

    const nuevo = await this.rolRepo.crear({
      nombre: dto.nombre,
      descripcion: dto.descripcion || null,
      estado_rol: config.ESTADOS_ROL.ACTIVO,
      usuario_registro: usuarioRegistrador,
    });
    return this._mapearRol(nuevo);
  }

  async actualizarRol(id, dto, usuarioModificador) {
    if (!dto.nombre) throw new AppError('El nombre del rol es obligatorio.', 400);
    const rol = await this.rolRepo.buscarPorId(id);
    if (!rol) throw new AppError('Rol no encontrado.', 404);

    // Verificar que el nuevo nombre no exista en otro rol
    if (rol.nombre !== dto.nombre) {
      const otro = await this.rolRepo.buscarPorNombre(dto.nombre);
      if (otro) throw new AppError('El nombre del rol ya existe.', 409);
    }

    const campos = {
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? rol.descripcion,
      usuario_ultima_modificacion: usuarioModificador,
    };
    const actualizado = await this.rolRepo.actualizar(id, campos);
    return this._mapearRol(actualizado);
  }

  async activarRol(id, usuarioModificador) {
    const rol = await this.rolRepo.buscarPorId(id);
    if (!rol) throw new AppError('Rol no encontrado.', 404);
    
    if (rol.estado_rol === config.ESTADOS_ROL.ACTIVO) {
        throw new AppError('El rol ya se encuentra activo.', 400);
    }

    const actualizado = await this.rolRepo.actualizar(id, {
        estado_rol: config.ESTADOS_ROL.ACTIVO,
        usuario_ultima_modificacion: usuarioModificador,
    });
    return this._mapearRol(actualizado);
}

  async inactivarRol(id, usuarioModificador) {
    const rol = await this.rolRepo.buscarPorId(id);
    if (!rol) throw new AppError('Rol no encontrado.', 404);
    if (rol.estado_rol === config.ESTADOS_ROL.INACTIVO) throw new AppError('El rol ya se encuentra inactivo.', 400);

    const actualizado = await this.rolRepo.actualizar(id, {
      estado_rol: config.ESTADOS_ROL.INACTIVO,
      usuario_ultima_modificacion: usuarioModificador,
    });
    return this._mapearRol(actualizado);
  }

  async listarRoles() {
    const roles = await this.rolRepo.listarRoles();
    return roles.map(rol => this._mapearRol(rol));
  }

  async obtenerRolPorId(id) {
    const rol = await this.rolRepo.buscarPorId(id);
    if (!rol) throw new AppError('Rol no encontrado.', 404);
    return this._mapearRol(rol);
  }

  // Mapeo para evitar exponer campos internos (aunque todos son necesarios)
  _mapearRol(rol) {
    return {
      id: rol.id,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      estado_rol: rol.estado_rol,
      usuario_registro: rol.usuario_registro,
      fecha_creacion: rol.fecha_creacion,
      usuario_ultima_modificacion: rol.usuario_ultima_modificacion,
      fecha_ultima_actualizacion: rol.fecha_ultima_actualizacion,
    };
  }
}