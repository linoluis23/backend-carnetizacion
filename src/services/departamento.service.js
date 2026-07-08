import { DepartamentoRepository } from '../repositories/departamento.repository.js';
import { AppError } from '../utils/errores.util.js';

export class DepartamentoService {
  constructor() {
    this.departamentoRepo = new DepartamentoRepository();
  }

  /**
   * Obtiene la lista de departamentos, con filtro opcional por país.
   * @param {number} [codPais]
   * @returns {Promise<Array>}
   */
  async listarDepartamentos(codPais = null) {
    const departamentos = await this.departamentoRepo.listar(codPais);
    return departamentos.map(dep => ({
      id: dep.id,
      cod_dep: dep.cod_dep,
      descripcion: dep.descripcion,
      descripcion_corta: dep.descripcion_corta,
      cod_pais: dep.cod_pais,
    }));
  }

  /**
   * Obtiene un departamento por su ID.
   * @param {number} id
   * @returns {Promise<object>}
   */
  async obtenerDepartamentoPorId(id) {
    const dep = await this.departamentoRepo.buscarPorId(id);
    if (!dep) throw new AppError('Departamento no encontrado.', 404);
    return {
      id: dep.id,
      cod_dep: dep.cod_dep,
      descripcion: dep.descripcion,
      descripcion_corta: dep.descripcion_corta,
      cod_pais: dep.cod_pais,
    };
  }

    async obtenerDepartamentoPorCodigo(codDep) {
    const dep = await this.departamentoRepo.buscarPorCodigo(codDep);
    if (!dep) throw new AppError('Departamento no encontrado.', 404);
    return {
      id: dep.id,
      cod_dep: dep.cod_dep,
      descripcion: dep.descripcion,
      descripcion_corta: dep.descripcion_corta,
      cod_pais: dep.cod_pais,
    };
  }
}