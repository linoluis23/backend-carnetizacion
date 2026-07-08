import pool from '../config/database.js';
import { Comunidad } from '../models/comunidad.model.js';

export class ComunidadRepository {
  async listar(filtros = {}) {
    let query = `
      SELECT c.*, 
             r.descripcion AS descripcion_regional,
             r.cod_prov AS cod_prov,
             pv.descripcion AS descripcion_provincia,
             d.descripcion AS descripcion_departamento
      FROM comunidad c
      LEFT JOIN regional r ON c.cod_reg = r.cod_reg
      LEFT JOIN provincia pv ON r.cod_prov = pv.cod_prov
      LEFT JOIN departamento d ON pv.cod_dep = d.cod_dep
      WHERE 1=1
    `;
    const params = [];

    if (filtros.cod_reg) {
      query += ' AND c.cod_reg = ?';
      params.push(filtros.cod_reg);
    }
    if (filtros.cod_prov) {
      query += ' AND r.cod_prov = ?';
      params.push(filtros.cod_prov);
    }
    if (filtros.estado) {
      query += ' AND c.estado = ?';
      params.push(filtros.estado);
    }

    query += ' ORDER BY c.descripcion ASC';
    const [rows] = await pool.query(query, params);
    
    return rows.map(row => {
      const com = new Comunidad(row);
      com.descripcion_regional = row.descripcion_regional;
      com.descripcion_provincia = row.descripcion_provincia;
      com.descripcion_departamento = row.departamento_descripcion; // Ajusta el nombre según tu modelo
      return com;
    });
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT c.*, r.descripcion AS descripcion_regional
       FROM comunidad c
       LEFT JOIN regional r ON c.cod_reg = r.cod_reg
       WHERE c.id = ?`, [id]
    );
    if (!rows.length) return null;
    const com = new Comunidad(rows[0]);
    com.descripcion_regional = rows[0].descripcion_regional;
    return com;
  }

  async buscarPorCodigo(codCom) {
    const [rows] = await pool.query(
      `SELECT c.*, r.descripcion AS descripcion_regional
       FROM comunidad c
       LEFT JOIN regional r ON c.cod_reg = r.cod_reg
       WHERE c.cod_com = ?`, [codCom]
    );
    if (!rows.length) return null;
    const com = new Comunidad(rows[0]);
    com.descripcion_regional = rows[0].descripcion_regional;
    return com;
  }

  async crear(datos) {
    const { cod_reg, cod_com, descripcion, descripcion_corta, estado, usuario_registro } = datos;
    await pool.query(
      `INSERT INTO comunidad (cod_reg, cod_com, descripcion, descripcion_corta, estado, usuario_registro, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [cod_reg, cod_com, descripcion, descripcion_corta, estado, usuario_registro]
    );
  }

  async actualizar(id, campos) {
    const keys = Object.keys(campos);
    if (keys.length === 0) return;
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => campos[key]);
    await pool.query(
      `UPDATE comunidad SET ${setClause}, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [...values, id]
    );
  }

  async eliminar(id, estado, usuarioModificador) {
    await pool.query(
      `UPDATE comunidad SET estado = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [estado, usuarioModificador, id]
    );
  }

  async activar(id, estadoActivo, usuarioModificador) {
  await pool.query(
    `UPDATE comunidad SET estado = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
    [estadoActivo, usuarioModificador, id]
  );
}
}