import { Router } from 'express';
import { getPublicKeyHandler, register, login } from '../controllers/authController';
import { addContact, listContacts, deleteContact, updateContact } from '../controllers/contactController';
import { verifyJWT } from '../middlewares/authMiddleware';
import { csrfProtection, attachCsrfToken } from '../middlewares/csrfMiddleware';

const router = Router();

// Rota para pegar chave pública RSA e também token CSRF
router.get('/public-key', attachCsrfToken, getPublicKeyHandler);

// Rotas com proteção CSRF
router.post('/register', csrfProtection, register);
router.post('/login', csrfProtection, login);

// Rotas protegidas por JWT + CSRF
router.post('/contacts', verifyJWT, csrfProtection, addContact);
router.get('/contacts', verifyJWT, listContacts);
router.put('/contacts/:id', verifyJWT, csrfProtection, updateContact);
router.delete('/contacts/:id', verifyJWT, csrfProtection, deleteContact);

export default router;
