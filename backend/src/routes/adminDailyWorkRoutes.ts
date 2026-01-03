import { Router } from 'express';
import { 
  getAllDailyWorkLogs, 
  getDailyWorkLogById, 
  updateDailyWorkLog,
  getTodayDailyWorkLogs
} from '../controllers/adminDailyWorkController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/', getAllDailyWorkLogs);
router.get('/today', getTodayDailyWorkLogs);
router.get('/:id', getDailyWorkLogById);
router.patch('/:id', updateDailyWorkLog);

export default router;