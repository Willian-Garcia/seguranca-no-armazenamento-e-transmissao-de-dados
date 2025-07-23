import { Request, Response } from 'express';
import Pool from '../database/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { rsaDecrypt, aesDecrypt, generateRSAKeys, encryptStorageAES } from '../utils/crypto';
import { sanitizeInput } from '../utils/sanitize';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret';

const certDir = path.join(__dirname, '../../certs');
const privateKeyPath = path.join(certDir, 'rsa_private.pem');
const publicKeyPath = path.join(certDir, 'rsa_public.pem');

function ensureRSAKeys() {
  if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
    console.log('⚠️ Chaves RSA não encontradas. Gerando novamente...');
    generateRSAKeys();
  }
}

function getPrivateKey(): string {
  ensureRSAKeys();
  return fs.readFileSync(privateKeyPath, 'utf8');
}

function getPublicKey(): string {
  ensureRSAKeys();
  return fs.readFileSync(publicKeyPath, 'utf8');
}

export function getPublicKeyHandler(req: Request, res: Response) {
  res.type('text/plain').send(getPublicKey());
}

export async function register(req: Request, res: Response) {
  try {
    const { encryptedKey, username, password } = req.body;

    const aesKeyBuffer = rsaDecrypt(encryptedKey, getPrivateKey());
    const key = aesKeyBuffer.slice(0, 32);
    const iv = aesKeyBuffer.slice(32, 48);

    const decUsername = aesDecrypt(username.cipher, key, Buffer.from(username.iv, 'base64'));
    const decPassword = aesDecrypt(password.cipher, key, Buffer.from(password.iv, 'base64'));

    const cleanUsername = sanitizeInput(decUsername);
    const hashedPassword = await bcrypt.hash(decPassword, 12);

    const encryptedUsername = encryptStorageAES(cleanUsername);

    await Pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [
      encryptedUsername,
      hashedPassword,
    ]);

    res.json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { encryptedKey, username, password } = req.body;

    const aesKeyBuffer = rsaDecrypt(encryptedKey, getPrivateKey());
    const key = aesKeyBuffer.slice(0, 32);
    const iv = aesKeyBuffer.slice(32, 48);

    const decUsername = aesDecrypt(username.cipher, key, Buffer.from(username.iv, 'base64'));
    const decPassword = aesDecrypt(password.cipher, key, Buffer.from(password.iv, 'base64'));

    const cleanUsername = sanitizeInput(decUsername);
    const encryptedUsername = encryptStorageAES(cleanUsername);

    const result = await Pool.query('SELECT * FROM users WHERE username = $1', [encryptedUsername]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Usuário não encontrado' });

    const user = result.rows[0];
    const isValid = await bcrypt.compare(decPassword, user.password);
    if (!isValid) return res.status(401).json({ error: 'Senha inválida' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login realizado com sucesso', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no login' });
  }
}
