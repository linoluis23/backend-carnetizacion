export class GestionarPasswordDTO {
  constructor({ passwordActual, nuevaPassword, confirmarPassword }) {
    this.passwordActual = passwordActual || null;
    this.nuevaPassword = nuevaPassword || null;
    this.confirmarPassword = confirmarPassword || null;
  }
}