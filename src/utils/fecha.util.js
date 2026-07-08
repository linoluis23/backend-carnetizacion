/**
 * Convierte una fecha (string, Date o timestamp) a un formato local de Bolivia.
 * @param {string|Date} valor - Fecha en cualquier formato reconocible
 * @returns {string} Fecha formateada como "dd/mm/aaaa, hh:mm:ss" o cadena vacía si es nulo/inválido
 */
export function formatearFecha(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return ''; // fecha inválida
  return fecha.toLocaleString('es-BO', {
    timeZone: 'America/La_Paz',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}