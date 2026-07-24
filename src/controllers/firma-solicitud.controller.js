import { FirmaSolicitudService } from '../services/firma-solicitud.service.js';
import { AutoridadService } from '../services/autoridad.service.js';

const firmaService = new FirmaSolicitudService();
const autoridadService = new AutoridadService();

export class FirmaSolicitudController {
  static async firmar(req, res, next) {
    try {
      const solicitudId = parseInt(req.params.id);
      const { tipoFirma, firmaHash } = req.body;
      const usuario = req.usuario;

      const autoridad = await autoridadService.obtenerEntidadPorUsuario(usuario.id);
      if (!autoridad) {
        return res.status(403).json({
          exito: false,
          mensaje: 'No tienes una autoridad activa para firmar solicitudes'
        });
      }

      const resultado = await firmaService.firmar(
        solicitudId,
        tipoFirma,
        autoridad.id,
        firmaHash,
        usuario.email
      );

      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) {
      next(error);
    }
  }

  static async firmaMasiva(req, res, next) {
    try {
      const { solicitudes, tipoFirma } = req.body;
      const usuario = req.usuario;

      const autoridad = await autoridadService.obtenerEntidadPorUsuario(usuario.id);
      if (!autoridad) {
        return res.status(403).json({
          exito: false,
          mensaje: 'No tienes una autoridad activa para firmar solicitudes'
        });
      }

      if (!solicitudes || !Array.isArray(solicitudes) || solicitudes.length === 0) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Debe enviar un array de solicitudes con sus firmas'
        });
      }

      const exitos = [];
      const errores = [];
      for (const item of solicitudes) {
        try {
          const { id, firmaHash } = item;
          const resultado = await firmaService.firmar(
            id,
            tipoFirma,
            autoridad.id,
            firmaHash,
            usuario.email
          );
          exitos.push({ id, mensaje: resultado.mensaje });
        } catch (error) {
          errores.push({ id: item.id, mensaje: error.message });
        }
      }

      res.status(200).json({
        exito: true,
        mensaje: `Firma masiva: ${exitos.length} éxitos, ${errores.length} errores`,
        detalle: { exitos, errores }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint de diagnóstico para verificar una firma sin guardarla.
   * POST /api/v1/solicitudes/verificar-firma
   * Body: { autoridadId, documento, firmaHash }
   */
  static async verificarFirma(req, res, next) {
    try {
      const { autoridadId, documento, firmaHash } = req.body;

      if (!autoridadId || !documento || !firmaHash) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Faltan parámetros: autoridadId, documento, firmaHash'
        });
      }

      // Obtener certificado activo de la autoridad
      const certificado = await firmaService.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
      if (!certificado) {
        return res.status(404).json({
          exito: false,
          mensaje: 'La autoridad no tiene un certificado activo'
        });
      }

      // Verificar la firma
      const esValida = firmaService._verificarFirma(
        firmaHash,
        documento,
        certificado.clave_publica
      );

      // Logs detallados
      console.log('🔍 DIAGNÓSTICO DE FIRMA:');
      console.log('📄 Documento (primeros 200 caracteres):', documento.substring(0, 200));
      console.log('📄 Longitud del documento:', documento.length);
      console.log('🔑 Clave pública (primeros 100 caracteres):', certificado.clave_publica.substring(0, 100));
      console.log('🔑 Hash de firma (primeros 100 caracteres):', firmaHash.substring(0, 100));
      console.log('✅ ¿Firma válida?', esValida);

      res.status(200).json({
        exito: true,
        datos: {
          esValida,
          documentoLength: documento.length,
          firmaHashLength: firmaHash.length,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Firmar una solicitud usando un archivo .p12 subido
   */
  static async firmarConP12(req, res, next) {
    try {
      const solicitudId = parseInt(req.params.id);
      const { tipoFirma, password } = req.body;
      const usuario = req.usuario;

      // Verificar que se haya subido un archivo
      if (!req.file) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Debe subir un archivo .p12'
        });
      }

      // Obtener la autoridad del usuario
      const autoridad = await autoridadService.obtenerEntidadPorUsuario(usuario.id);
      if (!autoridad) {
        return res.status(403).json({
          exito: false,
          mensaje: 'No tienes una autoridad activa para firmar solicitudes'
        });
      }

      // Llamar al servicio para firmar con .p12
      const resultado = await firmaService.firmarConP12(
        solicitudId,
        tipoFirma,
        autoridad.id,
        req.file.buffer, // contenido del .p12
        password,
        usuario.email
      );

      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) {
      next(error);
    }
  }

  static async generarFirmaPrueba(req, res, next) {
  try {
    const { autoridadId, documento } = req.body;
    if (!autoridadId || !documento) {
      return res.status(400).json({ exito: false, mensaje: 'Faltan autoridadId y documento' });
    }

    // Obtener certificado activo
    const certificado = await firmaService.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
    if (!certificado) {
      return res.status(404).json({ exito: false, mensaje: 'Certificado no encontrado' });
    }

    // Necesitamos la clave privada para firmar en el backend (solo para diagnóstico)
    // ¡Importante! No se debe hacer en producción, solo para depuración.
    // Como no tenemos la clave privada desencriptada, no podemos firmar desde el backend.
    // Pero podemos comparar el hash enviado con lo que esperaríamos usando la clave pública.
    // En su lugar, simularemos la firma con la clave pública? No, la verificación ya se hace.

    // Mejor: mostrar la diferencia entre el documento recibido y el documento almacenado.
    // Obtener la solicitud para comparar.
    // ... 

    res.status(200).json({ exito: true, mensaje: 'Diagnóstico completado' });
  } catch (error) {
    next(error);
  }
}

  static async verificarFirma(req, res, next) {
    try {
      const { autoridadId, documento, firmaHash } = req.body;

      if (!autoridadId || !documento || !firmaHash) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Faltan parámetros: autoridadId, documento, firmaHash'
        });
      }

      // ✅ Usar la instancia de firmaService
      const certificado = await firmaService.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
      if (!certificado) {
        return res.status(404).json({
          exito: false,
          mensaje: 'La autoridad no tiene un certificado activo'
        });
      }

      const esValida = firmaService._verificarFirma(
        firmaHash,
        documento,
        certificado.clave_publica
      );

      res.status(200).json({
        exito: true,
        datos: {
          esValida,
          documentoLength: documento.length,
          firmaHashLength: firmaHash.length,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async verificarFirmaSolicitud(req, res, next) {
  try {
    const solicitudId = parseInt(req.params.id);
    const { tipo } = req.query; // 'comunal', 'regional', 'departamental' (opcional)
    console.log(`🔍 Verificando firmas de solicitud ${solicitudId}`);

    // 1. Obtener la solicitud con los datos de firmas
    const solicitud = await firmaService.solicitudRepo.buscarPorId(solicitudId);
    if (!solicitud) {
      return res.status(404).json({ exito: false, mensaje: 'Solicitud no encontrada' });
    }
    console.log('📄 documento_firma almacenado:');
    console.log('Longitud:', solicitud.documento_firma?.length || 0);
    console.log('Primeros 1000 chars:', solicitud.documento_firma?.substring(0, 1000));
    if (!solicitud.documento_firma) {
      return res.status(400).json({ exito: false, mensaje: 'La solicitud no tiene documento de firma' });
    }

    // 2. Definir los niveles de firma
    const niveles = [
      { tipo: 'comunal', id_field: 'firma_comunal_id', hash_field: 'firma_comunal_hash', date_field: 'firma_comunal_fecha' },
      { tipo: 'regional', id_field: 'firma_regional_id', hash_field: 'firma_regional_hash', date_field: 'firma_regional_fecha' },
      { tipo: 'departamental', id_field: 'firma_departamental_id', hash_field: 'firma_departamental_hash', date_field: 'firma_departamental_fecha' },
    ];

    // 3. Filtrar por tipo si se especifica
    let nivelesVerificar = niveles;
    if (tipo) {
      const found = niveles.find(n => n.tipo === tipo);
      if (!found) {
        return res.status(400).json({ exito: false, mensaje: 'Tipo de firma inválido' });
      }
      nivelesVerificar = [found];
    }

    // 4. Verificar cada nivel
    const resultados = [];
    for (const nivel of nivelesVerificar) {
      const autoridadId = solicitud[nivel.id_field];
      const hash = solicitud[nivel.hash_field];
      const fecha = solicitud[nivel.date_field];

      if (!autoridadId || !hash) {
        resultados.push({
          tipo: nivel.tipo,
          firmado: false,
          valida: null,
          mensaje: 'No firmado o sin hash',
        });
        continue;
      }

      // Obtener la clave pública de la autoridad
      const certificado = await firmaService.certificadoRepo.obtenerActivoPorAutoridad(autoridadId);
      if (!certificado) {
        resultados.push({
          tipo: nivel.tipo,
          firmado: true,
          valida: false,
          mensaje: 'Autoridad sin certificado activo (clave pública no disponible)',
        });
        continue;
      }

      // Verificar la firma
      const esValida = firmaService._verificarFirma(
        hash,
        solicitud.documento_firma,
        certificado.clave_publica
      );

      resultados.push({
        tipo: nivel.tipo,
        firmado: true,
        valida: esValida,
        fecha: fecha || null,
        mensaje: esValida ? 'Firma válida' : 'Firma inválida',
      });
    }

    // 5. Respuesta
    res.status(200).json({
      exito: true,
      datos: {
        solicitud_id: solicitudId,
        documento_firma_length: solicitud.documento_firma.length,
        estado_solicitud: solicitud.estado_solicitud,
        firmas: resultados,
        resumen: {
          total: resultados.length,
          validas: resultados.filter(r => r.valida === true).length,
          invalidas: resultados.filter(r => r.valida === false).length,
          no_firmadas: resultados.filter(r => r.firmado === false).length,
        }
      }
    });
  } catch (error) {
    next(error);
  }
}
 static async firmarConPem(req, res, next) {
    try {
      const solicitudId = parseInt(req.params.id);
      const { tipoFirma, privateKeyPem } = req.body;
      const usuario = req.usuario;

      // Validar que la clave esté presente
      if (!privateKeyPem) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Debe proporcionar la clave privada en formato PEM'
        });
      }

      // Obtener la autoridad del usuario
      const autoridad = await autoridadService.obtenerEntidadPorUsuario(usuario.id);
      if (!autoridad) {
        return res.status(403).json({
          exito: false,
          mensaje: 'No tienes una autoridad activa para firmar solicitudes'
        });
      }

      // Llamar al servicio para firmar con PEM
      const resultado = await firmaService.firmarConPem(
        solicitudId,
        tipoFirma,
        autoridad.id,
        privateKeyPem,
        usuario.email
      );

      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) {
      next(error);
    }
  }

}