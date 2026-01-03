import { Router } from 'express';
import {
  addBonus,
  getBonusLedger,
  getBonusStats,
  adminUpdateBonus,
  adminUpdateBonusStatus,
  adminDeleteBonus,
} from '../controllers/bonusController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Admin
router.post('/', authenticate, requireRole('ADMIN'), addBonus);
router.get('/', authenticate, requireRole('ADMIN'), getBonusLedger);
router.get('/stats', authenticate, requireRole('ADMIN'), getBonusStats);

// Admin controls
router.put('/:id', authenticate, requireRole('ADMIN'), adminUpdateBonus);
router.patch('/:id/status', authenticate, requireRole('ADMIN'), adminUpdateBonusStatus);
router.delete('/:id', authenticate, requireRole('ADMIN'), adminDeleteBonus);

export default router;
