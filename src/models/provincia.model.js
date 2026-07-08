export class Provincia {
  constructor({
    id,
    cod_dep,
    cod_prov,
    descripcion,
    descripcion_corta,
    usuario_registro,
    fecha_registro,
    usuario_ultima_modificacion,
    fecha_ultima_actualizacion,
  }) {
    this.id = id;
    this.cod_dep = cod_dep;
    this.cod_prov = cod_prov;
    this.descripcion = descripcion;
    this.descripcion_corta = descripcion_corta;
    this.usuario_registro = usuario_registro;
    this.fecha_registro = fecha_registro;
    this.usuario_ultima_modificacion = usuario_ultima_modificacion;
    this.fecha_ultima_actualizacion = fecha_ultima_actualizacion;
  }
}