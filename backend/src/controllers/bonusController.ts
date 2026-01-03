import { Request, Response, NextFunction } from 'express';
import { EmployeeBonusEntry, type BonusStatus } from '../models/EmployeeBonusEntry';
import { User } from '../models/User';
import { EmployeeNotification } from '../models/EmployeeNotification';

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_STATUS = new Set<BonusStatus>(['APPROVED', 'PENDING']);

/**
 * ADMIN: Add bonus
 * POST /admin/bonuses
 */
export const addBonus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { employeeId, amount, note, status } = req.body as {
      employeeId?: string;
      amount?: any;
      note?: string;
      status?: BonusStatus;
    };

    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    if (!employeeId || typeof employeeId !== 'string' || !uuidRegex.test(employeeId)) {
      res.status(400).json({ message: 'Invalid employee ID format' });
      return;
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      res.status(400).json({ message: 'Amount must be a positive number' });
      return;
    }

    const safeStatus: BonusStatus = status && ALLOWED_STATUS.has(status) ? status : 'APPROVED';

    const employee = await User.findOne({ id: employeeId });
    if (!employee || employee.role !== 'EMPLOYEE') {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const bonusEntry = await EmployeeBonusEntry.create({
      employeeId,
      amount: amountNum,
      currency: 'JOD',
      note: (note || '').toString(),
      createdByAdminId: req.user.id,
      status: safeStatus,
    });

    // ✅ إشعار فقط إذا APPROVED
    if (bonusEntry.status === 'APPROVED') {
      try {
        const allApproved = await EmployeeBonusEntry.find({
          employeeId: employee.id,
          status: 'APPROVED',
        });
        const currentBalance = allApproved.reduce((sum, e) => sum + e.amount, 0);

        const isArabic = employee.language === 'ar';
        await EmployeeNotification.create({
          employeeId: employee.id,
          title: isArabic ? 'تم إضافة بونص جديد' : 'New Bonus Added',
          message: isArabic
            ? `تم إضافة بونص بقيمة ${bonusEntry.amount} دينار. رصيدك الحالي أصبح ${currentBalance} دينار.`
            : `A bonus of ${bonusEntry.amount} JOD has been added. Your current balance is ${currentBalance} JOD.`,
          type: 'BONUS',
          relatedBonusEntryId: bonusEntry.id,
        });
      } catch (e) {
        console.error('Failed to create notification (non-blocking):', e);
      }
    }

    res.status(201).json({ message: 'Bonus added', bonusEntry });
  } catch (error) {
    console.error('Error adding bonus:', error);
    next(error);
  }
};

/**
 * ADMIN: Get bonuses ledger
 * GET /admin/bonuses
 */
export const getBonusLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    const {
      employeeId,
      dateFrom,
      dateTo,
      status,
      amountMin,
      amountMax,
      search,
      page = '1',
      limit = '50',
    } = req.query as any;

    const condition: any = {};

    if (employeeId) {
      if (typeof employeeId !== 'string' || !uuidRegex.test(employeeId)) {
        res.status(400).json({ message: 'Invalid employeeId' });
        return;
      }
      condition.employeeId = employeeId;
    }

    if (status) {
      if (typeof status !== 'string' || !ALLOWED_STATUS.has(status as BonusStatus)) {
        res.status(400).json({ message: 'Invalid status' });
        return;
      }
      condition.status = status;
    }

    if (search) condition.search = String(search);

    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!isNaN(d.getTime())) condition.dateFrom = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      if (!isNaN(d.getTime())) condition.dateTo = d;
    }

    if (amountMin !== undefined && amountMin !== null && amountMin !== '') {
      const n = Number(amountMin);
      if (Number.isFinite(n)) condition.amountMin = n;
    }
    if (amountMax !== undefined && amountMax !== null && amountMax !== '') {
      const n = Number(amountMax);
      if (Number.isFinite(n)) condition.amountMax = n;
    }

    const allEntries = await EmployeeBonusEntry.find(condition);

    // ✅ Populate user info manually
    const entriesWithUsers = await Promise.all(
      allEntries.map(async (entry) => {
        const employee = await User.findById(entry.employeeId);
        const admin = await User.findById(entry.createdByAdminId);

        return {
          ...entry,
          employeeId: employee
            ? {
                fullName: employee.fullName,
                email: employee.email,
                employeeCode: employee.employeeCode,
              }
            : null,
          createdByAdminId: admin
            ? {
                fullName: admin.fullName,
                email: admin.email,
              }
            : null,
        };
      })
    );

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const entries = entriesWithUsers.slice(skip, skip + limitNum);

    res.json({
      entries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allEntries.length,
        pages: Math.ceil(allEntries.length / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN: Bonus stats
 * GET /admin/bonuses/stats
 */
export const getBonusStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthEntries = await EmployeeBonusEntry.find({
      dateFrom: startOfMonth,
      status: 'APPROVED',
    });
    const thisMonthTotal = thisMonthEntries
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);

    const allEntries = await EmployeeBonusEntry.find({ status: 'APPROVED' });

    const employeeTotals: Record<string, number> = {};
    allEntries.forEach((entry) => {
      if (entry.amount > 0) {
        employeeTotals[entry.employeeId] = (employeeTotals[entry.employeeId] || 0) + entry.amount;
      }
    });

    const topEmployeesData = await Promise.all(
      Object.entries(employeeTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(async ([employeeId, total]) => {
          const employee = await User.findById(employeeId);
          return {
            employeeId,
            employeeName: employee?.fullName || 'Unknown',
            employeeCode: employee?.employeeCode || '',
            total,
          };
        })
    );

    const monthlyTotals: Array<{ _id: { year: number; month: number }; total: number }> = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEntries = allEntries.filter(
        (e) =>
          e.createdAtUtc >= date &&
          e.createdAtUtc < new Date(date.getFullYear(), date.getMonth() + 1, 1) &&
          e.amount > 0
      );
      monthlyTotals.push({
        _id: { year: date.getFullYear(), month: date.getMonth() + 1 },
        total: monthEntries.reduce((sum, e) => sum + e.amount, 0),
      });
    }

    res.json({
      thisMonthTotal,
      topEmployees: topEmployeesData,
      monthlyTotals: monthlyTotals.reverse(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN: Update bonus (amount/currency/note)
 * PUT /admin/bonuses/:id
 */
export const adminUpdateBonus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    const { id } = req.params;
    const { amount, currency, note } = req.body;

    if (!uuidRegex.test(id)) {
      res.status(400).json({ success: false, message: 'Invalid bonus id' });
      return;
    }

    const updateData: any = {};
    if (amount !== undefined) {
      const n = Number(amount);
      if (!Number.isFinite(n)) {
        res.status(400).json({ success: false, message: 'Invalid amount' });
        return;
      }
      updateData.amount = n;
    }

    if (currency !== undefined) {
      if (typeof currency !== 'string' || currency.trim().length < 2) {
        res.status(400).json({ success: false, message: 'Invalid currency' });
        return;
      }
      updateData.currency = currency.trim();
    }

    if (note !== undefined) {
      if (typeof note !== 'string') {
        res.status(400).json({ success: false, message: 'Invalid note' });
        return;
      }
      updateData.note = note;
    }

    const updated = await EmployeeBonusEntry.update(id, updateData);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Bonus not found' });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (e) {
    console.error('adminUpdateBonus error:', e);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * ADMIN: Update bonus status
 * PATCH /admin/bonuses/:id/status
 */
export const adminUpdateBonusStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body as { status: BonusStatus };

    if (!uuidRegex.test(id)) {
      res.status(400).json({ success: false, message: 'Invalid bonus id' });
      return;
    }
    if (!status || !ALLOWED_STATUS.has(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const updated = await EmployeeBonusEntry.update(id, { status });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Bonus not found' });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (e) {
    console.error('adminUpdateBonusStatus error:', e);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * ADMIN: Delete bonus
 * DELETE /admin/bonuses/:id
 */
export const adminDeleteBonus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    const { id } = req.params;

    if (!uuidRegex.test(id)) {
      res.status(400).json({ success: false, message: 'Invalid bonus id' });
      return;
    }

    const ok = await EmployeeBonusEntry.delete(id);
    if (!ok) {
      res.status(404).json({ success: false, message: 'Bonus not found' });
      return;
    }

    res.json({ success: true, message: 'Bonus deleted successfully' });
  } catch (e) {
    console.error('adminDeleteBonus error:', e);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
