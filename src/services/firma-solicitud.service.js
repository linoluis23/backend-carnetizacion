import { FirmaSolicitudRepository } from '../repositories/firma-solicitud.repository.js';
import { SolicitudCarnetRepository } from '../repositories/solicitud-carnet.repository.js';
import { AutoridadRepository } from '../repositories/autoridad.repository.js';
import { CargoRepository } from '../repositories/cargo.repository.js';
import { PersonaRepository } from '../repositories/persona.repository.js';
import { ComunidadRepository } from '../repositories/comunidad.repository.js';
import { RegionalRepository } from '../repositories/regional.repository.js';
import { ProvinciaRepository } from '../repositories/provincia.repository.js';
import { CertificadoService } from './certificado.service.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';

export class FirmaSolicitudService {
  constructor() {
    this.firmaRepo = new FirmaSolicitudRepository();
    this.solicitudRepo = new SolicitudCarnetRepository();
    this.autoridadRepo = new AutoridadRepository();
    this.cargoRepo = new CargoRepository();
    this.personaRepo = new PersonaRepository();
    this.comunidadRepo = new ComunidadRepository();
    this.regionalRepo = new RegionalRepository();
    this.provinciaRepo = new ProvinciaRepository();
    this.certificadoService = new CertificadoService();
  }

  async firmar(solicitudId, usuarioId, tipoFirma) {
    // 1. Validar solicitud
    const solicitud = await this.solicitudRepo.buscarPorId(solicitudId);
    if (!solicitud) throw new AppError('Solicitud no encontrada.', 404);
    if (solicitud.estado_solicitud !== config.ESTADOS_SOLICITUD.PENDIENTE) {
      throw new AppError('Solo se pueden firmar solicitudes en estado pendiente.', 400);
    }

    // 2. Obtener la persona asociada
    const persona = await this.personaRepo.buscarPorId(solicitud.persona_id);
    if (!persona) throw new AppError('Persona no encontrada.', 404);

    // 3. Determinar el código geográfico correspondiente al tipo de firma
    let codigoAmbito;
    let nivelCargo;
    if (tipoFirma === 'COMUNAL') {
      codigoAmbito = persona.cod_com;
      nivelCargo = 'COMUNAL';
    } else if (tipoFirma === 'REGIONAL') {
      const comunidad = await this.comunidadRepo.buscarPorCodigo(persona.cod_com);
      if (!comunidad) throw new AppError('No se encontró la comunidad de la persona.', 404);
      const regional = await this.regionalRepo.buscarPorCodigo(comunidad.cod_reg);
      if (!regional) throw new AppError('No se encontró la regional de la persona.', 404);
      codigoAmbito = regional.cod_reg;
      nivelCargo = 'REGIONAL';
    } else if (tipoFirma === 'DEPARTAMENTAL') {
      const comunidad = await this.comunidadRepo.buscarPorCodigo(persona.cod_com);
      if (!comunidad) throw new AppError('Comunidad no encontrada.', 404);
      const regional = await this.regionalRepo.buscarPorCodigo(comunidad.cod_reg);
      if (!regional) throw new AppError('Regional no encontrada.', 404);
      const provincia = await this.provinciaRepo.buscarPorCodigo(regional.cod_prov);
      if (!provincia) throw new AppError('Provincia no encontrada.', 404);
      codigoAmbito = provincia.cod_dep;
      nivelCargo = 'DEPARTAMENTAL';
    } else {
      throw new AppError('Tipo de firma no válido.', 400);
    }

    // 4. Buscar la autoridad activa del cargo correspondiente en ese ámbito
    const cargo = await this.cargoRepo.buscarPorCodigo(
      nivelCargo === 'COMUNAL' ? 'PRE_COM' : nivelCargo === 'REGIONAL' ? 'PRE_REG' : 'PRE_DEP'
    );
    if (!cargo) throw new AppError('Cargo no encontrado.', 404);

    const ambito = {};
    if (tipoFirma === 'COMUNAL') ambito.cod_com = codigoAmbito;
    else if (tipoFirma === 'REGIONAL') ambito.cod_reg = codigoAmbito;
    else if (tipoFirma === 'DEPARTAMENTAL') ambito.cod_dep = codigoAmbito;

    const autoridadActiva = await this.autoridadRepo.buscarActivaPorCargoYAmbito(cargo.id, ambito);
    if (!autoridadActiva) {
      throw new AppError(`No existe autoridad ${nivelCargo} activa para este ámbito.`, 400);
    }

    // 5. Verificar que el usuario que firma corresponda a la persona de esa autoridad
    const personaAutoridad = await this.personaRepo.buscarPorId(autoridadActiva.persona_id);
    if (!personaAutoridad) throw new AppError('Persona de la autoridad no encontrada.', 404);
    const usuarioAutoridad = await this.personaRepo.buscarUsuarioPorDocumento(personaAutoridad.documento_identidad); // Asumimos que PersonaRepository tiene ese método o lo inyectamos
    if (!usuarioAutoridad || usuarioAutoridad.id !== usuarioId) {
      throw new AppError('Usted no es la autoridad competente para firmar en este nivel.', 403);
    }

    // 6. Verificar que no exista ya una firma de este tipo para esta solicitud
    const firmasExistentes = await this.firmaRepo.contarFirmas(solicitudId);
    if (firmasExistentes.includes(tipoFirma)) {
      throw new AppError(`La solicitud ya tiene la firma ${tipoFirma}.`, 409);
    }

    // 7. Generar firma digital usando el certificado activo de la autoridad
    let firmaDigital = null;
    try {
      const clavePrivada = await this.certificadoService.obtenerClavePrivadaActiva(autoridadActiva.id);
      const sign = crypto.createSign('SHA256');
      sign.update(JSON.stringify({ solicitudId, tipoFirma, fecha: new Date().toISOString() }));
      firmaDigital = sign.sign(clavePrivada, 'hex');
    } catch (error) {
      // Si no hay certificado, se permite firmar sin firma digital (solo registro)
      console.warn(`No se pudo generar firma digital para autoridad ${autoridadActiva.id}: ${error.message}`);
    }

    // 8. Registrar la firma
    await this.firmaRepo.crearFirma(solicitudId, usuarioId, tipoFirma, firmaDigital);

    // 9. Verificar si ya están las tres firmas; si es así, aprobar la solicitud
    const firmasActuales = await this.firmaRepo.contarFirmas(solicitudId);
    if (firmasActuales.includes('COMUNAL') && firmasActuales.includes('REGIONAL') && firmasActuales.includes('DEPARTAMENTAL')) {
      await this.solicitudRepo.actualizarEstado(solicitudId, config.ESTADOS_SOLICITUD.APROBADO, usuarioId);
      return { mensaje: 'Firma registrada. La solicitud ha sido aprobada automáticamente.' };
    }

    return { mensaje: 'Firma registrada exitosamente.' };
  }

    async firmaMasiva(solicitudesIds, usuarioId, tipoFirma) {
    const exitos = [];
    const errores = [];

    for (const solicitudId of solicitudesIds) {
      try {
        // Reutiliza la lógica de firma individual (o llamar directamente al método firmar)
        // Podemos invocar un método interno que devuelva resultado o lanzar error
        await this.firmar(solicitudId, usuarioId, tipoFirma); // asume que firmar lanza excepción si falla
        exitos.push(solicitudId);
      } catch (error) {
        errores.push({ solicitud_id: solicitudId, mensaje: error.message });
      }
    }

    return {
      procesados: solicitudesIds.length,
      exitos: exitos.length,
      errores,
    };
  }

}