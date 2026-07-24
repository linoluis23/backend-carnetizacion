// src/services/certificado-v2.service.js
import forge from 'node-forge';
import crypto from 'crypto'; // <-- Para validación de clave pública
import { CertificadoRepository } from '../repositories/certificado.repository.js';
import { AutoridadRepository } from '../repositories/autoridad.repository.js';
import { PersonaRepository } from '../repositories/persona.repository.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';

export class CertificadoV2Service {
  constructor() {
    this.certificadoRepo = new CertificadoRepository();
    this.autoridadRepo = new AutoridadRepository();
    this.personaRepo = new PersonaRepository();
  }

  /**
   * Valida que una cadena sea una clave pública PEM RSA válida.
   * @param {string} publicKeyPem 
   * @returns {boolean}
   */
  _validarClavePublica(publicKeyPem) {
    try {
      const keyObject = crypto.createPublicKey(publicKeyPem);
      return keyObject.asymmetricKeyType === 'rsa';
    } catch (error) {
      return false;
    }
  }

  /**
   * Genera un certificado X.509 autofirmado y lo empaqueta en PKCS#12 (.p12)
   * @param {number} autoridadId - ID de la autoridad
   * @param {string} passphrase - Contraseña para proteger el archivo .p12
   * @param {string} usuarioRegistrador - email del administrador
   * @returns {Promise<{p12Buffer: Buffer, certificateId: number, publicKeyPem: string}>}
   */
  async generarCertificadoPKCS12(autoridadId, passphrase, usuarioRegistrador) {
    // 1. Validar autoridad
    const autoridad = await this.autoridadRepo.buscarPorId(autoridadId);
    if (!autoridad) throw new AppError('Autoridad no encontrada.', 404);
    if (autoridad.estado !== config.ESTADOS_AUTORIDAD.ACTIVO) {
      throw new AppError('Solo se puede generar certificado para autoridades activas.', 400);
    }

    // 2. Validar que no tenga certificado activo
    const existente = await this.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
    if (existente) throw new AppError('La autoridad ya posee un certificado activo.', 409);

    // 3. Obtener datos de la persona
    const persona = await this.personaRepo.buscarPorId(autoridad.persona_id);
    if (!persona) throw new AppError('Persona no encontrada.', 404);

    // 4. Generar par de llaves RSA 4096 bits
    const keyPair = forge.pki.rsa.generateKeyPair({ bits: 4096 });
    const privateKeyPem = forge.pki.privateKeyToPem(keyPair.privateKey);
    const publicKeyPem = forge.pki.publicKeyToPem(keyPair.publicKey);

    // 5. Crear certificado X.509 autofirmado
    const cert = forge.pki.createCertificate();
    cert.publicKey = keyPair.publicKey;
    cert.serialNumber = Date.now().toString();

    // Datos del sujeto
    const commonName = `${persona.nombres} ${persona.primer_apellido}`.trim();
    const subjectAttributes = [
      { name: 'commonName', value: commonName },
      { name: 'countryName', value: 'BO' },
      { name: 'stateOrProvinceName', value: 'La Paz' },
      { name: 'localityName', value: 'La Paz' },
      { name: 'organizationName', value: 'ADEPCOCA' },
      { name: 'organizationalUnitName', value: 'Autoridades' },
    ];
    subjectAttributes.forEach(attr => cert.subject.addField(attr));

    // Autofirmado
    cert.issuer = cert.subject;

    // Vigencia (1 año)
    const now = new Date();
    cert.validity.notBefore = now;
    const expiracion = new Date();
    expiracion.setFullYear(expiracion.getFullYear() + 1);
    cert.validity.notAfter = expiracion;

    // Firmar el certificado
    cert.sign(keyPair.privateKey, forge.md.sha256.create());

    // 6. Guardar la clave pública en la base de datos
    const diasVigencia = config.VIGENCIA_CERTIFICADO || 365;
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + diasVigencia);

    const certificado = await this.certificadoRepo.crear({
      autoridad_id: autoridadId,
      clave_publica: publicKeyPem,
      clave_privada_encriptada: null, // No guardamos la privada
      fecha_expiracion: fechaExpiracion,
      estado: 'ACT',
      usuario_registro: usuarioRegistrador,
    });

    // 7. Crear archivo PKCS#12 (.p12)
    const p12Buffer = this._crearPKCS12(cert, keyPair.privateKey, passphrase, commonName);

    return {
      p12Buffer,
      certificateId: certificado.id,
      publicKeyPem,
    };
  }

  /**
   * Crea un archivo PKCS#12 (.p12) a partir del certificado y la clave privada.
   * @private
   */
  _crearPKCS12(cert, privateKey, passphrase, commonName) {
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
      privateKey,
      [cert],
      passphrase,
      {
        algorithm: 'aes256',
        friendlyName: commonName,
      }
    );
    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    return Buffer.from(p12Der, 'binary');
  }

  /**
   * Guarda la clave pública generada desde el frontend (flujo con .p12 en navegador).
   * Incluye validación de formato PEM.
   * @param {number} autoridadId 
   * @param {string} clavePublica 
   * @param {string} usuarioRegistrador 
   * @returns {Promise<{mensaje: string, certificado_id: number}>}
   */
  async guardarClavePublica(autoridadId, clavePublica, usuarioRegistrador) {
    // 1. Validar que se proporcionó la clave
    if (!clavePublica || typeof clavePublica !== 'string') {
      console.log('📥 Clave pública recibida (primeros 100 chars):', clavePublica.substring(0, 100));
console.log('📥 ¿Contiene BEGIN PUBLIC KEY?', clavePublica.includes('BEGIN PUBLIC KEY'));
console.log('📥 Longitud:', clavePublica.length);
      throw new AppError('La clave pública es requerida.', 400);
    }

    // 2. Validar formato PEM (RSA)
    if (!this._validarClavePublica(clavePublica)) {
      throw new AppError('La clave pública proporcionada no es válida. Debe ser un PEM RSA.', 400);
    }

    // 3. Validar autoridad
    const autoridad = await this.autoridadRepo.buscarPorId(autoridadId);
    if (!autoridad) throw new AppError('Autoridad no encontrada.', 404);
    if (autoridad.estado !== config.ESTADOS_AUTORIDAD.ACTIVO) {
      throw new AppError('Solo se puede generar certificado para autoridades activas.', 400);
    }

    // 4. Verificar que no tenga certificado activo
    const existente = await this.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
    if (existente) throw new AppError('La autoridad ya posee un certificado activo.', 409);

    // 5. Guardar certificado
    const diasVigencia = config.VIGENCIA_CERTIFICADO || 365;
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + diasVigencia);

    const certificado = await this.certificadoRepo.crear({
      autoridad_id: autoridadId,
      clave_publica: clavePublica,
      clave_privada_encriptada: null,
      fecha_expiracion: fechaExpiracion,
      estado: 'ACT',
      usuario_registro: usuarioRegistrador,
    });

    return { mensaje: 'Clave pública almacenada.', certificado_id: certificado.id };
  }

  /**
   * Obtiene el certificado activo de una autoridad.
   */
  async obtenerCertificadoActivo(autoridadId) {
    const certificado = await this.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
    if (!certificado) throw new AppError('No se encontró un certificado activo para esta autoridad.', 404);
    return {
      id: certificado.id,
      autoridad_id: certificado.autoridad_id,
      clave_publica: certificado.clave_publica,
      fecha_emision: certificado.fecha_emision,
      fecha_expiracion: certificado.fecha_expiracion,
      estado: certificado.estado,
    };
  }

  /**
   * Revoca un certificado.
   */
  async revocarCertificado(certificadoId, usuarioModificador) {
    const certificado = await this.certificadoRepo.buscarPorId(certificadoId);
    if (!certificado) throw new AppError('Certificado no encontrado.', 404);
    if (certificado.estado === 'REV') throw new AppError('El certificado ya está revocado.', 400);
    await this.certificadoRepo.revocar(certificadoId);
    return { mensaje: 'Certificado revocado exitosamente.' };
  }
}