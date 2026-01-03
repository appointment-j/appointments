import { Request, Response } from 'express';
import { query } from '../config/database';
import { EmployeeBonusEntry, BonusStatus } from '../models/EmployeeBonusEntry';

export interface AdminDashboardStats {
  total: number;
  today: number;
  pending: number;
  employees: number;
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_STATUS = new Set<BonusStatus>(['APPROVED', 'PENDING']);

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Forbidden' });

    const totalResult = await query('SELECT COUNT(*)::int AS count FROM appointments', []);
    const total = Number(totalResult?.rows?.[0]?.count ?? 0);

    const todayResult = await query(
      `
      SELECT COUNT(*)::int AS count
      FROM appointments
      WHERE DATE(created_at) = CURRENT_DATE
      `,
      []
    );
    const today = Number(todayResult?.rows?.[0]?.count ?? 0);

    const pendingResult = await query(
      'SELECT COUNT(*)::int AS count FROM appointments WHERE status = $1',
      ['PENDING']
    );
    const pending = Number(pendingResult?.rows?.[0]?.count ?? 0);

    const employeesResult = await query('SELECT COUNT(*)::int AS count FROM users WHERE role = $1', [
      'EMPLOYEE',
    ]);
    const employees = Number(employeesResult?.rows?.[0]?.count ?? 0);

    const stats: AdminDashboardStats = { total, today, pending, employees };

    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/** =========================
 * Admin: Bonuses CRUD
 ========================== */

export const adminGetBonuses = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Forbidden' });

    const { employeeId, status, search } = req.query as any;

    if (employeeId && !uuidRegex.test(employeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid employeeId' });
    }
    if (status && !ALLOWED_STATUS.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const data = await EmployeeBonusEntry.findWithEmployee({
      employeeId: employeeId || undefined,
      status: status || undefined,
      search: search || undefined,
    });

    // ✅ رجّع keys متعددة (data + entries) عشان الفرونت ما يتلخبط
    return res.json({ success: true, data, entries: data });
  } catch (e) {
    console.error('adminGetBonuses error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const adminUpdateBonus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Forbidden' });

    const { id } = req.params;
    const { amount, currency, note } = req.body;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid bonus id' });
    }

    const updateData: any = {};

    if (amount !== undefined) {
      const n = Number(amount);
      if (!Number.isFinite(n)) return res.status(400).json({ success: false, message: 'Invalid amount' });
      updateData.amount = n;
    }

    if (currency !== undefined) {
      if (typeof currency !== 'string' || currency.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Invalid currency' });
      }
      updateData.currency = currency.trim();
    }

    if (note !== undefined) {
      if (typeof note !== 'string' || !note.trim()) {
        return res.status(400).json({ success: false, message: 'Invalid note' });
      }
      updateData.note = note.trim();
    }

    const updated = await EmployeeBonusEntry.update(id, updateData);
    if (!updated) return res.status(404).json({ success: false, message: 'Bonus not found' });

    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('adminUpdateBonus error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const adminUpdateBonusStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Forbidden' });

    const { id } = req.params;
    const { status } = req.body as { status: BonusStatus };

    if (!uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid bonus id' });
    }
    if (!status || !ALLOWED_STATUS.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updated = await EmployeeBonusEntry.update(id, { status });
    if (!updated) return res.status(404).json({ success: false, message: 'Bonus not found' });

    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error('adminUpdateBonusStatus error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const adminDeleteBonus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Forbidden' });

    const { id } = req.params;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid bonus id' });
    }

    const ok = await EmployeeBonusEntry.delete(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Bonus not found' });

    return res.json({ success: true, message: 'Bonus deleted successfully' });
  } catch (e) {
    console.error('adminDeleteBonus error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
