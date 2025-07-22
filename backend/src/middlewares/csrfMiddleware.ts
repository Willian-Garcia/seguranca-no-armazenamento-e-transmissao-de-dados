import { Request, Response, NextFunction } from 'express';
import { generateCsrfToken, validateRequest } from '../utils/csrf';

// Anexa token CSRF no cookie
export function attachCsrfToken(req: Request, res: Response, next: NextFunction) {
  const token = generateCsrfToken(req, res);
  res.cookie('XSRF-TOKEN', token, { httpOnly: false });
  next();
}

// Protege rotas POST/DELETE
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (!validateRequest(req)) {
    return res.status(403).json({ error: 'CSRF token inválido' });
  }
  next();
}
