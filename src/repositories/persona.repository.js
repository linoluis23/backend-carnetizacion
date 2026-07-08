import pool from '../config/database.js';
import { Persona } from '../models/persona.model.js';

export class PersonaRepository {
  async listar(filtros = {}) {
    let query = `
            SELECT p.*, 
           c.descripcion AS comunidad_descripcion,
           c.cod_reg AS cod_reg,                -- ← agregar
           r.descripcion AS regional_descripcion,
           r.cod_prov AS cod_prov,              -- ← agregar
           pv.descripcion AS provincia_descripcion,
           pv.cod_dep AS cod_dep,               -- ← agregar
           d.descripcion AS departamento_descripcion
      FROM persona p
      LEFT JOIN comunidad c ON p.cod_com = c.cod_com
      LEFT JOIN regional r ON c.cod_reg = r.cod_reg
      LEFT JOIN provincia pv ON r.cod_prov = pv.cod_prov
      LEFT JOIN departamento d ON pv.cod_dep = d.cod_dep
      WHERE 1=1
    `;
    const params = [];
    if (filtros.cod_prov) {
  query += ' AND r.cod_prov = ?';
  params.push(filtros.cod_prov);
    }
    if (filtros.cod_reg) {
  query += ' AND r.cod_reg = ?';
  params.push(filtros.cod_reg);
    }
    if (filtros.cod_com) {
      query += ' AND p.cod_com = ?';
      params.push(filtros.cod_com);
    }
    if (filtros.estado) {
      query += ' AND p.estado = ?';
      params.push(filtros.estado);
    }
    if (filtros.nombres) {
      query += ' AND (p.nombres LIKE ? OR p.primer_apellido LIKE ? OR p.segundo_apellido LIKE ?)';
      const like = `%${filtros.nombres}%`;
      params.push(like, like, like);
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
    query += ' ORDER BY p.primer_apellido, p.segundo_apellido, p.nombres ASC';
    const [rows] = await pool.query(query, params);
    return rows.map(row => {
      const persona = new Persona(row);
      persona.comunidad_descripcion = row.comunidad_descripcion;
      persona.regional_descripcion = row.regional_descripcion;
      persona.provincia_descripcion = row.provincia_descripcion; 
      persona.departamento_descripcion = row.departamento_descripcion;
        persona.cod_reg = row.cod_reg;     // ← agregar
        persona.cod_prov = row.cod_prov;   // ← agregar
        persona.cod_dep = row.cod_dep;     // ← agregar
      return persona;
    });
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT p.*, 
             c.descripcion AS comunidad_descripcion,
             r.descripcion AS regional_descripcion,
             pv.descripcion AS provincia_descripcion,
             d.descripcion AS departamento_descripcion
      FROM persona p
      LEFT JOIN comunidad c ON p.cod_com = c.cod_com
      LEFT JOIN regional r ON c.cod_reg = r.cod_reg
      LEFT JOIN provincia pv ON r.cod_prov = pv.cod_prov
      LEFT JOIN departamento d ON pv.cod_dep = d.cod_dep
           WHERE p.id = ?`, [id]
    );
    if (!rows.length) return null;
    const persona = new Persona(rows[0]);
    persona.comunidad_descripcion = rows[0].comunidad_descripcion;
      persona.regional_descripcion = rows[0].regional_descripcion;
      persona.provincia_descripcion = rows[0].provincia_descripcion; 
      persona.departamento_descripcion = rows[0].departamento_descripcion;
    return persona;
  }

  async buscarPorCodPersona(codPersona) {
    const [rows] = await pool.query(`SELECT p.*, 
              c.descripcion AS comunidad_descripcion,
              r.descripcion AS regional_descripcion,
              pv.descripcion AS provincia_descripcion,
              d.descripcion AS departamento_descripcion
       FROM persona p
       LEFT JOIN comunidad c ON p.cod_com = c.cod_com
       LEFT JOIN regional r ON c.cod_reg = r.cod_reg
       LEFT JOIN provincia pv ON r.cod_prov = pv.cod_prov
       LEFT JOIN departamento d ON pv.cod_dep = d.cod_dep
       WHERE p.cod_persona = ?`, [codPersona]);
    if (!rows.length) return null;
    const persona = new Persona(rows[0]);
        persona.comunidad_descripcion = rows[0].comunidad_descripcion;
      persona.regional_descripcion = rows[0].regional_descripcion;
      persona.provincia_descripcion = rows[0].provincia_descripcion; 
      persona.departamento_descripcion = rows[0].departamento_descripcion;
    return persona;
  }

  async buscarPorCodSocio(codSocio) {
    const [rows] = await pool.query(`SELECT p.*, 
              c.descripcion AS comunidad_descripcion,
              r.descripcion AS regional_descripcion,
              pv.descripcion AS provincia_descripcion,
              d.descripcion AS departamento_descripcion
       FROM persona p
       LEFT JOIN comunidad c ON p.cod_com = c.cod_com
       LEFT JOIN regional r ON c.cod_reg = r.cod_reg
       LEFT JOIN provincia pv ON r.cod_prov = pv.cod_prov
       LEFT JOIN departamento d ON pv.cod_dep = d.cod_dep
       WHERE p.cod_socio = ?`, [codSocio]);
    if (!rows.length) return null;
    const persona = new Persona(rows[0]);
        persona.comunidad_descripcion = rows[0].comunidad_descripcion;
      persona.regional_descripcion = rows[0].regional_descripcion;
      persona.provincia_descripcion = rows[0].provincia_descripcion; 
      persona.departamento_descripcion = rows[0].departamento_descripcion;
      return persona;
  }

async buscarPorDocumento(documentoIdentidad, codComplementario = null) {
  let query = `SELECT p.*, 
                     c.descripcion AS comunidad_descripcion,
                     r.descripcion AS regional_descripcion,
                     pv.descripcion AS provincia_descripcion,
                     d.descripcion AS departamento_descripcion
              FROM persona p
              LEFT JOIN comunidad c ON p.cod_com = c.cod_com
              LEFT JOIN regional r ON c.cod_reg = r.cod_reg
              LEFT JOIN provincia pv ON r.cod_prov = pv.cod_prov
              LEFT JOIN departamento d ON pv.cod_dep = d.cod_dep
              WHERE TRIM(p.documento_identidad) = ?`;
  const params = [documentoIdentidad.trim()];

  // Solo agrega filtro de complemento si se proporciona un valor no vacío
  if (codComplementario !== null && codComplementario !== undefined && String(codComplementario).trim() !== '') {
    query += ' AND TRIM(p.cod_complementario) = ?';
    params.push(String(codComplementario).trim());
  }
  // Si no se envía complemento, no se filtra por él (devuelve cualquier persona con ese documento)

  const [rows] = await pool.query(query, params);
  if (!rows.length) return null;

  const persona = new Persona(rows[0]);
  persona.comunidad_descripcion = rows[0].comunidad_descripcion;
  persona.regional_descripcion = rows[0].regional_descripcion;
  persona.provincia_descripcion = rows[0].provincia_descripcion;
  persona.departamento_descripcion = rows[0].departamento_descripcion;
  return persona;
}

 async crear(datos) {
    const { cod_com, cod_persona, cod_socio, nombres, primer_apellido, segundo_apellido, tipo_socio, tipo_documento, documento_identidad, cod_complementario, lugar_nacimiento, fecha_nacimiento, estado_civil, genero, celular, correo_electronico, direccion_domicilio, estado, usuario_registro } = datos;
    await pool.query(
      `INSERT INTO persona 
       (cod_com, cod_persona, cod_socio, nombres, primer_apellido, segundo_apellido, tipo_socio, tipo_documento, documento_identidad, cod_complementario, lugar_nacimiento, fecha_nacimiento, estado_civil, genero, celular, correo_electronico, direccion_domicilio, estado, usuario_registro, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [cod_com, cod_persona, cod_socio, nombres, primer_apellido, segundo_apellido, tipo_socio, tipo_documento, documento_identidad, cod_complementario, lugar_nacimiento, fecha_nacimiento, estado_civil, genero, celular, correo_electronico, direccion_domicilio, estado, usuario_registro]
    );
}
  

  async actualizar(id, campos) {
    const keys = Object.keys(campos);
    if (keys.length === 0) return;
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => campos[key]);
    await pool.query(
      `UPDATE persona SET ${setClause}, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [...values, id]
    );
  }

  async eliminar(id, estado, usuarioModificador) {
    await pool.query(
      `UPDATE persona SET estado = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [estado, usuarioModificador, id]
    );
  }

  async activar(id, estadoActivo, usuarioModificador) {
  await pool.query(
    `UPDATE persona SET estado = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
    [estadoActivo, usuarioModificador, id]
  );
}
}