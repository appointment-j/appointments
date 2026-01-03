import { Router } from 'express';
import { getUsers, updateUserRole } from '../controllers/adminUsersController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/users', authenticate, requireRole('ADMIN'), getUsers);
router.patch('/users/:id/role', authenticate, requireRole('ADMIN'), updateUserRole);

export default router;