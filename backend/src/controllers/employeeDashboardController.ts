import { Request, Response, NextFunction } from 'express';
import { EmployeeBonusEntry } from '../models/EmployeeBonusEntry';
import { EmployeeNotification } from '../models/EmployeeNotification';

export const getDashboardSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'EMPLOYEE') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const employeeId = req.user.id;

    // Get current balance (sum of all approved entries)
    const allEntries = await EmployeeBonusEntry.find({ employeeId, status: 'APPROVED' });
    const balance = allEntries.reduce((sum, entry) => sum + entry.amount, 0);

    // Get this month's bonuses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const thisMonthEntries = allEntries.filter(
      (entry) => 
        new Date(entry.createdAtUtc) >= startOfMonth && 
        new Date(entry.createdAtUtc) <= endOfMonth
    );
    const thisMonthTotal = thisMonthEntries.reduce((sum, entry) => sum + entry.amount, 0);

    // Get last bonus
    const sortedEntries = [...allEntries].sort((a, b) => 
      new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime()
    );
    const lastBonus = sortedEntries.length > 0 ? sortedEntries[0] : null;

    // Get unread notifications count
    const unreadNotificationsCount = await EmployeeNotification.countUnread(employeeId);

    res.json({
      balance,
      thisMonthTotal,
      lastBonus: lastBonus ? {
        amount: lastBonus.amount,
        createdAtUtc: lastBonus.createdAtUtc,
        note: lastBonus.note,
      } : null,
      unreadNotificationsCount,
    });
  } catch (error) {
    next(error);
  }
};