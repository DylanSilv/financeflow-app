import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, register, changePassword } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Esperá 15 minutos antes de volver a intentarlo.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de registros alcanzado. Esperá 1 hora antes de volver a intentarlo.' },
});

router.post('/register',          registerLimiter, register);
router.post('/login',             loginLimiter,    login);
router.patch('/password',         requireAuth,     changePassword);

export default router;