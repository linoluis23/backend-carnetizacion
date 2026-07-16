import { ParametroSistemaRepository } from '../repositories/parametro-sistema.repository.js';

const config = {
  // Seguridad
  MAX_INTENTOS_FALLIDOS: 5,
  JWT_EXPIRACION: '24h',
  TIEMPO_BLOQUEO_MINUTOS: 30,
  TIEMPO_EXPIRACION_RESET: 30,
  MAX_INTENTOS_CODIGO: 3,

  // Estados de usuario
  ESTADOS: {
    ACTIVO: 'ACT',
    BLOQUEADO: 'BLO',
    ELIMINADO: 'ELI',
    INACTIVO: 'INA',      // si lo usas
  },

  // Estados de códigos de reseteo
  ESTADOS_CODIGO: {
    VIGENTE: 'VIG',
    CANCELADO: 'CA',
  },

  // Estados de rol
  ESTADOS_ROL: {
    ACTIVO: 'ACT',
    INACTIVO: 'INA',
  },

  // Estados de usuario_rol
  ESTADOS_USUARIO_ROL: {
    ACTIVO: 'ACT',
    INACTIVO: 'INA',
  },

  // Estados para regional (grupo ESTADO)
  ESTADO_REGIONAL: {
    ACTIVO: 'ACT',
    INACTIVO: 'INA',
  },

  ESTADO: {
  ACTIVO: 'ACT',
  INACTIVO: 'INA',
},
TIPO_SOCIO: { 'TIT': 'TIRULAR', 'DEL': 'DELEGADO' },
TIPO_DOCUMENTO: { 'CI': 'CEDULA DE IDENTIDAD', 'PAS': 'PASAPORTE' },
GENERO: { 'M': 'MASCULINO', 'F': 'FEMENINO', 'O': 'OTRO' },

ESTADOS_AUTORIDAD: {
  ACTIVO: 'ACT',
  INACTIVO: 'INA',
  SUSPENDIDO: 'SUS',
  ELIMINADO: 'ELI',
},
ESTADOS_PROGRAMACION: {
  ACTIVO: 'ACT',
  INACTIVO: 'INA',
  ELIMINADO: 'ELI',
},
ESTADOS_SOLICITUD: { PENDIENTE: 'PEN', APROBADO: 'APR', RECHAZADO: 'REC', EMITIDO: 'EMI' },
FECHA_VIGENCIA_DEFAULT: '2028-12-31',
VIGENCIA_CERTIFICADO: 365,  // días

ESTADOS_CIVIL: {
  SOLTERO_A: 'S',
  CASADO_A: 'C',
  DIVORCIADO_A: 'D',
  VIUDO_A: 'V',
},
ESTADOS_PERMISO: {
  ACTIVO: 'ACT',
  INACTIVO: 'INA',
  ELIMINADO: 'ELI',
},

};



let inicializado = false;

export async function inicializarConfiguracion() {
  if (inicializado) return;

  try {
    console.log('⏳ Cargando parámetros del sistema desde la base de datos...');
    const repo = new ParametroSistemaRepository();

    // --- SEGURIDAD ---
    const paramsSeg = await repo.obtenerPorGrupo('SEGURIDAD');
    if (paramsSeg.MAX_INTENTOS_FALLIDOS) config.MAX_INTENTOS_FALLIDOS = parseInt(paramsSeg.MAX_INTENTOS_FALLIDOS, 10);
    if (paramsSeg.JWT_EXPIRACION) {
      const valor = paramsSeg.JWT_EXPIRACION.trim();
      config.JWT_EXPIRACION = /^\d+$/.test(valor) ? `${valor}m` : valor;
    }
    if (paramsSeg.TIEMPO_BLOQUEO_MINUTOS) config.TIEMPO_BLOQUEO_MINUTOS = parseInt(paramsSeg.TIEMPO_BLOQUEO_MINUTOS, 10);
    if (paramsSeg.TIEMPO_EXPIRACION_RESET) config.TIEMPO_EXPIRACION_RESET = parseInt(paramsSeg.TIEMPO_EXPIRACION_RESET, 10);
    if (paramsSeg.MAX_INTENTOS_CODIGO) config.MAX_INTENTOS_CODIGO = parseInt(paramsSeg.MAX_INTENTOS_CODIGO, 10);
    if (paramsSeg.VIGENCIA_CERTIFICADO) config.VIGENCIA_CERTIFICADO = parseInt(paramsSeg.VIGENCIA_CERTIFICADO, 10);
    // --- ESTADO_USUARIO ---
    const paramsEstUsr = await repo.obtenerPorGrupo('ESTADO_USUARIO');
    if (Object.keys(paramsEstUsr).length > 0) {
      config.ESTADOS = {};
      for (const [codigo, descripcion] of Object.entries(paramsEstUsr)) {
        const nombre = descripcion.toUpperCase().replace(/ /g, '_');
        config.ESTADOS[nombre] = codigo;
      }
    }

    // --- ESTADO_CODIGO ---
    const paramsEstCod = await repo.obtenerPorGrupo('ESTADO_CODIGO');
    if (Object.keys(paramsEstCod).length > 0) {
      config.ESTADOS_CODIGO = {};
      for (const [codigo, descripcion] of Object.entries(paramsEstCod)) {
        const nombre = descripcion.toUpperCase().replace(/ /g, '_');
        config.ESTADOS_CODIGO[nombre] = codigo;
      }
    }

    // --- ESTADO_ROL ---
    const paramsEstRol = await repo.obtenerPorGrupo('ESTADO_ROL');
    if (Object.keys(paramsEstRol).length > 0) {
      config.ESTADOS_ROL = {};
      for (const [codigo, descripcion] of Object.entries(paramsEstRol)) {
        const nombre = descripcion.toUpperCase().replace(/ /g, '_');
        config.ESTADOS_ROL[nombre] = codigo;
      }
    }

    // --- ESTADO_USUARIO_ROL ---
    const paramsEstUsuRol = await repo.obtenerPorGrupo('ESTADO_USUARIO_ROL');
    if (Object.keys(paramsEstUsuRol).length > 0) {
      config.ESTADOS_USUARIO_ROL = {};
      for (const [codigo, descripcion] of Object.entries(paramsEstUsuRol)) {
        const nombre = descripcion.toUpperCase().replace(/ /g, '_');
        config.ESTADOS_USUARIO_ROL[nombre] = codigo;
      }
    }

    // --- ESTADO (para regionales) ---
    const paramsEstReg = await repo.obtenerPorGrupo('ESTADO');
    if (Object.keys(paramsEstReg).length > 0) {
      config.ESTADO_REGIONAL = {};
      for (const [codigo, descripcion] of Object.entries(paramsEstReg)) {
        const nombre = descripcion.toUpperCase().replace(/ /g, '_');
        config.ESTADO_REGIONAL[nombre] = codigo;
      }
    }
    
    const paramsEst = await repo.obtenerPorGrupo('ESTADO');
if (Object.keys(paramsEst).length > 0) {
  config.ESTADO = {};
  for (const [codigo, descripcion] of Object.entries(paramsEst)) {
    const nombre = descripcion.toUpperCase().replace(/ /g, '_');
    config.ESTADO[nombre] = codigo;
  }
}

// --- TIPO_SOCIO ---
const paramsTipoSocio = await repo.obtenerPorGrupo('TIPO_SOCIO');
if (Object.keys(paramsTipoSocio).length > 0) {
  config.TIPO_SOCIO = paramsTipoSocio; // { 'TIT': 'TITULAR', 'DEL': 'DELEGADO' }
}

// --- TIPO_DOCUMENTO ---
const paramsTipoDoc = await repo.obtenerPorGrupo('TIPO_DOCUMENTO');
if (Object.keys(paramsTipoDoc).length > 0) {
  config.TIPO_DOCUMENTO = paramsTipoDoc; // { 'CI': 'CEDULA_IDENTIDAD', ... }
}

// --- GENERO ---
const paramsGenero = await repo.obtenerPorGrupo('GENERO');
if (Object.keys(paramsGenero).length > 0) {
  config.GENERO = paramsGenero; // { 'M': 'MASCULINO', 'F': 'FEMENINO', ... }
}
// --- TIPO_SOCIO ---
/*const paramsTipoSocio = await repo.obtenerPorGrupo('TIPO_SOCIO');
if (Object.keys(paramsTipoSocio).length > 0) {
  config.TIPO_SOCIO = {};
  for (const [codigo, descripcion] of Object.entries(paramsTipoSocio)) {
    const nombre = descripcion.toUpperCase().replace(/ /g, '_');
    config.TIPO_SOCIO[nombre] = codigo;
  }
}

// --- TIPO_DOCUMENTO ---
const paramsTipoDoc = await repo.obtenerPorGrupo('TIPO_DOCUMENTO');
if (Object.keys(paramsTipoDoc).length > 0) {
  config.TIPO_DOCUMENTO = {};
  for (const [codigo, descripcion] of Object.entries(paramsTipoDoc)) {
    const nombre = descripcion.toUpperCase().replace(/ /g, '_');
    config.TIPO_DOCUMENTO[nombre] = codigo;
  }
}

// --- GENERO ---
const paramsGenero = await repo.obtenerPorGrupo('GENERO');
if (Object.keys(paramsGenero).length > 0) {
  config.GENERO = {};
  for (const [codigo, descripcion] of Object.entries(paramsGenero)) {
    const nombre = descripcion.toUpperCase().replace(/ /g, '_');
    config.GENERO[nombre] = codigo;
  }
}

*/

// --- ESTADO_AUTORIDAD ---
const paramsEstAutoridad = await repo.obtenerPorGrupo('ESTADO_AUTORIDAD');
if (Object.keys(paramsEstAutoridad).length > 0) {
  config.ESTADOS_AUTORIDAD = {};
  for (const [codigo, descripcion] of Object.entries(paramsEstAutoridad)) {
    const nombrePropiedad = descripcion.toUpperCase().replace(/ /g, '_');
    config.ESTADOS_AUTORIDAD[nombrePropiedad] = codigo;
  }
}

const paramsEstProg = await repo.obtenerPorGrupo('ESTADO_PROGRAMACION');
if (Object.keys(paramsEstProg).length > 0) {
  config.ESTADOS_PROGRAMACION = {};
  for (const [codigo, descripcion] of Object.entries(paramsEstProg)) {
    const nombrePropiedad = descripcion.toUpperCase().replace(/ /g, '_');
    config.ESTADOS_PROGRAMACION[nombrePropiedad] = codigo;
  }
}


// --- ESTADO_SOLICITUD ---
const paramsEstSol = await repo.obtenerPorGrupo('ESTADO_SOLICITUD');
if (Object.keys(paramsEstSol).length > 0) {
  config.ESTADOS_SOLICITUD = {};
  for (const [codigo, descripcion] of Object.entries(paramsEstSol)) {
    config.ESTADOS_SOLICITUD[descripcion.toUpperCase().replace(/ /g, '_')] = codigo;
  }
}

// --- ESTADO_CIVIL ---
const paramsEstCiv = await repo.obtenerPorGrupo('ESTADO_CIVIL');
if (Object.keys(paramsEstCiv).length > 0) {
  config.ESTADOS_CIVIL = {};
  for (const [codigo, descripcion] of Object.entries(paramsEstCiv)) {
    config.ESTADOS_CIVIL[descripcion.toUpperCase().replace(/ /g, '_')] = codigo;
  }
}

// --- ESTADO_PERMISOS ---
const paramsEstPer = await repo.obtenerPorGrupo('ESTADO_PERMISO');
if (Object.keys(paramsEstPer).length > 0) {
  config.ESTADOS_PERMISO = {};
  for (const [codigo, descripcion] of Object.entries(paramsEstPer)) {
    config.ESTADOS_PERMISO[descripcion.toUpperCase().replace(/ /g, '_')] = codigo;
  }
}

// --- VIGENCIA_CARNET ---
const paramsVig = await repo.obtenerPorGrupo('VIGENCIA_CARNET');
if (paramsVig.FECHA_VIGENCIA) {
  config.FECHA_VIGENCIA_DEFAULT = paramsVig.FECHA_VIGENCIA;
}


    console.log('✅ Configuración final cargada:', config);
    inicializado = true;
  } catch (error) {
    console.error('⚠️ Error al cargar parámetros. Usando valores por defecto.', error.message);
  }
}

export { config };