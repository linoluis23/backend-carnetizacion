import crypto from 'crypto';
import { CertificadoRepository } from '../repositories/certificado.repository.js';
import { AutoridadRepository } from '../repositories/autoridad.repository.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';

export class CertificadoService {
  constructor() {
    this.certificadoRepo = new CertificadoRepository();
    this.autoridadRepo = new AutoridadRepository();
  }

  /**
   * Genera un par de llaves RSA, encripta la privada y almacena el certificado.
   */
  /*
  async generarCertificado(autoridadId, usuarioRegistrador) {
    // 1. Verificar que la autoridad existe y está activa
    const autoridad = await this.autoridadRepo.buscarPorId(autoridadId);
    if (!autoridad) throw new AppError('Autoridad no encontrada.', 404);
    if (autoridad.estado !== config.ESTADOS_AUTORIDAD.ACTIVO) {
      throw new AppError('Solo se puede generar certificado para autoridades activas.', 400);
    }

    // 2. Verificar que no tenga ya un certificado activo
    const existente = await this.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
    if (existente) throw new AppError('La autoridad ya posee un certificado activo. Revóquelo antes de generar uno nuevo.', 409);

    // 3. Generar par de llaves RSA de 2048 bits
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    // 4. Encriptar clave privada con MASTER_KEY
    const masterKey = process.env.MASTER_KEY;
    if (!masterKey) throw new AppError('No se ha configurado MASTER_KEY.', 500);
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(masterKey, 'hex'), iv);
    let encryptedPrivate = cipher.update(privateKey, 'utf8', 'hex');
    encryptedPrivate += cipher.final('hex');
    const encryptedPrivateKey = iv.toString('hex') + ':' + encryptedPrivate;
    const diasVigencia = config.VIGENCIA_CERTIFICADO || 365;
const fechaExpiracion = new Date();
fechaExpiracion.setDate(fechaExpiracion.getDate() + diasVigencia);
    // 5. Guardar certificado
    const certificado = await this.certificadoRepo.crear({
      autoridad_id: autoridadId,
      clave_publica: publicKey,
      clave_privada_encriptada: encryptedPrivateKey,
        fecha_expiracion: fechaExpiracion,

      estado: 'ACT',
      usuario_registro: usuarioRegistrador,
    });

    return { mensaje: 'Certificado generado exitosamente.', certificado_id: certificado.id };
  }*/


async generarCertificado(autoridadId, clavePublica, usuarioRegistrador) {
  const autoridad = await this.autoridadRepo.buscarPorId(autoridadId);
  if (!autoridad) throw new AppError('Autoridad no encontrada.', 404);
  if (autoridad.estado !== config.ESTADOS_AUTORIDAD.ACTIVO) {
    throw new AppError('Solo se puede generar certificado para autoridades activas.', 400);
  }

  const existente = await this.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
  if (existente) throw new AppError('La autoridad ya posee un certificado activo.', 409);

  const diasVigencia = config.VIGENCIA_CERTIFICADO || 365;
  const fechaExpiracion = new Date();
  fechaExpiracion.setDate(fechaExpiracion.getDate() + diasVigencia);

  const certificado = await this.certificadoRepo.crear({
    autoridad_id: autoridadId,
    clave_publica: clavePublica,
    clave_privada_encriptada: null,   // ya no se guarda
    fecha_expiracion: fechaExpiracion,
    estado: 'ACT',
    usuario_registro: usuarioRegistrador,
  });

  return { mensaje: 'Certificado generado exitosamente.', certificado_id: certificado.id };
}
  /**
   * Obtiene la clave privada desencriptada de un certificado activo.
   */
  async obtenerClavePrivadaActiva(autoridadId) {
    const certificado = await this.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
    if (!certificado) throw new AppError('No se encontró un certificado activo para esta autoridad.', 404);

    const masterKey = process.env.MASTER_KEY;
    const parts = certificado.clave_privada_encriptada.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(masterKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  async obtenerCertificadoActivo(autoridadId) {
    const certificado = await this.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
    if (!certificado) throw new AppError('No se encontró un certificado activo para esta autoridad.', 404);
    return {
      id: certificado.id,
      autoridad_id: certificado.autoridad_id,
      clave_publica: certificado.clave_publica,
      fecha_emision: certificado.fecha_emision,
      estado: certificado.estado,
      usuario_registro: certificado.usuario_registro,
    };
  }

  async revocarCertificado(certificadoId, usuarioModificador) {
    const certificado = await this.certificadoRepo.buscarPorId(certificadoId);
    if (!certificado) throw new AppError('Certificado no encontrado.', 404);
    if (certificado.estado === 'REV') throw new AppError('El certificado ya está revocado.', 400);

    await this.certificadoRepo.revocar(certificadoId);
    return { mensaje: 'Certificado revocado exitosamente.' };
  }
  
}