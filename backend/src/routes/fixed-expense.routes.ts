import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  getFixedExpenses,
  createFixedExpense,
  markExpensePaid,
  toggleAutoPayExpense,
  deleteFixedExpense,
} from '../controllers/fixed-expense.controller';

const router = Router();

router.use(requireAuth);

router.get('/',               getFixedExpenses);
router.post('/',              createFixedExpense);
router.patch('/:id/pay',      markExpensePaid);
router.patch('/:id/autopay',  toggleAutoPayExpense);
router.delete('/:id',         deleteFixedExpense);

export default router;
