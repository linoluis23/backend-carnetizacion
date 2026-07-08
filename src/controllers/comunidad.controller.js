import { ComunidadService } from '../services/comunidad.service.js';
import { ComunidadDTO } from '../dtos/comunidad.dto.js';

const comunidadService = new ComunidadService();

export class ComunidadController {
  static async listar(req, res, next) {
    try {
      const codReg = req.query.cod_reg ? parseInt(req.query.cod_reg) : null;
    const codProv = req.query.cod_prov ? parseInt(req.query.cod_prov) : null;
    const estado = req.query.estado || null;
    const resultado = await comunidadService.listarComunidades({ cod_reg: codReg, cod_prov: codProv, estado });
      res.status(200).json({ exito: true, mensaje: 'Comunidades obtenidas.', datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerPorId(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const resultado = await comunidadService.obtenerPorId(id);
      res.status(200).json({ exito: true, mensaje: 'Comunidad obtenida.', datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerPorCodigo(req, res, next) {
    try {
      const codCom = parseInt(req.params.cod_com);
      const resultado = await comunidadService.obtenerPorCodigo(codCom);
      res.status(200).json({ exito: true, mensaje: 'Comunidad obtenida.', datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  static async registrar(req, res, next) {
    try {
      const dto = new ComunidadDTO(req.body);
      const usuarioRegistrador = req.usuario.email;
      const resultado = await comunidadService.registrar(dto, usuarioRegistrador);
      res.status(201).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
    } catch (error) {
      next(error);
    }
  }

  static async actualizar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const dto = new ComunidadDTO(req.body);
      const usuarioModificador = req.usuario.email;
      const resultado = await comunidadService.actualizar(id, dto, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
    } catch (error) {
      next(error);
    }
  }

  static async eliminar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await comunidadService.eliminar(id, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
    } catch (error) {
      next(error);
    }
  }

  static async activar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const usuarioModificador = req.usuario.email;
    const resultado = await comunidadService.activarComunidad(id, usuarioModificador);
    res.status(200).json({ exito: true, mensaje: 'Comunidad activada exitosamente.', datos: resultado });
  } catch (error) {
    next(error);
  }
}
}