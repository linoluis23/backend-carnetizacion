import forge from 'node-forge';
import crypto from 'crypto';
import { SolicitudCarnetRepository } from '../repositories/solicitud-carnet.repository.js';
import { AutoridadRepository } from '../repositories/autoridad.repository.js';
import { PersonaRepository } from '../repositories/persona.repository.js';
import { ComunidadRepository } from '../repositories/comunidad.repository.js';
import { RegionalRepository } from '../repositories/regional.repository.js';
import { ProvinciaRepository } from '../repositories/provincia.repository.js';
import { DepartamentoRepository } from '../repositories/departamento.repository.js';
import { CertificadoRepository } from '../repositories/certificado.repository.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';

export class FirmaSolicitudService {
  constructor() {
    this.solicitudRepo = new SolicitudCarnetRepository();
    this.autoridadRepo = new AutoridadRepository();
    this.personaRepo = new PersonaRepository();
    this.comunidadRepo = new ComunidadRepository();
    this.regionalRepo = new RegionalRepository();
    this.provinciaRepo = new ProvinciaRepository();
    this.departamentoRepo = new DepartamentoRepository();
    this.certificadoRepo = new CertificadoRepository();
  }

  // ============================================================
  // GENERAR DOCUMENTO FIRMA
  // ============================================================
async generarDocumentoFirma(solicitudId) {
    console.log('🔍 [generarDocumentoFirma] Iniciando para solicitud:', solicitudId);

    const solicitud = await this.solicitudRepo.buscarPorId(solicitudId);
    if (!solicitud) throw new AppError('Solicitud no encontrada', 404);
    console.log('✅ Solicitud encontrada, persona_id:', solicitud.persona_id);

    const persona = await this.personaRepo.buscarPorId(solicitud.persona_id);
    if (!persona) throw new AppError('Persona no encontrada', 404);
    console.log('✅ Persona encontrada, cod_com:', persona.cod_com);

    // Obtener jerarquía geográfica
    let comunidad = null, regional = null, provincia = null, departamento = null;
    if (persona.cod_com) {
      comunidad = await this.comunidadRepo.buscarPorCodigo(persona.cod_com);
    }
    if (comunidad?.cod_reg) {
      regional = await this.regionalRepo.buscarPorCodigo(comunidad.cod_reg);
    }
    if (regional?.cod_prov) {
      provincia = await this.provinciaRepo.buscarPorCodigo(regional.cod_prov);
    }
    if (provincia?.cod_dep) {
      departamento = await this.departamentoRepo.buscarPorCodigo(provincia.cod_dep);
    }

    console.log('📍 Jerarquía geográfica obtenida:');
    console.log('  Departamento:', departamento?.descripcion || 'No encontrado');
    console.log('  Provincia:', provincia?.descripcion || 'No encontrada');
    console.log('  Regional:', regional?.descripcion || 'No encontrada');
    console.log('  Comunidad:', comunidad?.descripcion || 'No encontrada');

    const fechaISO = solicitud.fecha_solicitud instanceof Date
      ? solicitud.fecha_solicitud.toISOString()
      : new Date(solicitud.fecha_solicitud).toISOString();

    let fechaVigenciaISO = solicitud.fecha_vigencia;
    if (fechaVigenciaISO) {
      const fecha = new Date(fechaVigenciaISO);
      if (!isNaN(fecha.getTime())) {
        fechaVigenciaISO = fecha.toISOString().split('T')[0];
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DocumentoFirma>
  <Solicitud id="${solicitud.id}" fecha="${fechaISO}">
    <Persona>
      <Codigo>${persona.cod_persona || ''}</Codigo>
      <cod_socio>${persona.cod_socio || ''}</cod_socio>
      <Nombre>${persona.nombres || ''}</Nombre>
      <ApellidoPaterno>${persona.primer_apellido || ''}</ApellidoPaterno>
      <ApellidoMaterno>${persona.segundo_apellido || ''}</ApellidoMaterno>
      <Documento>${persona.documento_identidad || ''}</Documento>
      <cod_departamento>${departamento?.cod_dep || ''}</cod_departamento>
      <Departamento>${departamento?.descripcion || ''}</Departamento>
      <cod_provincia>${provincia?.cod_prov || ''}</cod_provincia>
      <Provincia>${provincia?.descripcion || ''}</Provincia>
      <cod_regional>${regional?.cod_reg || ''}</cod_regional>
      <Regional>${regional?.descripcion || ''}</Regional>
      <cod_comunidad>${comunidad?.cod_com || ''}</cod_comunidad>
      <Comunidad>${comunidad?.descripcion || ''}</Comunidad>
    </Persona>
    <Programacion id="${solicitud.programacion_id || ''}" />
    <FechaVigencia>${fechaVigenciaISO || ''}</FechaVigencia>
    <Avales>
      <Comunidad>${solicitud.aval_comunidad ? 'SI' : 'NO'}</Comunidad>
      <Regional>${solicitud.aval_regional ? 'SI' : 'NO'}</Regional>
      <Departamental>${solicitud.aval_otros ? 'SI' : 'NO'}</Departamental>
    </Avales>
  </Solicitud>
</DocumentoFirma>`;

    // Normalizar saltos de línea a \n
    const xmlNormalizado = xml.replace(/\r\n/g, '\n');
    console.log('📄 XML generado (normalizado), longitud:', xmlNormalizado.length);
    console.log('📄 SHA-256 del XML normalizado:', this._calcularSHA256(xmlNormalizado));

    await this.solicitudRepo.actualizar(solicitudId, { documento_firma: xmlNormalizado });
    console.log('✅ XML guardado en la base de datos');

    return xmlNormalizado;
  }

  // ============================================================
  // VALIDACIÓN DE ÁMBITO GEOGRÁFICO
  // ============================================================
  async _validarAmbitoAutoridad(autoridad, persona, mapping) {
    // 1. Validar que los objetos tengan las propiedades necesarias
    if (!autoridad || !autoridad.cargo_nivel) {
      throw new AppError('Autoridad inválida o sin nivel de cargo', 500);
    }
    if (!persona || !persona.cod_com) {
      throw new AppError('Persona no tiene comunidad asociada', 400);
    }

    // 2. Obtener jerarquía geográfica de la persona
    const comunidadPersona = await this.comunidadRepo.buscarPorCodigo(persona.cod_com);
    if (!comunidadPersona) {
      throw new AppError('La persona no tiene comunidad asociada', 400);
    }

    const regionalPersona = await this.regionalRepo.buscarPorCodigo(comunidadPersona.cod_reg);
    if (!regionalPersona) {
      throw new AppError('La comunidad no tiene regional asociada', 400);
    }

    const provinciaPersona = await this.provinciaRepo.buscarPorCodigo(regionalPersona.cod_prov);
    if (!provinciaPersona) {
      throw new AppError('La regional no tiene provincia asociada', 400);
    }

    const departamentoPersona = await this.departamentoRepo.buscarPorCodigo(provinciaPersona.cod_dep);
    if (!departamentoPersona) {
      throw new AppError('La provincia no tiene departamento asociado', 400);
    }

    // 3. Validar según el nivel de la autoridad
    const cargoEsperado = mapping.cargo_esperado;
    console.log(`🔍 Validando ámbito para ${cargoEsperado}: autoridad.cod_com=${autoridad.cod_com}, persona.cod_com=${persona.cod_com}`);

    if (cargoEsperado === 'COMUNAL') {
      if (autoridad.cod_com !== persona.cod_com) {
        throw new AppError(
          `El Presidente Comunal solo puede firmar solicitudes de su comunidad (${autoridad.com_descripcion}). La persona pertenece a comunidad ${persona.comunidad_descripcion}.`,
          403
        );
      }
    } else if (cargoEsperado === 'REGIONAL') {
      if (autoridad.cod_reg !== comunidadPersona.cod_reg) {
        throw new AppError(
          `El Presidente Regional solo puede firmar solicitudes de su regional (${autoridad.reg_descripcion}). La persona pertenece a regional ${comunidadPersona.cod_reg}.`,
          403
        );
      }
    } else if (cargoEsperado === 'DEPARTAMENTAL') {
      // Opcional: si quieres limitar al departamento, descomenta:
      // if (autoridad.cod_dep !== departamentoPersona.cod_dep) {
      //   throw new AppError('El Presidente Departamental solo puede firmar solicitudes de su departamento', 403);
      // }
      // Por defecto, el departamental puede firmar todas
    } else {
      throw new AppError(`Nivel de cargo no reconocido: ${cargoEsperado}`, 500);
    }
  }

  // ============================================================
  // FIRMAR (con IndexedDB)
  // ============================================================
  async firmar(solicitudId, tipoFirma, autoridadId, firmaHash, usuarioModificador) {
    // 1. Validar solicitud
    const solicitud = await this.solicitudRepo.buscarPorId(solicitudId);
    if (!solicitud) throw new AppError('Solicitud no encontrada', 404);
    if (solicitud.estado_solicitud !== config.ESTADOS_SOLICITUD.PENDIENTE) {
      throw new AppError('La solicitud no está en estado pendiente', 400);
    }
    if (!solicitud.documento_firma) {
      throw new AppError('La solicitud no tiene documento para firmar', 400);
    }

    // 2. Validar autoridad
    const autoridad = await this.autoridadRepo.buscarPorId(autoridadId);
    if (!autoridad) throw new AppError('Autoridad no encontrada', 404);
    if (autoridad.estado !== 'ACT') throw new AppError('La autoridad no está activa', 400);

    // 3. Obtener certificado activo
    const certificado = await this.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
    if (!certificado) throw new AppError('La autoridad no tiene un certificado activo', 400);

    // 4. Mapear tipoFirma a campos
    const campoMap = {
      comunal: {
        id_field: 'firma_comunal_id',
        date_field: 'firma_comunal_fecha',
        hash_field: 'firma_comunal_hash',
        cargo_esperado: 'COMUNAL',
      },
      regional: {
        id_field: 'firma_regional_id',
        date_field: 'firma_regional_fecha',
        hash_field: 'firma_regional_hash',
        cargo_esperado: 'REGIONAL',
      },
      departamental: {
        id_field: 'firma_departamental_id',
        date_field: 'firma_departamental_fecha',
        hash_field: 'firma_departamental_hash',
        cargo_esperado: 'DEPARTAMENTAL',
      },
    };

    const mapping = campoMap[tipoFirma];
    if (!mapping) throw new AppError('Tipo de firma inválido', 400);

    // 5. Verificar cargo
    if (autoridad.cargo_nivel !== mapping.cargo_esperado) {
      throw new AppError(`La autoridad no tiene el cargo ${mapping.cargo_esperado}`, 403);
    }

    // 6. Validar ámbito geográfico
    const persona = await this.personaRepo.buscarPorId(solicitud.persona_id);
    if (!persona) throw new AppError('Persona no encontrada', 404);
    await this._validarAmbitoAutoridad(autoridad, persona, mapping);

    // 7. Verificar que no se haya firmado ya
    if (solicitud[mapping.id_field]) {
      throw new AppError(`La solicitud ya fue firmada por el nivel ${tipoFirma}`, 400);
    }

    // 8. Verificar firma digital
    if (!firmaHash) {
      throw new AppError('No se proporcionó la firma digital', 400);
    }
    const esValida = this._verificarFirma(firmaHash, solicitud.documento_firma, certificado.clave_publica);
    if (!esValida) {
      throw new AppError('La firma digital no es válida', 400);
    }

    // 9. Guardar firma
    const camposActualizar = {
      [mapping.id_field]: autoridadId,
      [mapping.date_field]: new Date(),
      [mapping.hash_field]: firmaHash,
      usuario_ultima_modificacion: usuarioModificador,
    };
    await this.solicitudRepo.actualizar(solicitudId, camposActualizar);

    // 10. Verificar si todas las firmas están completas
    const actualizada = await this.solicitudRepo.buscarPorId(solicitudId);
    const firmasCompletas = actualizada.firma_comunal_id &&
                            actualizada.firma_regional_id &&
                            actualizada.firma_departamental_id;

    if (firmasCompletas) {
      await this.solicitudRepo.actualizarEstado(solicitudId, config.ESTADOS_SOLICITUD.APROBADO, usuarioModificador);
    return { mensaje: 'Firma registrada. ¡Todas las firmas completas! Solicitud APROBADA.' };
}

    return { mensaje: `Firma ${tipoFirma} registrada exitosamente. Faltan firmas para completar.` };
  }








  // ============================================================
  // FIRMAR CON P12 (backend)
  // ============================================================
async firmarConP12(solicitudId, tipoFirma, autoridadId, p12Buffer, p12Password, usuarioModificador) {
    console.log('🔍 [firmarConP12] Iniciando firma con .p12 para solicitud:', solicitudId);

    // 1. Validar solicitud
    const solicitud = await this.solicitudRepo.buscarPorId(solicitudId);
    if (!solicitud) throw new AppError('Solicitud no encontrada', 404);
    if (solicitud.estado_solicitud !== config.ESTADOS_SOLICITUD.PENDIENTE) {
      throw new AppError('La solicitud no está en estado pendiente', 400);
    }
    if (!solicitud.documento_firma) {
      throw new AppError('La solicitud no tiene documento para firmar', 400);
    }
    console.log('📄 Documento a firmar (longitud):', solicitud.documento_firma.length);
    console.log('📄 SHA-256 del documento en BD:', this._calcularSHA256(solicitud.documento_firma));

    // 2. Validar autoridad
    const autoridad = await this.autoridadRepo.buscarPorId(autoridadId);
    if (!autoridad) throw new AppError('Autoridad no encontrada', 404);
    if (autoridad.estado !== 'ACT') throw new AppError('La autoridad no está activa', 400);
    console.log('✅ Autoridad encontrada, cargo_nivel:', autoridad.cargo_nivel);

    // 3. Obtener certificado activo
    const certificado = await this.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
    if (!certificado) throw new AppError('La autoridad no tiene un certificado activo', 400);
    console.log('✅ Certificado activo encontrado');

    // 4. Mapear tipo de firma
    const campoMap = {
      comunal: { id_field: 'firma_comunal_id', date_field: 'firma_comunal_fecha', hash_field: 'firma_comunal_hash', cargo_esperado: 'COMUNAL' },
      regional: { id_field: 'firma_regional_id', date_field: 'firma_regional_fecha', hash_field: 'firma_regional_hash', cargo_esperado: 'REGIONAL' },
      departamental: { id_field: 'firma_departamental_id', date_field: 'firma_departamental_fecha', hash_field: 'firma_departamental_hash', cargo_esperado: 'DEPARTAMENTAL' },
    };
    const mapping = campoMap[tipoFirma];
    if (!mapping) throw new AppError('Tipo de firma inválido', 400);

    // 5. Verificar cargo
    if (autoridad.cargo_nivel !== mapping.cargo_esperado) {
      throw new AppError(`La autoridad no tiene el cargo ${mapping.cargo_esperado}`, 403);
    }

    // 6. Validar ámbito geográfico
    const persona = await this.personaRepo.buscarPorId(solicitud.persona_id);
    if (!persona) throw new AppError('Persona no encontrada', 404);
    await this._validarAmbitoAutoridad(autoridad, persona, mapping);

    // 7. Verificar que no se haya firmado ya
    if (solicitud[mapping.id_field]) {
      throw new AppError(`La solicitud ya fue firmada por el nivel ${tipoFirma}`, 400);
    }

    // 8. Extraer clave privada del .p12
    let privateKeyPem;
    try {
      const p12Binary = p12Buffer.toString('binary');
      const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Binary));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, p12Password);

      let privateKey = null;
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      if (keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.length > 0) {
        privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;
      }
      if (!privateKey) {
        const plainKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
        if (plainKeyBags[forge.pki.oids.keyBag]?.length > 0) {
          privateKey = plainKeyBags[forge.pki.oids.keyBag][0].key;
        }
      }
      if (!privateKey) {
        throw new Error('No se encontró clave privada en el archivo .p12');
      }
      privateKeyPem = forge.pki.privateKeyToPem(privateKey);
      console.log('✅ Clave privada extraída correctamente');
    } catch (error) {
      throw new AppError('Error al procesar el archivo .p12: ' + error.message, 400);
    }

    // 9. Firmar el documento usando crypto
    let firmaHash;
    try {
      const documentoNormalizado = solicitud.documento_firma.replace(/\r\n/g, '\n');
      console.log('📄 Documento normalizado (longitud):', documentoNormalizado.length);
      console.log('📄 SHA-256 del documento normalizado:', this._calcularSHA256(documentoNormalizado));

      const sign = crypto.createSign('SHA256');
      sign.update(documentoNormalizado);
      sign.end();

      const signature = sign.sign({
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: 32,
      });
      firmaHash = signature.toString('base64');
      console.log('✅ Firma generada (longitud):', firmaHash.length);
      console.log('🔑 Hash (primeros 100 chars):', firmaHash.substring(0, 100));
    } catch (error) {
      throw new AppError('Error al firmar el documento: ' + error.message, 400);
    }

    // 10. Verificar firma con la clave pública
    const esValida = this._verificarFirma(firmaHash, solicitud.documento_firma, certificado.clave_publica);
    if (!esValida) {
      throw new AppError('La firma digital no es válida', 400);
    }

    // 11. Guardar firma
    const camposActualizar = {
      [mapping.id_field]: autoridadId,
      [mapping.date_field]: new Date(),
      [mapping.hash_field]: firmaHash,
      usuario_ultima_modificacion: usuarioModificador,
    };
    await this.solicitudRepo.actualizar(solicitudId, camposActualizar);
    console.log('✅ Firma guardada en la base de datos');

    // 12. Verificar si todas las firmas están completas
    const actualizada = await this.solicitudRepo.buscarPorId(solicitudId);
    const firmasCompletas = actualizada.firma_comunal_id &&
                            actualizada.firma_regional_id &&
                            actualizada.firma_departamental_id;

    if (firmasCompletas) {
      await this.solicitudRepo.actualizarEstado(solicitudId, config.ESTADOS_SOLICITUD.APROBADO, usuarioModificador);
      return { mensaje: 'Firma registrada. ¡Todas las firmas completas! Solicitud APROBADA.' };
    }

    return { mensaje: `✅ Firma ${tipoFirma} registrada exitosamente. Faltan ${3 - (actualizada.firma_comunal_id ? 1 : 0) - (actualizada.firma_regional_id ? 1 : 0) - (actualizada.firma_departamental_id ? 1 : 0)} firmas para completar.` };
  }

 // ============================================================
  // VERIFICAR FIRMA
  // ============================================================
  _verificarFirma(firmaHash, documento, clavePublicaPem) {
    try {
      console.log('========================================');
      console.log('🔍 VERIFICANDO FIRMA');
      console.log('📄 Longitud del documento:', documento.length);
      const documentoNormalizado = documento.replace(/\r\n/g, '\n');
      console.log('📄 Longitud del documento normalizado:', documentoNormalizado.length);
      console.log('📄 SHA-256 del documento normalizado:', this._calcularSHA256(documentoNormalizado));
      console.log('🔑 Hash (primeros 100 chars):', firmaHash.substring(0, 100));
      console.log('🔑 Longitud del hash:', firmaHash.length);

      const verifier = crypto.createVerify('SHA256');
      verifier.update(documentoNormalizado);
      verifier.end();

      const esValida = verifier.verify(
        {
          key: clavePublicaPem,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: 32,
        },
        Buffer.from(firmaHash, 'base64')
      );

      console.log('✅ ¿Firma válida?', esValida);
      console.log('========================================');
      return esValida;
    } catch (error) {
      console.error('❌ Error al verificar firma:', error);
      return false;
    }
  }


  // src/services/firma-solicitud.service.js

async firmarConPem(solicitudId, tipoFirma, autoridadId, privateKeyPem, usuarioModificador) {
  // 1. Validar solicitud
  const solicitud = await this.solicitudRepo.buscarPorId(solicitudId);
  if (!solicitud) throw new AppError('Solicitud no encontrada', 404);
  if (solicitud.estado_solicitud !== config.ESTADOS_SOLICITUD.PENDIENTE) {
    throw new AppError('La solicitud no está en estado pendiente', 400);
  }
  if (!solicitud.documento_firma) {
    throw new AppError('La solicitud no tiene documento para firmar', 400);
  }

  // 2. Validar autoridad
  const autoridad = await this.autoridadRepo.buscarPorId(autoridadId);
  if (!autoridad) throw new AppError('Autoridad no encontrada', 404);
  if (autoridad.estado !== 'ACT') throw new AppError('La autoridad no está activa', 400);

  // 3. Obtener certificado activo
  const certificado = await this.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
  if (!certificado) throw new AppError('La autoridad no tiene un certificado activo', 400);

  // 4. Mapear tipo de firma
  const campoMap = {
    comunal: { id_field: 'firma_comunal_id', date_field: 'firma_comunal_fecha', hash_field: 'firma_comunal_hash', cargo_esperado: 'COMUNAL' },
    regional: { id_field: 'firma_regional_id', date_field: 'firma_regional_fecha', hash_field: 'firma_regional_hash', cargo_esperado: 'REGIONAL' },
    departamental: { id_field: 'firma_departamental_id', date_field: 'firma_departamental_fecha', hash_field: 'firma_departamental_hash', cargo_esperado: 'DEPARTAMENTAL' },
  };
  const mapping = campoMap[tipoFirma];
  if (!mapping) throw new AppError('Tipo de firma inválido', 400);

  // 5. Verificar cargo
  if (autoridad.cargo_nivel !== mapping.cargo_esperado) {
    throw new AppError(`La autoridad no tiene el cargo ${mapping.cargo_esperado}`, 403);
  }

  // 6. Validar ámbito geográfico
  const persona = await this.personaRepo.buscarPorId(solicitud.persona_id);
  if (!persona) throw new AppError('Persona no encontrada', 404);
  await this._validarAmbitoAutoridad(autoridad, persona, mapping);

  // 7. Verificar que no se haya firmado ya
  if (solicitud[mapping.id_field]) {
    throw new AppError(`La solicitud ya fue firmada por el nivel ${tipoFirma}`, 400);
  }

  // 8. ✅ Importar la clave privada usando crypto.createPrivateKey (más robusto)
   let privateKey;
  try {
    // Limpiar el PEM
    const cleanedPem = privateKeyPem.trim().replace(/\r\n/g, '\n');
    console.log('🔑 PEM limpio (primeros 200 chars):', cleanedPem.substring(0, 200));

    // Intentar convertir con forge a PKCS#8 sin cifrar
    let pkiPrivateKey;
    try {
      // Si es RSA PRIVATE KEY, forge lo maneja
      pkiPrivateKey = forge.pki.privateKeyFromPem(cleanedPem);
      console.log('✅ Clave leída con forge');
    } catch (forgeError) {
      console.error('❌ forge no pudo leer la clave:', forgeError);
      // Si falla, intentar con crypto directamente (como fallback)
      privateKey = crypto.createPrivateKey(cleanedPem);
      console.log('✅ Clave importada con crypto (fallback)');
      // Si crypto funciona, saltamos la conversión
    }

    // Si forge leyó la clave, convertir a PEM estándar PKCS#8
    if (pkiPrivateKey) {
      // Exportar a PEM (PKCS#8) sin cifrar
      const pemPkcs8 = forge.pki.privateKeyToPem(pkiPrivateKey);
      console.log('✅ Convertida a PKCS#8 con forge');
      // Importar a crypto
      privateKey = crypto.createPrivateKey(pemPkcs8);
      console.log('✅ Clave importada a crypto desde forge');
    }
  } catch (error) {
    console.error('❌ Error al importar clave:', error);
    throw new AppError('La clave privada no es válida. Verifique el formato PEM.', 400);
  }

  // 9. Firmar el documento
   let firmaHash;
  try {
    const sign = crypto.createSign('SHA256');
    sign.update(solicitud.documento_firma);
    sign.end();
    const signature = sign.sign({
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32,
    });
    firmaHash = signature.toString('base64');
  } catch (error) {
    throw new AppError('Error al firmar el documento: ' + error.message, 400);
  }

  // 10. Verificar firma con la clave pública
  const esValida = this._verificarFirma(firmaHash, solicitud.documento_firma, certificado.clave_publica);
  if (!esValida) {
    throw new AppError('La firma digital no es válida', 400);
  }

  // 11. Guardar firma
  const camposActualizar = {
    [mapping.id_field]: autoridadId,
    [mapping.date_field]: new Date(),
    [mapping.hash_field]: firmaHash,
    usuario_ultima_modificacion: usuarioModificador,
  };
  await this.solicitudRepo.actualizar(solicitudId, camposActualizar);

  // 12. Verificar si todas las firmas están completas

    const actualizada = await this.solicitudRepo.buscarPorId(solicitudId);
  const firmasCompletas = actualizada.firma_comunal_id &&
                          actualizada.firma_regional_id &&
                          actualizada.firma_departamental_id;

  if (firmasCompletas) {
    await this.solicitudRepo.actualizarEstado(solicitudId, config.ESTADOS_SOLICITUD.APROBADO, usuarioModificador);
    return { mensaje: '🎉 ¡Todas las firmas completas! Solicitud APROBADA.' };
  }

  // ✅ Usar tipoFirma (no nombreNivel)
  const nombreNivel = {
    comunal: 'Comunal',
    regional: 'Regional',
    departamental: 'Departamental'
  }[tipoFirma] || tipoFirma;

  return {
    mensaje: `✅ Firma ${nombreNivel} registrada exitosamente. Faltan ${3 - [actualizada.firma_comunal_id, actualizada.firma_regional_id, actualizada.firma_departamental_id].filter(Boolean).length} firmas para completar.`
  };
}

  /*const actualizada = await this.solicitudRepo.buscarPorId(solicitudId);
  const firmasCompletas = actualizada.firma_comunal_id &&
                          actualizada.firma_regional_id &&
                          actualizada.firma_departamental_id;

  if (firmasCompletas) {
    await this.solicitudRepo.actualizarEstado(solicitudId, config.ESTADOS_SOLICITUD.APROBADO, usuarioModificador);
    return { mensaje: `✅ Firma ${nombreNivel} registrada. ¡Todas las firmas completas! Solicitud APROBADA.` };
  }

    return { mensaje: `✅ Firma ${nombreNivel} registrada exitosamente. Faltan ${firmasRestantes} firma(s) para completar.` };}
*/
  // ============================================================
  // UTILIDADES
  // ============================================================
  _calcularSHA256(texto) {
    return crypto.createHash('sha256').update(texto).digest('hex');
  }
}