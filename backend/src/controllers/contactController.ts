import { Request, Response } from 'express';
import Pool from '../database/db';

export async function addContact(req: Request, res: Response) {
  try {
    const { name, phone } = req.body;
    const userId = (req as any).userId;

    await Pool.query('INSERT INTO contacts (user_id, name, phone) VALUES ($1, $2, $3)', [
      userId,
      name.cipher,
      phone.cipher,
    ]);

    res.json({ message: 'Contato adicionado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao adicionar contato' });
  }
}

export async function listContacts(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const result = await Pool.query('SELECT id, name, phone FROM contacts WHERE user_id = $1', [
      userId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
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
    const userId = (req as any).userId;
    const contactId = req.params.id;
    const { name, phone } = req.body;

    await Pool.query('UPDATE contacts SET name=$1, phone=$2 WHERE id=$3 AND user_id=$4', [
      name.cipher,
      phone.cipher,
      contactId,
      userId
    ]);

    res.json({ message: 'Contato atualizado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar contato' });
  }
}
