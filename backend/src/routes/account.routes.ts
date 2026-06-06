import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getAccounts } from '../controllers/account.controller';

const router = Router();

router.use(requireAuth);
router.get('/', getAccounts);

export default router;
