export class Departamento {
  constructor({
    id,
    cod_dep,
    descripcion,
    descripcion_corta,
    cod_pais,
    usuario_registro,
    fecha_registro,
    usuario_ultima_modificacion,
    fecha_ultima_actualizacion,
  }) {
    this.id = id;
    this.cod_dep = cod_dep;
    this.descripcion = descripcion;
    this.descripcion_corta = descripcion_corta;
    this.cod_pais = cod_pais;
    this.usuario_registro = usuario_registro;
    this.fecha_registro = fecha_registro;
    this.usuario_ultima_modificacion = usuario_ultima_modificacion;
    this.fecha_ultima_actualizacion = fecha_ultima_actualizacion;
  }
}