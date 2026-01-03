import { Request, Response, NextFunction } from 'express';
import { EmployeeBonusEntry } from '../models/EmployeeBonusEntry';
import { EmployeeNotification } from '../models/EmployeeNotification';

// Employee-specific bonus endpoints
export const getMyBonuses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'EMPLOYEE') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const { search, dateFrom, dateTo, page = '1', limit = '50' } = req.query;

    const condition: any = { employeeId: req.user.id };

    if (dateFrom) {
      const d = new Date(dateFrom as string);
      if (!isNaN(d.getTime())) condition.dateFrom = d;
    }

    if (dateTo) {
      const d = new Date(dateTo as string);
      if (!isNaN(d.getTime())) condition.dateTo = d;
    }

    if (search) condition.search = search as string;

    const allEntries = await EmployeeBonusEntry.find(condition);

    // ✅ Approved only for balance
    const approvedEntries = allEntries.filter((e) => e.status === 'APPROVED');
    const balance = approvedEntries.reduce((sum, entry) => sum + entry.amount, 0);

    // ✅ This month total (approved positives only)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthTotal = approvedEntries
      .filter((e) => new Date(e.createdAtUtc).getTime() >= startOfMonth.getTime() && e.amount > 0)
      .reduce((sum, entry) => sum + entry.amount, 0);

    // ✅ lastBonus (آخر بونص معتمد)
    const last = [...approvedEntries].sort(
      (a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime()
    )[0];

    const lastBonus = last
      ? {
          amount: last.amount,
          createdAtUtc:
            typeof (last as any).createdAtUtc === 'string'
              ? (last as any).createdAtUtc
              : new Date(last.createdAtUtc).toISOString(),
          note: last.note || '',
        }
      : null;

    // ✅ unread notifications count
    const unreadNotificationsCount = await EmployeeNotification.countUnread(req.user.id);

    // ✅ pagination
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const skip = (pageNum - 1) * limitNum;
    const entries = allEntries.slice(skip, skip + limitNum);

    res.json({
      entries: entries || [],
      balance: balance || 0,
      thisMonthTotal: thisMonthTotal || 0,
      lastBonus,
      unreadNotificationsCount: unreadNotificationsCount || 0,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allEntries.length,
        pages: Math.ceil(allEntries.length / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching bonuses:', error);

    if (error.code === '42P01' || String(error.message || '').includes('does not exist')) {
      res.status(500).json({ message: 'Database table not found. Please check database configuration.' });
      return;
    }

    if (error.code === 'ECONNREFUSED' || String(error.message || '').includes('connection')) {
      res.status(503).json({ message: 'Database connection failed. Please check database server.' });
      return;
    }

    next(error);
  }
};

// Employee notification endpoints
export const getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'EMPLOYEE') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const { type, isRead, page = '1', limit = '50' } = req.query;

    const condition: any = { employeeId: req.user.id };
    if (type) condition.type = type as string;
    if (isRead !== undefined) condition.isRead = isRead === 'true';

    const allNotifications = await EmployeeNotification.find(condition);

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const skip = (pageNum - 1) * limitNum;
    const notifications = allNotifications.slice(skip, skip + limitNum);

    const unreadCount = await EmployeeNotification.countUnread(req.user.id);

    res.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allNotifications.length,
        pages: Math.ceil(allNotifications.length / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);

    if (error.code === '42P01' || String(error.message || '').includes('does not exist')) {
      res.status(500).json({ message: 'Database table not found. Please check database configuration.' });
      return;
    }

    if (error.code === 'ECONNREFUSED' || String(error.message || '').includes('connection')) {
      res.status(503).json({ message: 'Database connection failed. Please check database server.' });
      return;
    }

    next(error);
  }
};

export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'EMPLOYEE') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const { id } = req.params;

    const notification = await EmployeeNotification.findById(id);
    if (!notification || notification.employeeId !== req.user.id) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    await EmployeeNotification.update(id, { isRead: true });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'EMPLOYEE') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const notifications = await EmployeeNotification.find({
      employeeId: req.user.id,
      isRead: false,
    });

    for (const notification of notifications) {
      await EmployeeNotification.update(notification.id, { isRead: true });
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
