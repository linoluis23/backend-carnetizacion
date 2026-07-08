import { ResetPasswordService } from '../services/reset-password.service.js';
import { GestionarPasswordDTO } from '../dtos/gestionar-password.dto.js';

const resetPasswordService = new ResetPasswordService();

export class ResetPasswordController {
  /**
   * POST /usuarios/solicitar-reset
   */
  static async solicitarReset(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) throw new AppError('Debe proporcionar un correo electrónico.', 400);
      const resultado = await resetPasswordService.solicitarCodigo(email);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /usuarios/resetear-password
   */
static async resetearPassword(req, res, next) {
    try {
      const { email, codigo, password } = req.body;
      const resultado = await resetPasswordService.restablecerPassword(codigo, email, password);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) {
      next(error);
    }
}
}