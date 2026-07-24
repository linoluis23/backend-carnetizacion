import { SolicitudCarnetRepository } from '../repositories/solicitud-carnet.repository.js';
import { PersonaRepository } from '../repositories/persona.repository.js';
import { ProgramacionRepository } from '../repositories/programacion.repository.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';
import { ComunidadRepository } from '../repositories/comunidad.repository.js';
import { RegionalRepository } from '../repositories/regional.repository.js';
import { ProvinciaRepository } from '../repositories/provincia.repository.js'; // ← IMPORTAR
import { generarPDFCarnet } from './carnet-pdf.service.js';
import { AutoridadRepository } from '../repositories/autoridad.repository.js';
import { FirmaSolicitudService } from './firma-solicitud.service.js';

export class SolicitudCarnetService {
  constructor() {
    this.solicitudRepo = new SolicitudCarnetRepository();
    this.personaRepo = new PersonaRepository();
    this.comunidadRepo = new ComunidadRepository();
    this.regionalRepo = new RegionalRepository();
        this.provinciaRepo = new ProvinciaRepository(); // ← INSTANCIAR
    this.autoridadRepo = new AutoridadRepository(); 
    this.programacionRepo = new ProgramacionRepository();
  }

  _mapear(solicitud) {
    return {
      id: solicitud.id,
      persona_id: solicitud.persona_id,
      programacion_id: solicitud.programacion_id,
      aval_comunidad: Boolean(solicitud.aval_comunidad),
      aval_regional: Boolean(solicitud.aval_regional),
      aval_otros: Boolean(solicitud.aval_otros),
      foto: solicitud.foto,
      fecha_vigencia: solicitud.fecha_vigencia,
      estado_solicitud: solicitud.estado_solicitud,
      fecha_solicitud: solicitud.fecha_solicitud,
      observaciones: solicitud.observaciones,
      usuario_registro: solicitud.usuario_registro,
      fecha_creacion: solicitud.fecha_creacion,
      usuario_ultima_modificacion: solicitud.usuario_ultima_modificacion,
      fecha_ultima_actualizacion: solicitud.fecha_ultima_actualizacion,
      // Nuevos campos de firma
      firma_comunal_id: solicitud.firma_comunal_id,
      firma_comunal_fecha: solicitud.firma_comunal_fecha,
      firma_comunal_hash: solicitud.firma_comunal_hash,
      firma_regional_id: solicitud.firma_regional_id,
      firma_regional_fecha: solicitud.firma_regional_fecha,
      firma_regional_hash: solicitud.firma_regional_hash,
      firma_departamental_id: solicitud.firma_departamental_id,
      firma_departamental_fecha: solicitud.firma_departamental_fecha,
      firma_departamental_hash: solicitud.firma_departamental_hash,
      documento_firma: solicitud.documento_firma,
      pdf_carnet: solicitud.pdf_carnet,
      // Datos de la persona
      nombres: solicitud.nombres,
      primer_apellido: solicitud.primer_apellido,
      segundo_apellido: solicitud.segundo_apellido,
      documento_identidad: solicitud.documento_identidad,
      cod_socio: solicitud.cod_socio,
      cod_persona: solicitud.cod_persona,
      prog_fecha_inicio: solicitud.prog_fecha_inicio,
      prog_fecha_fin: solicitud.prog_fecha_fin,
      comunidad_descripcion: solicitud.comunidad_descripcion || '',
      cod_com: solicitud.cod_com || null,
      regional_descripcion: solicitud.regional_descripcion || '',
      cod_reg: solicitud.cod_reg || null,
      provincia_descripcion: solicitud.provincia_descripcion || '',
      cod_prov: solicitud.cod_prov || null,
      departamento_descripcion: solicitud.departamento_descripcion || '',
      cod_dep: solicitud.cod_dep || null,
    };
  }

   async listar(filtros = {}, usuario = null) {
  const solicitudes = await this.solicitudRepo.listar(filtros, usuario);
  return solicitudes.map(s => this._mapear(s));
}


  async obtenerPorId(id) {
    const solicitud = await this.solicitudRepo.buscarPorId(id);
    if (!solicitud) throw new AppError('Solicitud no encontrada.', 404);
    return this._mapear(solicitud);
  }

  // src/services/solicitud-carnet.service.js

async crear(dto, usuarioRegistrador) {
  // 1. Validar persona
  console.log('🔍 [crear] Iniciando creación de solicitud...');

  const persona = await this.personaRepo.buscarPorId(dto.persona_id);
  if (!persona) throw new AppError('Persona no encontrada.', 404);
  if (persona.estado !== 'ACT') throw new AppError('La persona no está activa.', 400);

  // 2. Verificar que no tenga otra solicitud en curso
  const solicitudExistente = await this.solicitudRepo.buscarActivaPorPersona(dto.persona_id);
  if (solicitudExistente) {
    throw new AppError('La persona ya tiene una solicitud de carnet en curso.', 409);
  }

  // 3. Obtener comunidad y regional
  const comunidad = await this.comunidadRepo.buscarPorCodigo(persona.cod_com);
  if (!comunidad) throw new AppError('No se encontró la comunidad de la persona.', 404);
  const regional = await this.regionalRepo.buscarPorCodigo(comunidad.cod_reg);
  if (!regional) throw new AppError('No se encontró la regional asociada.', 404);

  // 4. Buscar programación activa
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
    );
  }

  // 5. Asignar fecha de vigencia por defecto
  const fechaVigencia = dto.fecha_vigencia || config.FECHA_VIGENCIA_DEFAULT;

  // 6. Crear la solicitud
  const nueva = await this.solicitudRepo.crear({
    persona_id: dto.persona_id,
    programacion_id: programacionActiva.id,
    aval_comunidad: dto.aval_comunidad || false,
    aval_regional: dto.aval_regional || false,
    aval_otros: dto.aval_otros || false,
    foto: dto.foto || null,
    fecha_vigencia: fechaVigencia,
    estado_solicitud: config.ESTADOS_SOLICITUD.PENDIENTE,
    usuario_registro: usuarioRegistrador,
    observaciones: dto.observaciones || null,
  });
  console.log('✅ [crear] Solicitud creada con ID:', nueva.id);

  // 7. Generar documento de firma ✅ CORREGIDO
  console.log('🔍 [crear] Generando documento de firma...');
  const firmaService = new FirmaSolicitudService();
  const xmlGenerado = await firmaService.generarDocumentoFirma(nueva.id);
  console.log('✅ [crear] XML generado, longitud:', xmlGenerado.length);
  console.log('📄 [crear] Primeros 300 caracteres del XML:');
  console.log(xmlGenerado.substring(0, 300));

  return { mensaje: 'Solicitud creada exitosamente.', datos: this._mapear(nueva) };
}

 // src/services/solicitud-carnet.service.js

async actualizar(id, dto, usuarioModificador) {
  const solicitud = await this.solicitudRepo.buscarPorId(id);
  if (!solicitud) throw new AppError('Solicitud no encontrada.', 404);

  // No permitir modificar si ya tiene firmas o está en estado avanzado
  if (solicitud.firma_comunal_id || solicitud.firma_regional_id || solicitud.firma_departamental_id) {
    throw new AppError('No se puede modificar una solicitud que ya está en proceso de firma.', 400);
  }
  if (['APR', 'EMI'].includes(solicitud.estado_solicitud)) {
    throw new AppError('No se puede modificar una solicitud aprobada o emitida.', 400);
  }

  const campos = {};
  if (dto.programacion_id !== undefined) campos.programacion_id = dto.programacion_id;
  if (dto.aval_comunidad !== undefined) campos.aval_comunidad = dto.aval_comunidad ? 1 : 0;
  if (dto.aval_regional !== undefined) campos.aval_regional = dto.aval_regional ? 1 : 0;
  if (dto.aval_otros !== undefined) campos.aval_otros = dto.aval_otros ? 1 : 0;
  
  // ✅ Solo actualizar foto si se proporciona una nueva
  if (dto.foto !== undefined && dto.foto !== null) {
    campos.foto = dto.foto;
  }

  if (dto.fecha_vigencia !== undefined) {
    campos.fecha_vigencia = dto.fecha_vigencia || config.FECHA_VIGENCIA_DEFAULT;
  }
  if (dto.observaciones !== undefined) campos.observaciones = dto.observaciones;
  campos.usuario_ultima_modificacion = usuarioModificador;

  // ✅ Actualizar y obtener la solicitud actualizada
  await this.solicitudRepo.actualizar(id, campos);
  const actualizada = await this.solicitudRepo.buscarPorId(id);

  // ✅ Retornar objeto con mensaje y datos
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

  async emitirCarnet(id, usuarioModificador) {
  try {
    console.log('🔍 [emitirCarnet] Iniciando para solicitud:', id);
    const solicitud = await this.solicitudRepo.buscarPorId(id);
    if (!solicitud) throw new AppError('Solicitud no encontrada.', 404);
    if (solicitud.estado_solicitud !== config.ESTADOS_SOLICITUD.APROBADO) {
      throw new AppError('Solo se pueden emitir carnets de solicitudes aprobadas.', 400);
    }

    await this.solicitudRepo.actualizarEstado(id, config.ESTADOS_SOLICITUD.EMITIDO, usuarioModificador);

    const persona = await this.personaRepo.buscarPorId(solicitud.persona_id);
    if (!persona) throw new AppError('Persona no encontrada.', 404);
    console.log('✅ Persona encontrada, cod_com:', persona.cod_com);

    // Obtener provincia
    let provinciaDescripcion = '';
    if (persona.cod_com) {
      const comunidad = await this.comunidadRepo.buscarPorCodigo(persona.cod_com);
      console.log('✅ Comunidad encontrada:', comunidad?.cod_reg);
      if (comunidad?.cod_reg) {
        const regional = await this.regionalRepo.buscarPorCodigo(comunidad.cod_reg);
        console.log('✅ Regional encontrada:', regional?.cod_prov);
        if (regional?.cod_prov) {
          const provincia = await this.provinciaRepo.buscarPorCodigo(regional.cod_prov);
          provinciaDescripcion = provincia?.descripcion || '';
          console.log('✅ Provincia encontrada:', provinciaDescripcion);
        }
      }
    }

    const fechaNacimiento = persona.fecha_nacimiento
      ? new Date(persona.fecha_nacimiento).toLocaleDateString('es-BO')
      : '';

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
      comunidad_descripcion: solicitud.comunidad_descripcion || '',
      regional_descripcion: solicitud.regional_descripcion || '',
      provincia_descripcion: provinciaDescripcion,
      fecha_nacimiento: fechaNacimiento,
    };
 // ✅ Generar PDF y guardarlo en base64
    const pdfBase64 = await generarPDFCarnet(carnet);
    await this.solicitudRepo.actualizar(id, {
      pdf_carnet: pdfBase64,
      usuario_ultima_modificacion: usuarioModificador,
    });
    const solicitudActualizada = await this.solicitudRepo.buscarPorId(id);

    console.log('✅ Carnet generado:', carnet);
    return { mensaje: 'Carnet emitido exitosamente.', datos: {
        ...carnet,
        pdf_carnet: pdfBase64, // ← para descarga inmediata
      },};
  } catch (error) {
    console.error('❌ Error en emitirCarnet:', error);
    throw error;
  }
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