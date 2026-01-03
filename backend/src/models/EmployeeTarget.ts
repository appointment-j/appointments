import { query } from '../config/database';

export interface IEmployeeTarget {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  month: string; // YYYY-MM format
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  employeeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EmployeeTarget {
  static async findOne(condition: { id?: string; employeeId?: string; month?: string }): Promise<IEmployeeTarget | null> {
    let sql = 'SELECT * FROM employee_targets WHERE ';
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
    if (condition.month) {
      conditions.push(`month = $${params.length + 1}`);
      params.push(condition.month);
    }

    if (conditions.length === 0) return null;
    sql += conditions.join(' AND ');

    const result = await query(sql, params);
    if (result.rows.length === 0) return null;

    return this.mapRowToTarget(result.rows[0]);
  }

  static async findById(id: string): Promise<IEmployeeTarget | null> {
    return this.findOne({ id });
  }

  static async create(data: {
    title: string;
    description: string;
    targetValue: number;
    currentValue?: number;
    month: string;
    startDate: Date;
    endDate: Date;
    status?: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
    employeeId: string;
  }): Promise<IEmployeeTarget> {
    const sql = `
      INSERT INTO employee_targets (
        title, description, target_value, current_value, month,
        start_date, end_date, status, employee_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const params = [
      data.title,
      data.description,
      data.targetValue,
      data.currentValue !== undefined ? data.currentValue : 0,
      data.month,
      data.startDate,
      data.endDate,
      data.status || 'ACTIVE',
      data.employeeId
    ];

    const result = await query(sql, params);
    return this.mapRowToTarget(result.rows[0]);
  }

  static async update(id: string, data: Partial<IEmployeeTarget>): Promise<IEmployeeTarget> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.targetValue !== undefined) {
      updates.push(`target_value = $${paramIndex++}`);
      params.push(data.targetValue);
    }
    if (data.currentValue !== undefined) {
      updates.push(`current_value = $${paramIndex++}`);
      params.push(data.currentValue);
    }
    if (data.month !== undefined) {
      updates.push(`month = $${paramIndex++}`);
      params.push(data.month);
    }
    if (data.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      params.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      params.push(data.endDate);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    if (data.employeeId !== undefined) {
      updates.push(`employee_id = $${paramIndex++}`);
      params.push(data.employeeId);
    }

    if (updates.length === 0) {
      const target = await this.findById(id);
      if (!target) throw new Error('Target not found');
      return target;
    }

    params.push(id);
    const sql = `UPDATE employee_targets SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(sql, params);
    if (result.rows.length === 0) throw new Error('Target not found');
    return this.mapRowToTarget(result.rows[0]);
  }

  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM employee_targets WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async find(condition?: { employeeId?: string; month?: string; status?: string }): Promise<IEmployeeTarget[]> {
    let sql = 'SELECT * FROM employee_targets';
    const params: any[] = [];
    const conditions: string[] = [];

    if (condition?.employeeId) {
      conditions.push(`employee_id = $${params.length + 1}`);
      params.push(condition.employeeId);
    }
    if (condition?.month) {
      conditions.push(`month = $${params.length + 1}`);
      params.push(condition.month);
    }
    if (condition?.status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(condition.status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToTarget(row));
  }

  static async findByEmployee(employeeId: string): Promise<IEmployeeTarget[]> {
    return this.find({ employeeId });
  }

  static mapRowToTarget(row: any): IEmployeeTarget {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      targetValue: row.target_value,
      currentValue: row.current_value,
      month: row.month,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      employeeId: row.employee_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}