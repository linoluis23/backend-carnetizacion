import pool from '../config/database.js';
import { Rol } from '../models/rol.model.js';

export class RolRepository {
  async buscarPorNombre(nombre) {
    const [rows] = await pool.query('SELECT * FROM roles WHERE nombre = ?', [nombre]);
    return rows.length ? new Rol(rows[0]) : null;
  }

  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
    return rows.length ? new Rol(rows[0]) : null;
  }

  async listarRoles() {
    const [rows] = await pool.query('SELECT * FROM roles ORDER BY nombre ASC');
    return rows.map(row => new Rol(row));
  }

  async crear(rolData) {
    const { nombre, descripcion, estado_rol, usuario_registro } = rolData;
    const [result] = await pool.query(
      `INSERT INTO roles (nombre, descripcion, estado_rol, usuario_registro, fecha_creacion)
       VALUES (?, ?, ?, ?, NOW())`,
      [nombre, descripcion, estado_rol, usuario_registro]
    );
    const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [result.insertId]);
    return new Rol(rows[0]);
  }

  async actualizar(id, campos) {
    const keys = Object.keys(campos);
    if (keys.length === 0) return null;
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => campos[key]);
    await pool.query(
      `UPDATE roles SET ${setClause}, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [...values, id]
    );
    const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
    return new Rol(rows[0]);
  }

  async eliminar(id) {
    // Eliminación lógica: pasar a estado inactivo (INA)
    // Pero mejor usar el servicio, aquí solo ejecutamos UPDATE.
    // Dejaremos que el servicio decida el estado.
    // Para reutilizar, aquí no hacemos nada específico.
  }
}