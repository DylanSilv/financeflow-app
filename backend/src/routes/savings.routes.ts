import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  addFundsToGoal,
  deleteSavingsGoal,
} from '../controllers/savings.controller';

const router = Router();

router.use(requireAuth);

router.get('/',              getSavingsGoals);
router.post('/',             createSavingsGoal);
router.patch('/:id',         updateSavingsGoal);
router.patch('/:id/funds',   addFundsToGoal);
router.delete('/:id',        deleteSavingsGoal);

export default router;
