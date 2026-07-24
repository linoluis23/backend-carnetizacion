import { verificarToken } from '../utils/jwt.util.js';
import { UsuarioService } from '../services/usuario.service.js';
import { config } from 'dotenv';

const usuarioService = new UsuarioService();

export const autenticarToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ mensaje: 'Token no proporcionado.' });
  }

  try {
    const payload = verificarToken(token);
    const usuario = await usuarioService.buscarPorId(payload.id);
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado.' });
    }
    if (payload.email !== usuario.email) {
    return res.status(401).json({ mensaje: 'Token no válido: información inconsistente.' });
}
    if (usuario.estado_usuario !== 'ACT') {
      return res.status(403).json({ mensaje: 'Cuenta no activa.' });
    }
    req.usuario = { id: usuario.id, email: usuario.email, nombres: usuario.nombres, documento_identidad: usuario.documento_identidad };
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
  }
};