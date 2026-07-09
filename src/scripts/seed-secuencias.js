// scripts/seed-secuencias.js
import pool from '../src/config/database.js';

const rangos = [
  { cod_reg: 100, inicio: 1000, fin: 1050 },   // Chulumani
  { cod_reg: 101, inicio: 1051, fin: 2000 },   // Huancane
  { cod_reg: 101, inicio: 1050, fin: 1100 }, 
  { cod_reg: 102, inicio: 1100, fin: 1150 }, 
  { cod_reg: 103, inicio: 1150, fin: 1200 }, 
  { cod_reg: 104, inicio: 1200, fin: 1250 },
  { cod_reg: 105, inicio: 1250, fin: 1300 },

  { cod_reg: 106, inicio: 1300, fin: 1350 },
  { cod_reg: 107, inicio: 1350, fin: 1400 },
  { cod_reg: 108, inicio: 1400, fin: 1450 },
  { cod_reg: 109, inicio: 1450, fin: 1500 },
  { cod_reg: 110, inicio: 1500, fin: 1550 },
  { cod_reg: 111, inicio: 1550, fin: 1600 },

  { cod_reg: 112, inicio: 1600, fin: 1650 },
  // ... más regionales
];

async function seed() {
  for (const r of rangos) {
    await pool.query(
      `INSERT INTO secuencias_comunidad (cod_reg, ultimoCodigo, limiteSuperior)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE ultimoCodigo = VALUES(ultimoCodigo), limiteSuperior = VALUES(limiteSuperior)`,
      [r.cod_reg, r.inicio - 1, r.fin]
    );
  }
  console.log('Secuencias inicializadas.');
  process.exit(0);
}
seed().catch(console.error);