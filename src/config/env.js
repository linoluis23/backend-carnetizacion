import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_USER = process.env.DB_USER || 'root';
export const DB_PASS = process.env.DB_PASS || '';
export const DB_NAME = process.env.DB_NAME || 'db_laboratorio';
export const JWT_SECRET = process.env.JWT_SECRET || 'clave_super_secreta_2024_minimo_32_caracteres!!';
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '2h';