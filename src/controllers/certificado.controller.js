import { CertificadoService } from '../services/certificado.service.js';

const certificadoService = new CertificadoService();

export class CertificadoController {
static async generar(req, res, next) {
  try {
    const autoridadId = parseInt(req.params.id);
    const { clave_publica } = req.body;   // ← extraer del body
    if (!clave_publica) {
      return res.status(400).json({ exito: false, mensaje: 'Debe proporcionar la clave pública.' });
    }
    const usuarioRegistrador = req.usuario.email;
    const resultado = await certificadoService.generarCertificado(autoridadId, clave_publica, usuarioRegistrador);
    res.status(201).json({ exito: true, mensaje: resultado.mensaje, certificado_id: resultado.certificado_id });
  } catch (error) {
    next(error);
  }
}

    static async obtenerActivo(req, res, next) {
    try {
      const autoridadId = parseInt(req.params.id);
      const certificado = await certificadoService.obtenerCertificadoActivo(autoridadId);
      res.status(200).json({ exito: true, datos: certificado });
    } catch (error) {
      next(error);
    }
  }

  static async revocar(req, res, next) {
    try {
      const certificadoId = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await certificadoService.revocarCertificado(certificadoId, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) {
      next(error);
    }
  }
}