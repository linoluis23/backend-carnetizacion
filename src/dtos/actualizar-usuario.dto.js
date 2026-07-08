export class ActualizarUsuarioDTO {
  constructor({ nombres, primer_apellido, segundo_apellido, documento_identidad, foto }) {
    this.nombres = nombres;
    this.primer_apellido = primer_apellido;
    this.segundo_apellido = segundo_apellido;
    this.documento_identidad = documento_identidad; // ← NUEVO
    this.estado = this.estado; // Por defecto, el estado se establece como activo
    this.foto = foto;
  }
}