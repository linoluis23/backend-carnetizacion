import { body, validationResult } from 'express-validator';
import { config } from '../config/configuracion.js';
import { RolPermisoService } from '../services/rol-permiso.service.js';

//const rolPermisoService = new RolPermisoService();
//import Joi from 'joi';
/**
 * Middleware para validar campos de registro.
 */
export const validarRegistro = [
  body('email')
    .isEmail().withMessage('Debe ser un email válido.')
    .contains('@').withMessage('El email debe contener @.'),
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula.')
    .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una minúscula.')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('La contraseña debe contener al menos un carácter especial.'),
  body('nombres').notEmpty().withMessage('Los nombres son obligatorios.'),
    body('documento_identidad')
    .notEmpty().withMessage('El número de documento es obligatorio.')
  .isString()
  .isString().isLength({ min: 5, max: 10 }).withMessage('Documento de identidad inválido.'),

  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }
    next();
  },
];

/**
 * Middleware para validar login.
 */
export const validarLogin = [
  body('email').isEmail().withMessage('Email inválido.'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }
    next();
  },

  
];

/**
 * Middleware para validar los campos de actualización de perfil.
 */
export const validarActualizacion = [
  body('nombres')
    .optional()
    .notEmpty().withMessage('Los nombres no pueden estar vacíos.'),
  body('primer_apellido')
    .optional()
    .notEmpty().withMessage('El primer apellido no puede estar vacío.'),
  body('segundo_apellido')
    .optional(),
  body('foto')
    .optional()
    .isString().withMessage('La foto debe ser una cadena de texto (base64 o URL).'),
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }
    // Verificar que al menos un campo haya sido enviado
    const { nombres, primer_apellido, segundo_apellido, foto } = req.body;
    if (!nombres && !primer_apellido && !segundo_apellido && !foto) {
      return res.status(400).json({ mensaje: 'Debe enviar al menos un campo para actualizar.' });
    }
    next();
  },
];


// Validador reutilizable para contraseñas fuertes
export const passwordFuerte = (value, { req }) => {
  if (!value) return true; // se valida con notEmpty antes
  if (value.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  if (!/[A-Z]/.test(value)) throw new Error('La contraseña debe contener al menos una mayúscula.');
  if (!/[a-z]/.test(value)) throw new Error('La contraseña debe contener al menos una minúscula.');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) throw new Error('La contraseña debe contener al menos un carácter especial.');
  return true;
};

// Validación para cambio de contraseña
export const validarCambioPassword = [
  body('passwordActual').notEmpty().withMessage('La contraseña actual es obligatoria.'),
  body('nuevaPassword')
    .notEmpty().withMessage('La nueva contraseña es obligatoria.')
    .custom(passwordFuerte),
  body('confirmarPassword')
    .notEmpty().withMessage('Debe confirmar la nueva contraseña.')
    .custom((value, { req }) => {
      if (value !== req.body.nuevaPassword) throw new Error('Las contraseñas no coinciden.');
      return true;
    }),
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
    next();
  },
];

// Validación para resetear contraseña (solo nuevaPassword)
export const validarResetPassword = [
  body('nuevaPassword')
    .optional() // ← ahora es opcional
    .custom(passwordFuerte), // Si se envía, debe ser fuerte
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
    next();
  },
];

export const validarResetPasswordExterno = [
  body('email')
    .notEmpty().withMessage('El email es obligatorio.')
    .isEmail().withMessage('Debe proporcionar un email válido.'),
  body('codigo')
    .notEmpty().withMessage('El código es obligatorio.')
    .isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos.'),
  body('password')
    .notEmpty().withMessage('La nueva contraseña es obligatoria.')
    .custom(passwordFuerte),
  body('confirmarPassword')
    .notEmpty().withMessage('Debe confirmar la nueva contraseña.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden.');
      }
      return true;
    }),
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }
    next();
  },
];

export const validarRol = [
  body('nombre').notEmpty().withMessage('El nombre del rol es obligatorio.')
    .isLength({ max: 50 }).withMessage('Máximo 50 caracteres.'),
  body('descripcion').optional().isLength({ max: 255 }).withMessage('Máximo 255 caracteres.'),
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
    next();
  },
];

export const validarAsignacionRol = [
  body('rol_id').notEmpty().isInt().withMessage('Debe proporcionar un rol_id válido.'),
  body('fecha_desde').optional().isISO8601().withMessage('Fecha desde inválida.'),
  body('fecha_hasta').optional().isISO8601().withMessage('Fecha hasta inválida.'),
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
    next();
  },
];

export const validarComunidad = [
  body('cod_reg').notEmpty().isInt().withMessage('Código de regional obligatorio.'),
  // body('cod_com').notEmpty().isInt().withMessage('Código de comunidad obligatorio.'),
  body('descripcion').notEmpty().isLength({ max: 150 }).withMessage('Descripción obligatoria (máx. 150).'),
  // ✅ Cambiar: descripcion_corta ahora es opcional
  body('descripcion_corta').optional().isLength({ max: 150 }).withMessage('Descripción corta (máx. 150).'),
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
    next();
  },
];

export const validarPersona = [
  body('cod_com').notEmpty().isInt().withMessage('Código de comunidad obligatorio.'),
  body('cod_socio').notEmpty().withMessage('Código de socio obligatorio.'),
  body('nombres').notEmpty().isLength({ max: 100 }).withMessage('Nombres obligatorios (máx. 100).'),
  body('primer_apellido').notEmpty().isLength({ max: 100 }).withMessage('Primer apellido obligatorio.'),
  body('tipo_socio').notEmpty().withMessage('Tipo de socio obligatorio.')
    .custom(val => config.TIPO_SOCIO?.hasOwnProperty(val) ? true : Promise.reject('Tipo de socio no válido.')),
  body('tipo_documento').notEmpty().withMessage('Tipo de documento obligatorio.')
    .custom(val => config.TIPO_DOCUMENTO?.hasOwnProperty(val) ? true : Promise.reject('Tipo de documento no válido.')),
  body('documento_identidad').notEmpty().withMessage('Documento de identidad obligatorio.'),
  body('genero').notEmpty().withMessage('Género obligatorio.')
    .custom(val => config.GENERO?.hasOwnProperty(val) ? true : Promise.reject('Género no válido.')),

  body('estado_civil')
  .optional({ values: 'falsy' })
  .custom(val => Object.values(config.ESTADOS_CIVIL).includes(val) ? true : Promise.reject('Estado civil no válido.'))
  .isLength({ max: 100 }).withMessage('Máximo 100 caracteres.'),

  // Celular: opcional, pero si se envía debe ser solo dígitos
  body('celular')
  .optional({ values: 'falsy' })
  .matches(/^[0-9]+$/)
  .isLength({ min: 8, max: 8 }) // ejemplo de longitud
  .withMessage('El celular debe contener solo números y tener 8 dígitos.'),

  // Fecha de nacimiento: opcional, pero si se envía debe ser mayor de 18 años
  body('fecha_nacimiento')
    .optional({ values: 'falsy' })
    .isDate().withMessage('Fecha de nacimiento inválida.')
    .custom((value) => {
      if (!value) return true; // ya es opcional, pero por claridad
      const hoy = new Date();
      const fechaNac = new Date(value);
      let edad = hoy.getFullYear() - fechaNac.getFullYear();
      const mes = hoy.getMonth() - fechaNac.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
      }
      if (edad < 18) {
        throw new Error('La persona debe ser mayor de 18 años.');
      }
      return true;
    }),

  // Correo electrónico: opcional, pero si se envía debe ser email válido
  body('correo_electronico')
    .optional({ values: 'falsy' })  // acepta vacío, null, undefined
    .isEmail().withMessage('Correo electrónico inválido.'),

  // Los demás campos opcionales
  body('cod_complementario').optional({ values: 'falsy' }).isLength({ max: 5 }),
  body('lugar_nacimiento').optional({ values: 'falsy' }).isLength({ max: 100 }),
  body('estado_civil').optional({ values: 'falsy' }).isLength({ max: 100 }),
  body('direccion_domicilio').optional({ values: 'falsy' }),

  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }
    next();
  },
];


export const validarAutoridad = [
  body('cargo_id').notEmpty().isInt().withMessage('Cargo obligatorio.'),
  body('persona_id').notEmpty().isInt().withMessage('Persona obligatoria.'),
  body('fecha_inicio').notEmpty().isDate().withMessage('Fecha de inicio obligatoria.'),
  body('fecha_fin').optional({ values: 'falsy' }).isDate().withMessage('Fecha de fin inválida.'),
  body('estado').optional({ values: 'falsy' }).custom(val => Object.values(config.ESTADOS_AUTORIDAD).includes(val) ? true : Promise.reject('Estado no válido.')),  // Los campos geográficos se validan según el cargo en el servicio
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
    next();
  },
  body('glosa').optional({ values: 'falsy' }).isLength({ max: 255 }).withMessage('La glosa no debe exceder 255 caracteres.'),
  
];


export const validarProgramacion = [
  body('cod_reg').notEmpty().isInt().withMessage('Regional obligatoria.'),
  body('fecha_inicio').notEmpty().isDate().withMessage('Fecha de inicio obligatoria.'),
  body('fecha_fin').notEmpty().isDate().withMessage('Fecha de fin obligatoria.'),
  body('glosa').optional({ values: 'falsy' }).isLength({ max: 255 }).withMessage('Máximo 255 caracteres.'),
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
    next();
  },
];

export const validarSolicitud = [
  body('persona_id').notEmpty().isInt().withMessage('Persona obligatoria.'),
  body('programacion_id').optional({ values: 'falsy' }).isInt().withMessage('Programación inválida.'),

body('aval_comunidad').notEmpty().isBoolean().withMessage('El aval de la comunidad es obligatorio (true/false).'),
//body('aval_regional').notEmpty().isBoolean().withMessage('El aval regional es obligatorio (true/false).'),
//body('aval_otros').notEmpty().isBoolean().withMessage('El aval otros es obligatorio (true/false).'),

 // body('aval_comunidad')
  //.notEmpty().withMessage('El aval de la comunidad es obligatorio.')
 //.isBoolean().withMessage('aval_comunidad debe ser un valor booleano (true/false).'),
//body('aval_comunidad')
  //.isBoolean({ loose: true }).withMessage('El aval de la comunidad es obligatorio (debe ser true o false).'),
//body('aval_regional')
  //.isBoolean({ loose: true }).withMessage('El aval regional es obligatorio (debe ser true o false).'),
//body('aval_otros')
  //.isBoolean({ loose: true }).withMessage('El aval otros es obligatorio (debe ser true o false).'),

    body('aval_regional').optional().isBoolean().withMessage('Aval regional debe ser booleano.'),
  body('aval_otros').optional().isBoolean().withMessage('Aval otros debe ser booleano.'),
  body('foto').optional().isString().withMessage('Foto inválida.'),
  //body('fecha_vigencia').optional().isDate().withMessage('Fecha de vigencia inválida.'),
  body('fecha_vigencia').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Fecha de vigencia inválida.'),
  body('observaciones').optional().isLength({ max: 500 }).withMessage('Máximo 500 caracteres.'),
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
    next();
  },
];

// Valida que se haya subido una foto obligatoria (usado en solicitudes)
export const validarFotoObligatoria = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      exito: false,
      mensaje: 'La foto del solicitante es obligatoria.',
    });
  }
  next();
};

// Middleware para convertir campos booleanos enviados como texto en FormData
export const normalizarBooleanos = (req, res, next) => {
  const camposBooleanos = ['aval_comunidad', 'aval_regional', 'aval_otros'];
  for (const campo of camposBooleanos) {
    if (req.body[campo] === 'true') req.body[campo] = true;
    else if (req.body[campo] === 'false') req.body[campo] = false;
    else if (req.body[campo] === '') req.body[campo] = undefined; // para que falle la validación
  }
  next();
};

export const validarGenerarCertificado = [
  // El ID de la autoridad viene en la URL, no en el body. Solo validamos que exista.
  (req, res, next) => {
    if (!req.params.id) {
      return res.status(400).json({ exito: false, mensaje: 'ID de autoridad requerido.' });
    }
    next();
  },
];

export const validarPermiso = (req, res, next) => {
  const { codigo, nombre, descripcion } = req.body;

  // Validaciones básicas
  if (!codigo || codigo.trim() === '') {
    return res.status(400).json({
      exito: false,
      mensaje: 'El campo "codigo" es obligatorio',
    });
  }

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({
      exito: false,
      mensaje: 'El campo "nombre" es obligatorio',
    });
  }

  // Si todo está bien, continúa
  next();
};


/*
export const tienePermiso = (codigoPermiso) => {
  return async (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({ mensaje: 'No autenticado' });
      }

      // Si el usuario es ADMIN, tiene acceso a todo (opcional)
      const esAdmin = req.usuario.roles?.some(r => r.nombre === 'ADMIN');
      if (esAdmin) {
        return next();
      }

      // Obtener códigos de permisos del usuario
      const permisos = await rolPermisoService.obtenerCodigosPermisoDeUsuario(req.usuario.id);
      
      if (permisos.includes(codigoPermiso)) {
        next();
      } else {
        res.status(403).json({ mensaje: 'No tiene permiso para realizar esta acción' });
      }
    } catch (error) {
      next(error);
    }
  };
};*/

/*
export const validarPermiso = (req, res, next) => {
  const { codigo, nombre } = req.body;
  if (!codigo || !nombre) {
    return res.status(400).json({ mensaje: 'Código y nombre son obligatorios' });
  }
  next();
};*/