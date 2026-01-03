import { query } from '../config/database';
import { User } from './User';

export interface IDailyWorkLog {
  id: string;
  employeeId: string;
  date: Date;
  title?: string;
  description: string;
  adminNote?: string;
  isReviewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployeeWithLogInfo {
  id: string;
  fullName: string;
  email: string;
  employeeCode?: string;
  jobTitle?: string;
}

export interface IDailyWorkLogWithEmployee extends IDailyWorkLog {
  employee: IEmployeeWithLogInfo;
}

export class DailyWorkLog {
  static async findOne(condition: { id?: string; employeeId?: string; date?: Date }): Promise<IDailyWorkLog | null> {
    let sql = 'SELECT * FROM daily_work_logs WHERE ';
    const params: any[] = [];
    const conditions: string[] = [];

    if (condition.id) {
      conditions.push(`id = $${params.length + 1}`);
      params.push(condition.id);
    }
    if (condition.employeeId) {
      conditions.push(`employee_id = $${params.length + 1}`);
      params.push(condition.employeeId);
    }
    if (condition.date) {
      conditions.push(`date = $${params.length + 1}`);
      params.push(condition.date);
    }

    if (conditions.length === 0) return null;
    sql += conditions.join(' AND ');

    const result = await query(sql, params);
    if (result.rows.length === 0) return null;

    return this.mapRowToLog(result.rows[0]);
  }

  static async findById(id: string): Promise<IDailyWorkLog | null> {
    return this.findOne({ id });
  }

  static async create(data: {
    employeeId: string;
    date: Date;
    title?: string;
    description: string;
    adminNote?: string;
    isReviewed?: boolean;
  }): Promise<IDailyWorkLog> {
    const sql = `
      INSERT INTO daily_work_logs (
        employee_id, date, title, description, admin_note, is_reviewed
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      data.employeeId,
      data.date,
      data.title || null,
      data.description,
      data.adminNote || null,
      data.isReviewed !== undefined ? data.isReviewed : false
    ];

    const result = await query(sql, params);
    return this.mapRowToLog(result.rows[0]);
  }

  static async update(id: string, data: Partial<IDailyWorkLog>): Promise<IDailyWorkLog> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(data.title || null);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }

    if (data.adminNote !== undefined) {
      updates.push(`admin_note = $${paramIndex++}`);
      params.push(data.adminNote || null);
    }
    if (data.isReviewed !== undefined) {
      updates.push(`is_reviewed = $${paramIndex++}`);
      params.push(data.isReviewed);
    }

    if (updates.length === 0) {
      const log = await this.findById(id);
      if (!log) throw new Error('Daily work log not found');
      return log;
    }

    params.push(id);
    const sql = `UPDATE daily_work_logs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(sql, params);
    if (result.rows.length === 0) throw new Error('Daily work log not found');
    return this.mapRowToLog(result.rows[0]);
  }

  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM daily_work_logs WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async find(condition?: { 
    employeeId?: string; 
    dateFrom?: Date; 
    dateTo?: Date; 
    q?: string; 
    isReviewed?: boolean 
  }): Promise<IDailyWorkLog[]> {
    let sql = 'SELECT * FROM daily_work_logs';
    const params: any[] = [];
    const conditions: string[] = [];

    if (condition?.employeeId) {
      conditions.push(`employee_id = $${params.length + 1}`);
      params.push(condition.employeeId);
    }
    if (condition?.dateFrom) {
      conditions.push(`date >= $${params.length + 1}`);
      params.push(condition.dateFrom);
    }
    if (condition?.dateTo) {
      conditions.push(`date <= $${params.length + 1}`);
      params.push(condition.dateTo);
    }
    if (condition?.isReviewed !== undefined) {
      conditions.push(`is_reviewed = $${params.length + 1}`);
      params.push(condition.isReviewed);
    }
    if (condition?.q) {
      conditions.push(`(title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 2})`);
      params.push(`%${condition.q}%`);
      params.push(`%${condition.q}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY date DESC, created_at DESC';

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToLog(row));
  }

  static async findByEmployee(employeeId: string): Promise<IDailyWorkLog[]> {
    return this.find({ employeeId });
  }

  static async findAllWithEmployeeInfo(condition?: { 
    employeeId?: string; 
    dateFrom?: Date; 
    dateTo?: Date; 
    q?: string; 
    isReviewed?: boolean 
  }): Promise<IDailyWorkLogWithEmployee[]> {
    let sql = `
      SELECT 
        dwl.*,
        u.full_name,
        u.email,
        u.employee_code,
        u.job_title
      FROM daily_work_logs dwl
      JOIN users u ON dwl.employee_id = u.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (condition?.employeeId) {
      conditions.push(`dwl.employee_id = $${params.length + 1}`);
      params.push(condition.employeeId);
    }
    if (condition?.dateFrom) {
      conditions.push(`dwl.date >= $${params.length + 1}`);
      params.push(condition.dateFrom);
    }
    if (condition?.dateTo) {
      conditions.push(`dwl.date <= $${params.length + 1}`);
      params.push(condition.dateTo);
    }
    if (condition?.isReviewed !== undefined) {
      conditions.push(`dwl.is_reviewed = $${params.length + 1}`);
      params.push(condition.isReviewed);
    }
    if (condition?.q) {
      conditions.push(`(dwl.title ILIKE $${params.length + 1} OR dwl.description ILIKE $${params.length + 2} OR u.full_name ILIKE $${params.length + 3} OR u.email ILIKE $${params.length + 4})`);
      params.push(`%${condition.q}%`);
      params.push(`%${condition.q}%`);
      params.push(`%${condition.q}%`);
      params.push(`%${condition.q}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY dwl.date DESC, dwl.created_at DESC';

    const result = await query(sql, params);
    return result.rows.map((row) => ({
      ...this.mapRowToLog(row),
      employee: {
        id: row.employee_id,
        fullName: row.full_name,
        email: row.email,
        employeeCode: row.employee_code,
        jobTitle: row.job_title,
      }
    }));
  }

  static async findByIdWithEmployeeInfo(id: string): Promise<IDailyWorkLogWithEmployee | null> {
    const sql = `
      SELECT 
        dwl.*,
        u.full_name,
        u.email,
        u.employee_code,
        u.job_title
      FROM daily_work_logs dwl
      JOIN users u ON dwl.employee_id = u.id
      WHERE dwl.id = $1
    `;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      ...this.mapRowToLog(row),
      employee: {
        id: row.employee_id,
        fullName: row.full_name,
        email: row.email,
        employeeCode: row.employee_code,
        jobTitle: row.job_title,
      }
    };
  }

  static mapRowToLog(row: any): IDailyWorkLog {
    return {
      id: row.id,
      employeeId: row.employee_id,
      date: row.date ? new Date(row.date) : new Date(),
      title: row.title || undefined,
      description: row.description,
      adminNote: row.admin_note || undefined,
      isReviewed: row.is_reviewed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}