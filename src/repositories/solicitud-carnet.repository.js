import pool from '../config/database.js';
import { SolicitudCarnet } from '../models/solicitud-carnet.model.js';

export class SolicitudCarnetRepository {
  async listar(filtros = {}) {
  let query = `
    SELECT s.*,
           p.nombres, p.primer_apellido, p.segundo_apellido, p.documento_identidad,
           pg.fecha_inicio AS prog_fecha_inicio, pg.fecha_fin AS prog_fecha_fin,
           c.descripcion AS comunidad_descripcion,
           c.cod_com AS cod_com,
           r.descripcion AS regional_descripcion,
           r.cod_reg AS cod_reg,
           pv.descripcion AS provincia_descripcion,
           pv.cod_prov AS cod_prov,
           d.descripcion AS departamento_descripcion,
           d.cod_dep AS cod_dep
    FROM solicitud_carnet s
    JOIN persona p ON s.persona_id = p.id
    LEFT JOIN programacion_carnetizacion pg ON s.programacion_id = pg.id
    LEFT JOIN comunidad c ON p.cod_com = c.cod_com
    LEFT JOIN regional r ON c.cod_reg = r.cod_reg
    LEFT JOIN provincia pv ON r.cod_prov = pv.cod_prov
    LEFT JOIN departamento d ON pv.cod_dep = d.cod_dep
    WHERE 1=1
  `;
  const params = [];

  if (filtros.estado_solicitud) {
    query += ' AND s.estado_solicitud = ?';
    params.push(filtros.estado_solicitud);
  }
  if (filtros.persona_id) {
    query += ' AND s.persona_id = ?';
    params.push(filtros.persona_id);
  }
  if (filtros.cod_reg) {
  query += ' AND r.cod_reg = ?';
  params.push(filtros.cod_reg);
}
if (filtros.cod_com) {
    query += ' AND c.cod_com = ?';
    params.push(filtros.cod_com);
  }
  if (filtros.q) {
    const like = `%${filtros.q}%`;
    query += ` AND (
      p.nombres LIKE ? OR
      p.primer_apellido LIKE ? OR
      p.segundo_apellido LIKE ? OR
      p.cod_socio LIKE ? OR
      p.cod_persona LIKE ? OR
      p.documento_identidad LIKE ?
    )`;
    params.push(like, like, like, like, like, like);
  }
  query += ' ORDER BY s.fecha_solicitud DESC';
  const [rows] = await pool.query(query, params);
  
  return rows.map(row => {
    const sol = new SolicitudCarnet(row);
    // Datos de la persona
    sol.nombres = row.nombres;
    sol.primer_apellido = row.primer_apellido;
    sol.segundo_apellido = row.segundo_apellido;
    sol.documento_identidad = row.documento_identidad;
    // Datos de la programación
    sol.prog_fecha_inicio = row.prog_fecha_inicio;
    sol.prog_fecha_fin = row.prog_fecha_fin;
    // Datos geográficos
    sol.comunidad_descripcion = row.comunidad_descripcion;
    sol.cod_com = row.cod_com;
    sol.regional_descripcion = row.regional_descripcion;
    sol.cod_reg = row.cod_reg;
    sol.provincia_descripcion = row.provincia_descripcion;
    sol.cod_prov = row.cod_prov;
    sol.departamento_descripcion = row.departamento_descripcion;
    sol.cod_dep = row.cod_dep;
    return sol;
  });
}

  async buscarPorId(id) {
  const [rows] = await pool.query(
    `SELECT s.*,
            p.nombres, p.primer_apellido, p.segundo_apellido, p.documento_identidad,
            pg.fecha_inicio AS prog_fecha_inicio, pg.fecha_fin AS prog_fecha_fin,
            c.descripcion AS comunidad_descripcion,
            c.cod_com AS cod_com,
            r.descripcion AS regional_descripcion,
            r.cod_reg AS cod_reg,
            pv.descripcion AS provincia_descripcion,
            pv.cod_prov AS cod_prov,
            d.descripcion AS departamento_descripcion,
            d.cod_dep AS cod_dep
     FROM solicitud_carnet s
     JOIN persona p ON s.persona_id = p.id
     LEFT JOIN programacion_carnetizacion pg ON s.programacion_id = pg.id
     LEFT JOIN comunidad c ON p.cod_com = c.cod_com
     LEFT JOIN regional r ON c.cod_reg = r.cod_reg
     LEFT JOIN provincia pv ON r.cod_prov = pv.cod_prov
     LEFT JOIN departamento d ON pv.cod_dep = d.cod_dep
     WHERE s.id = ?`,
    [id]
  );
  
  if (!rows.length) return null;
  
  const sol = new SolicitudCarnet(rows[0]);
  sol.nombres = rows[0].nombres;
  sol.primer_apellido = rows[0].primer_apellido;
  sol.segundo_apellido = rows[0].segundo_apellido;
  sol.documento_identidad = rows[0].documento_identidad;
  sol.prog_fecha_inicio = rows[0].prog_fecha_inicio;
  sol.prog_fecha_fin = rows[0].prog_fecha_fin;
  sol.comunidad_descripcion = rows[0].comunidad_descripcion;
  sol.cod_com = rows[0].cod_com;
  sol.regional_descripcion = rows[0].regional_descripcion;
  sol.cod_reg = rows[0].cod_reg;
  sol.provincia_descripcion = rows[0].provincia_descripcion;
  sol.cod_prov = rows[0].cod_prov;
  sol.departamento_descripcion = rows[0].departamento_descripcion;
  sol.cod_dep = rows[0].cod_dep;
  return sol;
}

  async crear(datos) {
    const {
      persona_id, programacion_id, aval_comunidad, aval_regional, aval_otros,
      foto, fecha_vigencia, estado_solicitud, usuario_registro, observaciones,
    } = datos;
    const [result] = await pool.query(
      `INSERT INTO solicitud_carnet
       (persona_id, programacion_id, aval_comunidad, aval_regional, aval_otros, foto, fecha_vigencia, estado_solicitud, usuario_registro, observaciones, fecha_creacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [persona_id, programacion_id, aval_comunidad ? 1 : 0, aval_regional ? 1 : 0, aval_otros ? 1 : 0, foto, fecha_vigencia, estado_solicitud, usuario_registro, observaciones]
    );
    return this.buscarPorId(result.insertId);
  }

  async actualizar(id, campos) {
    const keys = Object.keys(campos);
    if (keys.length === 0) return null;
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => campos[k]);
    await pool.query(
      `UPDATE solicitud_carnet SET ${setClause}, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [...values, id]
    );
    return this.buscarPorId(id);
  }

  async actualizarEstado(id, estado, usuarioModificador) {
    await pool.query(
      `UPDATE solicitud_carnet SET estado_solicitud = ?, usuario_ultima_modificacion = ? WHERE id = ?`,
      [estado, usuarioModificador, id]
    );
    return this.buscarPorId(id);
  }

  async buscarActivaPorPersona(personaId) {
  const [rows] = await pool.query(
    `SELECT * FROM solicitud_carnet WHERE persona_id = ? AND estado_solicitud IN ('PEN', 'APR')`,
    [personaId]
  );
  return rows.length ? new SolicitudCarnet(rows[0]) : null;
}
}