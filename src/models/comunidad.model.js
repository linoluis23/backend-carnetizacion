export class Comunidad {
  constructor({
    id,
    cod_reg,
    cod_com,
    descripcion,
    descripcion_corta,
    estado,
    usuario_registro,
    fecha_registro,
    usuario_ultima_modificacion,
    fecha_ultima_actualizacion,
  }) {
    this.id = id;
    this.cod_reg = cod_reg;
    this.cod_com = cod_com;
    this.descripcion = descripcion;
    this.descripcion_corta = descripcion_corta;
    this.estado = estado;
    this.usuario_registro = usuario_registro;
    this.fecha_registro = fecha_registro;
    this.usuario_ultima_modificacion = usuario_ultima_modificacion;
    this.fecha_ultima_actualizacion = fecha_ultima_actualizacion;
  }
}