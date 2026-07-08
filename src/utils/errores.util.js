export class AppError extends Error {
  constructor(mensaje, codigoEstado = 400) {
    super(mensaje);
    this.codigoEstado = codigoEstado;
        this.esOperacional = true;

  }
}