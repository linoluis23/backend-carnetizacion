import pool from '../config/database.js';

export class HistorialAccesosRepository {
  /**
   * Registra un intento fallido de acceso.
   * @param {object} datos - { usuario_id, email_ingresado, ip_direccion, user_agent }
   * @returns {Promise<void>}
   */
  async registrarIntentoFallido(datos) {
    const { usuario_id, email_ingresado, ip_direccion, user_agent } = datos;
    await pool.query(
      `INSERT INTO historial_accesos_fallidos (usuario_id, email_ingresado, ip_direccion, user_agent)
       VALUES (?, ?, ?, ?)`,
      [usuario_id || null, email_ingresado, ip_direccion, user_agent]
    );
  }

    // Obtener los últimos N registros (para la tabla del dashboard)
  async obtenerUltimos(limite = 20) {
    const [rows] = await pool.query(
      'SELECT * FROM historial_accesos_fallidos ORDER BY fecha_intento DESC LIMIT ?',
      [limite]
    );
    return rows;
  }

  // Obtener conteo agrupado por día (para gráficos)
  async obtenerEstadisticasPorDia(dias = 7) {
    const [rows] = await pool.query(
      `SELECT DATE(fecha_intento) as fecha, COUNT(*) as total
       FROM historial_accesos_fallidos
       WHERE fecha_intento >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(fecha_intento)
       ORDER BY fecha ASC`,
      [dias]
    );
    return rows;
  }
}