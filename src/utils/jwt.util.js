import jwt from 'jsonwebtoken';
import { JWT_SECRETO, JWT_ALGORITMO} from '../config/constantes.js';
import { config } from '../config/configuracion.js';


/**
 * Genera un token JWT.
 * @param {object} payload - Datos a incluir (por ejemplo { id, email }).
 * @returns {string} Token firmado.
 */
export const generarToken = (payload) => {
  const payloadCompleto = {
    ...payload,
    id: payload.id,
    email: payload.email, 
    jti: crypto.randomUUID(), // opcional, pero recomendado para trazabilidad
  };
  return jwt.sign(payloadCompleto, JWT_SECRETO, {
    algorithm: JWT_ALGORITMO,   // HS512
    expiresIn: config.JWT_EXPIRACION, // parametrizado desde BD
  });
};

export const verificarToken = (token) => {
  return jwt.verify(token, JWT_SECRETO, { algorithms: [JWT_ALGORITMO] });
};


export const verificarTokenConExpiracion = (token) => {
  const payload = jwt.verify(token, JWT_SECRETO);
  return {
    payload,
    expiracion: new Date(payload.exp * 1000), // exp es en segundos
    esValido: true,
  };
};