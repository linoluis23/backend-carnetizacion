import pool from '../config/database.js';
import { SolicitudCarnet } from '../models/solicitud-carnet.model.js';

export class SolicitudCarnetRepository {
  async listar(filtros = {}, usuario = null) {
    let query = `
      SELECT s.*,
             p.nombres, p.primer_apellido, p.segundo_apellido, p.documento_identidad,
             p.cod_socio, p.cod_persona,
             pg.fecha_inicio AS prog_fecha_inicio, pg.fecha_fin AS prog_fecha_fin,
             c.descripcion AS comunidad_descripcion, c.cod_com AS cod_com,
             r.descripcion AS regional_descripcion, r.cod_reg AS cod_reg,
             pv.descripcion AS provincia_descripcion, pv.cod_prov AS cod_prov,
             d.descripcion AS departamento_descripcion, d.cod_dep AS cod_dep
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
    if (filtros.cod_dep) {
  query += ' AND d.cod_dep = ?';
  params.push(filtros.cod_dep);
}
 // ✅ FILTRO POR ÁMBITO GEOGRÁFICO (según el rol del usuario)
  if (usuario && usuario.documento_identidad) {
    // Obtener la autoridad del usuario
    const [autoridadRows] = await pool.query(
       //const [autoridadRows] = await pool.query(
       `SELECT a.*, c.nivel 
       FROM autoridades a
       JOIN cargos c ON a.cargo_id = c.id
       JOIN persona p ON a.persona_id = p.id
       WHERE p.documento_identidad = ? AND a.estado = 'ACT'`,
      [usuario.documento_identidad]
    );
    console.log('🔍 Autoridad encontrada:', autoridadRows);

    if (autoridadRows.length > 0) {
      const autoridad = autoridadRows[0];
      const nivel = autoridad.nivel;

      if (nivel === 'COMUNAL' && autoridad.cod_com) {
        query += ' AND c.cod_com = ?';
        params.push(autoridad.cod_com);
                console.log(`✅ Filtro COMUNAL: cod_com = ${autoridad.cod_com}`);

      } else if (nivel === 'REGIONAL' && autoridad.cod_reg) {
        query += ' AND r.cod_reg = ?';
        params.push(autoridad.cod_reg);
                console.log(`✅ Filtro REGIONAL: cod_reg = ${autoridad.cod_reg}`);

      } else if (nivel === 'DEPARTAMENTAL' && autoridad.cod_dep) {
        query += ' AND d.cod_dep = ?';
        params.push(autoridad.cod_dep);
                console.log(`✅ Filtro DEPARTAMENTAL: cod_dep = ${autoridad.cod_dep}`);

      }else {
        console.log('⚠️ Autoridad sin ámbito definido o nivel no reconocido.');
      }
      
      // Si es ADMIN, no se aplica filtro (ve todo)
    }
    else {
      console.log('⚠️ Usuario sin autoridad activa. No se aplica filtro (ve todo).');
    }
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
    return rows.map(row => new SolicitudCarnet(row));
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT s.*,
              p.nombres, p.primer_apellido, p.segundo_apellido, p.documento_identidad,
              p.cod_socio, p.cod_persona,
              pg.fecha_inicio AS prog_fecha_inicio, pg.fecha_fin AS prog_fecha_fin,
              c.descripcion AS comunidad_descripcion, c.cod_com AS cod_com,
              r.descripcion AS regional_descripcion, r.cod_reg AS cod_reg,
              pv.descripcion AS provincia_descripcion, pv.cod_prov AS cod_prov,
              d.descripcion AS departamento_descripcion, d.cod_dep AS cod_dep
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
    return new SolicitudCarnet(rows[0]);
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
      `UPDATE solicitud_carnet SET estado_solicitud = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
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