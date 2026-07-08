import pool from '../config/database.js';
import { UsuarioRol } from '../models/usuario-rol.model.js';
import { config } from '../config/configuracion.js';

export class UsuarioRolRepository {
  /**
   * Busca una asignación existente (cualquier estado) por usuario y rol.
   */
  async findAsignacion(usuarioId, rolId) {
    const [rows] = await pool.query(
      'SELECT * FROM usuario_rol WHERE usuario_id = ? AND rol_id = ?',
      [usuarioId, rolId]
    );
    return rows.length ? new UsuarioRol(rows[0]) : null;
  }

 

  /**
   * Actualiza el estado y el usuario que modifica de una asignación.
   */
  async actualizarEstado(id, estado, usuarioModificador) {
    await pool.query(
      `UPDATE usuario_rol SET estado_usuario_rol = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [estado, usuarioModificador, id]
    );
  }
  
  async desactivarAsignacion(usuarioId, rolId, usuarioModificador) {
  await pool.query(
    `UPDATE usuario_rol 
     SET estado_usuario_rol = ?, fecha_hasta = NOW(), 
         usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW()
     WHERE usuario_id = ? AND rol_id = ? AND estado_usuario_rol = 'ACT'`,
    ['INA', usuarioModificador, usuarioId, rolId]
  );
}
  /**
   * Lista todas las asignaciones de un usuario (con JOIN para nombre del rol).
   */
 async listarPorUsuario(usuarioId) {
  const [rows] = await pool.query(
    `SELECT ur.id, ur.rol_id, r.nombre AS rol_nombre, ur.estado_usuario_rol, 
            ur.fecha_asignacion, ur.fecha_desde, ur.fecha_hasta
     FROM usuario_rol ur 
     INNER JOIN roles r ON ur.rol_id = r.id 
     WHERE ur.usuario_id = ?
     ORDER BY ur.fecha_asignacion DESC`,  // opcional, para ordenar por la más reciente
    [usuarioId]
  );
  return rows;
}


  /**
   * Lista todos los usuarios asignados a un rol (con JOIN para datos del usuario).
   */
  async listarPorRol(rolId) {
    const [rows] = await pool.query(
      `SELECT ur.*, u.nombres, u.email 
       FROM usuario_rol ur 
       INNER JOIN usuarios u ON ur.usuario_id = u.id 
       WHERE ur.rol_id = ?`,
      [rolId]
    );
    return rows;
  }


    /**
   * Inactiva todas las asignaciones activas de un usuario y rol.
   */
  async inactivarAsignacionPorUsuarioRol(usuarioId, rolId, usuarioModificador) {
    await pool.query(
      `UPDATE usuario_rol 
       SET estado_usuario_rol = ?, fecha_hasta = NOW(), usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW()
       WHERE usuario_id = ? AND rol_id = ? AND estado_usuario_rol = ?`,
      [config.ESTADOS_USUARIO_ROL.INACTIVO, usuarioModificador, usuarioId, rolId, config.ESTADOS_USUARIO_ROL.ACTIVO]
    );
  }

  /**
   * Crea una nueva asignación con fechas opcionales.
   */
  async crearAsignacion(usuarioId, rolId, asignadoPor, fechaDesde = null, fechaHasta = null) {
    await pool.query(
      `INSERT INTO usuario_rol (usuario_id, rol_id, estado_usuario_rol, asignado_por, fecha_asignacion, fecha_desde, fecha_hasta)
       VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
      [
        usuarioId,
        rolId,
        config.ESTADOS_USUARIO_ROL.ACTIVO,
        asignadoPor,
        fechaDesde || new Date(), // si no se proporciona, fecha actual
        fechaHasta || null,
      ]
    );
  }
async findActiveAsignacionByUsuario(usuarioId) {
  const [rows] = await pool.query(
    `SELECT * FROM usuario_rol 
     WHERE usuario_id = ? AND estado_usuario_rol = ?`,
    [usuarioId, config.ESTADOS_USUARIO_ROL.ACTIVO]   // 'ACT'
  );
  return rows.length ? new UsuarioRol(rows[0]) : null;
}

  /**
 * Busca la asignación ACTIVA para un usuario y rol específicos.
 * @returns {Promise<UsuarioRol|null>}
 */
async findActiveAsignacion(usuarioId, rolId) {
  const [rows] = await pool.query(
    `SELECT * FROM usuario_rol 
     WHERE usuario_id = ? AND rol_id = ? AND estado_usuario_rol = ?`,
    [usuarioId, rolId, config.ESTADOS_USUARIO_ROL.ACTIVO]
  );
  return rows.length ? new UsuarioRol(rows[0]) : null;
}


/**
 * Inactiva todos los roles activos de un usuario.
 */
async inactivarTodosRolesActivos(usuarioId, usuarioModificador) {
  await pool.query(
    `UPDATE usuario_rol 
     SET estado_usuario_rol = ?, fecha_hasta = NOW(), usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW()
     WHERE usuario_id = ? AND estado_usuario_rol = ?`,
    [config.ESTADOS_USUARIO_ROL.INACTIVO, usuarioModificador, usuarioId, config.ESTADOS_USUARIO_ROL.ACTIVO]
  );
}
  /**
   * Busca una asignación por su ID.
   */
  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM usuario_rol WHERE id = ?', [id]);
    return rows.length ? new UsuarioRol(rows[0]) : null;
  }
}