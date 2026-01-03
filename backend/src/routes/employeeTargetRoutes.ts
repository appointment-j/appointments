import express from 'express';
import {
  createEmployeeTarget,
  getEmployeeTargets,
  getEmployeeTarget,
  updateEmployeeTarget,
  deleteEmployeeTarget,
  updateTargetProgress,
} from '../controllers/employeeTargetController';
import { authenticate, requireRole } from '../middleware/auth';

const router = express.Router();

// Admin routes
router.post('/', authenticate, requireRole('ADMIN'), createEmployeeTarget);
router.get('/', authenticate, requireRole('ADMIN'), getEmployeeTargets);
router.get('/:id', authenticate, requireRole('ADMIN'), getEmployeeTarget);
router.put('/:id', authenticate, requireRole('ADMIN'), updateEmployeeTarget);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteEmployeeTarget);

// ✅ FIX: admin can update progress
router.put('/:id/progress', authenticate, requireRole('ADMIN'), updateTargetProgress);

export default router;
