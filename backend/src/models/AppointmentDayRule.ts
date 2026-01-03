import { query } from '../config/database';

export interface IAppointmentDayRule {
  id: string;
  dayDate: string; // YYYY-MM-DD
  isBlocked: boolean;
  isOnlineOnly: boolean;
  defaultCapacity: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AppointmentDayRule {
  static async find(condition?: {
    dayDate?: string;
    from?: string;
    to?: string;
  }): Promise<IAppointmentDayRule[]> {
    let sql = 'SELECT * FROM appointment_day_rules WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (condition?.dayDate) {
      sql += ` AND day_date = $${paramIndex++}`;
      params.push(condition.dayDate);
    }
    
    if (condition?.from) {
      sql += ` AND day_date >= $${paramIndex++}`;
      params.push(condition.from);
    }
    
    if (condition?.to) {
      sql += ` AND day_date <= $${paramIndex++}`;
      params.push(condition.to);
    }

    sql += ' ORDER BY day_date ASC';

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToAppointmentDayRule(row));
  }

  static async findOne(condition: { dayDate: string }): Promise<IAppointmentDayRule | null> {
    const sql = 'SELECT * FROM appointment_day_rules WHERE day_date = $1';
    const result = await query(sql, [condition.dayDate]);
    if (result.rows.length === 0) return null;
    return this.mapRowToAppointmentDayRule(result.rows[0]);
  }

  static async upsert(data: {
    dayDate: string;
    isBlocked?: boolean;
    isOnlineOnly?: boolean;
    defaultCapacity?: number | null;
  }): Promise<IAppointmentDayRule> {
    const sql = `
      INSERT INTO appointment_day_rules (day_date, is_blocked, is_online_only, default_capacity)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (day_date) 
      DO UPDATE SET 
        is_blocked = EXCLUDED.is_blocked,
        is_online_only = EXCLUDED.is_online_only,
        default_capacity = EXCLUDED.default_capacity
      RETURNING *
    `;
    const result = await query(sql, [
      data.dayDate,
      data.isBlocked ?? false,
      data.isOnlineOnly ?? false,
      data.defaultCapacity ?? null,
    ]);
    return this.mapRowToAppointmentDayRule(result.rows[0]);
  }

  static async deleteByDate(dayDate: string): Promise<void> {
    const sql = 'DELETE FROM appointment_day_rules WHERE day_date = $1';
    await query(sql, [dayDate]);
  }

  static mapRowToAppointmentDayRule(row: any): IAppointmentDayRule {
    return {
      id: row.id,
      dayDate: row.day_date,
      isBlocked: row.is_blocked,
      isOnlineOnly: row.is_online_only,
      defaultCapacity: row.default_capacity,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}