import { FirmaSolicitudService } from '../services/firma-solicitud.service.js';

const firmaService = new FirmaSolicitudService();

export class FirmaSolicitudController {
  static async firmar(req, res, next) {
    try {
      const solicitudId = parseInt(req.params.id);
      const { tipo_firma } = req.body;
      const usuarioId = req.usuario.id;

      if (!tipo_firma || !['COMUNAL', 'REGIONAL', 'DEPARTAMENTAL'].includes(tipo_firma)) {
        return res.status(400).json({ exito: false, mensaje: 'Debe especificar un tipo de firma válido.' });
      }

      const resultado = await firmaService.firmar(solicitudId, usuarioId, tipo_firma);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) {
      next(error);
    }
  }

  // En src/controllers/solicitud-carnet.controller.js (o el controlador de firmas)
 static async firmaMasiva(req, res, next) {
    try {
      const { solicitudes_ids, tipo_firma } = req.body;
      if (!Array.isArray(solicitudes_ids) || solicitudes_ids.length === 0) {
        return res.status(400).json({ exito: false, mensaje: 'Debe enviar un arreglo de IDs de solicitudes.' });
      }
      if (!tipo_firma || !['COMUNAL', 'REGIONAL', 'DEPARTAMENTAL'].includes(tipo_firma)) {
        return res.status(400).json({ exito: false, mensaje: 'Debe especificar un tipo de firma válido.' });
      }
      const usuarioId = req.usuario.id;
      const resultado = await firmaService.firmaMasiva(solicitudes_ids, usuarioId, tipo_firma);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) {
      next(error);
    }
  }
}