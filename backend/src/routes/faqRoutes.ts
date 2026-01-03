import { Router } from 'express';
import {
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
} from '../controllers/faqController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Public
router.get('/', getFaqs);

// Admin
router.post('/', authenticate, requireRole('ADMIN'), createFaq);
router.get('/admin', authenticate, requireRole('ADMIN'), getFaqs);
router.patch('/:id', authenticate, requireRole('ADMIN'), updateFaq);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteFaq);
router.post('/reorder', authenticate, requireRole('ADMIN'), reorderFaqs);

export default router;

