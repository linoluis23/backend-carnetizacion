export class ProgramacionDTO {
  constructor({ cod_reg, fecha_inicio, fecha_fin, glosa }) {
    this.cod_reg = cod_reg;
    this.fecha_inicio = fecha_inicio;
    this.fecha_fin = fecha_fin;
    this.glosa = glosa || null;

  }
}