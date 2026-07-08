import bcrypt from 'bcrypt';

const password = '123456';
const saltRounds = 12;

console.log('🔐 Generando hash para:', password);
const hash = await bcrypt.hash(password, saltRounds);
console.log('✅ Hash bcrypt:', hash);
console.log('Puedes usarlo para insertar o actualizar el usuario administrador.');