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

 /**
   * Obtiene el total de solicitudes agrupadas por estado
   */
  async obtenerTotalesPorEstado() {
    const [rows] = await pool.query(`
      SELECT 
        estado_solicitud,
        COUNT(*) as total
      FROM solicitud_carnet
      GROUP BY estado_solicitud
    `);
    const resultado = {};
    rows.forEach(row => {
      resultado[row.estado_solicitud] = parseInt(row.total);
    });
    return resultado;
  }

  /**
   * Obtiene el total de solicitudes por regional con desglose de estados
   */
  async obtenerSolicitudesPorRegional() {
    const [rows] = await pool.query(`
      SELECT 
        r.cod_reg,
        r.descripcion AS regional,
        COUNT(DISTINCT p.id) AS total_personas,
        COUNT(s.id) AS total_solicitudes,
        SUM(CASE WHEN s.estado_solicitud = 'PEN' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN s.estado_solicitud = 'APR' THEN 1 ELSE 0 END) AS aprobadas,
        SUM(CASE WHEN s.estado_solicitud = 'EMI' THEN 1 ELSE 0 END) AS emitidas,
        SUM(CASE WHEN s.estado_solicitud = 'REC' THEN 1 ELSE 0 END) AS rechazadas
      FROM regional r
      LEFT JOIN comunidad c ON r.cod_reg = c.cod_reg
      LEFT JOIN persona p ON c.cod_com = p.cod_com
      LEFT JOIN solicitud_carnet s ON p.id = s.persona_id
      GROUP BY r.cod_reg, r.descripcion
      ORDER BY r.descripcion
    `);
    return rows;
  }

  /**
   * Obtiene distribución de personas por nivel geográfico
   */
  async obtenerPersonasPorGeografia() {
    const [rows] = await pool.query(`
      SELECT 
        'DEPARTAMENTO' AS nivel,
        d.cod_dep AS codigo,
        d.descripcion AS nombre,
        COUNT(DISTINCT p.id) AS total_personas
      FROM departamento d
      LEFT JOIN provincia pv ON d.cod_dep = pv.cod_dep
      LEFT JOIN regional r ON pv.cod_prov = r.cod_prov
      LEFT JOIN comunidad c ON r.cod_reg = c.cod_reg
      LEFT JOIN persona p ON c.cod_com = p.cod_com
      GROUP BY d.cod_dep, d.descripcion
      UNION ALL
      SELECT 
        'PROVINCIA' AS nivel,
        pv.cod_prov AS codigo,
        pv.descripcion AS nombre,
        COUNT(DISTINCT p.id) AS total_personas
      FROM provincia pv
      LEFT JOIN regional r ON pv.cod_prov = r.cod_prov
      LEFT JOIN comunidad c ON r.cod_reg = c.cod_reg
      LEFT JOIN persona p ON c.cod_com = p.cod_com
      GROUP BY pv.cod_prov, pv.descripcion
      UNION ALL
      SELECT 
        'REGIONAL' AS nivel,
        r.cod_reg AS codigo,
        r.descripcion AS nombre,
        COUNT(DISTINCT p.id) AS total_personas
      FROM regional r
      LEFT JOIN comunidad c ON r.cod_reg = c.cod_reg
      LEFT JOIN persona p ON c.cod_com = p.cod_com
      GROUP BY r.cod_reg, r.descripcion
      UNION ALL
      SELECT 
        'COMUNIDAD' AS nivel,
        c.cod_com AS codigo,
        c.descripcion AS nombre,
        COUNT(DISTINCT p.id) AS total_personas
      FROM comunidad c
      LEFT JOIN persona p ON c.cod_com = p.cod_com
      GROUP BY c.cod_com, c.descripcion
      ORDER BY nivel, nombre
    `);
    return rows;
  }

  async obtenerComunidadesPorRegional(codReg) {
  const [rows] = await pool.query(
    `
    SELECT 
      c.cod_com,
      c.descripcion AS comunidad,
      COUNT(DISTINCT p.id) AS total_personas,
      COUNT(s.id) AS total_solicitudes,
      SUM(CASE WHEN s.estado_solicitud = 'PEN' THEN 1 ELSE 0 END) AS pendientes,
      SUM(CASE WHEN s.estado_solicitud = 'APR' THEN 1 ELSE 0 END) AS aprobadas,
      SUM(CASE WHEN s.estado_solicitud = 'EMI' THEN 1 ELSE 0 END) AS emitidas,
      SUM(CASE WHEN s.estado_solicitud = 'REC' THEN 1 ELSE 0 END) AS rechazadas
    FROM comunidad c
    LEFT JOIN persona p ON c.cod_com = p.cod_com
    LEFT JOIN solicitud_carnet s ON p.id = s.persona_id
    WHERE c.cod_reg = ?
    GROUP BY c.cod_com, c.descripcion
    ORDER BY c.descripcion
    `,
    [codReg]
  );
  return rows;
}

async obtenerTodasRegionales() {
  const [rows] = await pool.query(
    `
    SELECT cod_reg, descripcion 
    FROM regional 
    WHERE estado = 'ACT' 
    ORDER BY descripcion
    `
  );
  return rows;
}

}