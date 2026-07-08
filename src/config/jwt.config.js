import { JWT_SECRET, JWT_EXPIRATION } from './env.js';

export const jwtConfig = {
  secret: JWT_SECRET,
  expiresIn: JWT_EXPIRATION || '24h',
  algorithms: ['HS256']
};