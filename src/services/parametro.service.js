import api from './api';

export const parametroService = {
  obtenerPorGrupo: (grupo) => api.get('/parametros', { params: { grupo } }),
};