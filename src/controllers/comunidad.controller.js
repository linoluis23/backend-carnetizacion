import { ComunidadService } from '../services/comunidad.service.js';
import { ComunidadDTO } from '../dtos/comunidad.dto.js';

const comunidadService = new ComunidadService();

export class ComunidadController {
static async listar(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const filtros = {
      cod_reg: req.query.cod_reg ? parseInt(req.query.cod_reg) : null,
      cod_prov: req.query.cod_prov ? parseInt(req.query.cod_prov) : null,
      estado: req.query.estado || null,
      busqueda: req.query.busqueda || null,
      // Recibir nombres amigables: 'cod_com', 'descripcion', 'regional'
      orderBy: req.query.orderBy || 'descripcion',
      orderDir: req.query.orderDir === 'DESC' ? 'DESC' : 'ASC'
    };

    const resultado = await comunidadService.listarComunidades(filtros, { limit, offset });
    res.status(200).json({
      exito: true,
      mensaje: 'Comunidades obtenidas.',
      datos: resultado.datos,
      total: resultado.total,
      pagina: page,
      totalPaginas: Math.ceil(resultado.total / limit)
    });
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