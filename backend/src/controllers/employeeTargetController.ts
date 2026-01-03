import { Request, Response } from 'express';
import { EmployeeTarget } from '../models/EmployeeTarget';
import { User } from '../models/User';
import { EmployeeNotification } from '../models/EmployeeNotification';

// Helpers
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

const ALLOWED_STATUS = new Set(['ACTIVE', 'COMPLETED', 'EXPIRED']);

const toPlain = (obj: any) => (typeof obj?.toJSON === 'function' ? obj.toJSON() : obj);

const safeNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const mapEmployeeLite = (u: any) => ({
  id: u.id,
  name: u.fullName,
  email: u.email,
});

/** =========================
 * Create a new employee target (ADMIN)
 ========================== */
export const createEmployeeTarget = async (req: Request, res: Response) => {
  try {
    const { title, description, targetValue, month, startDate, endDate, employeeId } = req.body;

    // Validate required fields (✅ targetValue can be 0)
    if (
      !title ||
      !description ||
      targetValue === undefined ||
      targetValue === null ||
      !month ||
      !startDate ||
      !endDate ||
      !employeeId
    ) {
      return res.status(400).json({
        success: false,
        message:
          'All fields are required: title, description, targetValue, month, startDate, endDate, employeeId',
      });
    }

    // Validate employeeId format (UUID)
    if (typeof employeeId !== 'string' || !uuidRegex.test(employeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid employeeId format' });
    }

    // Validate month format
    if (typeof month !== 'string' || !monthRegex.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month format, expected YYYY-MM',
      });
    }

    // Validate targetValue
    const tv = Number(targetValue);
    if (!Number.isFinite(tv) || tv < 0) {
      return res.status(400).json({ success: false, message: 'Invalid targetValue' });
    }

    // Validate dates
    const sd = new Date(startDate);
    const ed = new Date(endDate);
    if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid startDate or endDate' });
    }

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Create the target
    const employeeTarget = await EmployeeTarget.create({
      title,
      description,
      targetValue: tv,
      month,
      startDate: sd,
      endDate: ed,
      employeeId,
    });

    // Create notification for the employee (non-blocking)
    try {
      await EmployeeNotification.create({
        employeeId,
        title: 'تم إضافة تارجيت شهري جديد',
        message: `تم إضافة تارجيت شهري جديد لك بقيمة ${tv} لشهر ${month}`,
        type: 'TARGET_CREATED',
        relatedTargetId: employeeTarget.id,
      });
    } catch (e) {
      console.error('Notification creation failed (non-blocking):', e);
    }

    return res.status(201).json({
      success: true,
      message: 'Employee target created successfully',
      data: employeeTarget,
    });
  } catch (error) {
    console.error('Error creating employee target:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/** =========================
 * Get employee targets (ADMIN)
 * ✅ Always returns employees list for admin
 * ✅ No data => []
 ========================== */
export const getEmployeeTargets = async (req: Request, res: Response) => {
  try {
    const { employeeId, month } = req.query;

    const filter: any = {};

    if (employeeId) {
      if (typeof employeeId !== 'string' || !uuidRegex.test(employeeId)) {
        return res.status(400).json({ success: false, message: 'Invalid employeeId format' });
      }
      filter.employeeId = employeeId;
    }

    if (month) {
      if (typeof month !== 'string' || !monthRegex.test(month)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month format, expected YYYY-MM',
        });
      }
      filter.month = month;
    }

    // ✅ Fetch ALL employees for admin (حتى لو ما في targets)
    const employeesRaw = await User.find({ role: 'EMPLOYEE' }); // بدون فلترة isActive => كل الموظفين
    const employeesList = Array.isArray(employeesRaw) ? employeesRaw.map(mapEmployeeLite) : [];

    // ✅ Fetch targets
    const rawTargets = await EmployeeTarget.find(filter);
    const employeeTargets = Array.isArray(rawTargets) ? rawTargets : [];

    // ✅ Map employees by id to attach to targets
    const employeeMap: Record<string, { id: string; name: string; email: string }> = {};
    employeesList.forEach((e) => {
      employeeMap[e.id] = e;
    });

    const targetsWithEmployee = employeeTargets.map((target: any) => {
      const t = toPlain(target);
      return {
        ...t,
        employee: employeeMap[t.employeeId] || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: targetsWithEmployee,
      employees: employeesList, // ✅ هذا اللي بدك يبين عند الأدمن
    });
  } catch (error: any) {
    console.error('Error fetching employee targets:', error);

    if (error?.code === '42P01' || String(error?.message || '').includes('does not exist')) {
      return res.status(500).json({
        success: false,
        message: 'Database table not found. Please check database configuration.',
      });
    }

    if (error?.code === 'ECONNREFUSED' || String(error?.message || '').includes('connection')) {
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please check database server.',
      });
    }

    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/** =========================
 * Get employee's own targets (EMPLOYEE)
 * ✅ No data => []
 ========================== */
export const getEmployeeOwnTargets = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // @ts-ignore
    const employeeId = req.user.id;

    const raw = await EmployeeTarget.findByEmployee(employeeId);
    const employeeTargets = Array.isArray(raw) ? raw : [];

    return res.status(200).json({ success: true, data: employeeTargets });
  } catch (error: any) {
    console.error('Error fetching employee own targets:', error);

    if (error?.code === '42P01' || String(error?.message || '').includes('does not exist')) {
      return res.status(500).json({
        success: false,
        message: 'Database table not found. Please check database configuration.',
      });
    }

    if (error?.code === 'ECONNREFUSED' || String(error?.message || '').includes('connection')) {
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please check database server.',
      });
    }

    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/** =========================
 * Get single employee target (ADMIN)
 ========================== */
export const getEmployeeTarget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid target ID format' });
    }

    const employeeTarget = await EmployeeTarget.findById(id);

    if (!employeeTarget) {
      return res.status(404).json({ success: false, message: 'Employee target not found' });
    }

    const targetPlain = toPlain(employeeTarget);
    const employee = await User.findById(targetPlain.employeeId);

    return res.status(200).json({
      success: true,
      data: {
        ...targetPlain,
        employee: employee ? { id: employee.id, name: employee.fullName, email: employee.email } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching employee target:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/** =========================
 * Update employee target (ADMIN)
 ========================== */
export const updateEmployeeTarget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, targetValue, currentValue, month, startDate, endDate, status } = req.body;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid target ID format' });
    }

    const existingTarget = await EmployeeTarget.findById(id);
    if (!existingTarget) {
      return res.status(404).json({ success: false, message: 'Employee target not found' });
    }

    const existingPlain = toPlain(existingTarget);

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    if (targetValue !== undefined) {
      const tv = Number(targetValue);
      if (!Number.isFinite(tv) || tv < 0) {
        return res.status(400).json({ success: false, message: 'Invalid targetValue' });
      }
      updateData.targetValue = tv;
    }

    if (currentValue !== undefined) {
      const cv = Number(currentValue);
      if (!Number.isFinite(cv) || cv < 0) {
        return res.status(400).json({ success: false, message: 'Invalid currentValue' });
      }
      updateData.currentValue = cv;

      const effectiveTargetValue =
        updateData.targetValue !== undefined ? updateData.targetValue : existingPlain.targetValue;

      const progress = effectiveTargetValue > 0 ? (cv / effectiveTargetValue) * 100 : 0;
      updateData.status = progress >= 100 ? 'COMPLETED' : 'ACTIVE';
    }

    if (month) {
      if (typeof month !== 'string' || !monthRegex.test(month)) {
        return res.status(400).json({ success: false, message: 'Invalid month format, expected YYYY-MM' });
      }
      updateData.month = month;
    }

    if (startDate) {
      const sd = new Date(startDate);
      if (Number.isNaN(sd.getTime())) return res.status(400).json({ success: false, message: 'Invalid startDate' });
      updateData.startDate = sd;
    }

    if (endDate) {
      const ed = new Date(endDate);
      if (Number.isNaN(ed.getTime())) return res.status(400).json({ success: false, message: 'Invalid endDate' });
      updateData.endDate = ed;

      const now = new Date();
      if (now > ed && updateData.status !== 'COMPLETED') {
        updateData.status = 'EXPIRED';
      }
    }

    if (status !== undefined) {
      if (typeof status !== 'string' || !ALLOWED_STATUS.has(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      updateData.status = status;
    }

    const updated = await EmployeeTarget.update(id, updateData);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Employee target not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Employee target updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating employee target:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/** =========================
 * Delete employee target (ADMIN)
 ========================== */
export const deleteEmployeeTarget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid target ID format' });
    }

    const success = await EmployeeTarget.delete(id);

    if (!success) {
      return res.status(404).json({ success: false, message: 'Employee target not found' });
    }

    return res.status(200).json({ success: true, message: 'Employee target deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee target:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/** =========================
 * Update target progress (EMPLOYEE)
 ========================== */
export const updateTargetProgress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentValue } = req.body;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid target ID format' });
    }

    if (currentValue === undefined || currentValue === null) {
      return res.status(400).json({ success: false, message: 'Current value is required' });
    }

    const target = await EmployeeTarget.findById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Employee target not found' });
    }

    const targetPlain = toPlain(target);

    const cv = Number(currentValue);
    if (!Number.isFinite(cv) || cv < 0) {
      return res.status(400).json({ success: false, message: 'Invalid currentValue' });
    }

    const progress = targetPlain.targetValue > 0 ? (cv / targetPlain.targetValue) * 100 : 0;

    let status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' = 'ACTIVE';
    if (progress >= 100) status = 'COMPLETED';
    else if (new Date() > new Date(targetPlain.endDate)) status = 'EXPIRED';

    const updated = await EmployeeTarget.update(id, { currentValue: cv, status });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Employee target not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Target progress updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating target progress:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/** =========================
 * Get employee target statistics (EMPLOYEE)
 * ✅ No data => []
 ========================== */
export const getTargetStatistics = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // @ts-ignore
    const employeeId = req.user.id;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const raw = await EmployeeTarget.find({ employeeId, month: currentMonth });
    const currentMonthTargets = Array.isArray(raw) ? raw : [];

    const now = new Date();

    const statistics = currentMonthTargets.map((target: any) => {
      const t = toPlain(target);
      const progress = t.targetValue > 0 ? (safeNum(t.currentValue) / safeNum(t.targetValue)) * 100 : 0;

      let status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' = 'ACTIVE';
      if (progress >= 100) status = 'COMPLETED';
      else if (now > new Date(t.endDate)) status = 'EXPIRED';

      return {
        ...t,
        progress: Math.min(progress, 100),
        status,
      };
    });

    return res.status(200).json({ success: true, data: statistics });
  } catch (error: any) {
    console.error('Error fetching target statistics:', error);

    if (error?.code === '42P01' || String(error?.message || '').includes('does not exist')) {
      return res.status(500).json({
        success: false,
        message: 'Database table not found. Please check database configuration.',
      });
    }

    if (error?.code === 'ECONNREFUSED' || String(error?.message || '').includes('connection')) {
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please check database server.',
      });
    }

    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
