import { AutoridadService } from '../services/autoridad.service.js';
import { AutoridadDTO } from '../dtos/autoridad.dto.js';
import { config } from '../config/configuracion.js';

const autoridadService = new AutoridadService();

export class AutoridadController {
  static async listar(req, res, next) {
    try {
      const filtros = {
        estado: req.query.estado,
        cargo_id: req.query.cargo_id ? parseInt(req.query.cargo_id) : null,
        cod_dep: req.query.cod_dep ? parseInt(req.query.cod_dep) : null,
        cod_reg: req.query.cod_reg ? parseInt(req.query.cod_reg) : null,
        cod_com: req.query.cod_com ? parseInt(req.query.cod_com) : null,
        nombres: req.query.nombres || '',
      };
      const resultado = await autoridadService.listar(filtros);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) { next(error); }
  }

  static async obtenerPorId(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const resultado = await autoridadService.obtenerPorId(id);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) { next(error); }
  }

  static async crear(req, res, next) {
    try {
      const dto = new AutoridadDTO(req.body);
      const usuarioRegistrador = req.usuario.email;
      const resultado = await autoridadService.crear(dto, usuarioRegistrador);
      res.status(201).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
    } catch (error) { next(error); }
  }

  static async actualizar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const dto = new AutoridadDTO(req.body);
      const usuarioModificador = req.usuario.email;
      const resultado = await autoridadService.actualizar(id, dto, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
    } catch (error) { next(error); }
  }

  static async activar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await autoridadService.activarAutoridad(id, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) { next(error); }
  }

  static async inactivar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const { fecha_fin } = req.body; // opcional
      const usuarioModificador = req.usuario.email;
      const resultado = await autoridadService.inactivarAutoridad(id, fecha_fin, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) { next(error); }
  }

  static async suspender(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await autoridadService.suspenderAutoridad(id, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) { next(error); }
  }

  static async eliminar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await autoridadService.eliminarAutoridad(id, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) { next(error); }
  }

  static async obtenerPorUsuario(req, res, next) {
  try {
    const usuarioId = req.usuario.id;
    const resultado = await autoridadService.obtenerPorUsuario(usuarioId);
    res.status(200).json({ exito: true, datos: resultado });
  } catch (error) {
    next(error);
  }
}

static async obtenerUsuario(req, res, next) {
  console.log('🚀 Método obtenerUsuario EJECUTADO');
  try {
    const autoridadId = parseInt(req.params.id);
    console.log('📌 ID de autoridad:', autoridadId);
    const resultado = await autoridadService.obtenerUsuarioPorAutoridadId(autoridadId);
    res.status(200).json({ exito: true, datos: resultado });
  } catch (error) {
    console.error('❌ Error en obtenerUsuario:', error.message);
    next(error);
  }
}
}