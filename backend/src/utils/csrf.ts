import { doubleCsrf } from 'csrf-csrf';
import { Request } from 'express';

const { generateCsrfToken, validateRequest } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'csrf_secret',
  getSessionIdentifier: (req: Request) => req.ip || 'anonymous', // Garantindo string
  cookieName: 'XSRF-TOKEN',
  cookieOptions: {
    sameSite: 'strict',
    secure: false,
  },
});

export { generateCsrfToken, validateRequest };
