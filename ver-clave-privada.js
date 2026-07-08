import mysql from 'mysql2/promise';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

async function verClavePrivada() {
  // ID del certificado que quieres inspeccionar (cámbialo según tu caso)
  const certificadoId = 7;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [rows] = await connection.execute(
    'SELECT clave_privada_encriptada FROM certificados_autoridad WHERE id = ?',
    [certificadoId]
  );

  if (rows.length === 0) {
    console.log('Certificado no encontrado.');
    await connection.end();
    return;
  }

  const encryptedData = rows[0].clave_privada_encriptada;
  const masterKey = process.env.MASTER_KEY;

  if (!masterKey) {
    console.log('MASTER_KEY no está definida en .env');
    await connection.end();
    return;
  }

  // Desencriptar
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(masterKey, 'hex'), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  console.log('------ CLAVE PRIVADA DESENCRIPTADA ------');
  console.log(decrypted);
  console.log('------------------------------------------');

  await connection.end();
}

verClavePrivada();