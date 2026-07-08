import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function usePermisos() {
  const { permisos } = useContext(AuthContext);
  
  const tienePermiso = (codigo) => permisos.includes(codigo);
  const esAdmin = permisos.includes('usuarios');
  
  return { permisos, tienePermiso, esAdmin };
}