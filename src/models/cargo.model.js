export class Cargo {
  constructor({ id, cod_cargo, descripcion, nivel, estado }) {
    this.id = id;
    this.cod_cargo = cod_cargo;
    this.descripcion = descripcion;
    this.nivel = nivel;
    this.estado = estado;
  }
}