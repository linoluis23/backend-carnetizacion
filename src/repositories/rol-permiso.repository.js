import pool from '../config/database.js';

export class RolPermisoRepository {
  /**
   * Lista todos los permisos de un rol (con estado_rol_permiso = 'ACT').
   */
  async listarPorRol(rolId) {
    const [rows] = await pool.query(
      `SELECT rp.*, p.codigo, p.nombre, p.descripcion
       FROM rol_permiso rp
       JOIN permisos p ON rp.permiso_id = p.id
       WHERE rp.rol_id = ? AND rp.estado_rol_permiso = 'ACT'`,
      [rolId]
    );
    return rows;
  }

  /**
   * Asigna un permiso a un rol. Si ya existía (inactivo), lo reactiva.
   */
  async asignarPermiso(rolId, permisoId) {
    const [existente] = await pool.query(
      'SELECT id FROM rol_permiso WHERE rol_id = ? AND permiso_id = ?',
      [rolId, permisoId]
    );
    if (existente.length) {
      await pool.query(
        'UPDATE rol_permiso SET estado_rol_permiso = ? WHERE id = ?',
        ['ACT', existente[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO rol_permiso (rol_id, permiso_id, estado_rol_permiso) VALUES (?, ?, ?)',
        [rolId, permisoId, 'ACT']
      );
    }
  }

  /**
   * Elimina (inactiva) la asignación de un permiso a un rol.
   */
  async removerPermiso(rolId, permisoId) {
    await pool.query(
      'UPDATE rol_permiso SET estado_rol_permiso = ? WHERE rol_id = ? AND permiso_id = ?',
      ['INA', rolId, permisoId]
    );
  }

  /**
   * Obtiene los códigos de permiso activos para un rol específico.
   * @param {number} rolId
   * @returns {Promise<Array<{codigo: string, descripcion: string}>>}
   */
  async obtenerPermisosDeRol(rolId) {
    const [rows] = await pool.query(
      `SELECT p.codigo, p.nombre, p.descripcion
       FROM rol_permiso rp
       JOIN permisos p ON rp.permiso_id = p.id
       WHERE rp.rol_id = ? AND rp.estado_rol_permiso = 'ACT'`,
      [rolId]
    );
    return rows;
  }
}