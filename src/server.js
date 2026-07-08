import app from './app.js';
import { inicializarConfiguracion } from './config/configuracion.js';

const PORT = process.env.PORT || 3000;

inicializarConfiguracion()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error fatal al iniciar:', error);
    process.exit(1);
  });