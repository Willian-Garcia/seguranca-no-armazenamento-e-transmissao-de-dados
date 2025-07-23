import { Request, Response } from 'express';
import Pool from '../database/db';
import { sanitizeInput } from '../utils/sanitize';
import { rsaDecrypt, aesDecrypt, encryptStorageAES, decryptStorageAES } from '../utils/crypto';

const SHOW_PLAIN = process.env.SHOW_PLAIN === 'true';

export async function addContact(req: Request, res: Response) {
  try {
    const { encryptedKey, name, phone } = req.body;
    const userId = (req as any).userId;

    // ✅ Descriptografar chave AES do frontend
    const aesKeyBuffer = rsaDecrypt(encryptedKey, getPrivateKey());
    const key = aesKeyBuffer.slice(0, 32);
    const iv = aesKeyBuffer.slice(32, 48);

    // ✅ Descriptografar dados do frontend (valores originais)
    const decName = aesDecrypt(name.cipher, key, Buffer.from(name.iv, 'base64'));
    const decPhone = aesDecrypt(phone.cipher, key, Buffer.from(phone.iv, 'base64'));

    // ✅ Sanitizar dados puros
    const cleanName = sanitizeInput(decName);
    const cleanPhone = sanitizeInput(decPhone);

    // ✅ Recriptografar com chave fixa do backend antes de salvar no banco
    const encNameForStorage = encryptStorageAES(cleanName);
    const encPhoneForStorage = encryptStorageAES(cleanPhone);

    await Pool.query('INSERT INTO contacts (user_id, name, phone) VALUES ($1, $2, $3)', [
      userId,
      encNameForStorage,
      encPhoneForStorage,
    ]);

    res.json({ message: 'Contato adicionado com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar contato:', error);
    res.status(500).json({ error: 'Erro ao adicionar contato' });
  }
}

export async function listContacts(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const result = await Pool.query('SELECT id, name, phone FROM contacts WHERE user_id = $1', [
      userId,
    ]);

    const contacts = result.rows.map((row) => {
      if (SHOW_PLAIN) {
        let plainName, plainPhone;
        try {
          plainName = decryptStorageAES(row.name);
          plainPhone = decryptStorageAES(row.phone);
        } catch {
          plainName = '[Erro na descriptografia]';
          plainPhone = '[Erro na descriptografia]';
        }
        return {
          id: row.id,
          name: { plain: plainName, encrypted: row.name },
          phone: { plain: plainPhone, encrypted: row.phone },
        };
      } else {
        return {
          id: row.id,
          name: { encrypted: row.name },
          phone: { encrypted: row.phone },
        };
      }
    });

    res.json(contacts);
  } catch (error) {
    console.error('Erro ao listar contatos:', error);
    res.status(500).json({ error: 'Erro ao listar contatos' });
  }
}

export async function deleteContact(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const contactId = req.params.id;

    await Pool.query('DELETE FROM contacts WHERE id = $1 AND user_id = $2', [contactId, userId]);
    res.json({ message: 'Contato excluído com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir contato' });
  }
}

export async function updateContact(req: Request, res: Response) {
  try {
    const { encryptedKey, name, phone } = req.body;
    const userId = (req as any).userId;
    const contactId = req.params.id;

    // ✅ Descriptografar chave AES do frontend
    const aesKeyBuffer = rsaDecrypt(encryptedKey, getPrivateKey());
    const key = aesKeyBuffer.slice(0, 32);
    const iv = aesKeyBuffer.slice(32, 48);

    // ✅ Descriptografar dados do frontend
    const decName = aesDecrypt(name.cipher, key, Buffer.from(name.iv, 'base64'));
    const decPhone = aesDecrypt(phone.cipher, key, Buffer.from(phone.iv, 'base64'));

    const cleanName = sanitizeInput(decName);
    const cleanPhone = sanitizeInput(decPhone);

    // ✅ Recriptografar com chave fixa
    const encNameForStorage = encryptStorageAES(cleanName);
    const encPhoneForStorage = encryptStorageAES(cleanPhone);

    await Pool.query('UPDATE contacts SET name=$1, phone=$2 WHERE id=$3 AND user_id=$4', [
      encNameForStorage,
      encPhoneForStorage,
      contactId,
      userId,
    ]);

    res.json({ message: 'Contato atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar contato:', error);
    res.status(500).json({ error: 'Erro ao atualizar contato' });
  }
}

// ✅ Função auxiliar para pegar chave privada RSA
import fs from 'fs';
import path from 'path';
function getPrivateKey(): string {
  const certDir = path.join(__dirname, '../../certs');
  return fs.readFileSync(path.join(certDir, 'rsa_private.pem'), 'utf8');
}
