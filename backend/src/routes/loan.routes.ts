import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getLoans, createLoan, updateLoan, payInstallment, deleteLoan } from '../controllers/loan.controller';

const router = Router();

router.use(requireAuth);
router.get('/',               getLoans);
router.post('/',              createLoan);
router.patch('/:id',          updateLoan);
router.post('/:id/pay',       payInstallment);
router.delete('/:id',         deleteLoan);

export default router;
