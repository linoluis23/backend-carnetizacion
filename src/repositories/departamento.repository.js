import pool from '../config/database.js';
import { Departamento } from '../models/departamento.model.js';

export class DepartamentoRepository {
  /**
   * Lista todos los departamentos, opcionalmente filtrados por país.
   * @param {number} [codPais] - código de país para filtrar
   * @returns {Promise<Departamento[]>}
   */
  async listar(codPais = null) {
    let query = 'SELECT * FROM departamento';
    const params = [];
    if (codPais) {
      query += ' WHERE cod_pais = ?';
      params.push(codPais);
    }
    query += ' ORDER BY descripcion ASC';
    const [rows] = await pool.query(query, params);
    return rows.map(row => new Departamento(row));
  }

  /**
   * Busca un departamento por su ID.
   * @param {number} id
   * @returns {Promise<Departamento|null>}
   */
  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM departamento WHERE id = ?', [id]);
    return rows.length ? new Departamento(rows[0]) : null;
  }

   async buscarPorCodigo(codDep) {
    const [rows] = await pool.query('SELECT * FROM departamento WHERE cod_dep = ?', [codDep]);
    return rows.length ? new Departamento(rows[0]) : null;
  }

}