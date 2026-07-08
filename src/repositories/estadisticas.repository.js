import pool from '../config/database.js';

export class EstadisticasRepository {
  async contarUsuariosActivos() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM usuarios WHERE estado_usuario = 'ACT'`
    );
    return rows[0].total;
  }

  async contarRolesActivos() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM roles WHERE estado_rol = 'ACT'`
    );
    return rows[0].total;
  }

  async contarComunidadesActivas() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM comunidad WHERE estado = 'ACT'`
    );
    return rows[0].total;
  }

  async obtenerUltimosUsuarios(limite = 5) {
    const [rows] = await pool.query(
      `SELECT nombres, primer_apellido, email, fecha_creacion 
       FROM usuarios 
       ORDER BY fecha_creacion DESC 
       LIMIT ?`,
      [limite]
    );
    return rows;
  }
}