import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const AES_ALGORITHM = 'aes-256-cbc';
const KEY_PATH = path.join(__dirname, '../../certs');

export function generateRSAKeys(): { publicKey: string; privateKey: string } {
  const privatePath = path.join(KEY_PATH, 'rsa_private.pem');
  const publicPath = path.join(KEY_PATH, 'rsa_public.pem');

  if (!fs.existsSync(KEY_PATH)) {
    fs.mkdirSync(KEY_PATH, { recursive: true });
  }

  // ✅ Geração no formato correto (SPKI e PKCS8)
  if (!fs.existsSync(privatePath) || !fs.existsSync(publicPath)) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',   // ✅ Necessário para WebCrypto API
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',  // ✅ Compatível para descriptografia
        format: 'pem'
      }
    });

    fs.writeFileSync(privatePath, privateKey);
    fs.writeFileSync(publicPath, publicKey);

    console.log('✅ Chaves RSA geradas no formato correto!');
  }

  const privateKey = fs.readFileSync(privatePath, 'utf8');
  const publicKey = fs.readFileSync(publicPath, 'utf8');
  return { publicKey, privateKey };
}

// ✅ Função para descriptografar dados com RSA (chave privada)
export function rsaDecrypt(encryptedData: string, privateKey: string): Buffer {
  return crypto.privateDecrypt(
    { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
    Buffer.from(encryptedData, 'base64')
  );
}

// ✅ Função para descriptografar dados com AES
export function aesDecrypt(encrypted: string, key: Buffer, iv: Buffer): string {
  const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
