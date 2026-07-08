export class Programacion {
  constructor({
    id, cod_reg, fecha_inicio, fecha_fin, estado, glosa,
    usuario_registro, fecha_creacion,
    usuario_ultima_modificacion, fecha_ultima_actualizacion,
  }) {
    this.id = id;
    this.cod_reg = cod_reg;
    this.fecha_inicio = fecha_inicio;
    this.fecha_fin = fecha_fin;
    this.estado = estado;
    this.glosa = glosa || null;
    this.usuario_registro = usuario_registro;
    this.fecha_creacion = fecha_creacion;
    this.usuario_ultima_modificacion = usuario_ultima_modificacion;
    this.fecha_ultima_actualizacion = fecha_ultima_actualizacion;
  }
}