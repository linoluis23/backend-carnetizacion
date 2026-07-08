import pool from '../config/database.js';
import { config } from '../config/configuracion.js';

export class ResetPasswordTokenRepository {
  async crearToken(usuarioId, codigo, fechaExpiracion) {
    await pool.query(
      `INSERT INTO reset_password_tokens (codigo, fecha_creacion, fecha_expiracion, intentos_usados, estado, usuario_id)
       VALUES (?, NOW(), ?, 0, ?, ?)`,
      [codigo, fechaExpiracion, config.ESTADOS_CODIGO.VIGENTE, usuarioId]
    );
  }

  /**
   * Busca un token por su código exacto (sin importar estado o expiración).
   */
  async buscarTokenPorCodigo(codigo) {
    const [rows] = await pool.query(
      'SELECT * FROM reset_password_tokens WHERE codigo = ?',
      [codigo]
    );
    return rows.length ? rows[0] : null;
  }

  /**
   * Incrementa el contador de intentos. Si alcanza MAX_INTENTOS_CODIGO, cancela el token.
   * @returns {Promise<boolean>} true si el token fue cancelado por exceder intentos.
   */
  async incrementarIntentos(tokenId) {
    const [result] = await pool.query(
      'UPDATE reset_password_tokens SET intentos_usados = intentos_usados + 1 WHERE id = ?',
      [tokenId]
    );
    if (result.affectedRows === 0) return false;

    // Verificar si se alcanzó el límite
    const [rows] = await pool.query('SELECT intentos_usados FROM reset_password_tokens WHERE id = ?', [tokenId]);
    if (rows.length && rows[0].intentos_usados >= config.MAX_INTENTOS_CODIGO) {
      await this.cancelarToken(tokenId);
      return true; // indica que se canceló por exceder intentos
    }
    return false;
  }

  async invalidarTokensAnteriores(usuarioId) {
    await pool.query(
      `UPDATE reset_password_tokens SET estado = ? 
       WHERE usuario_id = ? AND estado = ? AND fecha_expiracion > NOW()`,
      [config.ESTADOS_CODIGO.CANCELADO, usuarioId, config.ESTADOS_CODIGO.VIGENTE]
    );
  }

  async cancelarToken(tokenId) {
    await pool.query(
      'UPDATE reset_password_tokens SET estado = ? WHERE id = ?',
      [config.ESTADOS_CODIGO.CANCELADO, tokenId]
    );
  }

    async findActiveTokenByUsuario(usuarioId) {
    const [rows] = await pool.query(
      `SELECT * FROM reset_password_tokens 
       WHERE usuario_id = ? AND estado = ? AND fecha_expiracion > NOW() 
       ORDER BY fecha_creacion DESC LIMIT 1`,
      [usuarioId, config.ESTADOS_CODIGO.VIGENTE]
    );
    return rows[0] || null;
  }
}