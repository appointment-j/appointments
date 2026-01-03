import { Request, Response, NextFunction } from 'express';
import { SiteEntry } from '../models/SiteEntry';
import { getLocalDate, getLocalHour } from '../utils/timezone';

export const createEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const dateLocal = getLocalDate(now);
    const hourLocal = getLocalHour(now);

    const entry = await SiteEntry.create({
      createdAtUtc: now,
      dateLocal,
      hourLocal,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      referrer: req.headers.referer,
      language: req.headers['accept-language']?.split(',')[0] || 'en',
      isAuthenticated: !!req.user,
      userId: req.user?.id,
    });

    res.status(201).json({ message: 'Entry recorded', entry });
  } catch (error) {
    next(error);
  }
};

export const getEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      dateFrom,
      dateTo,
      hourFrom,
      hourTo,
      language,
      isAuthenticated,
      page = '1',
      limit = '50',
    } = req.query;

    const condition: any = {};
    if (dateFrom) condition.dateFrom = dateFrom as string;
    if (dateTo) condition.dateTo = dateTo as string;
    if (hourFrom !== undefined) condition.hourFrom = Number(hourFrom);
    if (hourTo !== undefined) condition.hourTo = Number(hourTo);
    if (language) condition.language = language as string;
    if (isAuthenticated !== undefined) condition.isAuthenticated = isAuthenticated === 'true';

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get all entries for stats
    const allEntries = await SiteEntry.find(condition);
    
    // Get paginated entries
    const entries = allEntries.slice(skip, skip + limitNum);

    // Calculate stats
    const hourlyStats = Array(24).fill(0);
    const dailyStats: Record<string, number> = {};
    const languageStats: Record<string, number> = {};

    allEntries.forEach((entry) => {
      hourlyStats[entry.hourLocal]++;
      dailyStats[entry.dateLocal] = (dailyStats[entry.dateLocal] || 0) + 1;
      languageStats[entry.language] = (languageStats[entry.language] || 0) + 1;
    });

    res.json({
      entries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allEntries.length,
        pages: Math.ceil(allEntries.length / limitNum),
      },
      stats: {
        hourly: hourlyStats,
        daily: dailyStats,
        language: languageStats,
        total: allEntries.length,
        authenticated: allEntries.filter((e) => e.isAuthenticated).length,
      },
    });
  } catch (error) {
    next(error);
  }
};
