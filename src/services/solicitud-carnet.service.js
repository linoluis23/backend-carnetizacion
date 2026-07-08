import { SolicitudCarnetRepository } from '../repositories/solicitud-carnet.repository.js';
import { PersonaRepository } from '../repositories/persona.repository.js';
import { ProgramacionRepository } from '../repositories/programacion.repository.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';
import { ComunidadRepository } from '../repositories/comunidad.repository.js';
import { RegionalRepository } from '../repositories/regional.repository.js';

export class SolicitudCarnetService {
  constructor() {
  this.solicitudRepo = new SolicitudCarnetRepository();
  this.personaRepo = new PersonaRepository();
  this.comunidadRepo = new ComunidadRepository();
  this.regionalRepo = new RegionalRepository();
  this.programacionRepo = new ProgramacionRepository();
  }

_mapear(solicitud) {
  return {
    id: solicitud.id,
    persona_id: solicitud.persona_id,
    programacion_id: solicitud.programacion_id,
    aval_comunidad: solicitud.aval_comunidad,
    aval_regional: solicitud.aval_regional,
    aval_otros: solicitud.aval_otros,
    foto: solicitud.foto,
    fecha_vigencia: solicitud.fecha_vigencia,
    estado_solicitud: solicitud.estado_solicitud,
    fecha_solicitud: solicitud.fecha_solicitud,
    observaciones: solicitud.observaciones,
    usuario_registro: solicitud.usuario_registro,
    fecha_creacion: solicitud.fecha_creacion,
    usuario_ultima_modificacion: solicitud.usuario_ultima_modificacion,
    fecha_ultima_actualizacion: solicitud.fecha_ultima_actualizacion,
    // Datos de la persona
    nombres: solicitud.nombres,
    primer_apellido: solicitud.primer_apellido,
    segundo_apellido: solicitud.segundo_apellido,
    documento_identidad: solicitud.documento_identidad,
    // Datos de la programación
    prog_fecha_inicio: solicitud.prog_fecha_inicio,
    prog_fecha_fin: solicitud.prog_fecha_fin,
    // Datos geográficos
    comunidad_descripcion: solicitud.comunidad_descripcion || '',
    cod_com: solicitud.cod_com || null,
    regional_descripcion: solicitud.regional_descripcion || '',
    cod_reg: solicitud.cod_reg || null,
    provincia_descripcion: solicitud.provincia_descripcion || '',
    cod_prov: solicitud.cod_prov || null,
    departamento_descripcion: solicitud.departamento_descripcion || '',
    cod_dep: solicitud.cod_dep || null,
        pdf_carnet: solicitud.pdf_carnet,   // ← AÑADIR ESTA LÍNEA

  };
}

  async listar(filtros = {}) {
    const solicitudes = await this.solicitudRepo.listar(filtros);
    return solicitudes.map(s => this._mapear(s));
  }

  async obtenerPorId(id) {
    const solicitud = await this.solicitudRepo.buscarPorId(id);
    if (!solicitud) throw new AppError('Solicitud no encontrada.', 404);
    return this._mapear(solicitud);
  }


  async crear(dto, usuarioRegistrador) {
  // 1. Validar persona
  const persona = await this.personaRepo.buscarPorId(dto.persona_id);
  if (!persona) throw new AppError('Persona no encontrada.', 404);
  if (persona.estado !== 'ACT') throw new AppError('La persona no está activa.', 400);

  // 2. Verificar que no tenga otra solicitud en curso (PEN o APR)
  const solicitudExistente = await this.solicitudRepo.buscarActivaPorPersona(dto.persona_id);
  if (solicitudExistente) {
    throw new AppError('La persona ya tiene una solicitud de carnet en curso.', 409);
  }

  // 3. Obtener la comunidad de la persona
  const comunidad = await this.comunidadRepo.buscarPorCodigo(persona.cod_com);
  if (!comunidad) throw new AppError('No se encontró la comunidad de la persona.', 404);

  // 4. Obtener la regional de la comunidad
  const regional = await this.regionalRepo.buscarPorCodigo(comunidad.cod_reg);
  if (!regional) throw new AppError('No se encontró la regional asociada.', 404);

  // 5. Buscar programación activa para esa regional
  const programaciones = await this.programacionRepo.listar({
    cod_reg: regional.cod_reg,
    estado: 'ACT',
  });
  const programacionActiva = programaciones.length > 0 ? programaciones[0] : null;
  if (!programacionActiva) {
    throw new AppError(`No existe programación activa para la regional ${regional.descripcion}.`, 400);
  }


const ahora = new Date();
const fechaInicioProg = new Date(programacionActiva.fecha_inicio);
const fechaFinProg = new Date(programacionActiva.fecha_fin);

if (ahora < fechaInicioProg || ahora > fechaFinProg) {
  throw new AppError(
    `La programación para la regional ${regional.descripcion} no está vigente en este momento. ` +
    `Vigencia: ${fechaInicioProg.toLocaleDateString('es-BO')} al ${fechaFinProg.toLocaleDateString('es-BO')}.`,
    400
  );}


  // 6. Validación extra (opcional pero recomendada): la regional de la programación debe coincidir
  if (programacionActiva.cod_reg !== regional.cod_reg) {
    throw new AppError(`La persona no pertenece a la regional ${regional.descripcion}.`, 400);
  }

  // 7. Asignar fecha de vigencia por defecto si no se envió
  const fechaVigencia = dto.fecha_vigencia || config.FECHA_VIGENCIA_DEFAULT;

  // 8. Crear la solicitud
  const nueva = await this.solicitudRepo.crear({
    persona_id: dto.persona_id,
    programacion_id: programacionActiva.id,
    aval_comunidad: dto.aval_comunidad,
    aval_regional: dto.aval_regional,
    aval_otros: dto.aval_otros,
    foto: dto.foto,
    fecha_vigencia: fechaVigencia,
    estado_solicitud: config.ESTADOS_SOLICITUD.PENDIENTE,
    usuario_registro: usuarioRegistrador,
    observaciones: dto.observaciones,
  });

  return { mensaje: 'Solicitud creada exitosamente.', datos: this._mapear(nueva) };
}

  async actualizar(id, dto, usuarioModificador) {
    const solicitud = await this.solicitudRepo.buscarPorId(id);
    if (!solicitud) throw new AppError('Solicitud no encontrada.', 404);

    // Solo permitir actualizar ciertos campos si la solicitud no está emitida o rechazada
    if (['EMI', 'REC'].includes(solicitud.estado_solicitud)) {
      throw new AppError('No se puede modificar una solicitud que ya fue emitida o rechazada.', 400);
    }

    const campos = {};
    if (dto.programacion_id !== undefined) campos.programacion_id = dto.programacion_id;
    if (dto.aval1 !== undefined) campos.aval1 = dto.aval1 ? 1 : 0;
    if (dto.aval2 !== undefined) campos.aval2 = dto.aval2 ? 1 : 0;
    if (dto.aval3 !== undefined) campos.aval3 = dto.aval3 ? 1 : 0;
    if (dto.foto !== undefined) campos.foto = dto.foto;
    if (dto.fecha_vigencia !== undefined) campos.fecha_vigencia = dto.fecha_vigencia || config.FECHA_VIGENCIA_DEFAULT;
    if (dto.observaciones !== undefined) campos.observaciones = dto.observaciones;
    campos.usuario_ultima_modificacion = usuarioModificador;

    await this.solicitudRepo.actualizar(id, campos);
    const actualizada = await this.solicitudRepo.buscarPorId(id);
    return { mensaje: 'Solicitud actualizada.', datos: this._mapear(actualizada) };
  }

  async cambiarEstado(id, nuevoEstado, usuarioModificador) {
    const solicitud = await this.solicitudRepo.buscarPorId(id);
    if (!solicitud) throw new AppError('Solicitud no encontrada.', 404);
    if (solicitud.estado_solicitud === nuevoEstado) throw new AppError('La solicitud ya tiene ese estado.', 400);

    await this.solicitudRepo.actualizarEstado(id, nuevoEstado, usuarioModificador);
    const actualizada = await this.solicitudRepo.buscarPorId(id);
    return { mensaje: 'Estado actualizado.', datos: this._mapear(actualizada) };
  }

  // En src/services/solicitud-carnet.service.js
async firmaMasiva(solicitudesIds, tipoFirma, usuarioId) {
  const exitos = [];
  const errores = [];

  for (const solicitudId of solicitudesIds) {
    try {
      // Reutilizamos la lógica del método firmar del FirmaSolicitudService
      // Podemos instanciarlo aquí o mover la lógica a un helper
      const resultado = await this.firmaService.firmar(solicitudId, usuarioId, tipoFirma);
      exitos.push({ solicitudId, mensaje: resultado.mensaje });
    } catch (error) {
      errores.push({ solicitudId, mensaje: error.message });
    }
  }

  return {
    mensaje: `Firma masiva completada. Éxitos: ${exitos.length}, Errores: ${errores.length}.`,
    detalle: { exitos, errores },
  };
}

async emitirCarnet(id, usuarioModificador) {
  // Buscar la solicitud
  const solicitud = await this.solicitudRepo.buscarPorId(id);
  if (!solicitud) throw new AppError('Solicitud no encontrada.', 404);

  // Verificar que esté aprobada
  if (solicitud.estado_solicitud !== 'APR') {
    throw new AppError('Solo se pueden emitir carnets de solicitudes aprobadas.', 400);
  }

  // Cambiar estado a EMITIDO
  await this.solicitudRepo.actualizarEstado(id, config.ESTADOS_SOLICITUD.EMITIDO, usuarioModificador);

  // Obtener los datos de la persona
  const persona = await this.personaRepo.buscarPorId(solicitud.persona_id);
  if (!persona) throw new AppError('Persona no encontrada.', 404);

  // Construir el objeto carnet para el frontend
  const carnet = {
    id: solicitud.id,
    nombres: persona.nombres,
    primer_apellido: persona.primer_apellido,
    segundo_apellido: persona.segundo_apellido,
    documento_identidad: persona.documento_identidad,
    cod_socio: persona.cod_socio,
    cod_persona: persona.cod_persona,
    foto: solicitud.foto,
    fecha_vigencia: solicitud.fecha_vigencia,
    fecha_emision: new Date().toISOString(),
    comunidad_descripcion: persona.comunidad_descripcion,
    regional_descripcion: persona.regional_descripcion,
  };

  return {
    mensaje: 'Carnet emitido exitosamente.',
    datos: carnet,
  };
}

async guardarPDF(id, pdfBase64, usuarioModificador) {
  const solicitud = await this.solicitudRepo.buscarPorId(id);
  if (!solicitud) throw new AppError('Solicitud no encontrada.', 404);

  await this.solicitudRepo.actualizar(id, {
    pdf_carnet: pdfBase64,
    usuario_ultima_modificacion: usuarioModificador,
  });

  return { mensaje: 'PDF del carnet almacenado correctamente.' };
}
}