import pool from '../config/database.js';
import { Usuario } from '../models/usuario.model.js';
import { AppError } from '../utils/errores.util.js';
//import { UsuarioRepository } from '../repositories/usuario.repository.js';


export class UsuarioRepository {
  /**
   * Busca un usuario por su email.
   * @param {string} email
   * @returns {Promise<Usuario|null>}
   */
  async buscarPorEmail(email) {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?' , [email]);
    return rows.length ? new Usuario(rows[0]) : null;
  }

  /**
   * Crea un nuevo usuario.
   * @param {object} usuarioDatos - Campos a insertar.
   * @returns {Promise<Usuario>} Usuario creado.
   */
  async crear(usuarioDatos) {
    const {
      primer_apellido,
      segundo_apellido,
      nombres,
      email,
      password,
      estado_usuario,
      usuario_registro,documento_identidad,
    } = usuarioDatos;
    const [result] = await pool.query(
      `INSERT INTO usuarios 
      (primer_apellido, segundo_apellido, nombres, email, documento_identidad,password, estado_usuario, usuario_registro, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, ?, ?,?, NOW())`,
      [primer_apellido, segundo_apellido, nombres, email, documento_identidad, password, estado_usuario, usuario_registro]
    );
    // Recuperar el registro completo
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [result.insertId]);
    return new Usuario(rows[0]);
  }

  /**
   * Actualiza campos de un usuario por su id.
   * @param {number} id
   * @param {object} datos - Campos a actualizar.
   * @returns {Promise<Usuario>}
   */
  async actualizar(id, datos) {
    const fields = Object.keys(datos)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(datos);
    await pool.query(`UPDATE usuarios SET ${fields}, fecha_ultima_actualizacion = NOW() WHERE id = ?`, [...values, id]);
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    return new Usuario(rows[0]);
  }

  /**
   * Incrementa el contador de intentos fallidos y actualiza la fecha del último fallo.
   * @param {number} id
   * @returns {Promise<void>}
   */
  async incrementarIntentosFallidos(id) {
    await pool.query(
      `UPDATE usuarios SET intentos_fallidos = COALESCE(intentos_fallidos, 0) + 1, ultimo_intento_fallo = NOW() WHERE id = ?`,
      [id]
    );
  }

  /**
   * Bloquea al usuario estableciendo el campo bloqueado y bloqueado_hasta.
   * @param {number} id
   * @param {Date} hasta - Fecha y hora de desbloqueo.
   * @returns {Promise<void>}
   */
  async bloquearUsuario(id, hasta) {
    await pool.query(
      `UPDATE usuarios SET bloqueado = 1, bloqueado_hasta = ? WHERE id = ?`,
      [hasta, id]
    );
  }

  /**
   * Restablece los intentos fallidos y desbloquea si corresponde.
   * @param {number} id
   */
  async resetearIntentosFallidos(id) {
    await pool.query(
      `UPDATE usuarios SET intentos_fallidos = 0, bloqueado = 0, bloqueado_hasta = NULL WHERE id = ?`,
      [id]
    );
  }

  /**
   * Actualiza el último acceso del usuario.
   * @param {number} id
   */
  async actualizarUltimoAcceso(id) {
    await pool.query(`UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?`, [id]);
  }

    /**
   * Busca un usuario por su id.
   * @param {number} id
   * @returns {Promise<Usuario|null>}
   */
  async buscarPorId(id) {
     if (isNaN(id) || id <= 0) {
    throw new AppError('ID de usuario inválido.', 400);
  }
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    return rows.length ? new Usuario(rows[0]) : null;
  } catch (error) {
    console.error(`Error en buscarPorId (id=${id}):`, error);
    throw error; // o lanzar un AppError
  }
}

    /**
   * Listar usuarios con filtros opcionales.
   * @param {object} filtros - { estado_usuario, email, nombres }
   * @returns {Promise<Usuario[]>}
   */
  async listarUsuarios(filtros = {}) {
    let query = 'SELECT * FROM usuarios WHERE 1=1';
    const params = [];

    if (filtros.estado_usuario) {
      query += ' AND estado_usuario = ?';
      params.push(filtros.estado_usuario);
    }
    if (filtros.email) {
      query += ' AND email LIKE ?';
      params.push(`%${filtros.email}%`);
    }
    if (filtros.nombres) {
      query += ' AND nombres LIKE ?';
      params.push(`%${filtros.nombres}%`);
    }
    
    query += ' ORDER BY id_usuario DESC';
    const [rows] = await pool.query(query, params);
    return rows.map(row => new Usuario(row));
  }

  

  /**
   * Actualiza solo el estado_usuario y el usuario que modifica.
   */
  async actualizarEstadoUsuario(id, estado, usuarioModificador) {
    await pool.query(
      `UPDATE usuarios SET estado_usuario = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [estado, usuarioModificador, id]
    );
  }

  /**
   * Actualiza campos de bloqueo (bloqueado, bloqueado_hasta).
   */
  async actualizarBloqueo(id, bloqueado, bloqueado_hasta, usuarioModificador) {
    await pool.query(
      `UPDATE usuarios SET bloqueado = ?, bloqueado_hasta = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [bloqueado, bloqueado_hasta, usuarioModificador, id]
    );
  }


    async actualizarPassword(id, nuevoHash, usuarioModificador) {
    await pool.query(
      `UPDATE usuarios SET password = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [nuevoHash, usuarioModificador, id]
    );
  }

  async listarUsuarios(filtros = {}) {
  let query = `
    SELECT u.*, 
           r.nombre AS rol_nombre,
           ur.rol_id AS rol_id
    FROM usuarios u
    LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id AND ur.estado_usuario_rol = 'ACT'
    LEFT JOIN roles r ON ur.rol_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (filtros.estado_usuario) {
    query += ' AND u.estado_usuario = ?';
    params.push(filtros.estado_usuario);
  }
  if (filtros.email) {
    query += ' AND u.email LIKE ?';
    params.push(`%${filtros.email}%`);
  }
  if (filtros.nombres) {
    query += ' AND u.nombres LIKE ?';
    params.push(`%${filtros.nombres}%`);
  }

  query += ' ORDER BY u.nombres ASC';
  const [rows] = await pool.query(query, params);
  return rows.map(row => {
    const usuario = new Usuario(row);
    usuario.rol_nombre = row.rol_nombre || null;
    usuario.rol_id = row.rol_id || null;
    return usuario;
  });
}
/**
 * Busca un usuario por su documento de identidad.
 * @param {string} documentoIdentidad
 * @returns {Promise<Usuario|null>}
 */
async buscarPorDocumento(documentoIdentidad) {
  
  const [rows] = await pool.query(
    'SELECT * FROM usuarios WHERE documento_identidad = ?',
    [documentoIdentidad]
  );
  return rows.length ? new Usuario(rows[0]) : null;
}

}