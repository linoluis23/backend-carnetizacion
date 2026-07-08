import { ProvinciaRepository } from '../repositories/provincia.repository.js';
import { AppError } from '../utils/errores.util.js';

export class ProvinciaService {
  constructor() {
    this.provinciaRepo = new ProvinciaRepository();
  }

  async listarProvincias(codDep = null) {
    const provincias = await this.provinciaRepo.listar(codDep);
    return provincias.map(prov => ({
      id: prov.id,
      cod_dep: prov.cod_dep,
      cod_prov: prov.cod_prov,
      descripcion: prov.descripcion,
      descripcion_corta: prov.descripcion_corta,
      descripcion_departamento: prov.descripcion_departamento || null,
    }));
  }

  async obtenerProvinciaPorId(id) {
    const prov = await this.provinciaRepo.buscarPorId(id);
    if (!prov) throw new AppError('Provincia no encontrada.', 404);
    return {
      id: prov.id,
      cod_dep: prov.cod_dep,
      cod_prov: prov.cod_prov,
      descripcion: prov.descripcion,
      descripcion_corta: prov.descripcion_corta,
      descripcion_departamento: prov.descripcion_departamento || null,
    };
  }

  async obtenerProvinciaPorCodigo(codProv) {
    const prov = await this.provinciaRepo.buscarPorCodigo(codProv);
    if (!prov) throw new AppError('Provincia no encontrada.', 404);
    return {
      id: prov.id,
      cod_dep: prov.cod_dep,
      cod_prov: prov.cod_prov,
      descripcion: prov.descripcion,
      descripcion_corta: prov.descripcion_corta,
      descripcion_departamento: prov.descripcion_departamento || null,
    };
  }
}