export class AutoridadDTO {
  constructor({ cargo_id, persona_id, cod_dep, cod_reg, cod_com, fecha_inicio, fecha_fin, glosa, estado }) {
    this.cargo_id = cargo_id;
    this.persona_id = persona_id;
    this.cod_dep = cod_dep || null;
    this.cod_reg = cod_reg || null;
    this.cod_com = cod_com || null;
    this.fecha_inicio = fecha_inicio;
    this.fecha_fin = fecha_fin || null;
    this.estado = estado;
    this.glosa = glosa || null;      // ← AÑADIR

  }
}