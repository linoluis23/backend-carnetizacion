import pool from '../config/database.js';

export class CertificadoAutoridadRepository {
  async crear(datos) {
    const { autoridad_id, clave_publica, clave_privada_encriptada, estado, usuario_registro } = datos;
    await pool.query(
      `INSERT INTO certificados_autoridad (autoridad_id, clave_publica, clave_privada_encriptada, estado, usuario_registro)
       VALUES (?, ?, ?, ?, ?)`,
      [autoridad_id, clave_publica, clave_privada_encriptada, estado, usuario_registro]
    );
  }

  async obtenerActivoPorAutoridad(autoridadId) {
    const [rows] = await pool.query(
      'SELECT * FROM certificados_autoridad WHERE autoridad_id = ? AND estado = ?',
      [autoridadId, 'ACT']
    );
    return rows[0] || null;
  }

  async revocarPorAutoridad(autoridadId) {
    await pool.query(
      "UPDATE certificados_autoridad SET estado = 'REV' WHERE autoridad_id = ? AND estado = 'ACT'",
      [autoridadId]
    );
  }
}