// src/controllers/certificado.controller.js
import { CertificadoV2Service  } from '../services/certificado-v2.service.js';

const certificadoService = new CertificadoV2Service();

export class CertificadoController {
  /**
   * Genera un certificado (par de llaves) para una autoridad.
   * Se recibe opcionalmente una passphrase para cifrar la clave privada.
   */
  /*static async generar(req, res, next) {
    try {
      const autoridadId = parseInt(req.params.id);
      const { passphrase } = req.body; // opcional

      const usuarioRegistrador = req.usuario.email;
      const resultado = await certificadoService.generarCertificado(
        autoridadId,
        usuarioRegistrador,
        passphrase
      );

      res.status(201).json({
        exito: true,
        mensaje: resultado.mensaje,
        certificado_id: resultado.certificado_id,
        clave_publica: resultado.clave_publica,
        clave_privada_cifrada: resultado.clave_privada_cifrada, // si se usó passphrase
        fecha_expiracion: resultado.fecha_expiracion,
      });
    } catch (error) {
      next(error);
    }
  }*/
/*
    static async generar(req, res, next) {
    try {
      const autoridadId = parseInt(req.params.id);
      const { passphrase } = req.body;

      if (!passphrase || passphrase.length < 6) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Debe proporcionar una contraseña de al menos 6 caracteres para proteger el certificado.'
        });
      }

      const usuarioRegistrador = req.usuario.email;
      const resultado = await certificadoService.generarCertificadoPKCS12(
        autoridadId,
        passphrase,
        usuarioRegistrador
      );

      // ✅ DEVOLVER EL ARCHIVO .P12 COMO DESCARGA
      res.setHeader('Content-Type', 'application/x-pkcs12');
      res.setHeader('Content-Disposition', `attachment; filename="certificado_autoridad_${autoridadId}.p12"`);
      res.send(resultado.p12Buffer);

    } catch (error) {
      next(error);
    }
  }*/

static async generar(req, res, next) {
    try {
      const autoridadId = parseInt(req.params.id);
      const { clave_publica } = req.body;

      if (!clave_publica) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Debe proporcionar la clave pública.'
        });
      }

      const usuarioRegistrador = req.usuario.email;
      const resultado = await certificadoService.guardarClavePublica(
        autoridadId,
        clave_publica,
        usuarioRegistrador
      );

      res.status(201).json({
        exito: true,
        mensaje: resultado.mensaje,
        certificado_id: resultado.certificado_id,
      });
    } catch (error) {
      if (error.message.includes('válida') || error.statusCode === 400) {
        return res.status(400).json({ exito: false, mensaje: error.message });
      }
      next(error);
    }
  }

  /**
   * Obtiene el certificado activo de una autoridad.
   */
   static async obtenerActivo(req, res, next) {
    try {
      const autoridadId = parseInt(req.params.id);
      const certificado = await certificadoService.obtenerCertificadoActivo(autoridadId);
      res.status(200).json({ exito: true, datos: certificado });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoca un certificado.
   */
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

    static async generarPKCS12(req, res, next) {
    try {
      const autoridadId = parseInt(req.params.id);
      const { passphrase } = req.body;

      if (!passphrase || passphrase.length < 6) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Debe proporcionar una contraseña de al menos 6 caracteres.'
        });
      }

      const usuarioRegistrador = req.usuario.email;
      const resultado = await certificadoService.generarCertificadoPKCS12(
        autoridadId,
        passphrase,
        usuarioRegistrador
      );

      res.setHeader('Content-Type', 'application/x-pkcs12');
      res.setHeader('Content-Disposition', `attachment; filename="certificado_autoridad_${autoridadId}.p12"`);
      res.send(resultado.p12Buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Descarga la clave privada como archivo .pem (cifrada con passphrase si corresponde).
   * Para este endpoint, necesitamos recuperar la clave privada del certificado y devolverla.
   * Nota: Para simplificar, podemos generar la clave privada en el momento de la descarga,
   * pero como ya la tenemos en la respuesta de generar, podemos ofrecer descarga directa.
   * Alternativa: Crear un endpoint que devuelva la clave privada cifrada con passphrase
   * a partir del certificado almacenado (requiere almacenar la passphrase o regenerar la clave).
   * Por simplicidad, ofrecemos la descarga como parte de la respuesta de generación.
   * Si se necesita un endpoint específico, se puede implementar regenerando la clave.
   */
  static async descargarClavePrivada(req, res, next) {
    try {
      const certificadoId = parseInt(req.params.id);
      // Necesitamos obtener la clave privada del certificado. Para ello:
      // 1. Buscar el certificado.
      // 2. Desencriptar la clave privada con MASTER_KEY.
      // 3. Cifrarla con una passphrase (si se requiere) y devolverla.
      // Pero como no almacenamos la passphrase, solo podemos devolver la clave sin cifrar adicional.
      // Para este ejemplo, vamos a devolver la clave privada en texto plano (solo para uso seguro).
      // En un entorno real, se recomienda generar la clave en el frontend y enviar solo la pública.
      // O bien, almacenar la clave privada cifrada con passphrase en un campo separado.
      // Por ahora, devolvemos la clave privada desencriptada (solo para pruebas).
      // Mejor: el administrador ya obtuvo la clave cifrada en la respuesta de generar.
      // Así que no es necesario este endpoint si se captura en el frontend.

      // Esta implementación es un placeholder.
      const certificado = await certificadoService.obtenerClavePrivadaActiva(certificadoId);
      res.setHeader('Content-Disposition', 'attachment; filename="private_key.pem"');
      res.setHeader('Content-Type', 'application/x-pem-file');
      res.send(certificado);
    } catch (error) {
      next(error);
    }
  }
}