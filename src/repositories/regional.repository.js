import pool from '../config/database.js';
import { Regional } from '../models/regional.model.js';

export class RegionalRepository {
  async listar(codProv = null, estado = null) {
    let query = `
      SELECT r.*, p.descripcion AS descripcion_provincia
      FROM regional r
      LEFT JOIN provincia p ON r.cod_prov = p.cod_prov
      WHERE 1=1
    `;
    const params = [];
    if (codProv) {
      query += ' AND r.cod_prov = ?';
      params.push(codProv);
    }
    if (estado) {
      query += ' AND r.estado = ?';
      params.push(estado);
    }
    query += ' ORDER BY r.descripcion ASC';
    const [rows] = await pool.query(query, params);
    return rows.map(row => {
      const reg = new Regional(row);
      reg.descripcion_provincia = row.descripcion_provincia;
      return reg;
    });
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT r.*, p.descripcion AS descripcion_provincia
       FROM regional r
       LEFT JOIN provincia p ON r.cod_prov = p.cod_prov
       WHERE r.id = ?`, [id]
    );
    if (!rows.length) return null;
    const reg = new Regional(rows[0]);
    reg.descripcion_provincia = rows[0].descripcion_provincia;
    return reg;
  }

  async buscarPorCodigo(codReg) {
    const [rows] = await pool.query(
      `SELECT r.*, p.descripcion AS descripcion_provincia
       FROM regional r
       LEFT JOIN provincia p ON r.cod_prov = p.cod_prov
       WHERE r.cod_reg = ?`, [codReg]
    );
    if (!rows.length) return null;
    const reg = new Regional(rows[0]);
    reg.descripcion_provincia = rows[0].descripcion_provincia;
    return reg;
  }
  
  async eliminar(id, estadoActivo, usuarioModificador) {
  await pool.query(
    `UPDATE regional SET estado = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
    [estadoActivo, usuarioModificador, id]
  );
}

  async activar(id, estadoActivo, usuarioModificador) {
  await pool.query(
    `UPDATE regional SET estado = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
    [estadoActivo, usuarioModificador, id]
  );
}
}