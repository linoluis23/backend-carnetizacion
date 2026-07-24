import { SolicitudCarnetService } from '../services/solicitud-carnet.service.js';
import { SolicitudCarnetDTO } from '../dtos/solicitud-carnet.dto.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';
import { generarPDFCarnet } from '../services/carnet-pdf.service.js';
const solicitudService = new SolicitudCarnetService();

export class SolicitudCarnetController {
  static async listar(req, res, next) {
    try {
      const filtros = {
        estado_solicitud: req.query.estado_solicitud,
        cod_reg: req.query.cod_reg ? parseInt(req.query.cod_reg) : null,
        cod_com: req.query.cod_com ? parseInt(req.query.cod_com) : null,
        q: req.query.q || null,
      };
       const usuario = req.usuario;
      const resultado = await solicitudService.listar(filtros, usuario);
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
    
      if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      dto.foto = `data:${req.file.mimetype};base64,${base64}`;
    }
      const resultado = await solicitudService.actualizar(id, dto, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
          //res.status(200).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });

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
    } catch (error) { next(error); }
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
    } catch (error) { next(error); }
  }

  static async obtenerCarnetPdf(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const solicitud = await solicitudService.obtenerPorId(id);
      if (!solicitud.pdf_carnet) throw new AppError('No se ha generado el carnet para esta solicitud.', 404);
      res.status(200).json({ exito: true, datos: { carnet_pdf: solicitud.pdf_carnet } });
    } catch (error) {
      next(error);
    }
  }


   /**
   * Verifica la firma de una solicitud (requiere autenticación).
   */
  static async verificarFirma(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const solicitud = await solicitudService.obtenerPorId(id);
      
      if (!solicitud) {
        throw new AppError('Solicitud no encontrada.', 404);
      }

      // Obtener las firmas registradas
      const firmas = {
        comunal: {
          id: solicitud.firma_comunal_id,
          fecha: solicitud.firma_comunal_fecha,
          hash: solicitud.firma_comunal_hash,
          valida: false
        },
        regional: {
          id: solicitud.firma_regional_id,
          fecha: solicitud.firma_regional_fecha,
          hash: solicitud.firma_regional_hash,
          valida: false
        },
        departamental: {
          id: solicitud.firma_departamental_id,
          fecha: solicitud.firma_departamental_fecha,
          hash: solicitud.firma_departamental_hash,
          valida: false
        }
      };

      // Verificar cada firma que exista
      for (const [nivel, data] of Object.entries(firmas)) {
        if (data.hash && data.id) {
          // Obtener la clave pública de la autoridad que firmó
          const autoridad = await firmaService.autoridadRepo.buscarPorId(data.id);
          if (autoridad) {
            const certificado = await firmaService.certificadoRepo.obtenerActivoPorAutoridad(data.id);
            if (certificado) {
              const esValida = firmaService._verificarFirma(
                data.hash,
                solicitud.documento_firma,
                certificado.clave_publica
              );
              firmas[nivel].valida = esValida;
            }
          }
        }
      }

      res.status(200).json({
        exito: true,
        datos: {
          solicitud_id: solicitud.id,
          documento_firma: solicitud.documento_firma,
          estado: solicitud.estado_solicitud,
          firmas: firmas,
          todas_validas: Object.values(firmas)
            .filter(f => f.hash) // solo las que tienen firma
            .every(f => f.valida),
          tiene_firmas_completas: 
            firmas.comunal.id && firmas.regional.id && firmas.departamental.id
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificación pública (sin autenticación) - solo devuelve un resumen.
   */
  static async verificarFirmaPublica(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const solicitud = await solicitudService.obtenerPorId(id);
      
      if (!solicitud) {
        throw new AppError('Solicitud no encontrada.', 404);
      }

      // Solo mostramos información básica para verificación pública
      res.status(200).json({
        exito: true,
        datos: {
          solicitud_id: solicitud.id,
          fecha_solicitud: solicitud.fecha_solicitud,
          estado: solicitud.estado_solicitud,
          firmas_completas: 
            solicitud.firma_comunal_id && 
            solicitud.firma_regional_id && 
            solicitud.firma_departamental_id,
          persona: {
            documento: solicitud.documento_identidad,
            nombres: solicitud.nombres,
            primer_apellido: solicitud.primer_apellido,
            segundo_apellido: solicitud.segundo_apellido,
            fecha_solicitud: solicitud.fecha_solicitud,
            comunidad: solicitud.comunidad_descripcion
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // src/controllers/solicitud-carnet.controller.js

  static async previsualizar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const solicitud = await solicitudService.obtenerPorId(id);
      if (!solicitud) {
        throw new AppError('Solicitud no encontrada.', 404);
      }

            const persona = await solicitudService.personaRepo.buscarPorId(solicitud.persona_id);
      if (!persona) {
        throw new AppError('Persona no encontrada.', 404);
      }
        // Formatear fecha de nacimiento (si existe)
    let fechaNacimiento = '';
    if (persona.fecha_nacimiento) {
      const fecha = new Date(persona.fecha_nacimiento);
      if (!isNaN(fecha.getTime())) {
        fechaNacimiento = fecha.toLocaleDateString('es-BO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }
    }

      // Obtener datos de la persona y geografía (el servicio ya los tiene en el mapeo)
      // Pero necesitamos la estructura completa que espera generarPDFCarnet
      const carnetData = {
        id: solicitud.id,
        nombres: solicitud.nombres,
        primer_apellido: solicitud.primer_apellido,
        segundo_apellido: solicitud.segundo_apellido || '',
        documento_identidad: solicitud.documento_identidad,
        cod_socio: solicitud.cod_socio,
        cod_persona: solicitud.cod_persona,
        foto: solicitud.foto || null,
        fecha_vigencia: solicitud.fecha_vigencia,
        fecha_emision: new Date().toISOString(), // Para previsualización, usar fecha actual
        comunidad_descripcion: solicitud.comunidad_descripcion || '',
        regional_descripcion: solicitud.regional_descripcion || '',
        provincia_descripcion: solicitud.provincia_descripcion || '',
        fecha_nacimiento: fechaNacimiento,// Si no se tiene, se puede omitir o dejar vacío
      };

      // Generar PDF en base64
    const pdfBase64 = await generarPDFCarnet(carnetData, undefined, true);

      // Devolver el PDF en base64 (para mostrarlo en el frontend)
      res.status(200).json({
        exito: true,
        mensaje: 'Vista preliminar generada.',
        datos: { pdf_base64: pdfBase64 }
      });
    } catch (error) {
      next(error);
    }
  }
}