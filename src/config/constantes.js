export const ESTADO_USUARIO = {
  ACTIVO: 'ACT',
  INACTIVO: 'INA',
  BLOQUEADO: 'BLQ',
};

export const MAX_INTENTOS_FALLIDOS = 5;
export const TIEMPO_BLOQUEO_MINUTOS = 30; // en minutos
export const JWT_EXPIRACION = '24h';
export const JWT_SECRETO = process.env.JWT_SECRETO;
export const JWT_ALGORITMO = 'HS512';