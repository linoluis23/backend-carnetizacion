import { ProgramacionRepository } from '../repositories/programacion.repository.js';
import { RegionalRepository } from '../repositories/regional.repository.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';

export class ProgramacionService {
  constructor() {
    this.programacionRepo = new ProgramacionRepository();
    this.regionalRepo = new RegionalRepository();
  }

  _mapear(prog) {
    return {
      id: prog.id,
      cod_reg: prog.cod_reg,
      regional_descripcion: prog.regional_descripcion || '',
      fecha_inicio: prog.fecha_inicio,
      fecha_fin: prog.fecha_fin,
      estado: prog.estado,
      glosa: prog.glosa || '',
      usuario_registro: prog.usuario_registro,
      fecha_creacion: prog.fecha_creacion,
      usuario_ultima_modificacion: prog.usuario_ultima_modificacion,
      fecha_ultima_actualizacion: prog.fecha_ultima_actualizacion,
    };
  }

  async listar(filtros = {}) {
    const programas = await this.programacionRepo.listar(filtros);
    return programas.map(p => this._mapear(p));
  }

  async obtenerPorId(id) {
    const prog = await this.programacionRepo.buscarPorId(id);
    if (!prog) throw new AppError('Programación no encontrada.', 404);
    return this._mapear(prog);
  }

  async crear(dto, usuarioRegistrador) {
    // Validar regional
    const regional = await this.regionalRepo.buscarPorCodigo(dto.cod_reg);
    if (!regional) throw new AppError('Regional no encontrada.', 404);
    if (regional.estado !== 'ACT') throw new AppError('La regional no está activa.', 400);

    // Validar fechas
    const inicio = new Date(dto.fecha_inicio);
    const fin = new Date(dto.fecha_fin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      throw new AppError('Fechas inválidas.', 400);
    }
    if (fin < inicio) {
      throw new AppError('La fecha de fin debe ser mayor o igual a la fecha de inicio.', 400);
    }

    // Verificar solapamiento con programaciones activas existentes en la misma regional
    if (await this.programacionRepo.existeSolapamiento(dto.cod_reg, dto.fecha_inicio, dto.fecha_fin)) {
      throw new AppError('Ya existe una programación activa para esta regional en el período indicado.', 409);
    }

    const nueva = await this.programacionRepo.crear({
      cod_reg: dto.cod_reg,
      fecha_inicio: dto.fecha_inicio,
      fecha_fin: dto.fecha_fin,
      estado: config.ESTADOS_PROGRAMACION.ACTIVO,
      usuario_registro: usuarioRegistrador,
      glosa: dto.glosa,
    });

    return { mensaje: 'Programación creada exitosamente.', datos: this._mapear(nueva) };
  }

  async actualizar(id, dto, usuarioModificador) {
    const prog = await this.programacionRepo.buscarPorId(id);
    if (!prog) throw new AppError('Programación no encontrada.', 404);

    // Si se van a modificar las fechas, validar nuevamente y verificar solapamiento
    const inicio = dto.fecha_inicio ? new Date(dto.fecha_inicio) : new Date(prog.fecha_inicio);
    const fin = dto.fecha_fin ? new Date(dto.fecha_fin) : new Date(prog.fecha_fin);

    if (fin < inicio) {
      throw new AppError('La fecha de fin debe ser mayor o igual a la fecha de inicio.', 400);
    }

    const codReg = dto.cod_reg || prog.cod_reg;
    if (dto.fecha_inicio || dto.fecha_fin || dto.cod_reg) {
      if (await this.programacionRepo.existeSolapamiento(codReg, 
          dto.fecha_inicio || prog.fecha_inicio, 
          dto.fecha_fin || prog.fecha_fin, 
          id)) {
        throw new AppError('Otra programación activa ya cubre ese período para esta regional.', 409);
      }
    }

    const campos = {
      cod_reg: dto.cod_reg || prog.cod_reg,
      fecha_inicio: dto.fecha_inicio || prog.fecha_inicio,
      fecha_fin: dto.fecha_fin !== undefined ? dto.fecha_fin : prog.fecha_fin,
      usuario_ultima_modificacion: usuarioModificador,
    };
    if (dto.glosa !== undefined) campos.glosa = dto.glosa;

    await this.programacionRepo.actualizar(id, campos);
    const actualizada = await this.programacionRepo.buscarPorId(id);
    return { mensaje: 'Programación actualizada.', datos: this._mapear(actualizada) };
  }

  async cambiarEstado(id, nuevoEstado, usuarioModificador) {
    const prog = await this.programacionRepo.buscarPorId(id);
    if (!prog) throw new AppError('Programación no encontrada.', 404);

    // Si está ELI, no se puede activar ni inactivar
    if (prog.estado === config.ESTADOS_PROGRAMACION.ELIMINADO) {
      throw new AppError('No se puede modificar una programación eliminada.', 400);
    }

    if (prog.estado === nuevoEstado) {
      throw new AppError('La programación ya tiene ese estado.', 400);
    }

    await this.programacionRepo.actualizarEstado(id, nuevoEstado, usuarioModificador);
    const actualizada = await this.programacionRepo.buscarPorId(id);
    return { mensaje: 'Estado actualizado.', datos: this._mapear(actualizada) };
  }
}