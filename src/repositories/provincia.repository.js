import pool from '../config/database.js';
import { Provincia } from '../models/provincia.model.js';

export class ProvinciaRepository {
  async listar(codDep = null) {
    let query = `
      SELECT p.*, d.descripcion AS descripcion_departamento
      FROM provincia p
      LEFT JOIN departamento d ON p.cod_dep = d.cod_dep
    `;
    const params = [];
    if (codDep) {
      query += ' WHERE p.cod_dep = ?';
      params.push(codDep);
    }
    query += ' ORDER BY p.descripcion ASC';
    const [rows] = await pool.query(query, params);
    return rows.map(row => {
      const prov = new Provincia(row);
      prov.descripcion_departamento = row.descripcion_departamento;
      return prov;
    });
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT p.*, d.descripcion AS descripcion_departamento
       FROM provincia p
       LEFT JOIN departamento d ON p.cod_dep = d.cod_dep
       WHERE p.id = ?`, [id]
    );
    if (!rows.length) return null;
    const prov = new Provincia(rows[0]);
    prov.descripcion_departamento = rows[0].descripcion_departamento;
    return prov;
  }

  async buscarPorCodigo(codProv) {
    const [rows] = await pool.query(
      `SELECT p.*, d.descripcion AS descripcion_departamento
       FROM provincia p
       LEFT JOIN departamento d ON p.cod_dep = d.cod_dep
       WHERE p.cod_prov = ?`, [codProv]
    );
    if (!rows.length) return null;
    const prov = new Provincia(rows[0]);
    prov.descripcion_departamento = rows[0].descripcion_departamento;
    return prov;
  }
}