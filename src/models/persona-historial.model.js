export class PersonaHistorial {
  constructor({ id, persona_id, campo, valor_anterior, valor_nuevo, usuario_modificacion, fecha_modificacion }) {
    this.id = id;
    this.persona_id = persona_id;
    this.campo = campo;
    this.valor_anterior = valor_anterior;
    this.valor_nuevo = valor_nuevo;
    this.usuario_modificacion = usuario_modificacion;
    this.fecha_modificacion = fecha_modificacion;
  }
}