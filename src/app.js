import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usuarioRoutes from './routes/usuario.routes.js';
import { AppError } from './utils/errores.util.js';
import rolRoutes from './routes/rol.routes.js';
import usuarioRolRoutes from './routes/usuario-rol.routes.js';
import departamentoRoutes from './routes/departamento.routes.js';
import provinciaRoutes from './routes/provincia.routes.js';
import regionalRoutes from './routes/regional.routes.js';
import comunidadRoutes from './routes/comunidad.routes.js';
import personaRoutes from './routes/persona.routes.js';
import parametroRoutes from './routes/parametro.routes.js';
import estadisticasRoutes from './routes/estadisticas.routes.js';
import autoridadRoutes from './routes/autoridad.routes.js';
import cargoRoutes from './routes/cargo.routes.js';
import programacionRoutes from './routes/programacion.routes.js';
import solicitudRoutes from './routes/solicitud-carnet.routes.js';
import certificadoRoutes from './routes/certificado.routes.js';




dotenv.config();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rutas
app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/roles', rolRoutes);
app.use('/api/v1', usuarioRolRoutes); // ya incluye los prefijos /usuarios y /roles
// ... después de los otros app.use
app.use('/api/v1/departamentos', departamentoRoutes);
app.use('/api/v1/provincias', provinciaRoutes);
app.use('/api/v1/regionales', regionalRoutes);
app.use('/api/v1/comunidades', comunidadRoutes);
app.use('/api/v1/personas', personaRoutes);
app.use('/api/v1/parametros', parametroRoutes);

// ...
app.use('/api/v1/estadisticas', estadisticasRoutes);

app.use('/api/v1/autoridades', autoridadRoutes);

app.use('/api/v1/cargos', cargoRoutes);
app.use('/api/v1/programaciones', programacionRoutes);
app.use('/api/v1/solicitudes', solicitudRoutes);
app.use('/api/v1/', certificadoRoutes);
// Manejador de errores centralizado
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    // Errores controlados: se muestra advertencia sin stack
    console.warn(`⚠️ [${err.codigoEstado}] ${err.message}`);
  } else {
    // Errores inesperados: se imprime el stack completo para depuración
    console.error('❌ Error interno:', err.stack);
  }

  res.status(err.codigoEstado || 500).json({
    exito: false,
    mensaje: err.message || 'Error interno del servidor.',
  });
});

export default app;