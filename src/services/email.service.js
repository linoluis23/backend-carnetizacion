import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter = null;

// Inicializar transporter (se puede llamar una vez)
function crearTransporter() {
  if (transporter) return transporter;

  // Si no hay configuración SMTP, usar un transporter falso que solo muestra en consola
  if (!process.env.SMTP_HOST) {
    console.warn('⚠️ SMTP no configurado. Los correos se imprimirán en consola.');
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('--- CORREO SIMULADO ---');
        console.log('De:', mailOptions.from);
        console.log('Para:', mailOptions.to);
        console.log('Asunto:', mailOptions.subject);
        console.log('Mensaje:', mailOptions.text || mailOptions.html);
        console.log('-----------------------');
        return { messageId: 'simulado' };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export class EmailService {
  constructor() {
    this.transporter = crearTransporter();
  }

  /**
   * Envía un correo electrónico.
   * @param {object} opciones - { to, subject, text, html }
   * @returns {Promise<object>} información del envío
   */
  async enviarCorreo(opciones) {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Soporte" <no-reply@example.com>',
      ...opciones,
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log(`✅ Correo enviado a ${opciones.to}: ${info.messageId}`);
    return info;
  }
}