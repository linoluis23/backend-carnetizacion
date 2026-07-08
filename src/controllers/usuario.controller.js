import { UsuarioService } from '../services/usuario.service.js';
import { RegistrarUsuarioDTO } from '../dtos/registrar-usuario.dto.js';
import { LoginUsuarioDTO } from '../dtos/login-usuario.dto.js';
import { ActualizarUsuarioDTO } from '../dtos/actualizar-usuario.dto.js';
import { verificarToken } from '../utils/jwt.util.js';
import { GestionarPasswordDTO } from '../dtos/gestionar-password.dto.js';
import { ResetPasswordService } from '../services/reset-password.service.js';
import { RolPermisoService } from '../services/rol-permiso.service.js';


const usuarioService = new UsuarioService();
const resetPasswordService = new ResetPasswordService();
const rolPermisoService = new RolPermisoService();

export class UsuarioController {
  /**
   * POST /registro
   */
 static async registrar(req, res, next) {
    try {
        const dto = new RegistrarUsuarioDTO(req.body);
        // Se obtiene del token: email del usuario que ejecuta el registro
        const usuarioRegistrador = req.usuario.email; // o req.usuario.nombres
        const resultado = await usuarioService.registrarUsuario(dto, usuarioRegistrador);
        res.status(201).json({ 
          exito: true, 
          datos: resultado,
          mensaje: 'Registro realizado exitosamente...' });
    } catch (error) {
        next(error);
    }
}

  /**
   * POST /login
   */
static async iniciarSesion(req, res, next) {
    try {
        const dto = new LoginUsuarioDTO(req.body);
        const ip = req.ip || req.connection.remoteAddress || '0.0.0.0';
        const userAgent = req.headers['user-agent'] || 'Desconocido';
        const resultado = await usuarioService.iniciarSesion(dto, ip, userAgent);
        res.status(200).json({ exito: true, datos: resultado, mensaje: "Ok..." });
    } catch (error) {
        next(error);
    }
}

  /**
   * GET /perfil (requiere autenticación)
   */
  static async obtenerPerfil(req, res, next) {
    try {
      const id = req.usuario.id; // establecido por el middleware de autenticación
      const perfil = await usuarioService.obtenerPerfil(id);
      res.status(200).json({ exito: true, datos: perfil, mensaje: "Perfil usuario obtenido correctamente..." });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /perfil (requiere autenticación)
   */
static async actualizarPerfil(req, res, next) {
    try {
        const id = req.usuario.id;
        const dto = new ActualizarUsuarioDTO(req.body);
        const usuarioModificador = req.usuario.email; // usuario que realiza la modificación (del token)
        const usuarioActualizado = await usuarioService.actualizarPerfil(id, dto, usuarioModificador);
        res.status(200).json({ exito: true, datos: usuarioActualizado });
    } catch (error) {
        next(error);
    }
}

static async actualizarUsuarioPorId(req, res, next) {
    try {
        const idObjetivo = parseInt(req.params.id);
        
        const dto = new ActualizarUsuarioDTO(req.body);
        const usuarioModificador = req.usuario.email; // del token
        const resultado = await usuarioService.actualizarPerfilDeUsuario(idObjetivo, dto, usuarioModificador);
        res.status(200).json({ exito: true, 
          datos: resultado,
        mensaje:"Usuario actualizado correctamente..." });
    } catch (error) {
        next(error);
    }
}



  static async listarUsuarios(req, res, next) {
    try {
      const filtros = {
        estado_usuario: req.query.estado,
        email: req.query.email,
        nombres: req.query.nombres,
      };
      const usuarios = await usuarioService.listarUsuarios(filtros);
      res.status(200).json({ exito: true, 
        datos: usuarios,
        mensaje: "Datos obtenidos de usuarios..."
       });
    } catch (error) {
      next(error);
    }
  }

  static async activarUsuario(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      //const usuario = req.usuario.email;
      const resultado = await usuarioService.activarUsuario(id, usuarioModificador);
      res.status(200).json({ 
        exito: true, 
        datos: resultado,
        mensaje: "Usuario activado correctamente."});
    } catch (error) {
      next(error);
    }
  }

  static async inactivarUsuario(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await usuarioService.inactivarUsuario(id, usuarioModificador);
      res.status(200).json({ exito: true, datos: resultado, mensaje: "Usuario inactivado correctamente."});
    } catch (error) {
      next(error);
    }
  }

  static async bloquearUsuario(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const duracion = req.body.duracion || null; // minutos, opcional
      const resultado = await usuarioService.bloquearUsuario(id, usuarioModificador, duracion);
      res.status(200).json({ exito: true, datos: resultado, mensaje: "Usuario bloqueado correctamente." });
    } catch (error) {
      next(error);
    }
  }

  static async eliminarUsuario(req, res, next) {
    try {
      const idObjetivo = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await usuarioService.eliminarUsuario(idObjetivo, usuarioModificador);
      res.status(200).json({ exito: true, datos: resultado, mensaje: "Usuario eliminado correctamente." });
    } catch (error) {
      next(error);
    }
  }

// ... dentro de la clase UsuarioController

  /**
   * GET /verificar-token
   * Endpoint público para verificar la validez de un token JWT.
   */

  static async verificarToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(200).json({
                exito: true,
                valido: false,
                mensaje: 'Token no proporcionado.',
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(200).json({
                exito: true,
                valido: false,
                mensaje: 'Formato de token inválido.',
            });
        }

        let payload;
        try {
            payload = verificarToken(token); // contiene iat, exp, id, email...
        } catch (error) {
            return res.status(200).json({
                exito: true,
                valido: false,
                mensaje: 'Token inválido o expirado.',
            });
        }

        // Convertir timestamps UNIX a ISO 8601
        const fechaEmision = aFechaBolivia(payload.iat);
        const fechaExpiracion = aFechaBolivia(payload.exp);

        const perfil = await usuarioService.obtenerPerfil(payload.id);
        if (!perfil || perfil.estado_usuario !== 'ACT') {
            return res.status(200).json({
                exito: true,
                valido: false,
                mensaje: 'El usuario asociado al token no está activo o no existe.',
            });
        }

        return res.status(200).json({
            exito: true,
            valido: true,
            datos: {
                id: perfil.id,
                email: perfil.email,
                nombres: perfil.nombres,
                primer_apellido: perfil.primer_apellido,
                segundo_apellido: perfil.segundo_apellido,
                estado_usuario: perfil.estado_usuario,
                token: {
                    fecha_emision: fechaEmision,
                    fecha_expiracion: fechaExpiracion,
                },
                mensaje: "Token verificado satisfactoriamente...",
            },
        });
    } catch (error) {
        next(error);
    }
}

  /**
   * PUT /perfil/cambiar-password
   */
  static async cambiarPassword(req, res, next) {
    try {
        const idUsuario = req.usuario.id;
        const dto = new GestionarPasswordDTO(req.body);
        const usuarioModificador = req.usuario.email;
        const resultado = await usuarioService.cambiarPassword(idUsuario, dto, usuarioModificador);
        res.status(200).json({ exito: true, datos: resultado });
    } catch (error) {
        next(error);
    }
}



// Método actualizado
static async resetearPassword(req, res, next) {
  try {
    const idObjetivo = parseInt(req.params.id);
    const usuarioModificador = req.usuario.email;
    const { nuevaPassword } = req.body; // opcional
    const resultado = await resetPasswordService.resetearPasswordAdmin(idObjetivo, nuevaPassword, usuarioModificador);
    res.status(200).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos || null });
  } catch (error) {
    next(error);
  }
}

   static async subirFoto(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('No se envió ninguna imagen.', 400);
      }
      const idUsuario = req.usuario.id;
      const usuarioModificador = req.usuario.email;

      // Convertir el buffer a base64 con el prefijo adecuado
      const base64Data = req.file.buffer.toString('base64');
      const fotoBase64 = `data:${req.file.mimetype};base64,${base64Data}`;

      const resultado = await usuarioService.subirFoto(idUsuario, fotoBase64, usuarioModificador);
      res.status(200).json({ exito: true, datos: resultado, mensaje: "Foto del usuario actualizado correctamente..."});
    } catch (error) {
      next(error);
    }
  }

  static async eliminarFoto(req, res, next) {
    try {
      const idUsuario = req.usuario.id;
      const usuarioModificador = req.usuario.email;
      const resultado = await usuarioService.eliminarFoto(idUsuario, usuarioModificador);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerFoto(req, res, next) {
    try {
      const idUsuario = req.usuario.id;           // del token
      const resultado = await usuarioService.obtenerFotoDeUsuario(idUsuario);
      res.status(200).json({ exito: true, datos: resultado, mensaje: "Foto obtinido del usuario correctamente..."});
    } catch (error) {
      next(error);
    }
  }

    static async obtenerFotoPorUsuario(req, res, next) {
    try {
      const idUsuario = parseInt(req.params.id);
      const resultado = await usuarioService.obtenerFotoDeUsuario(idUsuario);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) {
      next(error);
    }
  }

    /**
   * POST/PUT /:id/foto – Subir o actualizar la foto de cualquier usuario (admin).
   */
  static async subirFotoDeUsuario(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('No se envió ninguna imagen.', 400);
      }
      const idObjetivo = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const base64Data = req.file.buffer.toString('base64');
      const fotoBase64 = `data:${req.file.mimetype};base64,${base64Data}`;
      const resultado = await usuarioService.subirFoto(idObjetivo, fotoBase64, usuarioModificador);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /:id/foto – Eliminar la foto de cualquier usuario (admin).
   */
  static async eliminarFotoDeUsuario(req, res, next) {
    try {
      const idObjetivo = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await usuarioService.eliminarFoto(idObjetivo, usuarioModificador);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) {
      next(error);
    }
  }


  static async obtenerPermisos(req, res, next) {
  try {
    const permisos = await rolPermisoService.obtenerCodigosPermisoDeUsuario(req.usuario.id);
    res.status(200).json({ exito: true, datos: permisos });
  } catch (error) {
    next(error);
  }
}

}



// Función auxiliar para formatear fecha Unix a zona horaria de Bolivia (UTC-4)
function aFechaBolivia(timestampUnix) {
    const fecha = new Date(timestampUnix * 1000);
    const offsetBolivia = -4 * 60; // minutos
    const tiempoLocal = fecha.getTime() + offsetBolivia * 60000;
    const fechaLocal = new Date(tiempoLocal);
    const year = fechaLocal.getUTCFullYear();
    const month = String(fechaLocal.getUTCMonth() + 1).padStart(2, '0');
    const day = String(fechaLocal.getUTCDate()).padStart(2, '0');
    const hours = String(fechaLocal.getUTCHours()).padStart(2, '0');
    const minutes = String(fechaLocal.getUTCMinutes()).padStart(2, '0');
    const seconds = String(fechaLocal.getUTCSeconds()).padStart(2, '0');
    const millis = String(fechaLocal.getUTCMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}-04:00`;
}