import pool from '../config/database.js';
import { Cargo } from '../models/cargo.model.js';

export class CargoRepository {
  /**
   * Busca un cargo por su ID.
   * @param {number} id
   * @returns {Promise<Cargo|null>}
   */
  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM cargos WHERE id = ?', [id]);
    return rows.length ? new Cargo(rows[0]) : null;
  }

  /**
   * Lista todos los cargos activos (o todos si no se especifica).
   */
 async listar(soloActivos = false) {
  let query = 'SELECT * FROM cargos';
  if (soloActivos) query += " WHERE estado = 'ACT'";
  query += ' ORDER BY descripcion ASC';
  const [rows] = await pool.query(query);
  return rows.map(row => new Cargo(row));
}
}