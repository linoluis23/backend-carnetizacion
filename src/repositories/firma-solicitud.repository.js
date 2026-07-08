import pool from '../config/database.js';

export class FirmaSolicitudRepository {
  /**
   * Registra una firma para una solicitud.
   */
  async crearFirma(solicitudId, usuarioId, tipoFirma, firmaDigital = null) {
    await pool.query(
      `INSERT INTO firmas_solicitud (solicitud_id, usuario_id, tipo_firma, firma_digital)
       VALUES (?, ?, ?, ?)`,
      [solicitudId, usuarioId, tipoFirma, firmaDigital]
    );
  }

  /**
   * Obtiene todas las firmas de una solicitud.
   * @param {number} solicitudId
   * @returns {Promise<Array>}
   */
  async obtenerFirmasPorSolicitud(solicitudId) {
    const [rows] = await pool.query(
      'SELECT * FROM firmas_solicitud WHERE solicitud_id = ?',
      [solicitudId]
    );
    return rows;
  }

  /**
   * Cuenta cuántas firmas de un tipo dado tiene una solicitud.
   */
  async contarFirmas(solicitudId) {
    const [rows] = await pool.query(
      'SELECT tipo_firma FROM firmas_solicitud WHERE solicitud_id = ?',
      [solicitudId]
    );
    return rows.map(r => r.tipo_firma);
  }
}