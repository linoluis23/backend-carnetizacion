export class Rol {
  constructor({ id, nombre, descripcion, estado_rol, usuario_registro, fecha_creacion, usuario_ultima_modificacion, fecha_ultima_actualizacion }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.estado_rol = estado_rol;
    this.usuario_registro = usuario_registro;
    this.fecha_creacion = fecha_creacion;
    this.usuario_ultima_modificacion = usuario_ultima_modificacion;
    this.fecha_ultima_actualizacion = fecha_ultima_actualizacion;
  }
}