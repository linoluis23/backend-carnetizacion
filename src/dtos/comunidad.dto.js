export class ComunidadDTO {
  constructor({ cod_reg, cod_com, descripcion, descripcion_corta }) {
    this.cod_reg = cod_reg;
    this.cod_com = cod_com;
    this.descripcion = descripcion?.trim();
    this.descripcion_corta = descripcion_corta?.trim();
  }
}