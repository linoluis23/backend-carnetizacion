export class Autoridad {
  constructor({
    id, cargo_id, persona_id, cod_dep, cod_reg, cod_com,
    fecha_inicio, fecha_fin, estado, glosa,
    usuario_registro, fecha_creacion,
    usuario_ultima_modificacion, fecha_ultima_actualizacion,
  }) {
    this.id = id;
    this.cargo_id = cargo_id;
    this.persona_id = persona_id;
    this.cod_dep = cod_dep || null;
    this.cod_reg = cod_reg || null;
    this.cod_com = cod_com || null;
    this.fecha_inicio = fecha_inicio;
    this.fecha_fin = fecha_fin || null;
    this.estado = estado;
    this.glosa = glosa || null;
    this.usuario_registro = usuario_registro;
    this.fecha_creacion = fecha_creacion;
    this.usuario_ultima_modificacion = usuario_ultima_modificacion;
    this.fecha_ultima_actualizacion = fecha_ultima_actualizacion;
  }
}