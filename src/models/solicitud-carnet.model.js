export class SolicitudCarnet {
  constructor({
    id, persona_id, programacion_id,
    aval_comunidad, aval_regional, aval_otros,
    foto, pdf_carnet, fecha_vigencia, estado_solicitud, fecha_solicitud, observaciones,
    usuario_registro, fecha_creacion, usuario_ultima_modificacion, fecha_ultima_actualizacion,
    // Campos de firma digital
    firma_comunal_id, firma_comunal_fecha, firma_comunal_hash,
    firma_regional_id, firma_regional_fecha, firma_regional_hash,
    firma_departamental_id, firma_departamental_fecha, firma_departamental_hash,
    documento_firma,
    // Datos adicionales de joins
    nombres, primer_apellido, segundo_apellido, documento_identidad,
    prog_fecha_inicio, prog_fecha_fin,
    comunidad_descripcion, cod_com,
    regional_descripcion, cod_reg,
    provincia_descripcion, cod_prov,
    departamento_descripcion, cod_dep,cod_socio,cod_persona
  }) {
    this.id = id;
    this.persona_id = persona_id;
    this.programacion_id = programacion_id || null;
    this.aval_comunidad = Boolean(aval_comunidad);
    this.aval_regional = Boolean(aval_regional);
    this.aval_otros = Boolean(aval_otros);
    this.foto = foto || null;
    this.pdf_carnet = pdf_carnet || null;
    this.fecha_vigencia = fecha_vigencia;
    this.estado_solicitud = estado_solicitud;
    this.fecha_solicitud = fecha_solicitud;
    this.observaciones = observaciones || null;
    this.usuario_registro = usuario_registro;
    this.fecha_creacion = fecha_creacion;
    this.usuario_ultima_modificacion = usuario_ultima_modificacion;
    this.fecha_ultima_actualizacion = fecha_ultima_actualizacion;

    // Firma digital
    this.firma_comunal_id = firma_comunal_id || null;
    this.firma_comunal_fecha = firma_comunal_fecha || null;
    this.firma_comunal_hash = firma_comunal_hash || null;
    this.firma_regional_id = firma_regional_id || null;
    this.firma_regional_fecha = firma_regional_fecha || null;
    this.firma_regional_hash = firma_regional_hash || null;
    this.firma_departamental_id = firma_departamental_id || null;
    this.firma_departamental_fecha = firma_departamental_fecha || null;
    this.firma_departamental_hash = firma_departamental_hash || null;
    this.documento_firma = documento_firma || null;

    // Joins
    this.nombres = nombres || null;
    this.primer_apellido = primer_apellido || null;
    this.segundo_apellido = segundo_apellido || null;
    this.documento_identidad = documento_identidad || null;
    this.prog_fecha_inicio = prog_fecha_inicio || null;
    this.prog_fecha_fin = prog_fecha_fin || null;
    this.comunidad_descripcion = comunidad_descripcion || '';
    this.cod_com = cod_com || null;
    this.regional_descripcion = regional_descripcion || '';
    this.cod_reg = cod_reg || null;
    this.provincia_descripcion = provincia_descripcion || '';
    this.cod_prov = cod_prov || null;
    this.departamento_descripcion = departamento_descripcion || '';
    this.cod_dep = cod_dep || null;
    this.cod_socio = cod_socio || null;
    this.cod_persona = cod_persona || null;
  }
}