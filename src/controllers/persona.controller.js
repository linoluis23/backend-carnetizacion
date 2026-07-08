import { PersonaService } from '../services/persona.service.js';
import { PersonaDTO } from '../dtos/persona.dto.js';
import XLSX from 'xlsx';
const personaService = new PersonaService();

export class PersonaController {
  static async listar(req, res, next) {
    try {
      const filtros = {
      cod_com: req.query.cod_com ? parseInt(req.query.cod_com) : null,
      cod_reg: req.query.cod_reg ? parseInt(req.query.cod_reg) : null,      // ← ¿está?
      cod_prov: req.query.cod_prov ? parseInt(req.query.cod_prov) : null,    // ← ¿está?
        estado: req.query.estado || null,
        nombres: req.query.nombres || null,
          q: req.query.q || null,   // ← nuevo

      };
      const resultado = await personaService.listar(filtros);
      res.status(200).json({ exito: true, mensaje: 'Personas obtenidas.', datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerPorId(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const resultado = await personaService.obtenerPorId(id);
      res.status(200).json({ exito: true, mensaje: 'Persona obtenida.', datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerPorCodPersona(req, res, next) {
    try {
      const codPersona = req.params.cod_persona; 
      const resultado = await personaService.obtenerPorCodPersona(codPersona);
      res.status(200).json({ exito: true, mensaje: 'Persona obtenida.', datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerPorCodSocio(req, res, next) {
    try {
      const codSocio = req.params.cod_socio;
      const resultado = await personaService.obtenerPorCodSocio(codSocio);
      res.status(200).json({ exito: true, mensaje: 'Persona obtenida.', datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerPorDocumento(req, res, next) {
    try {
      const {documento_identidad, cod_complementario } = req.query;
      const resultado = await personaService.obtenerPorDocumento(documento_identidad, cod_complementario || null);
      res.status(200).json({ exito: true, mensaje: 'Persona obtenida.', datos: resultado });
    } catch (error) {
      next(error);
    }
  }

  static async registrar(req, res, next) {
    try {
      const dto = new PersonaDTO(req.body);
      const usuarioRegistrador = req.usuario.email;
      const resultado = await personaService.registrar(dto, usuarioRegistrador);
      res.status(201).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
    } catch (error) {
      next(error);
    }
  }

  static async actualizar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const dto = new PersonaDTO(req.body);
      const usuarioModificador = req.usuario.email;
      const resultado = await personaService.actualizar(id, dto, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
    } catch (error) {
      next(error);
    }
  }

  static async eliminar(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const usuarioModificador = req.usuario.email;
      const resultado = await personaService.eliminar(id, usuarioModificador);
      res.status(200).json({ exito: true, mensaje: resultado.mensaje, datos: resultado.datos });
    } catch (error) {
      next(error);
    }
  }

  static async activar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const usuarioModificador = req.usuario.email;
    const resultado = await personaService.activarPersona(id, usuarioModificador);
    res.status(200).json({ exito: true, mensaje: 'Persona activada exitosamente.', datos: resultado });
  } catch (error) {
    next(error);
  }
}

static async cargaMasiva(req, res, next) {
  try {
    const personas = req.body;
    if (!Array.isArray(personas) || personas.length === 0) {
      return res.status(400).json({ exito: false, mensaje: 'Debe enviar un arreglo de personas.' });
    }
    const usuarioRegistrador = req.usuario.email;
    const resultado = await personaService.cargaMasiva(personas, usuarioRegistrador);
    res.status(200).json({ exito: true, datos: resultado });
  } catch (error) {
    next(error);
  }
}

static async cargaMasivaExcel(req, res, next) {
  try {
    if (!req.file) throw new AppError('Debe enviar un archivo Excel.', 400);
    //const XLSX = require('xlsx');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const usuarioRegistrador = req.usuario.email;
    const resultado = await personaService.cargaMasiva(data, usuarioRegistrador);
    res.status(200).json({ exito: true, datos: resultado });
  } catch (error) {
    next(error);
  }
}

static async obtenerHistorial(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const resultado = await personaService.obtenerHistorialPersona(id);
    res.status(200).json({ exito: true, datos: resultado });
  } catch (error) {
    next(error);
  }
}

}