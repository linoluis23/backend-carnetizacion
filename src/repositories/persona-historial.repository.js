import pool from '../config/database.js';
// importar modelo si existe, si no, usar objetos planos.

export class PersonaHistorialRepository {
  async crear({ persona_id, campo, valor_anterior, valor_nuevo, usuario_modificacion }) {
    // normalizar fecha_nacimiento
    if (campo === 'fecha_nacimiento') {
      valor_anterior = valor_anterior ? new Date(valor_anterior).toISOString().split('T')[0] : null;
      valor_nuevo = valor_nuevo ? new Date(valor_nuevo).toISOString().split('T')[0] : null;
    }
    await pool.query(
      `INSERT INTO persona_historial (persona_id, campo, valor_anterior, valor_nuevo, usuario_modificacion, fecha_modificacion)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [persona_id, campo, valor_anterior, valor_nuevo, usuario_modificacion]
    );
  }

  async listarPorPersona(personaId) {
    const [rows] = await pool.query(
      `SELECT * FROM persona_historial WHERE persona_id = ? ORDER BY fecha_modificacion DESC`,
      [personaId]
    );
    return rows;
  }

  async listarPorPersonaPaginado(personaId, pagina = 1, porPagina = 5) {
    const offset = (pagina - 1) * porPagina;
    const [rows] = await pool.query(
      `SELECT * FROM persona_historial WHERE persona_id = ? ORDER BY fecha_modificacion DESC LIMIT ? OFFSET ?`,
      [personaId, porPagina, offset]
    );
    const [totalRow] = await pool.query(
      `SELECT COUNT(*) AS total FROM persona_historial WHERE persona_id = ?`,
      [personaId]
    );
    return { registros: rows, total: totalRow[0].total };
  }
}