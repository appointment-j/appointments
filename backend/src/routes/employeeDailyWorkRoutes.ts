import { Router } from 'express';
import { 
  createDailyWorkLog, 
  getDailyWorkLogs, 
  getDailyWorkLogById, 
  updateDailyWorkLog,
  deleteDailyWorkLog,
  getDailyWorkLogsForDashboard
} from '../controllers/employeeDailyWorkController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication and employee role
router.use(authenticate);
router.use(requireRole('EMPLOYEE'));

router.post('/', createDailyWorkLog);
router.get('/', getDailyWorkLogs);
router.get('/dashboard', getDailyWorkLogsForDashboard);
router.get('/:id', getDailyWorkLogById);
router.put('/:id', updateDailyWorkLog);
router.delete('/:id', deleteDailyWorkLog);

export default router;