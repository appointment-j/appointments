import { query } from '../config/database';

export interface IBlockedDay {
  id: string;
  date: string;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BlockedDay {
  static async findOne(condition: { date?: string }): Promise<IBlockedDay | null> {
    if (!condition.date) return null;
    const result = await query('SELECT * FROM blocked_days WHERE date = $1', [condition.date]);
    if (result.rows.length === 0) return null;
    return this.mapRowToBlockedDay(result.rows[0]);
  }

  static mapRowToBlockedDay(row: any): IBlockedDay {
    return {
      id: row.id,
      date: row.date,
      reason: row.reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
