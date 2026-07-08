import { PersonaRepository } from '../repositories/persona.repository.js';
import { ComunidadRepository } from '../repositories/comunidad.repository.js';
import { PersonaHistorialRepository } from '../repositories/persona-historial.repository.js';
import { PersonaDTO } from '../dtos/persona.dto.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';

export class PersonaService {
  constructor() {
    this.personaRepo = new PersonaRepository();
    this.comunidadRepo = new ComunidadRepository();
    this.historialRepo = new PersonaHistorialRepository();
  }

  _mapear(persona) {
    return {
      id: persona.id,
      cod_com: persona.cod_com,
      cod_persona: persona.cod_persona,
      cod_socio: persona.cod_socio,
      nombres: persona.nombres,
      primer_apellido: persona.primer_apellido,
      segundo_apellido: persona.segundo_apellido,
      tipo_socio: persona.tipo_socio,
      tipo_documento: persona.tipo_documento,
      documento_identidad: persona.documento_identidad,
      cod_complementario: persona.cod_complementario,
      lugar_nacimiento: persona.lugar_nacimiento,
      fecha_nacimiento: persona.fecha_nacimiento,
      estado_civil: persona.estado_civil,
      genero: persona.genero,
      celular: persona.celular,
      correo_electronico: persona.correo_electronico,
      direccion_domicilio: persona.direccion_domicilio,
      estado: persona.estado,
      comunidad_descripcion: persona.comunidad_descripcion || null,
      regional_descripcion: persona.regional_descripcion || null,
      provincia_descripcion: persona.provincia_descripcion || null,
      departamento_descripcion: persona.departamento_descripcion || null,
      usuario_registro: persona.usuario_registro,
      fecha_registro: persona.fecha_registro,
      usuario_ultima_modificacion: persona.usuario_ultima_modificacion,
      fecha_ultima_actualizacion: persona.fecha_ultima_actualizacion,
      cod_reg: persona.cod_reg,
      cod_prov: persona.cod_prov,
      cod_dep: persona.cod_dep,
    };
  }

  async listar(filtros = {}) {
    const personas = await this.personaRepo.listar(filtros);
    return personas.map(p => this._mapear(p));
  }

  async obtenerPorId(id) {
    const persona = await this.personaRepo.buscarPorId(id);
    if (!persona) throw new AppError('Persona no encontrada.', 404);
    return this._mapear(persona);
  }

  async obtenerPorCodPersona(codPersona) {
    const persona = await this.personaRepo.buscarPorCodPersona(codPersona);
    if (!persona) throw new AppError('Persona no encontrada.', 404);
    return this._mapear(persona);
  }

  async obtenerPorCodSocio(codSocio) {
    const persona = await this.personaRepo.buscarPorCodSocio(codSocio);
    if (!persona) throw new AppError('Persona no encontrada.', 404);
    return this._mapear(persona);
  }

  async obtenerPorDocumento(documentoIdentidad, codComplementario) {
    const persona = await this.personaRepo.buscarPorDocumento(documentoIdentidad, codComplementario);
    if (!persona) throw new AppError('Persona no encontrada.', 404);
    return this._mapear(persona);
  }

  async registrar(dto, usuarioRegistrador) {
    // Validar que la comunidad exista
    const comunidad = await this.comunidadRepo.buscarPorCodigo(dto.cod_com);
    if (!comunidad) {
      throw new AppError('Código de comunidad inexistente.', 400);
    }

    // Generar código de persona automático
    const codPersona = this._generarCodPersona(dto);

    // Verificar unicidad del código generado
    if (await this.personaRepo.buscarPorCodPersona(codPersona)) {
      throw new AppError('El código de persona generado ya existe. Posible duplicado exacto.', 409);
    }

    // Verificar unicidad del código de socio
    if (await this.personaRepo.buscarPorCodSocio(dto.cod_socio)) {
      throw new AppError('El código de socio ya existe.', 409);
    }

    // Verificar unicidad del documento
    if (await this.personaRepo.buscarPorDocumento(dto.documento_identidad, dto.cod_complementario)) {
      throw new AppError('Ya existe una persona con ese documento de identidad.', 409);
    }

    await this.personaRepo.crear({
      cod_com: dto.cod_com,
      cod_persona: codPersona,
      cod_socio: dto.cod_socio,
      nombres: dto.nombres,
      primer_apellido: dto.primer_apellido,
      segundo_apellido: dto.segundo_apellido,
      tipo_socio: dto.tipo_socio,
      tipo_documento: dto.tipo_documento,
      documento_identidad: dto.documento_identidad,
      cod_complementario: dto.cod_complementario,
      lugar_nacimiento: dto.lugar_nacimiento,
      fecha_nacimiento: dto.fecha_nacimiento,
      estado_civil: dto.estado_civil,
      genero: dto.genero,
      celular: dto.celular,
      correo_electronico: dto.correo_electronico,
      direccion_domicilio: dto.direccion_domicilio,
      estado: config.ESTADO.ACTIVO,
      usuario_registro: usuarioRegistrador,
    });

    const nueva = await this.personaRepo.buscarPorCodPersona(codPersona);
    return { mensaje: 'Persona registrada exitosamente.', datos: this._mapear(nueva) };
  }

  async actualizar(id, dto, usuarioModificador) {
    const persona = await this.personaRepo.buscarPorId(id);
    if (!persona) throw new AppError('Persona no encontrada.', 404);

    // Validar comunidad si se cambió
    if (dto.cod_com && dto.cod_com !== persona.cod_com) {
      const comunidad = await this.comunidadRepo.buscarPorCodigo(dto.cod_com);
      if (!comunidad) throw new AppError('Código de comunidad inexistente.', 400);
    }

    // Verificar unicidad de código de persona (si cambió)
    if (dto.cod_persona && dto.cod_persona !== persona.cod_persona) {
      if (await this.personaRepo.buscarPorCodPersona(dto.cod_persona)) {
        throw new AppError('El código de persona ya está en uso.', 409);
      }
    }

    // Verificar unicidad de código de socio (si cambió)
    if (dto.cod_socio && dto.cod_socio !== persona.cod_socio) {
      if (await this.personaRepo.buscarPorCodSocio(dto.cod_socio)) {
        throw new AppError('El código de socio ya está en uso.', 409);
      }
    }

    // Verificar unicidad del documento (si cambió), excluyendo el ID actual
    if (dto.documento_identidad !== undefined) {
      const docIgual = dto.documento_identidad === persona.documento_identidad
        && (dto.cod_complementario || null) === (persona.cod_complementario || null)
        && (dto.tipo_documento || persona.tipo_documento) === persona.tipo_documento;

      if (!docIgual) {
        if (await this.personaRepo.buscarPorDocumento(dto.documento_identidad, dto.cod_complementario, id)) {
          throw new AppError('El documento de identidad ya existe.', 409);
        }
      }
    }

    // Registrar cambios en el historial
    const camposAAuditar = [
      'cod_com', 'cod_socio', 'nombres', 'primer_apellido', 'segundo_apellido',
      'tipo_socio', 'tipo_documento', 'documento_identidad', 'cod_complementario',
      'lugar_nacimiento', 'fecha_nacimiento', 'estado_civil', 'genero',
      'celular', 'correo_electronico', 'direccion_domicilio', 'estado'
    ];

    for (const campo of camposAAuditar) {
      if (dto[campo] !== undefined) {
        let valorAnterior = persona[campo];
        let valorNuevo = dto[campo];

        // Normalizar fechas para comparación
        if (campo === 'fecha_nacimiento') {
          const formatear = (val) => val ? new Date(val).toISOString().split('T')[0] : null;
          if (formatear(valorAnterior) === formatear(valorNuevo)) continue;
        }

        if (valorAnterior != valorNuevo) { // comparación flexible
          await this.historialRepo.crear({
            persona_id: id,
            campo,
            valor_anterior: valorAnterior,
            valor_nuevo: valorNuevo,
            usuario_modificacion: usuarioModificador,
          });
        }
      }
    }

    // Preparar campos para actualizar
    const campos = { ...dto, usuario_ultima_modificacion: usuarioModificador };
    await this.personaRepo.actualizar(id, campos);

    const actualizada = await this.personaRepo.buscarPorId(id);
    return { mensaje: 'Persona actualizada exitosamente.', datos: this._mapear(actualizada) };
  }

  async obtenerHistorialPersona(id) {
    const persona = await this.personaRepo.buscarPorId(id);
    if (!persona) throw new AppError('Persona no encontrada.', 404);

    const historial = await this.historialRepo.listarPorPersona(id);
    return historial.map(h => ({
      id: h.id,
      campo: h.campo,
      valor_anterior: h.valor_anterior,
      valor_nuevo: h.valor_nuevo,
      usuario_modificacion: h.usuario_modificacion,
      fecha_modificacion: h.fecha_modificacion,
    }));
  }

  async eliminar(id, usuarioModificador) {
    const persona = await this.personaRepo.buscarPorId(id);
    if (!persona) throw new AppError('Persona no encontrada.', 404);
    if (persona.estado === config.ESTADO.INACTIVO) {
      throw new AppError('La persona ya se encuentra eliminada.', 400);
    }
    await this.personaRepo.eliminar(id, config.ESTADO.INACTIVO, usuarioModificador);
    const eliminada = await this.personaRepo.buscarPorId(id);
    return { mensaje: 'Persona eliminada (lógico).', datos: this._mapear(eliminada) };
  }

  async activarPersona(id, usuarioModificador) {
    const persona = await this.personaRepo.buscarPorId(id);
    if (!persona) throw new AppError('Persona no encontrada.', 404);
    if (persona.estado === config.ESTADO.ACTIVO) {
      throw new AppError('La persona ya se encuentra activa.', 400);
    }
    await this.personaRepo.activar(id, config.ESTADO.ACTIVO, usuarioModificador);
    const actualizada = await this.personaRepo.buscarPorId(id);
    return this._mapear(actualizada);
  }

  async cargaMasiva(personas, usuarioRegistrador) {
    const exitosos = [];
    const errores = [];

    for (let i = 0; i < personas.length; i++) {
      try {
        const personaData = personas[i];
        const dto = new PersonaDTO(personaData);
        const resultado = await this.registrar(dto, usuarioRegistrador);
        exitosos.push({ indice: i, cod_persona: resultado.datos.cod_persona });
      } catch (error) {
        errores.push({ indice: i, mensaje: error.message });
      }
    }

    return {
      total_enviados: personas.length,
      total_exitosos: exitosos.length,
      total_fallidos: errores.length,
      detalle_errores: errores,
    };
  }

  _generarCodPersona(dto) {
    const doc = dto.documento_identidad.trim();
    const inicialNombres = dto.nombres.charAt(0).toUpperCase();
    const inicialApellido1 = dto.primer_apellido.charAt(0).toUpperCase();
    const inicialApellido2 = dto.segundo_apellido ? dto.segundo_apellido.charAt(0).toUpperCase() : '';
    const iniciales = inicialNombres + inicialApellido1 + inicialApellido2;

    return `${doc}-${dto.cod_com} ${iniciales}`;
  }
}