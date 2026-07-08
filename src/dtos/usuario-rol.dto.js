export class AsignarRolDTO {
  constructor({ rol_id, fecha_desde, fecha_hasta }) {
    this.rol_id = rol_id;
    this.fecha_desde = fecha_desde || null;
    this.fecha_hasta = fecha_hasta || null;
  }
}