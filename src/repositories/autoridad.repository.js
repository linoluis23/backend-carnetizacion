import pool from '../config/database.js';
import { Autoridad } from '../models/autoridad.model.js';

export class AutoridadRepository {
  /**
   * Lista las autoridades con la cadena geográfica completa.
   * @param {object} filtros - { estado, cargo_id, cod_dep, cod_reg, cod_com }
   * @returns {Promise<Autoridad[]>}
   */
  async listar(filtros = {}) {
    let query = `
      SELECT a.*,
         c2.cod_cargo, c2.descripcion AS cargo_descripcion, c2.nivel AS cargo_nivel,
         p.nombres, p.primer_apellido, p.segundo_apellido, p.documento_identidad,
         d.cod_dep, d.descripcion AS dep_descripcion,
         pv.cod_prov, pv.descripcion AS prov_descripcion,
         r.cod_reg, r.descripcion AS reg_descripcion,
         com.cod_com, com.descripcion AS com_descripcion,
         ca.id AS certificado_id,
         ca.estado AS certificado_estado,
         ca.fecha_expiracion AS certificado_expiracion,
         CASE WHEN ca.id IS NOT NULL AND ca.estado = 'ACT' THEN 1 ELSE 0 END AS tiene_certificado
  FROM autoridades a
  LEFT JOIN cargos c2 ON a.cargo_id = c2.id
  LEFT JOIN persona p ON a.persona_id = p.id
  LEFT JOIN comunidad com ON p.cod_com = com.cod_com
  LEFT JOIN regional r ON com.cod_reg = r.cod_reg
  LEFT JOIN provincia pv ON r.cod_prov = pv.cod_prov
  LEFT JOIN departamento d ON pv.cod_dep = d.cod_dep
  LEFT JOIN certificados_autoridad ca ON a.id = ca.autoridad_id AND ca.estado = 'ACT'
  WHERE 1=1
    `;
    const params = [];

    if (filtros.estado) {
      query += ' AND a.estado = ?';
      params.push(filtros.estado);
    }
    if (filtros.cargo_id) {
      query += ' AND a.cargo_id = ?';
      params.push(filtros.cargo_id);
    }
    if (filtros.cod_dep) {
      query += ' AND d.cod_dep = ?';
      params.push(filtros.cod_dep);
    }
    if (filtros.cod_reg) {
      query += ' AND r.cod_reg = ?';
      params.push(filtros.cod_reg);
    }
    if (filtros.cod_com) {
      query += ' AND c.cod_com = ?';
      params.push(filtros.cod_com);
    }
    if (filtros.nombres) {
  query += ` AND (p.nombres LIKE ? OR p.primer_apellido LIKE ? OR p.segundo_apellido LIKE ? OR p.documento_identidad LIKE ?)`;
  const like = `%${filtros.nombres}%`;
  params.push(like, like, like, like);
}

    query += ' ORDER BY a.fecha_inicio DESC';
    const [rows] = await pool.query(query, params);
    return rows.map(row => {
      const autoridad = new Autoridad(row);
      autoridad.cod_cargo = row.cod_cargo;
      autoridad.cargo_descripcion = row.cargo_descripcion;
      autoridad.cargo_nivel = row.cargo_nivel;
      autoridad.nombres = row.nombres;
      autoridad.primer_apellido = row.primer_apellido;
      autoridad.segundo_apellido = row.segundo_apellido;
      autoridad.documento_identidad = row.documento_identidad;
      autoridad.cod_dep = row.cod_dep;
      autoridad.dep_descripcion = row.dep_descripcion;
      autoridad.cod_prov = row.cod_prov;
      autoridad.prov_descripcion = row.prov_descripcion;
      autoridad.cod_reg = row.cod_reg;
      autoridad.reg_descripcion = row.reg_descripcion;
      autoridad.cod_com = row.cod_com;
      autoridad.com_descripcion = row.com_descripcion;
      autoridad.glosa = row.glosa;
      autoridad.tiene_certificado = row.tiene_certificado === 1;
      autoridad.certificado_activo_id = row.certificado_activo_id || null;
      autoridad.certificado_id = row.certificado_id;
      autoridad.certificado_estado = row.certificado_estado;
      autoridad.certificado_expiracion = row.certificado_expiracion;
      return autoridad;
    });
  }

  /**
   * Busca una autoridad por su ID.
   */

async buscarPorId(id) {
  try {
    const [rows] = await pool.query(
      `SELECT a.*,
              c2.cod_cargo, c2.descripcion AS cargo_descripcion, c2.nivel AS cargo_nivel,
              p.nombres, p.primer_apellido, p.segundo_apellido, p.documento_identidad,
              d.cod_dep, d.descripcion AS dep_descripcion,
              pv.cod_prov, pv.descripcion AS prov_descripcion,
              r.cod_reg, r.descripcion AS reg_descripcion,
              com.cod_com, com.descripcion AS com_descripcion,
              (SELECT EXISTS(
                 SELECT 1 FROM certificados_autoridad ca
                 WHERE ca.autoridad_id = a.id AND ca.estado = 'ACT'
               )) AS tiene_certificado
       FROM autoridades a
       LEFT JOIN cargos c2 ON a.cargo_id = c2.id
       LEFT JOIN persona p ON a.persona_id = p.id
       LEFT JOIN comunidad com ON p.cod_com = com.cod_com
       LEFT JOIN regional r ON com.cod_reg = r.cod_reg
       LEFT JOIN provincia pv ON r.cod_prov = pv.cod_prov
       LEFT JOIN departamento d ON pv.cod_dep = d.cod_dep
       WHERE a.id = ?`,
      [id]
    );
    if (!rows.length) return null;

    const row = rows[0];
    const autoridad = new Autoridad(row);
    // Asignar propiedades extendidas
    autoridad.cod_cargo = row.cod_cargo;
    autoridad.cargo_descripcion = row.cargo_descripcion;
    autoridad.cargo_nivel = row.cargo_nivel;
    autoridad.nombres = row.nombres;
    autoridad.primer_apellido = row.primer_apellido;
    autoridad.segundo_apellido = row.segundo_apellido;
    autoridad.documento_identidad = row.documento_identidad;
    autoridad.cod_dep = row.cod_dep;
    autoridad.dep_descripcion = row.dep_descripcion;
    autoridad.cod_prov = row.cod_prov;
    autoridad.prov_descripcion = row.prov_descripcion;
    autoridad.cod_reg = row.cod_reg;
    autoridad.reg_descripcion = row.reg_descripcion;
    autoridad.cod_com = row.cod_com;
    autoridad.com_descripcion = row.com_descripcion;
    autoridad.tiene_certificado = row.tiene_certificado === 1;
    return autoridad;
  } catch (error) {
    console.error('Error en buscarPorId:', error);
    throw error;
  }
}

  /**
   * Crea una nueva autoridad.
   */
async crear(datos) {
  const { cargo_id, persona_id, cod_dep, cod_reg, cod_com, fecha_inicio, fecha_fin, estado, usuario_registro, glosa } = datos;
  const [result] = await pool.query(
    `INSERT INTO autoridades (cargo_id, persona_id, cod_dep, cod_reg, cod_com, fecha_inicio, fecha_fin, estado, usuario_registro, glosa, fecha_creacion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [cargo_id, persona_id, cod_dep, cod_reg, cod_com, fecha_inicio, fecha_fin, estado, usuario_registro, glosa || null]
  );
  return this.buscarPorId(result.insertId);
}

  /**
   * Actualiza campos de una autoridad.
   */
  async actualizar(id, campos) {
    console.log('🗃️ campos recibidos en repositorio:', campos); 
    const keys = Object.keys(campos);
    if (keys.length === 0) return;
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => campos[k]);
      console.log('🗄️ SQL:', `UPDATE autoridades SET ${setClause} WHERE id = ?`);
  console.log('🗄️ Values:', [...values, id]);
    await pool.query(
      `UPDATE autoridades SET ${setClause}, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [...values, id]
    );
    return this.buscarPorId(id);
  }

  /**
   * Cambia solo el estado de una autoridad.
   */
  async actualizarEstado(id, estado, usuarioModificador) {
    await pool.query(
      `UPDATE autoridades SET estado = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [estado, usuarioModificador, id]
    );
    return this.buscarPorId(id);
  }

  /**
   * Verifica si existe una autoridad activa del mismo cargo y ámbito que se solape con las fechas dadas.
   */
  async existeSolapamiento(cargoId, ambito, fechaInicio, fechaFin, excluirId = null) {
    let query = `
      SELECT COUNT(*) AS total FROM autoridades
      WHERE cargo_id = ? AND estado = 'ACT'
    `;
    const params = [cargoId];

    if (ambito.cod_dep !== undefined) {
      query += ' AND cod_dep = ?';
      params.push(ambito.cod_dep);
    }
    if (ambito.cod_reg !== undefined) {
      query += ' AND cod_reg = ?';
      params.push(ambito.cod_reg);
    }
    if (ambito.cod_com !== undefined) {
      query += ' AND cod_com = ?';
      params.push(ambito.cod_com);
    }

    query += ` AND (
      (fecha_inicio <= ? AND (fecha_fin IS NULL OR fecha_fin >= ?))
      OR (fecha_inicio <= ? AND fecha_fin IS NULL)
      OR (? <= fecha_inicio AND ? >= fecha_inicio)
    )`;
    const fInicio = fechaInicio;
    const fFin = fechaFin || '9999-12-31';
    params.push(fFin, fInicio, fFin, fInicio, fFin);

    if (excluirId !== null) {
      query += ' AND id != ?';
      params.push(excluirId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total > 0;
  }

  /**
   * Busca la autoridad ACTIVA de una persona (sin importar el cargo).
   */
  async buscarActivaPorPersona(personaId) {
    const [rows] = await pool.query(
      'SELECT * FROM autoridades WHERE persona_id = ? AND estado = ?',
      [personaId, 'ACT']
    );
    return rows.length ? new Autoridad(rows[0]) : null;
  }

  /**
   * Busca la autoridad ACTIVA para un cargo y ámbito específicos.
   */
  async buscarActivaPorCargoYAmbito(cargoId, ambito) {
    let query = 'SELECT * FROM autoridades WHERE cargo_id = ? AND estado = ?';
    const params = [cargoId, 'ACT'];

    if (ambito.cod_dep !== undefined) {
      query += ' AND cod_dep = ?';
      params.push(ambito.cod_dep);
    }
    if (ambito.cod_reg !== undefined) {
      query += ' AND cod_reg = ?';
      params.push(ambito.cod_reg);
    }
    if (ambito.cod_com !== undefined) {
      query += ' AND cod_com = ?';
      params.push(ambito.cod_com);
    }

    const [rows] = await pool.query(query, params);
    return rows.length ? new Autoridad(rows[0]) : null;
  }

  /**
   * Desactiva una autoridad estableciendo su estado y fecha_fin.
   */
  async desactivarAutoridad(id, estado, fechaFin) {
    await pool.query(
      'UPDATE autoridades SET estado = ?, fecha_fin = ? WHERE id = ?',
      [estado, fechaFin, id]
    );
  }

  /**
 * Busca una autoridad ACTIVA para un cargo y ámbito, excluyendo un ID.
 * @param {number} cargoId
 * @param {object} ambito - { cod_dep, cod_reg, cod_com } (solo uno estará presente)
 * @param {number} excluirId - ID a excluir
 * @returns {Promise<Autoridad|null>}
 */
async buscarActivaPorCargoYAmbitoExcluyendo(cargoId, ambito, excluirId) {
  let query = 'SELECT * FROM autoridades WHERE cargo_id = ? AND estado = ?';
  const params = [cargoId, 'ACT'];

  if (ambito.cod_dep !== undefined) {
    query += ' AND cod_dep = ?';
    params.push(ambito.cod_dep);
  }
  if (ambito.cod_reg !== undefined) {
    query += ' AND cod_reg = ?';
    params.push(ambito.cod_reg);
  }
  if (ambito.cod_com !== undefined) {
    query += ' AND cod_com = ?';
    params.push(ambito.cod_com);
  }

  query += ' AND id != ?';
  params.push(excluirId);

  const [rows] = await pool.query(query, params);
  return rows.length ? new Autoridad(rows[0]) : null;
}
}