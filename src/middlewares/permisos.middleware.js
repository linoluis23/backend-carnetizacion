/*import { RolPermisoService } from '../services/rol-permiso.service.js';
import { AutoridadService } from '../services/autoridad.service.js';
import { PersonaService } from '../services/persona.service.js';
import { AppError } from '../utils/errores.util.js';

const rolPermisoService = new RolPermisoService();
const autoridadService = new AutoridadService();
const personaService = new PersonaService();


export function tienePermiso(permisoCodigo, opciones = {}) {
  return async (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({ mensaje: 'Autenticación requerida.' });
      }

      // Obtener los permisos del usuario
      const codigos = await rolPermisoService.obtenerCodigosPermisoDeUsuario(req.usuario.id);
      
      // Si el usuario tiene el rol de admin, se le concede acceso total
      if (req.usuario.rol === 'admin') {
        return next();
      }

      // Verificar el permiso específico
      if (!codigos.includes(permisoCodigo)) {
        return res.status(403).json({ mensaje: 'No tiene los permisos necesarios.' });
      }

      // Validación adicional: si la acción requiere ser la autoridad competente
      if (opciones.esAutoridad) {
        const personaId = parseInt(req.params.id) || req.body.persona_id;
        if (!personaId) {
          return res.status(400).json({ mensaje: 'ID de persona no proporcionado para la validación de autoridad.' });
        }

        // Verificar si el usuario es la autoridad activa para la persona
        const persona = await personaService.obtenerPorId(personaId);
        if (!persona) return res.status(404).json({ mensaje: 'Persona no encontrada.' });

        // Obtener la autoridad de la persona (asumiendo que tenemos un método para eso)
        const autoridad = await autoridadService.obtenerAutoridadCompetente(personaId, req.usuario.id);
        if (!autoridad) {
          return res.status(403).json({ mensaje: 'Usted no es la autoridad competente para esta persona.' });
        }

        if (opciones.nivelAutoridad && autoridad.cargo_nivel !== opciones.nivelAutoridad) {
          return res.status(403).json({ mensaje: `Se requiere autoridad de nivel ${opciones.nivelAutoridad}.` });
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}*/

import { RolPermisoService } from '../services/rol-permiso.service.js';

const rolPermisoService = new RolPermisoService();

export const tienePermiso = (codigoPermiso) => {
  return async (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({ mensaje: 'No autenticado' });
      }

      // Si es ADMIN, pasa directo
      const esAdmin = req.usuario.roles?.some(r => r.nombre === 'ADMIN');
      if (esAdmin) {
        return next();
      }

      // Obtener permisos del usuario
      const permisos = await rolPermisoService.obtenerCodigosPermisoDeUsuario(req.usuario.id);
      
      if (permisos.includes(codigoPermiso)) {
        next();
      } else {
        res.status(403).json({ mensaje: 'No tiene permiso para realizar esta acción' });
      }
    } catch (error) {
      next(error);
    }
  };
};