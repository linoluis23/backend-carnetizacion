// src/services/usuario-sync.service.js
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
   * Crea el usuario si no existe y asigna el rol correspondiente.
   */
  async sincronizarUsuarioAutoridad(personaId, nivelCargo) {
    // 1. Obtener persona
    const persona = await this.personaRepo.buscarPorId(personaId);
    if (!persona) throw new Error('Persona no encontrada.');

    // 2. Buscar usuario por documento
    let usuario = await this.usuarioRepo.buscarPorDocumento(persona.documento_identidad);
    let passwordTemporal = null;

    // 3. Si no existe, crear usuario
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

    // 6. Enviar notificación (solo si se creó un nuevo usuario)
    if (passwordTemporal) {
      await this.notificacionService.enviarCredencialesUsuario(
        usuario,
        passwordTemporal,
        nombreRol,
        process.env.FRONTEND_URL || 'http://localhost:5173'
      );
    }

    return usuario;
  }

  /**
   * Desactiva el rol asociado a una autoridad.
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

  _generarPasswordTemporal(documentoIdentidad) {
    const prefijo = 'Coc@';
    const doc = documentoIdentidad ? documentoIdentidad.padStart(5, '0') : '00000';
    return prefijo + doc;
  }
}