import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getTransfers, createTransfer, deleteTransfer } from '../controllers/transfer.controller';

const router = Router();

router.use(requireAuth);

router.get('/',      getTransfers);
router.post('/',     createTransfer);
router.delete('/:id', deleteTransfer);

export default router;
