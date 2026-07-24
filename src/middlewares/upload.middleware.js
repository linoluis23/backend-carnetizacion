import multer from 'multer';
import path from 'path';

import { AppError } from '../utils/errores.util.js';

// Almacenamiento en memoria (buffer)
const storage = multer.memoryStorage();

// Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg'];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Formato de imagen no permitido. Use JPEG, JPG o PNG.', 400), false);
  }
};

// Configuración de multer

const excelStorage = multer.memoryStorage(); // <--- AÑADIR ESTA LÍNEA

// ---------- Configuración para imágenes ----------
const imageStorage = multer.memoryStorage(); // nombre cambiado
export const subirImagen = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg'];
    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Formato de imagen no permitido. Use JPEG, JPG o PNG.', 400), false);
    }
  },
}).single('foto');

// ---------- Configuración para Excel ----------
export const subirExcel = (req, res, next) => {
  const upload = multer({
    storage: excelStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
      const allowed = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new AppError('Solo se permiten archivos Excel (.xlsx, .xls).', 400), false);
      }
    },
  }).single('archivo');

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error al procesar el archivo: ' + err.message,
      });
    } else if (err) {
      return next(err);
    }
    // Verificar si realmente se envió un archivo
    if (!req.file) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe seleccionar un archivo Excel para cargar.',
      });
    }
    next();
  });
};


export const uploadP12 = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (ext === 'p12' || ext === 'pfx') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .p12 o .pfx'), false);
    }
  },
});