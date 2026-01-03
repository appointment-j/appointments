import { Router } from 'express';
import { getDashboardSummary } from '../controllers/employeeDashboardController';
import { getEmployeeOwnTargets } from '../controllers/employeeTargetController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Employee dashboard endpoints
router.get('/summary', authenticate, requireRole('EMPLOYEE'), getDashboardSummary);
router.get('/targets/my-targets', authenticate, requireRole('EMPLOYEE'), getEmployeeOwnTargets);

export default router;