import { AutoridadRepository } from '../repositories/autoridad.repository.js';
import { CargoRepository } from '../repositories/cargo.repository.js';
import { PersonaRepository } from '../repositories/persona.repository.js';
import { DepartamentoRepository } from '../repositories/departamento.repository.js';
import { ProvinciaRepository } from '../repositories/provincia.repository.js';
import { RegionalRepository } from '../repositories/regional.repository.js';
import { ComunidadRepository } from '../repositories/comunidad.repository.js';
import { UsuarioRepository } from '../repositories/usuario.repository.js';
import { UsuarioRolService } from './usuario-rol.service.js'; // Asume que tienes este servicio
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';
import { UsuarioSyncService } from './usuario-sync.service.js';


export class AutoridadService {
  constructor() {
    this.autoridadRepo = new AutoridadRepository();
    this.cargoRepo = new CargoRepository();
    this.personaRepo = new PersonaRepository();
    this.departamentoRepo = new DepartamentoRepository();
    this.provinciaRepo = new ProvinciaRepository();
    this.regionalRepo = new RegionalRepository();
    this.comunidadRepo = new ComunidadRepository();
        this.usuarioRepo = new UsuarioRepository();
    this.usuarioRolService = new UsuarioRolService();
        this.usuarioSyncService = new UsuarioSyncService();
  }

  _mapear(autoridad) {
    return {
      id: autoridad.id,
      cargo_id: autoridad.cargo_id,
      persona_id: autoridad.persona_id,
      cod_dep: autoridad.cod_dep,
      cod_reg: autoridad.cod_reg,
      cod_com: autoridad.cod_com,
      fecha_inicio: autoridad.fecha_inicio,
      fecha_fin: autoridad.fecha_fin,
      estado: autoridad.estado,
      cargo_descripcion: autoridad.cargo_descripcion,
      cargo_nivel: autoridad.cargo_nivel,
      nombres: autoridad.nombres,
      primer_apellido: autoridad.primer_apellido,
      segundo_apellido: autoridad.segundo_apellido,
      documento_identidad: autoridad.documento_identidad,
      dep_descripcion: autoridad.dep_descripcion,
      cod_prov: autoridad.cod_prov,
      prov_descripcion: autoridad.prov_descripcion,
      reg_descripcion: autoridad.reg_descripcion,
      com_descripcion: autoridad.com_descripcion,
      usuario_registro: autoridad.usuario_registro,
      fecha_creacion: autoridad.fecha_creacion,
      usuario_ultima_modificacion: autoridad.usuario_ultima_modificacion,
      fecha_ultima_actualizacion: autoridad.fecha_ultima_actualizacion,
      glosa: autoridad.glosa || null,
    };
  }

  async listar(filtros = {}) {
    const autoridades = await this.autoridadRepo.listar(filtros);
    return autoridades.map(a => this._mapear(a));
  }

  async obtenerPorId(id) {
    const autoridad = await this.autoridadRepo.buscarPorId(id);
    if (!autoridad) throw new AppError('Autoridad no encontrada.', 404);
    return this._mapear(autoridad);
  }

  // ==================== CREAR ====================
  async crear(dto, usuarioRegistrador) {
    const cargo = await this.cargoRepo.buscarPorId(dto.cargo_id);
    if (!cargo) throw new AppError('Cargo no encontrado.', 404);
    if (cargo.estado !== 'ACT') throw new AppError('El cargo no está activo.', 400);

    const persona = await this.personaRepo.buscarPorId(dto.persona_id);
    if (!persona) throw new AppError('Persona no encontrada.', 404);
    if (persona.estado !== 'ACT') throw new AppError('La persona no está activa.', 400);

    // Verificar que la persona no tenga NINGUNA autoridad activa
const autoridadExistentePersona = await this.autoridadRepo.buscarActivaPorPersona(dto.persona_id);
if (autoridadExistentePersona) {
  throw new AppError('La persona ya posee una autoridad activa. No puede ocupar más de un cargo simultáneamente.', 409);
}

    const ambito = await this._validarAmbitoYCadenaGeografica(cargo, dto, persona);

    // Desactivar autoridad anterior del mismo cargo y ámbito (sucesión automática)
    const autoridadAnterior = await this.autoridadRepo.buscarActivaPorCargoYAmbito(cargo.id, ambito);
    if (autoridadAnterior) {
      const fechaFinAnterior = this._diaAnterior(dto.fecha_inicio);
      await this.autoridadRepo.desactivarAutoridad(autoridadAnterior.id, config.ESTADOS_AUTORIDAD.INACTIVO, fechaFinAnterior);
    }

    const nueva = await this.autoridadRepo.crear({
      cargo_id: dto.cargo_id,
      persona_id: dto.persona_id,
      cod_dep: ambito.cod_dep || null,
      cod_reg: ambito.cod_reg || null,
      cod_com: ambito.cod_com || null,
      fecha_inicio: dto.fecha_inicio,
      fecha_fin: dto.fecha_fin,
      glosa: dto.glosa || null,
      estado: config.ESTADOS_AUTORIDAD.ACTIVO,
      usuario_registro: usuarioRegistrador,
    });
    await this.usuarioSyncService.sincronizarUsuarioAutoridad(dto.persona_id, cargo.nivel);
    return { mensaje: 'Autoridad registrada exitosamente.', datos: this._mapear(nueva) };
  }

  // ==================== ACTUALIZAR ====================
  async actualizar(id, dto, usuarioModificador) {
    const autoridad = await this.autoridadRepo.buscarPorId(id);
    if (!autoridad) throw new AppError('Autoridad no encontrada.', 404);

    let cargoId = dto.cargo_id || autoridad.cargo_id;
    const cargo = await this.cargoRepo.buscarPorId(cargoId);
    if (!cargo) throw new AppError('Cargo no encontrado.', 404);

    if (dto.persona_id && dto.persona_id !== autoridad.persona_id) {
      const persona = await this.personaRepo.buscarPorId(dto.persona_id);
      if (!persona || persona.estado !== 'ACT') throw new AppError('Persona no válida.', 400);
      const activa = await this.autoridadRepo.buscarActivaPorPersona(dto.persona_id);
      if (activa && activa.cargo_id !== cargoId) {
        throw new AppError('La persona ya tiene una autoridad activa con un cargo diferente.', 409);
      }
    }

    const ambito = await this._validarAmbitoYCadenaGeografica(cargo, dto, null, autoridad);

    if (await this.autoridadRepo.existeSolapamiento(cargoId, ambito,
        dto.fecha_inicio || autoridad.fecha_inicio,
        dto.fecha_fin !== undefined ? dto.fecha_fin : autoridad.fecha_fin,
        id)) {
      throw new AppError('Ya existe otra autoridad activa del mismo cargo en ese ámbito en el período.', 409);
    }

    const campos = {
      cargo_id: cargoId,
      persona_id: dto.persona_id || autoridad.persona_id,
      cod_dep: ambito.cod_dep !== undefined ? ambito.cod_dep : autoridad.cod_dep,
      cod_reg: ambito.cod_reg !== undefined ? ambito.cod_reg : autoridad.cod_reg,
      cod_com: ambito.cod_com !== undefined ? ambito.cod_com : autoridad.cod_com,
      fecha_inicio: dto.fecha_inicio || autoridad.fecha_inicio,
      fecha_fin: dto.fecha_fin !== undefined ? dto.fecha_fin : autoridad.fecha_fin,
      glosa: dto.glosa !== undefined ? dto.glosa : autoridad.glosa,
      usuario_ultima_modificacion: usuarioModificador,
    };

    if (dto.estado !== undefined) {
      if (!Object.values(config.ESTADOS_AUTORIDAD).includes(dto.estado)) {
        throw new AppError('Estado de autoridad no válido.', 400);
      }
      campos.estado = dto.estado;
    }

    await this.autoridadRepo.actualizar(id, campos);
    const actualizada = await this.autoridadRepo.buscarPorId(id);
    return { mensaje: 'Autoridad actualizada.', datos: this._mapear(actualizada) };
  }

  // ==================== CAMBIOS DE ESTADO ====================
  async activarAutoridad(id, usuarioModificador) {
    const autoridad = await this.autoridadRepo.buscarPorId(id);
    if (!autoridad) throw new AppError('Autoridad no encontrada.', 404);
    if (autoridad.estado === config.ESTADOS_AUTORIDAD.ACTIVO) throw new AppError('La autoridad ya está activa.', 400);
    if (autoridad.estado === config.ESTADOS_AUTORIDAD.ELIMINADO) throw new AppError('No se puede activar una autoridad eliminada.', 400);

    const ambito = {};
    const cargo = await this.cargoRepo.buscarPorId(autoridad.cargo_id);
    if (!cargo) throw new AppError('Cargo no encontrado.', 404);
    if (cargo.nivel === 'DEPARTAMENTAL' && autoridad.cod_dep) ambito.cod_dep = autoridad.cod_dep;
    else if (cargo.nivel === 'REGIONAL' && autoridad.cod_reg) ambito.cod_reg = autoridad.cod_reg;
    else if (cargo.nivel === 'COMUNAL' && autoridad.cod_com) ambito.cod_com = autoridad.cod_com;

    const otraActiva = await this.autoridadRepo.buscarActivaPorCargoYAmbito(autoridad.cargo_id, ambito);
    if (otraActiva) throw new AppError('No puede haber más de un cargo activo para el mismo puesto.', 409);

    await this.autoridadRepo.actualizar(id, {
      estado: config.ESTADOS_AUTORIDAD.ACTIVO,
      fecha_fin: null,
      usuario_ultima_modificacion: usuarioModificador,
    });
    await this.usuarioSyncService.sincronizarUsuarioAutoridad(autoridad.persona_id, cargo.nivel);    
    const actualizada = await this.autoridadRepo.buscarPorId(id);
    return { mensaje: 'Autoridad activada exitosamente.', datos: this._mapear(actualizada) };
  }

  async inactivarAutoridad(id, fechaFin, usuarioModificador) {
    const autoridad = await this.autoridadRepo.buscarPorId(id);
    if (!autoridad) throw new AppError('Autoridad no encontrada.', 404);
    if (autoridad.estado === config.ESTADOS_AUTORIDAD.INACTIVO) throw new AppError('La autoridad ya está inactiva.', 400);
    if (autoridad.estado === config.ESTADOS_AUTORIDAD.ELIMINADO) throw new AppError('No se puede modificar una autoridad eliminada.', 400);

    const fechaFinal = fechaFin || new Date().toISOString().slice(0, 10);
    const fechaFinDate = new Date(fechaFinal);
    if (isNaN(fechaFinDate.getTime())) throw new AppError('Fecha de finalización inválida.', 400);
    const fechaInicioDate = new Date(autoridad.fecha_inicio);
    if (fechaFinDate < fechaInicioDate) throw new AppError('La fecha de finalización debe ser mayor o igual a la fecha de inicio.', 400);

    await this.autoridadRepo.actualizar(id, {
      estado: config.ESTADOS_AUTORIDAD.INACTIVO,
      fecha_fin: fechaFinal,
      usuario_ultima_modificacion: usuarioModificador,
    });
        const cargo = await this.cargoRepo.buscarPorId(autoridad.cargo_id);
    await this.usuarioSyncService.removerRolAutoridad(autoridad.persona_id, cargo.nivel);
    const actualizada = await this.autoridadRepo.buscarPorId(id);
    return { mensaje: 'Autoridad inactivada exitosamente.', datos: this._mapear(actualizada) };
  }

  async suspenderAutoridad(id, usuarioModificador) {
    return this._cambiarEstadoSimple(id, config.ESTADOS_AUTORIDAD.SUSPENDIDO, usuarioModificador);
  const autoridad = await this.autoridadRepo.buscarPorId(id);
    const cargo = await this.cargoRepo.buscarPorId(autoridad.cargo_id);
    await this.usuarioSyncService.removerRolAutoridad(autoridad.persona_id, cargo.nivel);
  }

  async eliminarAutoridad(id, usuarioModificador) {
        const autoridad = await this.autoridadRepo.buscarPorId(id);
    const cargo = await this.cargoRepo.buscarPorId(autoridad.cargo_id);
    await this.usuarioSyncService.removerRolAutoridad(autoridad.persona_id, cargo.nivel);
    return this._cambiarEstadoSimple(id, config.ESTADOS_AUTORIDAD.ELIMINADO, usuarioModificador);
  }

  async _cambiarEstadoSimple(id, nuevoEstado, usuarioModificador) {
    const autoridad = await this.autoridadRepo.buscarPorId(id);
    if (!autoridad) throw new AppError('Autoridad no encontrada.', 404);
    if (autoridad.estado === config.ESTADOS_AUTORIDAD.ELIMINADO) throw new AppError('No se puede modificar una autoridad eliminada.', 400);
    if (autoridad.estado === nuevoEstado) throw new AppError('La autoridad ya tiene ese estado.', 400);

    await this.autoridadRepo.actualizarEstado(id, nuevoEstado, usuarioModificador);
    const actualizada = await this.autoridadRepo.buscarPorId(id);
    return { mensaje: 'Estado actualizado correctamente.', datos: this._mapear(actualizada) };
  }

  // ==================== MÉTODOS PRIVADOS AUXILIARES ====================
  async _validarAmbitoYCadenaGeografica(cargo, dto, persona, autoridadExistente = null) {
    const ambito = {};
    const personaObj = persona || (autoridadExistente ? await this.personaRepo.buscarPorId(autoridadExistente.persona_id) : null);

    if (cargo.nivel === 'DEPARTAMENTAL') {
      if (!dto.cod_dep) throw new AppError('Debe especificar un departamento.', 400);
      const dep = await this.departamentoRepo.buscarPorCodigo(dto.cod_dep);
      if (!dep) throw new AppError('Departamento no encontrado.', 404);
      ambito.cod_dep = dto.cod_dep;
    } else if (cargo.nivel === 'REGIONAL') {
      if (!dto.cod_reg) throw new AppError('Debe especificar una regional.', 400);
      const reg = await this.regionalRepo.buscarPorCodigo(dto.cod_reg);
      if (!reg || reg.estado !== 'ACT') throw new AppError('Regional no válida.', 400);
      const prov = await this.provinciaRepo.buscarPorCodigo(reg.cod_prov);
      if (!prov) throw new AppError('Provincia asociada no existe.', 404);
      const dep = await this.departamentoRepo.buscarPorCodigo(prov.cod_dep);
      if (!dep) throw new AppError('Departamento asociado no existe.', 404);

      if (personaObj) {
        const comunidadPersona = await this.comunidadRepo.buscarPorCodigo(personaObj.cod_com);
        if (!comunidadPersona) throw new AppError('No se encontró la comunidad de la persona.', 404);
        const regionalDeComunidad = await this.regionalRepo.buscarPorCodigo(comunidadPersona.cod_reg);
        if (!regionalDeComunidad || regionalDeComunidad.cod_reg !== dto.cod_reg) {
          throw new AppError('La persona no pertenece a una comunidad de la regional especificada.', 400);
        }
      }
      ambito.cod_reg = dto.cod_reg;
    } else if (cargo.nivel === 'COMUNAL') {
      if (!dto.cod_com) throw new AppError('Debe especificar una comunidad.', 400);
      const com = await this.comunidadRepo.buscarPorCodigo(dto.cod_com);
      if (!com || com.estado !== 'ACT') throw new AppError('Comunidad no válida.', 400);
      const reg = await this.regionalRepo.buscarPorCodigo(com.cod_reg);
      if (!reg || reg.estado !== 'ACT') throw new AppError('Regional asociada no válida.', 400);
      const prov = await this.provinciaRepo.buscarPorCodigo(reg.cod_prov);
      if (!prov) throw new AppError('Provincia asociada no existe.', 404);
      const dep = await this.departamentoRepo.buscarPorCodigo(prov.cod_dep);
      if (!dep) throw new AppError('Departamento asociado no existe.', 404);

      if (personaObj && personaObj.cod_com !== dto.cod_com) {
        throw new AppError('La persona no pertenece a la comunidad especificada.', 400);
      }
      ambito.cod_com = dto.cod_com;
    } else {
      throw new AppError('Nivel de cargo no reconocido.', 400);
    }
    return ambito;
  }


// Método para sincronizar rol basado en autoridad
async sincronizarRolUsuario(autoridad) {
    const persona = await this.personaRepo.buscarPorId(autoridad.persona_id);
    if (!persona) return;

    // Buscar el usuario del sistema por documento de identidad
    const usuario = await this.usuarioRepo.buscarPorDocumento(persona.documento_identidad);
    if (!usuario) return; // O podrías crearlo automáticamente

    const rolPresidente = await this.rolRepo.buscarPorNombre('PRESIDENTE'); // Asume que tienes RolRepository
    if (!rolPresidente) return;

    if (autoridad.estado === 'ACT') {
        // Activar el rol de presidente para el usuario
        await this.usuarioRolService.asignarRol(usuario.id, rolPresidente.id, 'SISTEMA');
    } else {
        // Desactivar el rol de presidente
        await this.usuarioRolService.inactivarAsignacion(usuario.id, rolPresidente.id, 'SISTEMA');
    }
}

async obtenerPorUsuario(usuarioId) {
  // Obtener persona a partir del usuario (por documento)
  const usuario = await this.usuarioRepo.buscarPorId(usuarioId);
  if (!usuario) throw new AppError('Usuario no encontrado.', 404);

  const persona = await this.personaRepo.buscarPorDocumento(usuario.documento_identidad);
  if (!persona) throw new AppError('Persona no encontrada.', 404);

  // Buscar autoridad activa de esa persona
  const autoridad = await this.autoridadRepo.buscarActivaPorPersona(persona.id);
  if (!autoridad) throw new AppError('No tiene una autoridad activa.', 404);

  return this._mapear(autoridad);
}

  _diaAnterior(fechaStr) {
    const fecha = new Date(fechaStr);
    fecha.setDate(fecha.getDate() - 1);
    return fecha.toISOString().split('T')[0];
  }
}