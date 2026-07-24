import crypto from 'crypto';
import fs from 'fs';

// Configuración
const autoridadId = 14; // Cambia por el ID de la autoridad
const xmlFilePath = './documento.xml'; // Guarda el XML aquí
const privateKeyPath = './comunal.p12'; // Ruta al .p12
const passphrase = '123456'; // Contraseña del .p12

// Leer XML
const documento = fs.readFileSync(xmlFilePath, 'utf8').trim();

// Cargar clave privada desde .p12
import forge from 'node-forge';
const p12Buffer = fs.readFileSync(privateKeyPath);
const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Buffer.toString('binary')));
const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, passphrase);
let privateKey = null;
const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
if (keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.length > 0) {
  privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;
}
if (!privateKey) {
  const plainKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
  if (plainKeyBags[forge.pki.oids.keyBag]?.length > 0) {
    privateKey = plainKeyBags[forge.pki.oids.keyBag][0].key;
  }
}
const privateKeyPem = forge.pki.privateKeyToPem(privateKey);

// Firmar con crypto
const sign = crypto.createSign('SHA256');
sign.update(documento);
sign.end();
const signature = sign.sign({
  key: privateKeyPem,
  padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  saltLength: 32,
});
const firmaHash = signature.toString('base64');

console.log('Firma generada:', firmaHash);
console.log('Payload para Postman:');
console.log(JSON.stringify({ autoridadId, documento, firmaHash }, null, 2));