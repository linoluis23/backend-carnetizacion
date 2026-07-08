import { CargoRepository } from '../repositories/cargo.repository.js';

const cargoRepo = new CargoRepository();

export class CargoController {
  static async listar(req, res, next) {
    try {
      const cargos = await cargoRepo.listar(); // trae todos los cargos activos e inactivos
      res.status(200).json({ exito: true, datos: cargos });
    } catch (error) {
      next(error);
    }
  }
}