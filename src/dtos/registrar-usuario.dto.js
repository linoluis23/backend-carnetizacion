export class RegistrarUsuarioDTO {
  constructor({ nombres, primer_apellido, segundo_apellido, email, password, documento_identidad }) {
    this.nombres = nombres;
    this.primer_apellido = primer_apellido;
    this.segundo_apellido = segundo_apellido || null;
    this.email = email;
    this.password = password;
    this.documento_identidad = documento_identidad;   // ← NUEVO
  }
}