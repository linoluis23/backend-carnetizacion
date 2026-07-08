import { ProgramacionService } from '../services/programacion.service.js';
import { ProgramacionDTO } from '../dtos/programacion.dto.js';
import { config } from '../config/configuracion.js';

const programacionService = new ProgramacionService();

export class ProgramacionController {
  static async listar(req, res, next) {
    try {
      const filtros = {
        estado: req.query.estado,
        cod_reg: req.query.cod_reg ? parseInt(req.query.cod_reg) : null,
      };
      const resultado = await programacionService.listar(filtros);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) { next(error); }
  }

  static async obtenerPorId(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const resultado = await programacionService.obtenerPorId(id);
      res.status(200).json({ exito: true, datos: resultado });
    } catch (error) { next(error); }
  }

  static async crear(req, res, next) {
    try {
      const dto = new ProgramacionDTO(req.body);
      const usuarioRegistrador = req.usuario.email;
      const resultado = await programacionService.crear(dto, usuarioRegistrador);
      res.status(201).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
    } catch (error) { next(error); }
  }

  static async actualizar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const dto = new ProgramacionDTO(req.body);
      const usuarioModificador = req.usuario.email;
      const resultado = await programacionService.actualizar(id, dto, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
    } catch (error) { next(error); }
  }

  static async activar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await programacionService.cambiarEstado(id, config.ESTADOS_PROGRAMACION.ACTIVO, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) { next(error); }
  }

  static async inactivar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await programacionService.cambiarEstado(id, config.ESTADOS_PROGRAMACION.INACTIVO, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) { next(error); }
  }

  static async eliminar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await programacionService.cambiarEstado(id, config.ESTADOS_PROGRAMACION.ELIMINADO, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje });
    } catch (error) { next(error); }
  }
}