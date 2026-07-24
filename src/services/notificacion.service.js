// src/services/notificacion.service.js
import { EmailService } from './email.service.js';

export class NotificacionService {
  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Envía las credenciales de acceso a un usuario recién creado.
   * @param {object} usuario - Datos del usuario { nombres, primer_apellido, email }
   * @param {string} password - Contraseña temporal
   * @param {string} rol - Nombre del rol asignado
   * @param {string} frontendUrl - URL del frontend para el link de acceso
   */
  async enviarCredencialesUsuario(usuario, password, rol, frontendUrl) {
    const nombreCompleto = `${usuario.nombres} ${usuario.primer_apellido} ${usuario.segundo_apellido || ''}`.trim();
    const asunto = '🔐 Credenciales de Acceso - SISTEMA DE CARNETIZACION';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #056c24; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">ADEPCOCA</h1>
          <p style="color: #a0c0f0; margin: 5px 0 0;">Sistema de Gestión</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Estimado/a <strong>${nombreCompleto}</strong>,</p>
          <p style="font-size: 14px; color: #555;">Se ha creado una cuenta para usted en el sistema con el rol de <strong>${rol}</strong>.</p>
          <div style="background-color: #f8f9fa; border: 1px dashed #1a3c6e; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>👤 Usuario:</strong> ${usuario.email}</p>
            <p style="margin: 10px 0 0; font-size: 14px;"><strong>🔑 Contraseña temporal:</strong> ${password}</p>
            <p style="margin: 10px 0 0; font-size: 14px;"><strong>🎯 Rol asignado:</strong> ${rol}</p>
          </div>
          <p style="font-size: 14px; color: #555;">
            🔗 Acceda al sistema haciendo clic en el siguiente enlace:
            <br/>
            <a href="${frontendUrl}" style="color: #056c24; font-weight: bold;">${frontendUrl}</a>
          </p>
          <p style="font-size: 14px; color: #555;">🔒 Le recomendamos cambiar su contraseña después del primer inicio de sesión.</p>
          <p style="font-size: 14px; color: #555;">Si tiene alguna pregunta, comuníquese con el administrador del sistema.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 12px; color: #999;">Atentamente,<br/>Departamento de Seguridad Informática<br/>ADEPCOCA S.A.</p>
        </div>
      </div>
    `;

    const text = `Estimado/a ${nombreCompleto},\n\nSe ha creado una cuenta para usted en el sistema con el rol de ${rol}.\nUsuario: ${usuario.email}\nContraseña temporal: ${password}\nRol: ${rol}\nAcceda al sistema en: ${frontendUrl}\n\nLe recomendamos cambiar su contraseña después del primer inicio de sesión.\n\nAtentamente,\nADEPCOCA S.A.`;

    try {
      await this.emailService.enviarCorreo({
        to: usuario.email,
        subject: asunto,
        text,
        html,
      });
    } catch (error) {
      console.error('Error al enviar credenciales por correo:', error);
    }
  }
}