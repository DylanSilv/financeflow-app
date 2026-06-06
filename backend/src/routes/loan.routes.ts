import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getLoans, payInstallment } from '../controllers/loan.controller';

const router = Router();

router.use(requireAuth);
router.get('/',               getLoans);
router.post('/:id/pay',       payInstallment);

export default router;
