import { RegionalRepository } from '../repositories/regional.repository.js';
import { AppError } from '../utils/errores.util.js';
import { config } from '../config/configuracion.js';

export class RegionalService {
  constructor() {
    this.regionalRepo = new RegionalRepository();
  }

    _mapear(reg) {
    return {
      id: reg.id,
      cod_prov: reg.cod_prov,
      cod_reg: reg.cod_reg,
      estado: reg.estado,
      descripcion: reg.descripcion,
      descripcion_corta: reg.descripcion_corta,
      descripcion_provincia: reg.descripcion_provincia || null,
      usuario_registro: reg.usuario_registro,
      fecha_registro: reg.fecha_registro,
      usuario_ultima_modificacion: reg.usuario_ultima_modificacion,
      fecha_ultima_actualizacion: reg.fecha_ultima_actualizacion,
    };
  }

  async listarRegionales(codProv = null, estado = null) {
    const regionales = await this.regionalRepo.listar(codProv, estado);
    return regionales.map(reg => ({
      id: reg.id,
      cod_prov: reg.cod_prov,
      cod_reg: reg.cod_reg,
      estado: reg.estado,
      descripcion: reg.descripcion,
      descripcion_corta: reg.descripcion_corta,
      descripcion_provincia: reg.descripcion_provincia || null,
    }));
  }

  async obtenerRegionalPorId(id) {
    const reg = await this.regionalRepo.buscarPorId(id);
    if (!reg) throw new AppError('Regional no encontrada.', 404);
    return {
      id: reg.id,
      cod_prov: reg.cod_prov,
      cod_reg: reg.cod_reg,
      estado: reg.estado,
      descripcion: reg.descripcion,
      descripcion_corta: reg.descripcion_corta,
      descripcion_provincia: reg.descripcion_provincia || null,
    };
  }

  async obtenerRegionalPorCodigo(codReg) {
    const reg = await this.regionalRepo.buscarPorCodigo(codReg);
    if (!reg) throw new AppError('Regional no encontrada.', 404);
    return {
      id: reg.id,
      cod_prov: reg.cod_prov,
      cod_reg: reg.cod_reg,
      estado: reg.estado,
      descripcion: reg.descripcion,
      descripcion_corta: reg.descripcion_corta,
      descripcion_provincia: reg.descripcion_provincia || null,
    };
  }

   async eliminar(id, usuarioModificador) {
  const reg = await this.regionalRepo.buscarPorId(id);
  if (!reg) throw new AppError('Regional no encontrada.', 404);
  if (reg.estado === config.ESTADO_REGIONAL.INACTIVO) {
    throw new AppError('La regional ya se encuentra eliminada.', 400);
  }
  await this.regionalRepo.activar(id, config.ESTADO_REGIONAL.INACTIVO, usuarioModificador);
  const actualizada = await this.regionalRepo.buscarPorId(id);
  return this._mapear(actualizada);
}


  async activarRegional(id, usuarioModificador) {
  const reg = await this.regionalRepo.buscarPorId(id);
  if (!reg) throw new AppError('Regional no encontrada.', 404);
  if (reg.estado === config.ESTADO_REGIONAL.ACTIVO) {
    throw new AppError('La regional ya se encuentra activa.', 400);
  }
  await this.regionalRepo.activar(id, config.ESTADO_REGIONAL.ACTIVO, usuarioModificador);
  const actualizada = await this.regionalRepo.buscarPorId(id);
  return this._mapear(actualizada);
}
}