import { Router } from 'express';
import {
  getMyBonuses,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/employeeBonusController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Employee bonuses
router.get('/me', authenticate, requireRole('EMPLOYEE'), getMyBonuses);

// Employee notifications
router.get('/notifications', authenticate, requireRole('EMPLOYEE'), getMyNotifications);
router.patch('/notifications/:id/read', authenticate, requireRole('EMPLOYEE'), markNotificationAsRead);
router.patch('/notifications/read-all', authenticate, requireRole('EMPLOYEE'), markAllNotificationsAsRead);

export default router;
