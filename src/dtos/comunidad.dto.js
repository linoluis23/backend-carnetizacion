export class ComunidadDTO {
  constructor({ cod_reg, descripcion, descripcion_corta }) {
    this.cod_reg = cod_reg;
    this.descripcion = descripcion?.trim();
    this.descripcion_corta = descripcion_corta?.trim();
  }
}