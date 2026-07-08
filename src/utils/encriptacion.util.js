import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12; // Número de rondas de sal (recomendado 10-12)

/**
 * Genera el hash bcrypt de una contraseña.
 * @param {string} password - Contraseña en texto plano.
 * @returns {Promise<string>} Hash bcrypt (60 caracteres).
 */
export async function encriptarPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compara una contraseña con un hash (primero bcrypt, luego SHA‑512 para compatibilidad).
 * Si la contraseña coincide con el hash antiguo, devuelve una bandera para actualizarlo.
 * @param {string} password - Contraseña en texto plano.
 * @param {string} hash - Hash almacenado (bcrypt o SHA‑512 de 128 caracteres hex).
 * @returns {Promise<{valido: boolean, necesitaActualizar: boolean}>}
 */
export async function compararPassword(password, hash) {
  // Si el hash empieza con "$2b$" o "$2a$", es bcrypt
  if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
    const valido = await bcrypt.compare(password, hash);
    return { valido, necesitaActualizar: false };
  }

  // Si tiene 128 caracteres hex, es SHA‑512 antiguo
  if (/^[a-f0-9]{128}$/i.test(hash)) {
    const sha512Hash = crypto.createHash('sha512').update(password).digest('hex');
    if (sha512Hash === hash) {
      return { valido: true, necesitaActualizar: true }; // Migrar a bcrypt
    }
    return { valido: false, necesitaActualizar: false };
  }

  // Formato desconocido → inválido
  return { valido: false, necesitaActualizar: false };
}