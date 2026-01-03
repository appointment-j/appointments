import { Request, Response } from 'express';
import { DailyWorkLog } from '../models/DailyWorkLog';

export const getAllDailyWorkLogs = async (req: Request, res: Response) => {
  try {
    const { q, dateFrom, dateTo, employeeId, isReviewed } = req.query;

    // Parse query parameters
    const parsedDateFrom = dateFrom ? new Date(dateFrom as string) : undefined;
    const parsedDateTo = dateTo ? new Date(dateTo as string) : undefined;
    const parsedIsReviewed = isReviewed !== undefined ? isReviewed === 'true' : undefined;

    // Validate dates if provided
    if (dateFrom && isNaN(parsedDateFrom!.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid dateFrom format' 
      });
    }
    if (dateTo && isNaN(parsedDateTo!.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid dateTo format' 
      });
    }

    const dailyWorkLogs = await DailyWorkLog.findAllWithEmployeeInfo({
      q: q as string,
      dateFrom: parsedDateFrom,
      dateTo: parsedDateTo,
      employeeId: employeeId as string,
      isReviewed: parsedIsReviewed
    });

    res.status(200).json({ 
      success: true, 
      data: dailyWorkLogs 
    });
  } catch (error) {
    console.error('Error getting all daily work logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getDailyWorkLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const logWithEmployee = await DailyWorkLog.findByIdWithEmployeeInfo(id);

    if (!logWithEmployee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Daily work log not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: logWithEmployee 
    });
  } catch (error) {
    console.error('Error getting daily work log by id:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const updateDailyWorkLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNote, isReviewed } = req.body;

    const dailyWorkLog = await DailyWorkLog.findById(id);

    if (!dailyWorkLog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Daily work log not found' 
      });
    }

    const updatedDailyWorkLog = await DailyWorkLog.update(id, {
      adminNote: adminNote || null,
      isReviewed: isReviewed !== undefined ? isReviewed : dailyWorkLog.isReviewed
    });

    // Get the updated log with employee info
    const logWithEmployee = await DailyWorkLog.findByIdWithEmployeeInfo(id);

    res.status(200).json({ 
      success: true, 
      data: logWithEmployee || updatedDailyWorkLog,
      message: 'Daily work log updated successfully'
    });
  } catch (error) {
    console.error('Error updating daily work log:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getTodayDailyWorkLogs = async (req: Request, res: Response) => {
  try {
    // Calculate start and end of today
    const today = new Date();
    // Set to start of day in local time
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // Set to end of day in local time
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const dailyWorkLogs = await DailyWorkLog.findAllWithEmployeeInfo({
      dateFrom: startOfDay,
      dateTo: endOfDay
    });

    res.status(200).json({ 
      success: true, 
      data: dailyWorkLogs 
    });
  } catch (error) {
    console.error('Error getting today daily work logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};