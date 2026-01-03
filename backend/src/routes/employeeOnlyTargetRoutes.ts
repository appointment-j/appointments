import express from 'express';
import {
  getEmployeeOwnTargets,
  getTargetStatistics,
  updateTargetProgress,
} from '../controllers/employeeTargetController';
import { authenticate, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/my-targets', authenticate, requireRole('EMPLOYEE'), getEmployeeOwnTargets);
router.get('/statistics', authenticate, requireRole('EMPLOYEE'), getTargetStatistics);
router.put('/:id/progress', authenticate, requireRole('EMPLOYEE'), updateTargetProgress);

export default router;
