import { UsuarioRepository } from '../repositories/usuario.repository.js';
import { ResetPasswordTokenRepository } from '../repositories/reset-password-token.repository.js';
import { encriptarPassword } from '../utils/encriptacion.util.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';
import { EmailService } from './email.service.js';


export class ResetPasswordService {
  constructor() {
    this.usuarioRepo = new UsuarioRepository();
    this.tokenRepo = new ResetPasswordTokenRepository();
        this.emailService = new EmailService();

  }

  async solicitarCodigo(email) {
    const usuario = await this.usuarioRepo.buscarPorEmail(email);
    if (!usuario) {
      return { mensaje: 'Si el correo está registrado, recibirás un código de restablecimiento.' };
    }
    if (usuario.estado_usuario !== config.ESTADOS.ACTIVO) {
      throw new AppError('La cuenta no está activa. No se puede restablecer la contraseña.', 400);
    }

    // Invalidar cualquier token anterior vigente
    await this.tokenRepo.invalidarTokensAnteriores(usuario.id);

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + config.TIEMPO_EXPIRACION_RESET * 60000);

    await this.tokenRepo.crearToken(usuario.id, codigo, expiracion);

        // Formatear fecha de expiración en hora de Bolivia (UTC-4)
    const fechaFormateada = expiracion.toLocaleString('es-BO', {
      timeZone: 'America/La_Paz',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const nombre = usuario.nombres || 'Usuario';
    const asunto = '🔐 Restablecimiento de contraseña';
   const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1a3c6e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LLINUX2.0</h1>
          <p style="color: #a0c0f0; margin: 5px 0 0;">Sistema de Gestión Usuarios</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Estimado/a <strong>${nombre}</strong>,</p>
          <p style="font-size: 14px; color: #555;">Hemos recibido una solicitud para restablecer la contraseña de su cuenta. Utilice el siguiente código de verificación para continuar con el proceso:</p>
          <div style="background-color: #f8f9fa; border: 1px dashed #1a3c6e; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a3c6e;">${codigo}</span>
          </div>
          <p style="font-size: 14px; color: #555;">⏳ Este código es válido por <strong>${config.TIEMPO_EXPIRACION_RESET} minutos</strong>
             <br/>
            📅 Fecha y hora de expiración: <strong>${fechaFormateada}</strong> (hora de Bolivia).
          </p>
          <p style="font-size: 14px; color: #555;">Si no solicitó este cambio, por favor ignore este mensaje o contacte a nuestro equipo de soporte.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 12px; color: #999;">Atentamente,<br/>Departamento de Seguridad Informática<br/>LLINUX2.0 S.A.</p>
        </div>
      </div>
    `;
    const text = `Estimado/a ${nombre},\n\nPara restablecer su contraseña, use el código: ${codigo}\nVálido por ${config.TIEMPO_EXPIRACION_RESET} minutos.\n\nSi no solicitó este cambio, haga caso omiso.\n\nAtentamente,\nMi Empresa`;

    try {
      await this.emailService.enviarCorreo({
        to: email,
        subject: asunto,
        text,
        html,
      });
    }catch (error) {
      console.error('Error al enviar el correo de restablecimiento:', error);
      // Si falla el envío, el código se guardó pero el usuario no lo recibe.
      // Podríamos eliminar el token o simplemente informar error.
      throw new AppError('No se pudo enviar el correo. Intente nuevamente.', 500);
    }

    console.log(`[RESET] Código para ${email}: ${codigo}`);

    // Solo para pruebas se retorna el código; en producción elimina el campo codigo
    return {
      email: email,
      codigo: codigo,
      mensaje: 'Si el correo está registrado, recibirás un código de restablecimiento.',
    };
  }

    async restablecerPassword(codigo, email, nuevaPassword) {
    // Buscar usuario por email
    const usuario = await this.usuarioRepo.buscarPorEmail(email);
    if (!usuario) {
      throw new AppError('Código inválido.', 400);
    }

    // Obtener el token activo (vigente) del usuario
    const activeToken = await this.tokenRepo.findActiveTokenByUsuario(usuario.id);
    if (!activeToken) {
      throw new AppError('Código inválido o expirado.', 400);
    }

    // Comparar el código enviado con el del token activo
    if (activeToken.codigo !== codigo) {
      // Código incorrecto → incrementar intentos en el token activo
      const cancelado = await this.tokenRepo.incrementarIntentos(activeToken.id);

      if (cancelado) {
        throw new AppError('Código bloqueado por exceder el número máximo de intentos.', 400);
      }
      throw new AppError('Código inválido.', 400);
    }

    // Código correcto: restablecer contraseña
    const nuevoHash = await encriptarPassword(nuevaPassword);
    await this.usuarioRepo.actualizarPassword(usuario.id, nuevoHash, 'RESET');

    // Cancelar el token por uso exitoso
    await this.tokenRepo.cancelarToken(activeToken.id);

        // Enviar confirmación por email
   // Correo de confirmación ejecutivo
    const nombre = usuario.nombres || 'Usuario';
    const asunto = '✅ Contraseña actualizada exitosamente';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1a3c6e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LLINUX2.0</h1>
          <p style="color: #a0c0f0; margin: 5px 0 0;">Sistema de Gestión Usuarios</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Estimado/a <strong>${nombre}</strong>,</p>
          <p style="font-size: 14px; color: #555;">Le informamos que la contraseña de su cuenta ha sido modificada con éxito.</p>
          <p style="font-size: 14px; color: #555;">📅 Fecha de cambio: ${new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' })} (hora de Bolivia)</p>
          <p style="font-size: 14px; color: #555;">Si usted no realizó esta acción, por favor póngase en contacto con nuestro equipo de soporte de inmediato.</p>
          <div style="background-color: #f0f8ff; border-left: 4px solid #1a3c6e; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #1a3c6e;">🔒 Recomendación: nunca comparta su contraseña y active la verificación en dos pasos si está disponible.</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 12px; color: #999;">Atentamente,<br/>Departamento de Seguridad Informática<br/>LLINUX2.0 S.A.</p>
        </div>
      </div>
    `;
    const text = `Estimado/a ${nombre},\n\nSu contraseña ha sido actualizada exitosamente.\nFecha: ${new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}\n\nSi no realizó este cambio, contacte a soporte.\n\nAtentamente,\nMi Empresa`;

    try {
      await this.emailService.enviarCorreo({
        to: email,
        subject: asunto,
        text,
        html,
      });
    } catch (error) {
      console.error('Error al enviar correo de confirmación:', error);
      // No lanzamos error porque la contraseña ya se cambió
    }
    return { mensaje: 'Contraseña actualizada exitosamente.' };
  }

  /**************/
  /**
   * Resetea la contraseña de un usuario (acción administrativa).
   * Si no se proporciona nuevaPassword, genera una segura y la envía por correo.
   */
async resetearPasswordAdmin(idObjetivo, nuevaPassword, usuarioModificador) {
  const usuario = await this.usuarioRepo.buscarPorId(idObjetivo);
  if (!usuario) throw new AppError('Usuario no encontrado.', 404);

  let passwordFinal = nuevaPassword;
  let generada = false;

  if (!passwordFinal) {
    passwordFinal = this._generarPasswordSegura();
    generada = true;
  }

  const nuevoHash = await encriptarPassword(passwordFinal);
  await this.usuarioRepo.actualizarPassword(idObjetivo, nuevoHash, usuarioModificador);

  if (generada) {
    const nombre = usuario.nombres || 'Usuario';
    const asunto = '🔐 Contraseña restablecida por administrador';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1a3c6e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Mi Empresa</h1>
          <p style="color: #a0c0f0; margin: 5px 0 0;">Seguridad de la Cuenta</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Estimado/a <strong>${nombre}</strong>,</p>
          <p style="font-size: 14px; color: #555;">Un administrador ha restablecido la contraseña de su cuenta. A continuación, encontrará su nueva contraseña temporal:</p>
          <div style="background-color: #f8f9fa; border: 1px dashed #1a3c6e; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a3c6e;">${passwordFinal}</span>
          </div>
          <p style="font-size: 14px; color: #555;">Por razones de seguridad, le recomendamos cambiar esta contraseña inmediatamente después de iniciar sesión.</p>
          <p style="font-size: 14px; color: #555;">Si usted no solicitó este cambio, por favor contacte a nuestro equipo de soporte.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 12px; color: #999;">Atentamente,<br/>Departamento de Seguridad Informática<br/>Mi Empresa S.A.</p>
        </div>
      </div>
    `;
    const text = `Estimado/a ${nombre},\n\nUn administrador ha restablecido su contraseña. Su nueva contraseña temporal es: ${passwordFinal}\nPor favor, cámbiela al iniciar sesión.\n\nSi no solicitó este cambio, contacte a soporte.\n\nAtentamente,\nMi Empresa`;

    try {
      await this.emailService.enviarCorreo({
        to: usuario.email,
        subject: asunto,
        text,
        html,
      });
    } catch (error) {
      console.error('Error al enviar correo de nueva contraseña:', error);
    }
  }

  //return { nuevaPassword: passwordGenerada,
   // mensaje: 'Contraseña reseteada exitosamente.' };

       const respuesta = { mensaje: 'Contraseña reseteada exitosamente.' };
    if (generada) {
      respuesta.datos = {
        email: usuario.email,
        passwordGenerada: passwordFinal,
      };
    }
    return respuesta;
}











  _generarPasswordSegura() {
   // const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*()_+-=[]{}|;:,.<>?';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@.$_';

    let pass = '';
    for (let i = 0; i < 7; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));

    }
    return pass;
  }

}