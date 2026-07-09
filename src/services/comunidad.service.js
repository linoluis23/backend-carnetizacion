import { ComunidadRepository } from '../repositories/comunidad.repository.js';
import { SecuenciaComunidadRepository } from '../repositories/secuencia-comunidad.repository.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';
import pool from '../config/database.js';

export class ComunidadService {
  constructor() {
    this.comunidadRepo = new ComunidadRepository();
    this.secuenciaRepo = new SecuenciaComunidadRepository();

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

async listarComunidades(filtros = {}, paginacion = {}) {
  const resultado = await this.comunidadRepo.listar(filtros, paginacion);
  return {
    datos: resultado.datos.map(c => this._mapear(c)),
    total: resultado.total,
    pagina: Math.floor((paginacion.offset || 0) / (paginacion.limit || 100)) + 1,
    totalPaginas: Math.ceil(resultado.total / (paginacion.limit || 100))
  };
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
    // Ya no se valida que dto.cod_com exista; se generará
    // Se ignora dto.cod_com si viene, o se puede eliminar

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const regionalExiste = await this.comunidadRepo.validarRegional(dto.cod_reg);
      if (!regionalExiste) throw new AppError('La regional no existe.', 400);
      // 1. Obtener secuencia con bloqueo
      const secuencia = await this.secuenciaRepo.obtenerPorRegional(dto.cod_reg, connection);
      if (!secuencia) {
        throw new AppError(`No existe rango para la regional ${dto.cod_reg}`, 400);
      }

      const { ultimoCodigo, limiteSuperior } = secuencia;
      const nuevoCodigo = ultimoCodigo + 1;
      if (nuevoCodigo > limiteSuperior) {
        throw new AppError(`Códigos agotados para la regional ${dto.cod_reg} (límite ${limiteSuperior})`, 409);
      }

      // 2. Actualizar secuencia
      await this.secuenciaRepo.actualizarUltimoCodigo(dto.cod_reg, nuevoCodigo, connection);

      // 3. Crear comunidad con el código generado
      await this.comunidadRepo.crear({
        cod_reg: dto.cod_reg,
        cod_com: nuevoCodigo,          // <-- automático
        descripcion: dto.descripcion,
        descripcion_corta: dto.descripcion_corta,
        estado: config.ESTADO.ACTIVO,
        usuario_registro: usuarioRegistrador,
      }, connection); // pasar conexión si el método lo acepta

      await connection.commit();

      // 4. Obtener la comunidad recién creada
      const nueva = await this.comunidadRepo.buscarPorCodigo(nuevoCodigo);
      return { mensaje: 'Comunidad registrada exitosamente.', datos: this._mapear(nueva) };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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