import crypto from 'crypto';

const MASTER_KEY = process.env.MASTER_KEY; // Debe ser una clave secreta en .env (64 caracteres hex)

export function generarParDeLlaves() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

export function encriptarClavePrivada(privateKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(MASTER_KEY, 'hex'), iv);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function desencriptarClavePrivada(encryptedData) {
  const [ivHex, encryptedHex] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(MASTER_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function firmarHash(privateKey, hash) {
  const sign = crypto.createSign('SHA256');
  sign.update(hash);
  sign.end();
  return sign.sign(privateKey, 'hex');
}