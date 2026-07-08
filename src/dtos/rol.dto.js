export class RolDTO {
  constructor({ nombre, descripcion }) {
    this.nombre = nombre?.trim();
    this.descripcion = descripcion?.trim();
  }
}