import { Router } from 'express';
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  resetEmployeePassword,
  inviteEmployee,
} from '../controllers/employeeController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, requireRole('ADMIN'), createEmployee);
router.get('/', authenticate, requireRole('ADMIN'), getEmployees);
router.patch('/:id', authenticate, requireRole('ADMIN'), updateEmployee);
router.post('/:id/reset-password', authenticate, requireRole('ADMIN'), resetEmployeePassword);
router.post('/:id/invite', authenticate, requireRole('ADMIN'), inviteEmployee);

export default router;

