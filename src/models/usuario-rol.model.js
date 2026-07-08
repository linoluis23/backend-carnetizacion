export class UsuarioRol {
  constructor({
    id,
    usuario_id,
    rol_id,
    estado_usuario_rol,
    asignado_por,
    fecha_asignacion,
    fecha_desde,
    fecha_hasta,
    usuario_ultima_modificacion,
    fecha_ultima_actualizacion,
  }) {
    this.id = id;
    this.usuario_id = usuario_id;
    this.rol_id = rol_id;
    this.estado_usuario_rol = estado_usuario_rol;
    this.asignado_por = asignado_por;
    this.fecha_asignacion = fecha_asignacion;
    this.fecha_desde = fecha_desde;
    this.fecha_hasta = fecha_hasta;
    this.usuario_ultima_modificacion = usuario_ultima_modificacion;
    this.fecha_ultima_actualizacion = fecha_ultima_actualizacion;
  }
}