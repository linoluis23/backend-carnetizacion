import { UsuarioRepository } from '../repositories/usuario.repository.js';
import { UsuarioRolRepository } from '../repositories/usuario-rol.repository.js';
import { PersonaRepository } from '../repositories/persona.repository.js';
import { RolRepository } from '../repositories/rol.repository.js';
import { config } from '../config/configuracion.js';
import { encriptarPassword } from '../utils/encriptacion.util.js';
import { NotificacionService } from './notificacion.service.js';

export class UsuarioSyncService {
  constructor() {
    this.usuarioRepo = new UsuarioRepository();
    this.usuarioRolRepo = new UsuarioRolRepository();
    this.personaRepo = new PersonaRepository();
    this.rolRepo = new RolRepository();
    this.notificacionService = new NotificacionService();
  }

  /**
   * Sincroniza el usuario del sistema para una persona que asume un cargo.
   * Crea el usuario si no existe (basado en documento_identidad) y asigna el rol correspondiente.
   * @param {number} personaId
   * @param {string} nivelCargo - 'DEPARTAMENTAL', 'REGIONAL', 'COMUNAL'
   */
  async sincronizarUsuarioAutoridad(personaId, nivelCargo) {
    // 1. Obtener datos de la persona
    const persona = await this.personaRepo.buscarPorId(personaId);
    if (!persona) throw new Error('Persona no encontrada.');

    // 2. Buscar usuario existente por documento de identidad
    let usuario = await this.usuarioRepo.buscarPorDocumento(persona.documento_identidad);
    
    // Variable para guardar la contraseña temporal (solo si se crea nuevo usuario)
    let passwordTemporal = null;

    // 3. Si no existe, crear el usuario
    if (!usuario) {
      passwordTemporal = this._generarPasswordTemporal(persona.documento_identidad);
      const passwordHash = await encriptarPassword(passwordTemporal);

      usuario = await this.usuarioRepo.crear({
        primer_apellido: persona.primer_apellido,
        segundo_apellido: persona.segundo_apellido,
        nombres: persona.nombres,
        email: persona.correo_electronico || `${persona.documento_identidad}@sistema.com`,
        documento_identidad: persona.documento_identidad,
        password: passwordHash,
        estado_usuario: config.ESTADOS.ACTIVO,
        usuario_registro: 'SISTEMA',
      });

      // Enviar correo con credenciales
      await this.notificacionService.enviarCredencialesUsuario(usuario, passwordTemporal);
    }

    // 4. Determinar el rol según el nivel del cargo
    const nombreRol = this._mapearNivelARol(nivelCargo);
    const rol = await this.rolRepo.buscarPorNombre(nombreRol);
    if (!rol) throw new Error(`Rol ${nombreRol} no encontrado.`);

    // 5. Asignar (o reactivar) el rol al usuario
    const asignacionExistente = await this.usuarioRolRepo.findAsignacion(usuario.id, rol.id);
    if (asignacionExistente) {
      if (asignacionExistente.estado_usuario_rol !== 'ACT') {
        await this.usuarioRolRepo.actualizarEstado(asignacionExistente.id, 'ACT', 'SISTEMA');
      }
    } else {
      await this.usuarioRolRepo.crearAsignacion(usuario.id, rol.id, 'SISTEMA');
    }

    return usuario;
  }

  /**
   * Desactiva el rol asociado a una autoridad cuando ésta se inactiva/suspende/elimina.
   * @param {number} personaId
   * @param {string} nivelCargo
   */
  async removerRolAutoridad(personaId, nivelCargo) {
    const persona = await this.personaRepo.buscarPorId(personaId);
    if (!persona) return;

    const usuario = await this.usuarioRepo.buscarPorDocumento(persona.documento_identidad);
    if (!usuario) return;

    const nombreRol = this._mapearNivelARol(nivelCargo);
    const rol = await this.rolRepo.buscarPorNombre(nombreRol);
    if (!rol) return;

    await this.usuarioRolRepo.inactivarAsignacionPorUsuarioRol(usuario.id, rol.id, 'SISTEMA');
  }

  // --- Métodos privados ---
  _mapearNivelARol(nivel) {
    const mapa = {
      'DEPARTAMENTAL': 'PRESIDENTE',
      'REGIONAL': 'REGIONAL',
      'COMUNAL': 'COMUNAL',
    };
    return mapa[nivel] || 'PRESIDENTE';
  }


async buscarUsuarioPorPersona(personaId) {
  const persona = await this.personaRepo.buscarPorId(personaId);
  if (!persona) return null;
  return this.usuarioRepo.buscarPorDocumento(persona.documento_identidad);
}

  _generarPasswordTemporal(documentoIdentidad) {
  const prefijo = 'Coc@';
  // Asegurarse de que el documento tenga al menos 6 caracteres; si no, completar con ceros
  const doc = documentoIdentidad ? documentoIdentidad.padStart(5, '0') : '00000';
  return prefijo + doc;
}
}