import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  getSavingsGoals,
  createSavingsGoal,
  addFundsToGoal,
} from '../controllers/savings.controller';

const router = Router();

router.use(requireAuth);

router.get('/',              getSavingsGoals);
router.post('/',             createSavingsGoal);
router.patch('/:id/funds',   addFundsToGoal);

export default router;
