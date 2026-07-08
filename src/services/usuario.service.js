import { UsuarioRepository } from '../repositories/usuario.repository.js';
import { encriptarPassword, compararPassword } from '../utils/encriptacion.util.js';
import { generarToken } from '../utils/jwt.util.js';
import { HistorialAccesosRepository } from '../repositories/historial-accesos.repository.js';
import { config } from '../config/configuracion.js';
import { AppError } from '../utils/errores.util.js';
import { Rol } from '../models/rol.model.js';
import { UsuarioRol } from '../models/usuario-rol.model.js';
import { EmailService } from './email.service.js';
import { UsuarioRolRepository } from '../repositories/usuario-rol.repository.js';
import { NotificacionService } from './notificacion.service.js';


export class UsuarioService {
  constructor() {
    this.usuarioRepository = new UsuarioRepository();
    this.historialRepository = new HistorialAccesosRepository();
     this.emailService = new EmailService();
         this.usuarioRolRepository = new UsuarioRolRepository();   // ← NUEVO
    this.notificacionService = new NotificacionService();
  }

 async registrarUsuario(dto, usuarioRegistrador) {
  // 1. Validar email duplicado
  const existente = await this.usuarioRepository.buscarPorEmail(dto.email);
  if (existente) {
    throw new AppError('El correo electrónico ya está registrado.', 409);
  }

  const existenteDoc = await this.usuarioRepository.buscarPorDocumento(dto.documento_identidad);
  if (existenteDoc) {
    throw new AppError('Ya existe un usuario con el número de documento ingresado.', 409);
  }

  // 2. Validar documento duplicado (INDEPENDIENTE)
  /*if (dto.documento_identidad) {
    const existenteDoc = await this.usuarioRepository.buscarPorDocumento(dto.documento_identidad);
    if (existenteDoc) {
      throw new AppError('Ya existe un usuario con el número de documento ingresado.', 409);
    }
  }*/

  // 3. Crear usuario
  const passwordEncriptado = await encriptarPassword(dto.password);
  const nuevo = await this.usuarioRepository.crear({
    primer_apellido: dto.primer_apellido,
    segundo_apellido: dto.segundo_apellido,
    nombres: dto.nombres,
    email: dto.email,
    documento_identidad: dto.documento_identidad,
    password: passwordEncriptado,
    estado_usuario: config.ESTADOS.ACTIVO,
    usuario_registro: usuarioRegistrador,
  });

    // Enviar correo con credenciales (registro manual)
  try {
    await this.notificacionService.enviarCredencialesUsuario({
      nombres: nuevo.nombres,
      primer_apellido: nuevo.primer_apellido,
      segundo_apellido: nuevo.segundo_apellido,
      email: nuevo.email,
    }, dto.password);
  } catch (error) {
    console.error('Error al enviar correo de registro:', error);
    // No lanzar error; el usuario ya fue creado
  }

  return {
    id: nuevo.id,
    email: nuevo.email,
    nombres: nuevo.nombres,
    primer_apellido: nuevo.primer_apellido,
    segundo_apellido: nuevo.segundo_apellido,
    documento_identidad: nuevo.documento_identidad,
    estado_usuario: nuevo.estado_usuario,
    bloqueado_hasta: nuevo.bloqueado_hasta,
  };
}

  async iniciarSesion(dto, ip, userAgent) {
    const usuario = await this.usuarioRepository.buscarPorEmail(dto.email);

    if (!usuario) {
      await this.historialRepository.registrarIntentoFallido({
        usuario_id: null,
        email_ingresado: dto.email,
        ip_direccion: ip,
        user_agent: userAgent,
      });
      throw new AppError('Credenciales inválidas.', 401);
    }
    if (usuario.estado_usuario !== config.ESTADOS.ACTIVO) {
        throw new AppError('Credenciales inválidas.', 401);
    }

    // Verificar bloqueo temporal
    if (usuario.bloqueado && usuario.bloqueado_hasta) {
      const ahora = new Date();
      const bloqueoHasta = new Date(usuario.bloqueado_hasta);
      if (ahora < bloqueoHasta) {
        const minutosRestantes = Math.ceil((bloqueoHasta - ahora) / 60000);
        throw new AppError(`Cuenta bloqueada. Intente nuevamente en ${minutosRestantes} minutos.`, 423);
      } else {
        await this.usuarioRepository.resetearIntentosFallidos(usuario.id);
        usuario.bloqueado = 0;
        usuario.intentos_fallidos = 0;
      }
    }

    const { valido: passwordValido, necesitaActualizar } = await compararPassword(dto.password, usuario.password);

    if (!passwordValido) {
      await this.historialRepository.registrarIntentoFallido({
        usuario_id: usuario.id,
        email_ingresado: dto.email,
        ip_direccion: ip,
        user_agent: userAgent,
      });

      await this.usuarioRepository.incrementarIntentosFallidos(usuario.id);
      const nuevoUsuario = await this.usuarioRepository.buscarPorEmail(dto.email);
      if (nuevoUsuario.intentos_fallidos >= config.MAX_INTENTOS_FALLIDOS) {
        const hasta = new Date(Date.now() + config.TIEMPO_BLOQUEO_MINUTOS * 60000);
        await this.usuarioRepository.bloquearUsuario(usuario.id, hasta);
        throw new AppError(`Cuenta bloqueada por exceder intentos. Vuelva en ${config.TIEMPO_BLOQUEO_MINUTOS} minutos.`, 423);
      }
      throw new AppError('Credenciales inválidas.', 401);
    }

    if (necesitaActualizar) {
      const nuevoHash = await encriptarPassword(dto.password);
      await this.usuarioRepository.actualizarPassword(usuario.id, nuevoHash, usuario.email);
    }

    await this.usuarioRepository.resetearIntentosFallidos(usuario.id);
    await this.usuarioRepository.actualizarUltimoAcceso(usuario.id);

    const token = generarToken({ id: usuario.id, email: usuario.email });
    return {
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombres: usuario.nombres,
        primer_apellido: usuario.primer_apellido,
        segundo_apellido: usuario.segundo_apellido,
        estado_usuario: usuario.estado_usuario,
            },
      mensaje: "Login exitoso......",
    };
  }

  async obtenerPerfil(id) {
    if (isNaN(id) || id <= 0) throw new AppError('ID de usuario inválido.', 400);
    const usuario = await this.usuarioRepository.buscarPorId(id);
     
    if (!usuario) {
      throw new AppError('Usuario no encontrado.', 404);
    }
    return {
      id: usuario.id,
      primer_apellido: usuario.primer_apellido,
      segundo_apellido: usuario.segundo_apellido,
      nombres: usuario.nombres,
      email: usuario.email,
      estado_usuario: usuario.estado_usuario,
      ultimo_acceso: usuario.ultimo_acceso,
      foto: usuario.foto,
    };
  }

  async buscarPorId(id) {
    return this.usuarioRepository.buscarPorId(id);
  }

  async actualizarPerfil(id, dto, usuarioModificador) {
    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    const camposAActualizar = {};
    if (dto.nombres !== undefined) camposAActualizar.nombres = dto.nombres;
    if (dto.primer_apellido !== undefined) camposAActualizar.primer_apellido = dto.primer_apellido;
    if (dto.segundo_apellido !== undefined) camposAActualizar.segundo_apellido = dto.segundo_apellido;
    if (dto.foto !== undefined) camposAActualizar.foto = dto.foto;

    if (Object.keys(camposAActualizar).length === 0) {
      throw new AppError('Debe enviar al menos un campo para actualizar.', 400);
    }

    camposAActualizar.usuario_ultima_modificacion = usuarioModificador;
    const actualizado = await this.usuarioRepository.actualizar(id, camposAActualizar);
    return {
      id: actualizado.id,
      primer_apellido: actualizado.primer_apellido,
      segundo_apellido: actualizado.segundo_apellido,
      nombres: actualizado.nombres,
      email: actualizado.email,
      estado_usuario: actualizado.estado_usuario,
      ultimo_acceso: actualizado.ultimo_acceso,
      foto: actualizado.foto,
    };
  }

  async actualizarPerfilDeUsuario(idObjetivo, dto, usuarioModificador) {
    const usuario = await this.usuarioRepository.buscarPorId(idObjetivo);
    if (!usuario) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    const camposAActualizar = {};
    if (dto.nombres !== undefined) camposAActualizar.nombres = dto.nombres;
    if (dto.primer_apellido !== undefined) camposAActualizar.primer_apellido = dto.primer_apellido;
    if (dto.segundo_apellido !== undefined) camposAActualizar.segundo_apellido = dto.segundo_apellido;
    if (dto.documento_identidad !== undefined) camposAActualizar.documento_identidad = dto.documento_identidad;
    if (dto.foto !== undefined) camposAActualizar.foto = dto.foto;

    if (Object.keys(camposAActualizar).length === 0) {
      throw new AppError('Debe enviar al menos un campo para actualizar.', 400);
    }

    camposAActualizar.usuario_ultima_modificacion = usuarioModificador;
    const actualizado = await this.usuarioRepository.actualizar(idObjetivo, camposAActualizar);
    return {
      id: actualizado.id,
      primer_apellido: actualizado.primer_apellido,
      segundo_apellido: actualizado.segundo_apellido,
      nombres: actualizado.nombres,
      documento_identidad: actualizado.documento_identidad,
      email: actualizado.email,
      estado_usuario: actualizado.estado_usuario,
      ultimo_acceso: actualizado.ultimo_acceso,
      foto: actualizado.foto,
    };
    
  }

  async listarUsuarios(filtros = {}) {
    const usuarios = await this.usuarioRepository.listarUsuarios(filtros);
    return usuarios.map(usuario => ({
      id: usuario.id,
      primer_apellido: usuario.primer_apellido,
      segundo_apellido: usuario.segundo_apellido,
      nombres: usuario.nombres,
      email: usuario.email,
      documento_identidad: usuario.documento_identidad,  // ← NUEVO
      estado_usuario: usuario.estado_usuario,
      bloqueado: usuario.bloqueado,
      bloqueado_hasta: usuario.bloqueado_hasta,
      ultimo_acceso: usuario.ultimo_acceso,
      foto: usuario.foto,
      rol_nombre: usuario.rol_nombre,    // ← nuevo
      rol_id: usuario.rol_id,            // ← nuevo
    }
  ));
  }

  async activarUsuario(id, usuarioModificador) {
    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) throw new AppError('Usuario no encontrado.', 404);
    if (usuario.estado_usuario === config.ESTADOS.ACTIVO) {
      throw new AppError('Usuario ya se encuentra activo.', 400);
    }
    await this.usuarioRepository.resetearIntentosFallidos(id);
    await this.usuarioRepository.actualizarEstadoUsuario(id, config.ESTADOS.ACTIVO, usuarioModificador);
    const actualizado = await this.usuarioRepository.buscarPorId(id);
    return this._mapearPerfil(actualizado);
  }

  async inactivarUsuario(id, usuarioModificador) {
    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) throw new AppError('Usuario no encontrado.', 404);
    if (usuario.estado_usuario === config.ESTADOS.INACTIVO) {
      throw new AppError('Usuario ya se encuentra inactivo.', 400);
    }
    await this.usuarioRepository.actualizarEstadoUsuario(id, config.ESTADOS.INACTIVO, usuarioModificador);
    const actualizado = await this.usuarioRepository.buscarPorId(id);
    return this._mapearPerfil(actualizado);
  }

  async bloquearUsuario(id, usuarioModificador, duracionMinutos = null) {
    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) throw new AppError('Usuario no encontrado.', 404);
    if (usuario.estado_usuario === config.ESTADOS.BLOQUEADO) {
      throw new AppError('Usuario ya se encuentra bloqueado.', 400);
    }

    let bloqueadoHasta = null;
    if (duracionMinutos !== null && duracionMinutos > 0) {
      bloqueadoHasta = new Date(Date.now() + duracionMinutos * 60000);
    }

    await this.usuarioRepository.actualizarEstadoUsuario(id, config.ESTADOS.BLOQUEADO, usuarioModificador);
    await this.usuarioRepository.actualizarBloqueo(id, 1, bloqueadoHasta, usuarioModificador);
    const actualizado = await this.usuarioRepository.buscarPorId(id);
    return this._mapearPerfil(actualizado);
  }

  async eliminarUsuario(id, usuarioModificador) {
    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) throw new AppError('Usuario no encontrado.', 404);

    if (usuario.estado_usuario === config.ESTADOS.ELIMINADO) {
        throw new AppError('Usuario ya se encuentra eliminado.', 400);
    }

    // 1. Cambiar estado del usuario a ELIMINADO
    await this.usuarioRepository.actualizarEstadoUsuario(id, config.ESTADOS.ELIMINADO, usuarioModificador);

    // 2. Inactivar el rol activo si existe
    const asignacionActiva = await this.usuarioRolRepository.findActiveAsignacionByUsuario(id);
    if (asignacionActiva) {
        await this.usuarioRolRepository.desactivarAsignacion(
            id,
            asignacionActiva.rol_id,
            usuarioModificador
        );
    }

    const actualizado = await this.usuarioRepository.buscarPorId(id);
    return this._mapearPerfil(actualizado);
}



  _mapearPerfil(usuario) {
    return {
      id: usuario.id,
      primer_apellido: usuario.primer_apellido,
      segundo_apellido: usuario.segundo_apellido,
      nombres: usuario.nombres,
      documento_identidad: usuario.documento_identidad,
      email: usuario.email,
      estado_usuario: usuario.estado_usuario,
      bloqueado: usuario.bloqueado,
      bloqueado_hasta: usuario.bloqueado_hasta,
      ultimo_acceso: usuario.ultimo_acceso,
      foto: usuario.foto,
    };
  }

  async cambiarPassword(idUsuario, dto, usuarioModificador) {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);
    if (!usuario) throw new AppError('Usuario no encontrado.', 404);

    const { valido: passwordValido } = await compararPassword(dto.passwordActual, usuario.password);
    if (!passwordValido) throw new AppError('La contraseña actual es incorrecta.', 400);

    // Verificar que la nueva sea distinta a la actual (usamos la misma función de comparación)
    const { valido: nuevaIgualActual } = await compararPassword(dto.nuevaPassword, usuario.password);
    if (nuevaIgualActual) {
      throw new AppError('La nueva contraseña no puede ser igual a la actual.', 400);
    }

    const nuevoHash = await encriptarPassword(dto.nuevaPassword);
    await this.usuarioRepository.actualizarPassword(idUsuario, nuevoHash, usuarioModificador);
    return { mensaje: 'Contraseña actualizada exitosamente.' };
  }
/*
async resetearPassword(idObjetivo, nuevaPassword, usuarioModificador) {
  const usuario = await this.usuarioRepository.buscarPorId(idObjetivo);
  if (!usuario) throw new AppError('Usuario no encontrado.', 404);

  let passwordFinal = nuevaPassword;
  let generada = false;

  if (!passwordFinal) {
    passwordFinal = this._generarPasswordSegura();
    generada = true;
  }

  const nuevoHash = await encriptarPassword(passwordFinal);
  await this.usuarioRepository.actualizarPassword(idObjetivo, nuevoHash, usuarioModificador);

  // Enviar correo si se generó una contraseña nueva automáticamente
  if (generada) {
    try {
      await this.emailService.enviarCorreo({
        to: usuario.email,
        subject: 'Su contraseña ha sido restablecida',
        html: `
          <p>Estimado/a ${usuario.nombres},</p>
          <p>Su contraseña ha sido restablecida por un administrador. Su nueva contraseña es:</p>
          <h2 style="text-align:center; background:#f4f4f4; padding:10px;">${passwordFinal}</h2>
          <p>Le recomendamos cambiarla después de iniciar sesión.</p>
        `,
        text: `Su contraseña ha sido restablecida. Nueva contraseña: ${passwordFinal}`,
      });
    } catch (error) {
      console.error('No se pudo enviar el correo de restablecimiento:', error);
      // No lanzar error, la contraseña ya fue cambiada
    }
  }

  return { mensaje: 'Contraseña reseteada exitosamente.' };
}

_generarPasswordSegura() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*()_+-=[]{}|;:,.<>?';
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}
*/
/**
 * Genera una contraseña aleatoria segura: 12 caracteres, mayúsculas, minúsculas, dígitos, símbolos
 */
_generarPasswordSegura() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*()_+-=[]{}|;:,.<>?';
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

  async subirFoto(idUsuario, fotoBase64, usuarioModificador) {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);
    if (!usuario) throw new AppError('Usuario no encontrado.', 404);

    const campos = { foto: fotoBase64, usuario_ultima_modificacion: usuarioModificador };
    const actualizado = await this.usuarioRepository.actualizar(idUsuario, campos);
    return { mensaje: 'Foto actualizada exitosamente.', foto: actualizado.foto };
  }

  async eliminarFoto(idUsuario, usuarioModificador) {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);
    if (!usuario) throw new AppError('Usuario no encontrado.', 404);
    if (!usuario.foto) {
      throw new AppError('El usuario no tiene foto asignada.', 400);
    }
    const campos = { foto: null, usuario_ultima_modificacion: usuarioModificador };
    await this.usuarioRepository.actualizar(idUsuario, campos);
    return { mensaje: 'Foto eliminada exitosamente.' };
  }

  async obtenerFotoDeUsuario(idUsuario) {
    const usuario = await this.usuarioRepository.buscarPorId(idUsuario);
    if (!usuario) throw new AppError('Usuario no encontrado.', 404);
    if (!usuario.foto) {
      throw new AppError('El usuario no tiene foto asignada.', 404);
    }
    return { foto: usuario.foto };
  }
}