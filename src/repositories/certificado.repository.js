import pool from '../config/database.js';
import { Certificado } from '../models/certificado.model.js';

export class CertificadoRepository {
  /**
   * Crea un nuevo certificado para una autoridad.
   */
async crear(datos) {
  const { autoridad_id, clave_publica, clave_privada_encriptada, fecha_expiracion, estado, usuario_registro } = datos;
  const [insertResult] = await pool.query(
    `INSERT INTO certificados_autoridad (autoridad_id, clave_publica, clave_privada_encriptada, fecha_expiracion, estado, usuario_registro, fecha_creacion)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [autoridad_id, clave_publica, clave_privada_encriptada || null, fecha_expiracion, estado, usuario_registro]
  );
  return this.buscarPorId(insertResult.insertId);
}

  /**
   * Obtiene el certificado ACTIVO de una autoridad.
   */
  async obtenerActivoPorAutoridad(autoridadId) {
    const [rows] = await pool.query(
      'SELECT * FROM certificados_autoridad WHERE autoridad_id = ? AND estado = ?',
      [autoridadId, 'ACT']
    );
    return rows.length ? new Certificado(rows[0]) : null;
  }

  /**
   * Busca un certificado por su ID.
   */
  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM certificados_autoridad WHERE id = ?', [id]);
    return rows.length ? new Certificado(rows[0]) : null;
  }

  /**
   * Revoca todos los certificados activos de una autoridad.
   */
  async revocarPorAutoridad(autoridadId) {
    await pool.query(
      "UPDATE certificados_autoridad SET estado = 'REV' WHERE autoridad_id = ? AND estado = 'ACT'",
      [autoridadId]
    );
  }

    async obtenerActivoPorAutoridad(autoridadId) {
    const [rows] = await pool.query(
      'SELECT * FROM certificados_autoridad WHERE autoridad_id = ? AND estado = ?',
      [autoridadId, 'ACT']
    );
    return rows.length ? new Certificado(rows[0]) : null;
  }

  async revocar(id) {
    await pool.query(
      "UPDATE certificados_autoridad SET estado = 'REV' WHERE id = ?",
      [id]
    );
  }


}