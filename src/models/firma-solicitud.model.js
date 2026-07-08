export class FirmaSolicitud {
  constructor({ id, solicitud_id, usuario_id, tipo_firma, firma_digital, fecha_firma }) {
    this.id = id;
    this.solicitud_id = solicitud_id;
    this.usuario_id = usuario_id;
    this.tipo_firma = tipo_firma;
    this.firma_digital = firma_digital || null;
    this.fecha_firma = fecha_firma;
  }
}