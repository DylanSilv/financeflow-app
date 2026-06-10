import { Router } from 'express';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../controllers/transaction.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/',      getTransactions);
router.post('/',     createTransaction);
router.patch('/:id',  updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
