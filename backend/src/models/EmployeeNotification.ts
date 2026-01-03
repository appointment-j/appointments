import { query } from '../config/database';

export interface IEmployeeNotification {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  type: 'BONUS' | 'TARGET_CREATED';
  isRead: boolean;
  relatedBonusEntryId?: string;
  relatedTargetId?: string;
  createdAtUtc: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class EmployeeNotification {
  static async create(data: {
    employeeId: string;
    title: string;
    message: string;
    type: 'BONUS' | 'TARGET_CREATED';
    relatedBonusEntryId?: string;
    relatedTargetId?: string;
  }): Promise<IEmployeeNotification> {
    const sql = `
      INSERT INTO employee_notifications (
        employee_id, title, message, type, related_bonus_entry_id, related_target_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      data.employeeId,
      data.title,
      data.message,
      data.type,
      data.relatedBonusEntryId || null,
      data.relatedTargetId || null,
    ];

    const result = await query(sql, params);
    return this.mapRowToNotification(result.rows[0]);
  }

  static async find(condition?: {
    employeeId?: string;
    isRead?: boolean;
    type?: string;
  }): Promise<IEmployeeNotification[]> {
    let sql = 'SELECT * FROM employee_notifications WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (condition?.employeeId) {
      sql += ` AND employee_id = $${paramIndex++}`;
      params.push(condition.employeeId);
    }
    if (condition?.isRead !== undefined) {
      sql += ` AND is_read = $${paramIndex++}`;
      params.push(condition.isRead);
    }
    if (condition?.type) {
      sql += ` AND type = $${paramIndex++}`;
      params.push(condition.type);
    }

    sql += ' ORDER BY created_at_utc DESC';

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToNotification(row));
  }

  static async findById(id: string): Promise<IEmployeeNotification | null> {
    const result = await query('SELECT * FROM employee_notifications WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToNotification(result.rows[0]);
  }

  static async update(id: string, data: Partial<IEmployeeNotification>): Promise<IEmployeeNotification> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.isRead !== undefined) {
      updates.push(`is_read = $${paramIndex++}`);
      params.push(data.isRead);
    }

    if (updates.length === 0) {
      const notification = await this.findById(id);
      if (!notification) throw new Error('Notification not found');
      return notification;
    }

    params.push(id);
    const sql = `UPDATE employee_notifications SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(sql, params);
    if (result.rows.length === 0) throw new Error('Notification not found');
    return this.mapRowToNotification(result.rows[0]);
  }

  static async countUnread(employeeId: string): Promise<number> {
    try {
      const result = await query(
        'SELECT COUNT(*) FROM employee_notifications WHERE employee_id = $1 AND is_read = false',
        [employeeId]
      );
      // PostgreSQL returns count as string in count property, but might be in different format
      const row = result.rows[0];
      if (!row) {
        return 0;
      }
      const countValue = row.count || row.COUNT || row['count(*)'] || '0';
      return parseInt(countValue) || 0;
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  }

  static mapRowToNotification(row: any): IEmployeeNotification {
    return {
      id: row.id,
      employeeId: row.employee_id,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: row.is_read,
      relatedBonusEntryId: row.related_bonus_entry_id,
      relatedTargetId: row.related_target_id,
      createdAtUtc: row.created_at_utc,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}