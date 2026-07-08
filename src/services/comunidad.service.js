import { ComunidadRepository } from '../repositories/comunidad.repository.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';

export class ComunidadService {
  constructor() {
    this.comunidadRepo = new ComunidadRepository();
  }

  _mapear(com) {
    return {
      id: com.id,
      cod_reg: com.cod_reg,
      cod_com: com.cod_com,
      descripcion: com.descripcion,
      descripcion_corta: com.descripcion_corta,
      estado: com.estado,
      descripcion_regional: com.descripcion_regional || null,
      usuario_registro: com.usuario_registro,
      fecha_registro: com.fecha_registro,
      usuario_ultima_modificacion: com.usuario_ultima_modificacion,
      fecha_ultima_actualizacion: com.fecha_ultima_actualizacion,
    };
  }

  async listarComunidades(filtros = {}) {

    //async listar(codReg = null, estado = null) {
   // const comunidades = await this.comunidadRepo.listar(codReg, estado);
      const comunidades = await this.comunidadRepo.listar(filtros);

    return comunidades.map(c => this._mapear(c));
  }

  async obtenerPorId(id) {
    const com = await this.comunidadRepo.buscarPorId(id);
    if (!com) throw new AppError('Comunidad no encontrada.', 404);
    return this._mapear(com);
  }

  async obtenerPorCodigo(codCom) {
    const com = await this.comunidadRepo.buscarPorCodigo(codCom);
    if (!com) throw new AppError('Comunidad no encontrada.', 404);
    return this._mapear(com);
  }

  async registrar(dto, usuarioRegistrador) {
    // Validar unicidad del código
    const existente = await this.comunidadRepo.buscarPorCodigo(dto.cod_com);
    if (existente) throw new AppError('El código de comunidad ya existe.', 409);

    await this.comunidadRepo.crear({
      cod_reg: dto.cod_reg,
      cod_com: dto.cod_com,
      descripcion: dto.descripcion,
      descripcion_corta: dto.descripcion_corta,
      estado: config.ESTADO.ACTIVO,
      usuario_registro: usuarioRegistrador,
    });

    // Retornar la comunidad recién creada (buscar por código)
    const nueva = await this.comunidadRepo.buscarPorCodigo(dto.cod_com);
    return { mensaje: 'Comunidad registrada exitosamente.', datos: this._mapear(nueva) };
  }

  async actualizar(id, dto, usuarioModificador) {
    const com = await this.comunidadRepo.buscarPorId(id);
    if (!com) throw new AppError('Comunidad no encontrada.', 404);

    // Verificar que el nuevo código no exista en otra comunidad
    if (dto.cod_com !== com.cod_com) {
      const otra = await this.comunidadRepo.buscarPorCodigo(dto.cod_com);
      if (otra) throw new AppError('El código de comunidad ya está en uso.', 409);
    }

    const campos = {
      cod_reg: dto.cod_reg,
      cod_com: dto.cod_com,
      descripcion: dto.descripcion,
      descripcion_corta: dto.descripcion_corta,
      usuario_ultima_modificacion: usuarioModificador,
    };
    await this.comunidadRepo.actualizar(id, campos);
    const actualizada = await this.comunidadRepo.buscarPorId(id);
    return { mensaje: 'Comunidad actualizada exitosamente.', datos: this._mapear(actualizada) };
  }

  async eliminar(id, usuarioModificador) {
    const com = await this.comunidadRepo.buscarPorId(id);
    if (!com) throw new AppError('Comunidad no encontrada.', 404);
    if (com.estado === config.ESTADO.INACTIVO) {
      throw new AppError('La comunidad ya se encuentra eliminada.', 400);
    }
    await this.comunidadRepo.eliminar(id, config.ESTADO.INACTIVO, usuarioModificador);
    const eliminada = await this.comunidadRepo.buscarPorId(id);
    return { mensaje: 'Comunidad eliminada (lógico).', datos: this._mapear(eliminada) };
  }

  async activarComunidad(id, usuarioModificador) {
  const com = await this.comunidadRepo.buscarPorId(id);
  if (!com) throw new AppError('Comunidad no encontrada.', 404);
  if (com.estado === config.ESTADO.ACTIVO) {
    throw new AppError('La comunidad ya se encuentra activa.', 400);
  }
  await this.comunidadRepo.activar(id, config.ESTADO.ACTIVO, usuarioModificador);
  const actualizada = await this.comunidadRepo.buscarPorId(id);
  return this._mapear(actualizada);
}
}