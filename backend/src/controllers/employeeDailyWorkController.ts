import { Request, Response } from 'express';
import { DailyWorkLog } from '../models/DailyWorkLog';
import { User } from '../models/User';

export const createDailyWorkLog = async (req: Request, res: Response) => {
  try {
    const { date, title, description } = req.body;
    const employeeId = req.user!.id;

    // Validate required fields
    if (!description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Description is required' 
      });
    }

    // Validate date format
    let workDate: Date;
    if (date) {
      workDate = new Date(date);
      if (isNaN(workDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format' 
        });
      }
    } else {
      workDate = new Date();
      workDate.setHours(0, 0, 0, 0); // Set to start of day
    }

    const dailyWorkLog = await DailyWorkLog.create({
      employeeId,
      date: workDate,
      title: title || null,
      description,
    });

    res.status(201).json({ 
      success: true, 
      data: dailyWorkLog,
      message: 'Daily work log created successfully'
    });
  } catch (error) {
    console.error('Error creating daily work log:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getDailyWorkLogs = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user!.id;

    const dailyWorkLogs = await DailyWorkLog.findByEmployee(employeeId);

    res.status(200).json({ 
      success: true, 
      data: dailyWorkLogs 
    });
  } catch (error) {
    console.error('Error getting daily work logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getDailyWorkLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = req.user!.id;

    const dailyWorkLog = await DailyWorkLog.findById(id);

    if (!dailyWorkLog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Daily work log not found' 
      });
    }

    // Check if the log belongs to the current user
    if (dailyWorkLog.employeeId !== employeeId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: dailyWorkLog 
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
    const { title, description } = req.body;
    const employeeId = req.user!.id;

    const dailyWorkLog = await DailyWorkLog.findById(id);

    if (!dailyWorkLog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Daily work log not found' 
      });
    }

    // Check if the log belongs to the current user
    if (dailyWorkLog.employeeId !== employeeId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const updatedDailyWorkLog = await DailyWorkLog.update(id, {
      title: title || null,
      description,
    });

    res.status(200).json({ 
      success: true, 
      data: updatedDailyWorkLog,
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

export const deleteDailyWorkLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = req.user!.id;

    const dailyWorkLog = await DailyWorkLog.findById(id);

    if (!dailyWorkLog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Daily work log not found' 
      });
    }

    // Check if the log belongs to the current user
    if (dailyWorkLog.employeeId !== employeeId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const deleted = await DailyWorkLog.delete(id);

    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: 'Daily work log not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Daily work log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting daily work log:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getDailyWorkLogsForDashboard = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 5;

    // Get the employee's logs ordered by date descending, limited to the specified number
    const dailyWorkLogs = await DailyWorkLog.find({ employeeId });
    
    // Sort by date and createdAt descending and limit the results
    const sortedLogs = dailyWorkLogs
      .sort((a, b) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison === 0) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return dateComparison;
      })
      .slice(0, limit);

    res.status(200).json({ 
      success: true, 
      data: sortedLogs 
    });
  } catch (error) {
    console.error('Error getting daily work logs for dashboard:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};