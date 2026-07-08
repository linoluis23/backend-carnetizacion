import { SolicitudCarnetService } from '../services/solicitud-carnet.service.js';
import { SolicitudCarnetDTO } from '../dtos/solicitud-carnet.dto.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';   // ← AÑADIR ESTA LÍNEA

const solicitudService = new SolicitudCarnetService();

export class SolicitudCarnetController {
  static async listar(req, res, next) {
    try {
      const filtros = {
        estado_solicitud: req.query.estado_solicitud,
       //persona_id: req.query.persona_id ? parseInt(req.query.persona_id) : null,
              cod_reg: req.query.cod_reg ? parseInt(req.query.cod_reg) : null,
      cod_com: req.query.cod_com ? parseInt(req.query.cod_com) : null,
      q: req.query.q || null,
      };
      const resultado = await solicitudService.listar(filtros);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) { next(error); }
  }

  static async obtenerPorId(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const resultado = await solicitudService.obtenerPorId(id);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) { next(error); }
  }

static async crear(req, res, next) {
  try {
    const dto = new SolicitudCarnetDTO(req.body);

    // Si se subió un archivo de foto, convertirlo a base64
    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      dto.foto = `data:${req.file.mimetype};base64,${base64}`;
    }

    const usuarioRegistrador = req.usuario.email;
    const resultado = await solicitudService.crear(dto, usuarioRegistrador);
    res.status(201).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
  } catch (error) {
    next(error);
  }
}

  static async actualizar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const dto = new SolicitudCarnetDTO(req.body);
      const usuarioModificador = req.usuario.email;
      const resultado = await solicitudService.actualizar(id, dto, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
    } catch (error) { next(error); }
  }

  static async aprobar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await solicitudService.cambiarEstado(id, config.ESTADOS_SOLICITUD.APROBADO, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) { next(error); }
  }

  static async rechazar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await solicitudService.cambiarEstado(id, config.ESTADOS_SOLICITUD.RECHAZADO, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) { next(error); }
  }

static async emitir(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const usuarioModificador = req.usuario.email;
    const resultado = await solicitudService.emitirCarnet(id, usuarioModificador);
    res.status(200).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
  } catch (error) {
    next(error);
  }
}

static async obtenerCarnetPdf(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const solicitud = await solicitudService.obtenerPorId(id);
    if (!solicitud.carnet_pdf) throw new AppError('No se ha generado el carnet para esta solicitud.', 404);
    res.status(200).json({ exito: true, datos: { carnet_pdf: solicitud.carnet_pdf } });
  } catch (error) {
    next(error);
  }
}

static async guardarPDF(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { pdf_base64 } = req.body;
    if (!pdf_base64) {
      return res.status(400).json({ exito: false, mensaje: 'PDF base64 requerido.' });
    }
    const usuarioModificador = req.usuario.email;
    const resultado = await solicitudService.guardarPDF(id, pdf_base64, usuarioModificador);
    res.status(200).json({ exito: true, mensaje: resultado.mensaje });
  } catch (error) {
    next(error);
  }
}
}