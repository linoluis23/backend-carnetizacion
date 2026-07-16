// src/services/permiso.service.js
import { PermisoRepository } from '../repositories/permiso.repository.js';
import { AppError } from '../utils/errores.util.js';
import { config } from '../config/configuracion.js';

export class PermisoService {
  constructor() {
    this.permisoRepo = new PermisoRepository();
  }

  async listar() {
    return this.permisoRepo.listar();
  }

  async obtenerPorId(id) {
    const permiso = await this.permisoRepo.buscarPorId(id);
    if (!permiso) throw new AppError('Permiso no encontrado.', 404);
    return permiso;
  }

  async crear({ codigo, nombre, descripcion }, usuarioRegistro) {
    const existente = await this.permisoRepo.buscarPorCodigo(codigo);
    if (existente) throw new AppError('El código del permiso ya existe.', 409);
    const estadoActivo = config.ESTADOS_PERMISO?.ACTIVO || 'ACT';
    return this.permisoRepo.crear({ codigo, nombre, descripcion, estado: estadoActivo }, usuarioRegistro);
  }

  async actualizar(id, { codigo, nombre, descripcion, estado }, usuarioModificacion) {
    const permiso = await this.permisoRepo.buscarPorId(id);
    if (!permiso) throw new AppError('Permiso no encontrado.', 404);

    if (estado) {
      const estadosPermitidos = [
        config.ESTADOS_PERMISO?.ACTIVO,
        config.ESTADOS_PERMISO?.INACTIVO,
      ].filter(Boolean);
      if (!estadosPermitidos.includes(estado)) {
        throw new AppError('El estado solo puede ser ACTIVO o INACTIVO.', 400);
      }
    }

    if (codigo && codigo !== permiso.codigo) {
      const otro = await this.permisoRepo.buscarPorCodigo(codigo);
      if (otro) throw new AppError('El código ya está en uso.', 409);
    }

    const campos = {};
    if (codigo !== undefined) campos.codigo = codigo;
    if (nombre !== undefined) campos.nombre = nombre;
    if (descripcion !== undefined) campos.descripcion = descripcion;
    if (estado !== undefined) campos.estado = estado;

    return this.permisoRepo.actualizar(id, campos, usuarioModificacion);
  }

  // 🔥 ELIMINAR (lógica con validación)
  async eliminar(id, usuarioModificacion) {
    const permiso = await this.permisoRepo.buscarPorId(id);
    if (!permiso) throw new AppError('Permiso no encontrado.', 404);

    const estadoEliminado = config.ESTADOS_PERMISO?.ELIMINADO || 'ELI';
    // ✅ Usar permiso.estado (NO permiso.estado_permiso)
    if (permiso.estado === estadoEliminado) {
      throw new AppError('El permiso ya está eliminado.', 400);
    }

    await this.permisoRepo.eliminarLogico(id, usuarioModificacion);
    return { mensaje: 'Permiso eliminado lógicamente.' };
  }

  // 🔥 INACTIVAR con validación
  async inactivar(id, usuarioModificacion) {
    const permiso = await this.permisoRepo.buscarPorId(id);
    if (!permiso) throw new AppError('Permiso no encontrado.', 404);

    const estadoActivo = config.ESTADOS_PERMISO?.ACTIVO || 'ACT';
    const estadoInactivo = config.ESTADOS_PERMISO?.INACTIVO || 'INA';
    const estadoEliminado = config.ESTADOS_PERMISO?.ELIMINADO || 'ELI';

    // ✅ Usar permiso.estado
    if (permiso.estado === estadoEliminado) {
      throw new AppError('No se puede inactivar un permiso eliminado.', 400);
    }
    if (permiso.estado === estadoInactivo) {
      throw new AppError('El permiso ya está inactivo.', 400);
    }
    if (permiso.estado !== estadoActivo) {
      throw new AppError('Solo se pueden inactivar permisos activos.', 400);
    }

    await this.permisoRepo.actualizar(id, { estado: estadoInactivo }, usuarioModificacion);
    return { mensaje: 'Permiso inactivado correctamente.' };
  }

  // 🔥 ACTIVAR con validación
  async activar(id, usuarioModificacion) {
    const permiso = await this.permisoRepo.buscarPorId(id);
    if (!permiso) throw new AppError('Permiso no encontrado.', 404);

    const estadoActivo = config.ESTADOS_PERMISO?.ACTIVO || 'ACT';
    const estadoInactivo = config.ESTADOS_PERMISO?.INACTIVO || 'INA';
    const estadoEliminado = config.ESTADOS_PERMISO?.ELIMINADO || 'ELI';

    // ✅ Usar permiso.estado
    if (permiso.estado === estadoEliminado) {
      throw new AppError('No se puede activar un permiso eliminado.', 400);
    }
    if (permiso.estado === estadoActivo) {
      throw new AppError('El permiso ya está activo.', 400);
    }
    if (permiso.estado !== estadoInactivo) {
      throw new AppError('Solo se pueden activar permisos inactivos.', 400);
    }

    await this.permisoRepo.actualizar(id, { estado: estadoActivo }, usuarioModificacion);
    return { mensaje: 'Permiso activado correctamente.' };
  }
}