import { Router } from 'express';
import { getTransactions, createTransaction } from '../controllers/transaction.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de transacciones requieren estar autenticado
router.use(requireAuth);

router.get('/', getTransactions);
router.post('/', createTransaction);

export default router;
