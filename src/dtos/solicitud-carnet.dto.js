export class SolicitudCarnetDTO {
  constructor({
    persona_id, programacion_id, aval_comunidad, aval_regional, aval_otros,
    foto, fecha_vigencia, observaciones,
  }) {
    this.persona_id = persona_id;
    this.programacion_id = programacion_id || null;
    this.aval_comunidad = aval_comunidad;
    this.aval_regional  = aval_regional  || false;
    this.aval_otros     = aval_otros     || false;
    this.foto = foto || null;
    this.fecha_vigencia = fecha_vigencia || null;
    this.observaciones = observaciones || null;
  }
}