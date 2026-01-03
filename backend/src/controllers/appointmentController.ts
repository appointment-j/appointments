import { Request, Response, NextFunction } from 'express';
import { Appointment } from '../models/Appointment';
import { AppointmentSlot } from '../models/AppointmentSlot';
import { AppointmentDayRule } from '../models/AppointmentDayRule';
import { AppointmentSlotRule } from '../models/AppointmentSlotRule';
import { SurveyResponse } from '../models/SurveyResponse';
import { BlockedDay } from '../models/BlockedDay';
import { BlockedTimeRange } from '../models/BlockedTimeRange';
import { SurveyAnswer } from '../models/SurveyAnswer';
import { SurveyField } from '../models/SurveyField';
import { User } from '../models/User';
import { parseLocalDateTime } from '../utils/timezone';
import { sendAppointmentConfirmationEmail, sendAppointmentCancelEmail, sendAppointmentConfirmationWhatsApp } from '../config/email';
import { AppError } from '../middleware/errorHandler';
import { query } from '../config/database';

export const getAvailableSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date, mode } = req.query;

    if (!date || !mode) {
      res.status(400).json({ message: 'Date and mode required' });
      return;
    }

    // Check if date is blocked
    const blockedDay = await BlockedDay.findOne({ date: date as string });
    if (blockedDay) {
      res.json({ slots: [], reason: blockedDay.reason });
      return;
    }

    // Get blocked time ranges for this mode
    const blockedRanges = await BlockedTimeRange.find({ mode: mode as 'IN_PERSON' | 'ONLINE' });

    // Generate available slots (9 AM to 5 PM, 30 min intervals)
    const slots: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        // Check if this time is in a blocked range
        const isBlocked = blockedRanges.some((range) => {
          const [startH, startM] = range.startTime.split(':').map(Number);
          const [endH, endM] = range.endTime.split(':').map(Number);
          const slotTime = hour * 60 + minute;
          const startTime = startH * 60 + startM;
          const endTime = endH * 60 + endM;
          return slotTime >= startTime && slotTime < endTime;
        });

        if (!isBlocked) {
          slots.push(timeStr);
        }
      }
    }

    // Check existing appointments for this date
    // Use raw query since Appointment.find doesn't support direct dateLocal query
    const { rows } = await query(
      'SELECT * FROM appointments WHERE date_local = $1 AND status = $2',
      [date as string, 'UPCOMING']
    );
    const existingAppointments = rows.map((row) => Appointment.mapRowToAppointment(row));

    const bookedSlots = new Set(existingAppointments.map((apt) => apt.timeLocal));

    const availableSlots = slots.filter((slot) => !bookedSlots.has(slot));

    res.json({ slots: availableSlots });
  } catch (error) {
    next(error);
  }
};

export const bookAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { mode, dateLocal, timeLocal, note, surveyAnswers } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Validate slot availability
    const blockedDay = await BlockedDay.findOne({ date: dateLocal });
    if (blockedDay) {
      res.status(400).json({ message: `Date is blocked: ${blockedDay.reason}` });
      return;
    }

    const existing = await Appointment.findOne({
      dateLocal,
      timeLocal,
      status: 'UPCOMING',
    });

    if (existing) {
      res.status(400).json({ message: 'Time slot already booked' });
      return;
    }

    const startDateTimeUtc = parseLocalDateTime(dateLocal, timeLocal);
    const endDateTimeUtc = new Date(startDateTimeUtc.getTime() + 30 * 60 * 1000); // 30 min

    const appointment = await Appointment.create({
      userId: req.user.id,
      mode,
      dateLocal,
      timeLocal,
      startDateTimeUtc,
      endDateTimeUtc,
      note,
      status: 'UPCOMING',
    });

    // Save survey answers
    if (surveyAnswers && Array.isArray(surveyAnswers)) {
      const activeFields = await SurveyField.find({ isActive: true });
      const fieldMap = new Map(activeFields.map((f) => [f.id, f]));

      for (const answer of surveyAnswers) {
        if (fieldMap.has(answer.fieldId)) {
          await SurveyAnswer.create({
            appointmentId: appointment.id,
            fieldId: answer.fieldId,
            value: answer.value,
          });
        }
      }
    }

    // Send confirmation email
    try {
      await sendAppointmentConfirmationEmail(req.user.email, {
        mode,
        dateLocal,
        timeLocal,
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError);
    }

    // Send WhatsApp notification to admin
    try {
      await sendAppointmentConfirmationWhatsApp({
        mode,
        dateLocal,
        timeLocal,
        note,
      });
    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError);
    }

    res.status(201).json({ message: 'Appointment booked', appointment });
  } catch (error) {
    next(error);
  }
};

export const getMyAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const appointments = await Appointment.find({ userId: req.user.id });

    // Populate user info manually
    const appointmentsWithUser = await Promise.all(
      appointments.map(async (apt) => {
        const user = await User.findById(apt.userId);
        return {
          ...apt,
          userId: user
            ? {
                fullName: user.fullName,
                email: user.email,
              }
            : null,
        };
      })
    );

    res.json({ appointments: appointmentsWithUser });
  } catch (error) {
    next(error);
  }
};

export const cancelAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const appointment = await Appointment.findOne({ id, userId: req.user.id });

    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    if (appointment.status !== 'UPCOMING') {
      res.status(400).json({ message: 'Only upcoming appointments can be cancelled' });
      return;
    }

    await Appointment.update(id, { status: 'CANCELED' });

    // Send cancellation email
    try {
      await sendAppointmentCancelEmail(req.user.email, {
        dateLocal: appointment.dateLocal,
        timeLocal: appointment.timeLocal,
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError);
    }

    const updatedAppointment = await Appointment.findById(id);
    res.json({ message: 'Appointment cancelled', appointment: updatedAppointment });
  } catch (error) {
    next(error);
  }
};

export const rescheduleAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { dateLocal, timeLocal } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const appointment = await Appointment.findOne({ id, userId: req.user.id });

    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    if (appointment.status !== 'UPCOMING') {
      res.status(400).json({ message: 'Only upcoming appointments can be rescheduled' });
      return;
    }

    // Check new slot availability
    const existing = await Appointment.findOne({
      dateLocal,
      timeLocal,
      status: 'UPCOMING',
    });

    if (existing && existing.id !== id) {
      res.status(400).json({ message: 'Time slot already booked' });
      return;
    }

    const startDateTimeUtc = parseLocalDateTime(dateLocal, timeLocal);
    const endDateTimeUtc = new Date(startDateTimeUtc.getTime() + 30 * 60 * 1000);

    await Appointment.update(id, {
      dateLocal,
      timeLocal,
      startDateTimeUtc,
      endDateTimeUtc,
    });

    const updatedAppointment = await Appointment.findById(id);
    res.json({ message: 'Appointment rescheduled', appointment: updatedAppointment });
  } catch (error) {
    next(error);
  }
};

// Admin endpoints
export const getAllAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, dateFrom, dateTo } = req.query;
    const condition: any = {};

    if (status) condition.status = status as string;
    if (dateFrom || dateTo) {
      condition.dateLocal = {};
      if (dateFrom) condition.dateLocal.$gte = dateFrom as string;
      if (dateTo) condition.dateLocal.$lte = dateTo as string;
    }

    const appointments = await Appointment.find(condition);

    // Populate user info manually
    const appointmentsWithUser = await Promise.all(
      appointments.map(async (apt) => {
        const user = await User.findById(apt.userId);
        return {
          ...apt,
          userId: user
            ? {
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
              }
            : null,
        };
      })
    );

    res.json({ appointments: appointmentsWithUser });
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, handledByAdminName } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    await Appointment.update(id, { status, handledByAdminName });

    const updatedAppointment = await Appointment.findById(id);
    res.json({ message: 'Appointment updated', appointment: updatedAppointment });
  } catch (error) {
    next(error);
  }
};

// New Survey-based Appointment Booking Endpoints
export const createSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      firstName, fatherName, lastName, age, socialStatus, phone,
      nationality, nationalId, passportId, region, major, university, heardFrom
    } = req.body;

    // Validate required fields
    if (!firstName || !fatherName || !lastName || !phone || !nationality) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Validate nationality-specific fields
    if (nationality === 'الأردن' && !nationalId) {
      res.status(400).json({ message: 'National ID required for Jordanian nationality' });
      return;
    }
    if (nationality !== 'الأردن' && !passportId) {
      res.status(400).json({ message: 'Passport ID required for non-Jordanian nationality' });
      return;
    }

    // Create survey response
    const surveyResponse = await SurveyResponse.create({
      firstName,
      fatherName,
      lastName,
      age,
      socialStatus,
      phone,
      nationality,
      nationalId,
      passportId,
      region,
      major,
      university,
      heardFrom,
    });

    res.status(201).json({ 
      success: true, 
      data: { 
        id: surveyResponse.id,
        firstName: surveyResponse.firstName,
        fatherName: surveyResponse.fatherName,
        lastName: surveyResponse.lastName,
        phone: surveyResponse.phone
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableSlotsWithRules = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      res.status(400).json({ message: 'from and to parameters required (YYYY-MM-DD format)' });
      return;
    }

    // Get all slots within the date range
    const slots = await AppointmentSlot.find({
      from: `${from as string} 00:00:00`,
      to: `${to as string} 23:59:59`,
      isActive: true
    });

    // Get all day rules within the date range
    const dayRules = await AppointmentDayRule.find({
      from: from as string,
      to: to as string
    });
    const dayRuleMap = new Map(dayRules.map(rule => [rule.dayDate, rule]));

    // Get all slot rules
    const slotRules = await AppointmentSlotRule.find();
    const slotRuleMap = new Map(slotRules.map(rule => [rule.slotId, rule]));

    // Get all appointments within the date range
    const appointments = await query(
      `SELECT slot_id, COUNT(*) as count FROM appointments 
       WHERE date_local BETWEEN $1 AND $2 
       AND status = 'UPCOMING'
       GROUP BY slot_id`,
      [from, to]
    );
    const appointmentCountMap = new Map(appointments.rows.map(row => [row.slot_id, parseInt(row.count)]));

    // Process each slot with rules
    const availableSlots = slots.map(slot => {
      const date = slot.startAt.toISOString().split('T')[0];
      
      // Get effective rules (slot rule overrides day rule)
      const dayRule = dayRuleMap.get(date);
      const slotRule = slotRuleMap.get(slot.id);
      
      const effectiveIsBlocked = slotRule?.isBlocked ?? dayRule?.isBlocked ?? false;
      const effectiveIsOnlineOnly = slotRule?.isOnlineOnly ?? dayRule?.isOnlineOnly ?? false;
      const effectiveCapacity = slotRule?.capacity ?? dayRule?.defaultCapacity ?? slot.capacity;
      const effectiveAllowOnline = slotRule?.allowOnline ?? (slotRule?.allowOnline === null ? slot.allowOnline : true);
      const effectiveAllowInPerson = slotRule?.allowInPerson ?? (slotRule?.allowInPerson === null ? slot.allowInPerson : true);
      
      const bookedCount = appointmentCountMap.get(slot.id) || 0;
      
      return {
        id: slot.id,
        startAt: slot.startAt,
        endAt: slot.endAt,
        bookedCount,
        effectiveCapacity,
        effectiveIsOnlineOnly,
        effectiveAllowOnline,
        effectiveAllowInPerson,
        isAvailable: !effectiveIsBlocked && bookedCount < effectiveCapacity
      };
    }).filter(slot => slot.isAvailable);

    res.json({ slots: availableSlots });
  } catch (error) {
    next(error);
  }
};

export const bookAppointmentWithSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      surveyResponseId, slotId, mode
    } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Validate required fields
    if (!surveyResponseId) {
      res.status(400).json({ message: 'Survey response ID required' });
      return;
    }

    // Validate that survey response exists
    const surveyResponse = await SurveyResponse.findById(surveyResponseId);
    if (!surveyResponse) {
      res.status(400).json({ message: 'Survey response not found' });
      return;
    }

    // Validate slot exists
    const slot = await AppointmentSlot.findById(slotId);
    if (!slot) {
      res.status(400).json({ message: 'Invalid slot' });
      return;
    }

    // Check if slot is active
    if (!slot.isActive) {
      res.status(400).json({ message: 'Slot is not active' });
      return;
    }

    // Check day rules
    const date = slot.startAt.toISOString().split('T')[0];
    const dayRule = await AppointmentDayRule.findOne({ dayDate: date });
    
    // Check if day is blocked
    if (dayRule?.isBlocked) {
      res.status(400).json({ message: 'Day is blocked' });
      return;
    }

    // Check slot rules
    const slotRule = await AppointmentSlotRule.findOne({ slotId });
    
    // Check if slot is blocked
    if (slotRule?.isBlocked) {
      res.status(400).json({ message: 'Slot is blocked' });
      return;
    }

    // Check mode restrictions
    if (mode === 'IN_PERSON' && (slotRule?.isOnlineOnly || dayRule?.isOnlineOnly || !slot.allowInPerson || slotRule?.allowInPerson === false)) {
      res.status(400).json({ message: 'In-person appointments not allowed for this slot' });
      return;
    }

    if (mode === 'ONLINE' && (!slot.allowOnline || slotRule?.allowOnline === false)) {
      res.status(400).json({ message: 'Online appointments not allowed for this slot' });
      return;
    }

    // Check capacity using a simpler approach with a lock
    // In a production environment, you would use a proper transaction with row locking
    // For this implementation, we'll use a simpler approach
    
    // Check current bookings for this slot
    const bookingCountResult = await query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE slot_id = $1 AND status = 'UPCOMING'`,
      [slotId]
    );
    const currentBookings = parseInt(bookingCountResult.rows[0].count);
    
    // Calculate effective capacity
    const effectiveCapacity = slotRule?.capacity ?? dayRule?.defaultCapacity ?? slot.capacity;
    
    if (currentBookings >= effectiveCapacity) {
      res.status(409).json({ message: 'Slot is full' });
      return;
    }

    // Create appointment
    const appointment = await Appointment.create({
      userId: req.user.id,
      mode,
      dateLocal: date,
      timeLocal: `${slot.startAt.getHours().toString().padStart(2, '0')}:${slot.startAt.getMinutes().toString().padStart(2, '0')}`,
      startDateTimeUtc: slot.startAt,
      endDateTimeUtc: slot.endAt,
      status: 'UPCOMING',
      surveyResponseId: surveyResponse.id,
    });

    // Send confirmation email
    try {
      await sendAppointmentConfirmationEmail(req.user.email, {
        mode,
        dateLocal: date,
        timeLocal: `${slot.startAt.getHours().toString().padStart(2, '0')}:${slot.startAt.getMinutes().toString().padStart(2, '0')}`,
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError);
    }

    // Send WhatsApp notification to admin
    try {
      await sendAppointmentConfirmationWhatsApp({
        mode,
        dateLocal: date,
        timeLocal: `${slot.startAt.getHours().toString().padStart(2, '0')}:${slot.startAt.getMinutes().toString().padStart(2, '0')}`,
        note: `${surveyResponse.firstName} ${surveyResponse.fatherName} ${surveyResponse.lastName} - ${surveyResponse.phone}`,
      });
    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError);
    }

    res.status(201).json({ 
      message: 'Appointment booked', 
      appointment: {
        ...appointment,
        surveyResponse
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin endpoints for appointment management
export const getAdminAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, dateFrom, dateTo } = req.query;
    const condition: any = {};

    if (status) condition.status = status as string;
    if (dateFrom || dateTo) {
      condition.dateLocal = {};
      if (dateFrom) condition.dateLocal.$gte = dateFrom as string;
      if (dateTo) condition.dateLocal.$lte = dateTo as string;
    }

    // Get appointments with survey responses
    const appointments = await Appointment.find(condition);

    // Get survey responses for these appointments
    const surveyResponseIds = appointments
      .map(apt => apt.surveyResponseId)
      .filter(id => id) as string[];
    
    const surveyResponses = await Promise.all(
      surveyResponseIds.map(id => SurveyResponse.findById(id))
    );
    const surveyResponseMap = new Map(
      surveyResponses.filter(sr => sr).map(sr => [sr!.id, sr!])
    );

    // Get user info manually
    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (apt) => {
        const user = await User.findById(apt.userId);
        const surveyResponse = apt.surveyResponseId ? surveyResponseMap.get(apt.surveyResponseId) : null;
        
        return {
          ...apt,
          fullName: surveyResponse 
            ? `${surveyResponse.firstName} ${surveyResponse.fatherName} ${surveyResponse.lastName}`
            : user?.fullName || 'Unknown',
          phone: surveyResponse?.phone || user?.phone || '',
          surveyResponse,
          userId: user
            ? {
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
              }
            : null,
        };
      })
    );

    res.json({ appointments: appointmentsWithDetails });
  } catch (error) {
    console.error('Error in getAdminAppointments:', error);
    next(error);
  }
};

// Get today's appointments
export const getTodayAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Find appointments for today
    const appointments = await Appointment.find({
      dateLocal: { $gte: today, $lte: today }
    });

    // Filter out canceled appointments manually since the find method doesn't support $ne
    const nonCanceledAppointments = appointments.filter(apt => apt.status !== 'CANCELED');

    // Get survey responses for these appointments
    const surveyResponseIds = nonCanceledAppointments
      .map(apt => apt.surveyResponseId)
      .filter(id => id) as string[];
    
    const surveyResponses = await Promise.all(
      surveyResponseIds.map(id => SurveyResponse.findById(id))
    );
    const surveyResponseMap = new Map(
      surveyResponses.filter(sr => sr).map(sr => [sr!.id, sr!])
    );

    // Get user info manually
    const appointmentsWithDetails = await Promise.all(
      nonCanceledAppointments.map(async (apt) => {
        const user = await User.findById(apt.userId);
        const surveyResponse = apt.surveyResponseId ? surveyResponseMap.get(apt.surveyResponseId) : null;
        
        return {
          ...apt,
          fullName: surveyResponse 
            ? `${surveyResponse.firstName} ${surveyResponse.fatherName} ${surveyResponse.lastName}`
            : user?.fullName || 'Unknown',
          phone: surveyResponse?.phone || user?.phone || '',
          surveyResponse,
          userId: user
            ? {
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
              }
            : null,
        };
      })
    );

    res.json({ appointments: appointmentsWithDetails });
  } catch (error) {
    console.error('Error in getTodayAppointments:', error);
    next(error);
  }
};

export const getAdminAppointmentDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    // Get survey response
    let surveyResponse = null;
    if (appointment.surveyResponseId) {
      surveyResponse = await SurveyResponse.findById(appointment.surveyResponseId);
    }

    // Get user info
    const user = await User.findById(appointment.userId);

    // For now, we'll need to find the slot by matching date/time since we don't have a direct reference
    // This is a simplified approach - in a real implementation you'd have a direct slot_id reference
    const slots = await AppointmentSlot.find({ 
      from: `${appointment.dateLocal} 00:00:00`, 
      to: `${appointment.dateLocal} 23:59:59` 
    });
    const slot = slots.find(s => 
      s.startAt.getHours() === appointment.startDateTimeUtc.getHours() &&
      s.startAt.getMinutes() === appointment.startDateTimeUtc.getMinutes()
    );

    // Get day rule
    const dayRule = await AppointmentDayRule.findOne({ dayDate: appointment.dateLocal });

    // Get slot rule if slot exists
    let slotRule = null;
    if (slot) {
      slotRule = await AppointmentSlotRule.findOne({ slotId: slot.id });
    }

    res.json({
      appointment,
      surveyResponse,
      user,
      slot,
      dayRule,
      slotRule,
    });
  } catch (error) {
    next(error);
  }
};

// Admin control endpoints
export const getAdminSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      res.status(400).json({ message: 'from and to parameters required (YYYY-MM-DD format)' });
      return;
    }

    // Get all slots within the date range
    const slots = await AppointmentSlot.find({
      from: `${from as string} 00:00:00`,
      to: `${to as string} 23:59:59`,
    });

    // Get all day rules within the date range
    const dayRules = await AppointmentDayRule.find({
      from: from as string,
      to: to as string
    });
    const dayRuleMap = new Map(dayRules.map(rule => [rule.dayDate, rule]));

    // Get all slot rules
    const slotRules = await AppointmentSlotRule.find();
    const slotRuleMap = new Map(slotRules.map(rule => [rule.slotId, rule]));

    // Get appointment counts for each slot
    const appointmentCounts = await query(
      `SELECT slot_id, COUNT(*) as count FROM appointments 
       WHERE date_local BETWEEN $1 AND $2 
       AND status = 'UPCOMING'
       GROUP BY slot_id`,
      [from, to]
    );
    const appointmentCountMap = new Map(appointmentCounts.rows.map(row => [row.slot_id, parseInt(row.count)]));

    // Combine all data
    const slotData = slots.map(slot => {
      const date = slot.startAt.toISOString().split('T')[0];
      
      // Get effective rules (slot rule overrides day rule)
      const dayRule = dayRuleMap.get(date);
      const slotRule = slotRuleMap.get(slot.id);
      
      const effectiveIsBlocked = slotRule?.isBlocked ?? dayRule?.isBlocked ?? false;
      const effectiveIsOnlineOnly = slotRule?.isOnlineOnly ?? dayRule?.isOnlineOnly ?? false;
      const effectiveCapacity = slotRule?.capacity ?? dayRule?.defaultCapacity ?? slot.capacity;
      const effectiveAllowOnline = slotRule?.allowOnline ?? (slotRule?.allowOnline === null ? slot.allowOnline : true);
      const effectiveAllowInPerson = slotRule?.allowInPerson ?? (slotRule?.allowInPerson === null ? slot.allowInPerson : true);
      
      const bookedCount = appointmentCountMap.get(slot.id) || 0;
      
      return {
        slot,
        dayRule,
        slotRule,
        bookedCount,
        effectiveCapacity,
        effectiveIsBlocked,
        effectiveIsOnlineOnly,
        effectiveAllowOnline,
        effectiveAllowInPerson,
        isAvailable: !effectiveIsBlocked && bookedCount < effectiveCapacity
      };
    });

    res.json({ slots: slotData });
  } catch (error) {
    next(error);
  }
};

export const updateDayRule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date } = req.params;
    const { isBlocked, isOnlineOnly, defaultCapacity } = req.body;

    // Validate date format
    if (!/\d{4}-\d{2}-\d{2}/.test(date)) {
      res.status(400).json({ message: 'Invalid date format, expected YYYY-MM-DD' });
      return;
    }

    const dayRule = await AppointmentDayRule.upsert({
      dayDate: date,
      isBlocked,
      isOnlineOnly,
      defaultCapacity,
    });

    res.json({ message: 'Day rule updated', dayRule });
  } catch (error) {
    next(error);
  }
};

export const updateSlotRule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slotId } = req.params;
    const { isBlocked, isOnlineOnly, capacity, allowOnline, allowInPerson } = req.body;

    const slotRule = await AppointmentSlotRule.upsert({
      slotId,
      isBlocked,
      isOnlineOnly,
      capacity,
      allowOnline,
      allowInPerson,
    });

    res.json({ message: 'Slot rule updated', slotRule });
  } catch (error) {
    next(error);
  }
};

export const generateSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { from, to, durationMinutes = 30 } = req.body;

    if (!from || !to) {
      res.status(400).json({ message: 'from and to parameters required (YYYY-MM-DD format)' });
      return;
    }

    // Validate date format
    if (!/\d{4}-\d{2}-\d{2}/.test(from) || !/\d{4}-\d{2}-\d{2}/.test(to)) {
      res.status(400).json({ message: 'Invalid date format, expected YYYY-MM-DD' });
      return;
    }

    // Parse dates
    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T23:59:59`);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      res.status(400).json({ message: 'Invalid date format' });
      return;
    }

    // Generate slots for each day in the range
    const current = new Date(fromDate);
    
    while (current <= toDate) {
      // Generate slots for this day within working hours (09:30 to 17:30)
      const day = current.toISOString().split('T')[0];
      
      // Start from 09:30 AM
      let hour = 9;
      let minute = 30;
      
      while (hour < 17 || (hour === 17 && minute < 30)) {
        // Create start and end times for this slot
        const startAt = new Date(current);
        startAt.setHours(hour, minute, 0, 0);
        
        const endAt = new Date(startAt);
        endAt.setMinutes(endAt.getMinutes() + durationMinutes);
        
        // Check if this would exceed the end time (17:30)
        if (endAt.getHours() > 17 || (endAt.getHours() === 17 && endAt.getMinutes() >= 30)) {
          break;
        }
        
        // Check if a slot already exists for this time range
        const existingSlots = await query(
          `SELECT id FROM appointment_slots 
           WHERE DATE(start_at) = $1 
           AND EXTRACT(HOUR FROM start_at) = $2 
           AND EXTRACT(MINUTE FROM start_at) = $3`,
          [day, hour, minute]
        );
        
        if (existingSlots.rows.length === 0) {
          // Create the slot
          await AppointmentSlot.create({
            startAt,
            endAt,
            isActive: true,
            capacity: 3,
            allowOnline: true,
            allowInPerson: true,
          });
        }
        
        // Move to next slot
        minute += durationMinutes;
        if (minute >= 60) {
          hour += Math.floor(minute / 60);
          minute = minute % 60;
        }
      }
      
      // Move to next day
      current.setDate(current.getDate() + 1);
    }

    res.json({ message: 'Slots generated successfully' });
  } catch (error) {
    next(error);
  }
};
