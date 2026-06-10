import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../controllers/account.controller';

const router = Router();

router.use(requireAuth);
router.get('/',     getAccounts);
router.post('/',    createAccount);
router.patch('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;
