import pool from '../config/database.js';

export class RolPermisoRepository {
  /**
   * Obtiene los códigos de permiso activos para un rol específico.
   * @param {number} rolId
   * @returns {Promise<Array<{codigo: string, descripcion: string}>>}
   */
  async obtenerPermisosDeRol(rolId) {
    const [rows] = await pool.query(
      `SELECT p.codigo, p.descripcion
       FROM rol_permiso rp
       JOIN permisos p ON rp.permiso_id = p.id
       WHERE rp.rol_id = ? AND rp.estado_rol_permiso = 'ACT'`,
      [rolId]
    );
    return rows;
  }
}