import { Router } from 'express';
import { getPublicKeyHandler as getPublicKey, register, login } from '../controllers/authController';
import { addContact, listContacts, deleteContact } from '../controllers/contactController';
import { verifyJWT } from '../middlewares/authMiddleware';
import { csrfProtection, attachCsrfToken } from '../middlewares/csrfMiddleware';

const router = Router();

// Rota para pegar chave pública RSA e também token CSRF
router.get('/public-key', attachCsrfToken, getPublicKey);

// Rotas com proteção CSRF
router.post('/register', csrfProtection, register);
router.post('/login', csrfProtection, login);

// Rotas protegidas por JWT + CSRF
router.post('/contacts', verifyJWT, csrfProtection, addContact);
router.get('/contacts', verifyJWT, listContacts);
router.delete('/contacts/:id', verifyJWT, csrfProtection, deleteContact);

export default router;
