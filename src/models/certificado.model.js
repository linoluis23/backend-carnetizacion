// src/models/certificado.model.js
export class Certificado {
  constructor({
    id,
    autoridad_id,
    clave_publica,
    clave_privada_encriptada = null, // valor por defecto
    fecha_emision,
    fecha_expiracion,
    estado,
    usuario_registro,
    fecha_creacion,
  }) {
    this.id = id;
    this.autoridad_id = autoridad_id;
    this.clave_publica = clave_publica;
    this.clave_privada_encriptada = clave_privada_encriptada;
    this.fecha_emision = fecha_emision;
    this.fecha_expiracion = fecha_expiracion || null;
    this.estado = estado;
    this.usuario_registro = usuario_registro;
    this.fecha_creacion = fecha_creacion;
  }
}