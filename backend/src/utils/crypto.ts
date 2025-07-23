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

  if (!fs.existsSync(privatePath) || !fs.existsSync(publicPath)) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
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

// ✅ RSA Decrypt
export function rsaDecrypt(encryptedData: string, privateKey: string): Buffer {
  return crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    Buffer.from(encryptedData, 'base64')
  );
}

// ✅ AES Decrypt
export function aesDecrypt(encrypted: string, key: Buffer, iv: Buffer): string {
  const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ✅ NOVO: AES para dados em repouso (username)
export function encryptStorageAES(data: string): string {
  const key = Buffer.from(process.env.STORAGE_KEY!, 'utf8');
  const iv = Buffer.from(process.env.STORAGE_IV!, 'utf8');
  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

export function decryptStorageAES(encrypted: string): string {
  const key = Buffer.from(process.env.STORAGE_KEY!, 'utf8');
  const iv = Buffer.from(process.env.STORAGE_IV!, 'utf8');
  const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
