import pool from '../config/database.js';
import { Permiso } from '../models/permiso.model.js';

export class PermisoRepository {
  async listar() {
    // Puedes filtrar por estado != 'ELI' si quieres ocultar eliminados
    const [rows] = await pool.query('SELECT * FROM permisos WHERE estado_permiso != ? ORDER BY nombre ASC', ['ELI']);
    return rows.map(r => new Permiso(r));
  }

  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM permisos WHERE id = ?', [id]);
    return rows.length ? new Permiso(rows[0]) : null;
  }

  async buscarPorCodigo(codigo) {
    const [rows] = await pool.query('SELECT * FROM permisos WHERE codigo = ?', [codigo]);
    return rows.length ? new Permiso(rows[0]) : null;
  }

  async crear(permiso, usuarioRegistro) {
    const { codigo, nombre, descripcion, estado } = permiso;
    const [result] = await pool.query(
      `INSERT INTO permisos (codigo, nombre, descripcion, estado_permiso, usuario_registro, fecha_creacion)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [codigo, nombre, descripcion, estado || 'ACT', usuarioRegistro]
    );
    return this.buscarPorId(result.insertId);
  }

  async actualizar(id, campos, usuarioModificacion) {
    // Convertir 'estado' a 'estado_permiso' si existe
    if (campos.estado !== undefined) {
      campos.estado_permiso = campos.estado;
      delete campos.estado;
    }

    const keys = Object.keys(campos);
    if (keys.length === 0) return null;

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => campos[k]);
    values.push(usuarioModificacion, id);

    const sql = `UPDATE permisos SET ${setClause}, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`;
    await pool.query(sql, values);
    return this.buscarPorId(id);
  }

  // NUEVO: eliminación lógica
async eliminarLogico(id, usuarioModificacion) {
  await pool.query(
    `UPDATE permisos SET estado_permiso = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
    ['ELI', usuarioModificacion, id]
  );
}
}