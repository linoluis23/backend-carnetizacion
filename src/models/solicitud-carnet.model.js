export class SolicitudCarnet {
  constructor({
    id, persona_id, programacion_id, aval_comunidad, aval_regional, aval_otros,
    foto, fecha_vigencia, estado_solicitud, fecha_solicitud, observaciones,
    usuario_registro, fecha_creacion, usuario_ultima_modificacion, fecha_ultima_actualizacion,
  }) {
    this.id = id;
    this.persona_id = persona_id;
    this.programacion_id = programacion_id || null;
    this.aval_comunidad = Boolean(aval_comunidad);
    this.aval_regional  = Boolean(aval_regional);
    this.aval_otros     = Boolean(aval_otros);
    this.foto = foto || null;
    this.fecha_vigencia = fecha_vigencia;
    this.estado_solicitud = estado_solicitud;
    this.fecha_solicitud = fecha_solicitud;
    this.observaciones = observaciones || null;
    this.usuario_registro = usuario_registro;
    this.fecha_creacion = fecha_creacion;
    this.usuario_ultima_modificacion = usuario_ultima_modificacion;
    this.fecha_ultima_actualizacion = fecha_ultima_actualizacion;
  }
}