import pool from '../config/database.js';
import { Programacion } from '../models/programacion.model.js';

export class ProgramacionRepository {
  async listar(filtros = {}) {
    let query = `
      SELECT p.*, r.descripcion AS regional_descripcion
      FROM programacion_carnetizacion p
      LEFT JOIN regional r ON p.cod_reg = r.cod_reg
      WHERE 1=1
    `;
    const params = [];

    if (filtros.estado) {
      query += ' AND p.estado = ?';
      params.push(filtros.estado);
    }
    if (filtros.cod_reg) {
      query += ' AND p.cod_reg = ?';
      params.push(filtros.cod_reg);
    }

    query += ' ORDER BY p.fecha_inicio DESC';
    const [rows] = await pool.query(query, params);
    return rows.map(row => {
      const prog = new Programacion(row);
      prog.regional_descripcion = row.regional_descripcion;
      return prog;
    });
  }

  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM programacion_carnetizacion WHERE id = ?', [id]);
    return rows.length ? new Programacion(rows[0]) : null;
  }

  async crear(datos) {
    const { cod_reg, fecha_inicio, fecha_fin, estado, usuario_registro, glosa } = datos;
    const [result] = await pool.query(
      `INSERT INTO programacion_carnetizacion (cod_reg, fecha_inicio, fecha_fin, estado, usuario_registro, glosa, fecha_creacion)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [cod_reg, fecha_inicio, fecha_fin, estado, usuario_registro, glosa || null]
    );
    return this.buscarPorId(result.insertId);
  }

  async actualizar(id, campos) {
    const keys = Object.keys(campos);
    if (keys.length === 0) return;
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => campos[k]);
    await pool.query(
      `UPDATE programacion_carnetizacion SET ${setClause}, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [...values, id]
    );
    return this.buscarPorId(id);
  }

  async actualizarEstado(id, estado, usuarioModificador) {
    await pool.query(
      `UPDATE programacion_carnetizacion SET estado = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [estado, usuarioModificador, id]
    );
    return this.buscarPorId(id);
  }

  /**
   * Verifica si existe solapamiento de fechas con otra programación ACTIVA de la misma regional.
   * @param {number} codReg - código de regional
   * @param {string} fechaInicio - inicio de la nueva programación
   * @param {string} fechaFin - fin de la nueva programación
   * @param {number|null} excluirId - ID a excluir (en edición)
   * @returns {Promise<boolean>} true si hay solapamiento
   */
  async existeSolapamiento(codReg, fechaInicio, fechaFin, excluirId = null) {
    let query = `
      SELECT COUNT(*) AS total FROM programacion_carnetizacion
      WHERE cod_reg = ? AND estado = 'ACT'
        AND (
          (fecha_inicio <= ? AND fecha_fin >= ?)  -- solapamiento parcial o total
          OR (fecha_inicio <= ? AND fecha_fin IS NULL)
          OR (? <= fecha_inicio AND ? >= fecha_inicio)
        )
    `;
    const params = [codReg, fechaFin, fechaInicio, fechaFin, fechaInicio, fechaFin];

    if (excluirId !== null) {
      query += ' AND id != ?';
      params.push(excluirId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total > 0;
  }
}