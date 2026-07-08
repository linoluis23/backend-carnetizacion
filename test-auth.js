import { hashPassword, verifyPassword } from './src/utils/hash.util.js';

// Probar hash y verificación
const password = 'Admin@123';
console.log('Contraseña original:', password);

const hashed = hashPassword(password);
console.log('Hash generado:', hashed);
console.log('Formato correcto:', hashed.includes(':'));

const isValid = verifyPassword(password, hashed);
console.log('Verificación correcta:', isValid);

const isInvalid = verifyPassword('PasswordErronea', hashed);
console.log('Verificación incorrecta:', !isInvalid);