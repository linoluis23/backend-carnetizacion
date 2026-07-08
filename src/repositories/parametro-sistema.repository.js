import pool from '../config/database.js';

export class ParametroSistemaRepository {
  /**
   * Obtiene todos los parámetros de un grupo específico.
   * @param {string} grupo
   * @returns {Promise<object>} Ej: { MAX_INTENTOS_FALLIDOS: '5', JWT_EXPIRACION: '2h', ... }
   */
  async obtenerPorGrupo(grupo) {
    const [rows] = await pool.query(
      'SELECT clave, valor FROM parametros_sistema WHERE grupo = ?',
      [grupo]
    );
    const params = {};
    for (const row of rows) {
      params[row.clave] = row.valor;
    }
    return params;
  }
}