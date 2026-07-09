import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getCards, createCard, updateCard, deleteCard } from '../controllers/card.controller';

const router = Router();

router.use(requireAuth);

router.get('/',        getCards);
router.post('/',       createCard);
router.patch('/:id',   updateCard);
router.delete('/:id',  deleteCard);

export default router;
