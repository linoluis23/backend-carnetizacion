// src/repositories/secuencia-comunidad.repository.js
import pool from '../config/database.js';

export class SecuenciaComunidadRepository {
  async obtenerPorRegional(codReg, connection = null) {
    const conn = connection || pool;
    const [rows] = await conn.query(
      `SELECT ultimoCodigo, limiteSuperior 
       FROM secuencias_comunidad 
       WHERE cod_reg = ? 
       FOR UPDATE`,
      [codReg]
    );
    return rows.length ? rows[0] : null;
  }

  async actualizarUltimoCodigo(codReg, nuevoCodigo, connection = null) {
    const conn = connection || pool;
    await conn.query(
      `UPDATE secuencias_comunidad 
       SET ultimoCodigo = ? 
       WHERE cod_reg = ?`,
      [nuevoCodigo, codReg]
    );
  }
}