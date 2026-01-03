import { Router } from 'express';
import {
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  getAvailableSlotsWithRules,
  bookAppointmentWithSurvey,
  getAdminAppointments,
  getAdminAppointmentDetails,
  getAdminSlots,
  updateDayRule,
  updateSlotRule,
  generateSlots,
  createSurvey,
  getTodayAppointments,
} from '../controllers/appointmentController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Public
router.get('/slots', getAvailableSlots);
router.get('/slots-with-rules', getAvailableSlotsWithRules);

// Applicant
router.post('/', authenticate, bookAppointment);
router.post('/survey', authenticate, createSurvey);
router.post('/survey-book', authenticate, bookAppointmentWithSurvey);
router.get('/my', authenticate, getMyAppointments);
router.post('/:id/cancel', authenticate, cancelAppointment);
router.post('/:id/reschedule', authenticate, rescheduleAppointment);

// Admin
router.get('/admin', authenticate, requireRole('ADMIN'), getAllAppointments);
router.get('/admin/:id', authenticate, requireRole('ADMIN'), getAdminAppointmentDetails);
router.patch('/admin/:id', authenticate, requireRole('ADMIN'), updateAppointmentStatus);

// Admin Appointment Management
router.get('/admin/appointments', authenticate, requireRole('ADMIN'), getAdminAppointments);
router.get('/admin/appointments/:id', authenticate, requireRole('ADMIN'), getAdminAppointmentDetails);
router.get('/admin/today', authenticate, requireRole('ADMIN'), getTodayAppointments);

// Admin Schedule Control
router.get('/admin/slots', authenticate, requireRole('ADMIN'), getAdminSlots);
router.patch('/admin/days/:date', authenticate, requireRole('ADMIN'), updateDayRule);
router.patch('/admin/slots/:slotId', authenticate, requireRole('ADMIN'), updateSlotRule);
router.post('/admin/slots/generate', authenticate, requireRole('ADMIN'), generateSlots);

export default router;

