import pool from '../config/database.js';
import { Comunidad } from '../models/comunidad.model.js';

export class ComunidadRepository {
  // src/repositories/comunidad.repository.js

async listar(filtros = {}, paginacion = {}) {
  const {
    cod_reg,
    cod_prov,
    estado,
    busqueda,
    orderBy = 'descripcion',        // nombre amigable
    orderDir = 'ASC'
  } = filtros;

  const { limit = 100, offset = 0 } = paginacion;

  // --- Mapeo de campos permitidos para ORDER BY (seguro) ---
  const camposPermitidos = {
    'cod_com': 'c.cod_com',
    'descripcion': 'c.descripcion',
    'regional': 'r.descripcion',
    // Se pueden agregar más: 'estado', 'fecha_registro', etc.
  };
  const columnaOrden = camposPermitidos[orderBy] || 'c.descripcion';
  const direccion = (orderDir.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

  // --- Construcción WHERE ---
  const whereConditions = [];
  const params = [];

  if (cod_reg) {
    whereConditions.push('c.cod_reg = ?');
    params.push(cod_reg);
  }
  if (cod_prov) {
    whereConditions.push('r.cod_prov = ?');
    params.push(cod_prov);
  }
  if (estado) {
    whereConditions.push('c.estado = ?');
    params.push(estado);
  }
  if (busqueda) {
    whereConditions.push('(c.descripcion LIKE ? OR c.descripcion_corta LIKE ? OR c.cod_com LIKE ?)');
    const like = `%${busqueda}%`;
    params.push(like, like, `%${busqueda}%`);
  }

  const whereClause = whereConditions.length
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // --- Consulta principal (con paginación) ---
  const query = `
    SELECT c.*, 
           r.descripcion AS descripcion_regional,
           r.cod_prov AS cod_prov,
           pv.descripcion AS descripcion_provincia,
           d.descripcion AS descripcion_departamento
    FROM comunidad c
    LEFT JOIN regional r ON c.cod_reg = r.cod_reg
    LEFT JOIN provincia pv ON r.cod_prov = pv.cod_prov
    LEFT JOIN departamento d ON pv.cod_dep = d.cod_dep
    ${whereClause}
    ORDER BY ${columnaOrden} ${direccion}
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(query, [...params, limit, offset]);

  // --- Consulta para contar total (sin paginación) ---
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM comunidad c
    LEFT JOIN regional r ON c.cod_reg = r.cod_reg
    LEFT JOIN provincia pv ON r.cod_prov = pv.cod_prov
    LEFT JOIN departamento d ON pv.cod_dep = d.cod_dep
    ${whereClause}
  `;
  const [countRows] = await pool.query(countQuery, params);
  const total = countRows[0].total;

  // --- Mapeo de resultados ---
  const datos = rows.map(row => {
    const com = new Comunidad(row);
    com.descripcion_regional = row.descripcion_regional;
    com.descripcion_provincia = row.descripcion_provincia;
    com.descripcion_departamento = row.descripcion_departamento;
    return com;
  });

  return { datos, total };
}

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT c.*, r.descripcion AS descripcion_regional
       FROM comunidad c
       LEFT JOIN regional r ON c.cod_reg = r.cod_reg
       WHERE c.id = ?`, [id]
    );
    if (!rows.length) return null;
    const com = new Comunidad(rows[0]);
    com.descripcion_regional = rows[0].descripcion_regional;
    return com;
  }

  async buscarPorCodigo(codCom) {
    const [rows] = await pool.query(
      `SELECT c.*, r.descripcion AS descripcion_regional
       FROM comunidad c
       LEFT JOIN regional r ON c.cod_reg = r.cod_reg
       WHERE c.cod_com = ?`, [codCom]
    );
    if (!rows.length) return null;
    const com = new Comunidad(rows[0]);
    com.descripcion_regional = rows[0].descripcion_regional;
    return com;
  }

  // src/repositories/comunidad.repository.js
async crear(datos, connection = null) {
  const conn = connection || pool;
  const { cod_reg, cod_com, descripcion, descripcion_corta, estado, usuario_registro } = datos;
  await conn.query(
    `INSERT INTO comunidad (cod_reg, cod_com, descripcion, descripcion_corta, estado, usuario_registro, fecha_registro)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [cod_reg, cod_com, descripcion, descripcion_corta, estado, usuario_registro]
  );
}

  async actualizar(id, campos) {
    const keys = Object.keys(campos);
    if (keys.length === 0) return;
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => campos[key]);
    await pool.query(
      `UPDATE comunidad SET ${setClause}, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [...values, id]
    );
  }

  async eliminar(id, estado, usuarioModificador) {
    await pool.query(
      `UPDATE comunidad SET estado = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
      [estado, usuarioModificador, id]
    );
  }

  async activar(id, estadoActivo, usuarioModificador) {
  await pool.query(
    `UPDATE comunidad SET estado = ?, usuario_ultima_modificacion = ?, fecha_ultima_actualizacion = NOW() WHERE id = ?`,
    [estadoActivo, usuarioModificador, id]
  );
}

async validarRegional(codReg) {
  const [rows] = await pool.query('SELECT 1 FROM regional WHERE cod_reg = ?', [codReg]);
  return rows.length > 0;
}
}