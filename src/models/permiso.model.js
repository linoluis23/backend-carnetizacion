export class Permiso {
  constructor({ id, codigo, nombre, descripcion, estado_permiso, usuario_registro, fecha_creacion }) {
    this.id = id;
    this.codigo = codigo;
    this.nombre = nombre;
    this.descripcion = descripcion || null;
    this.estado = estado_permiso; // ← Mapear estado_permiso a estado
    this.usuario_registro = usuario_registro || null;
    this.fecha_creacion = fecha_creacion || null;
  }
}