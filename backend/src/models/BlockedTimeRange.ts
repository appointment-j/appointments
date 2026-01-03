import { query } from '../config/database';

export interface IBlockedTimeRange {
  id: string;
  mode: 'IN_PERSON' | 'ONLINE';
  startTime: string;
  endTime: string;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BlockedTimeRange {
  static async find(condition?: { mode?: 'IN_PERSON' | 'ONLINE' }): Promise<IBlockedTimeRange[]> {
    let sql = 'SELECT * FROM blocked_time_ranges WHERE 1=1';
    const params: any[] = [];

    if (condition?.mode) {
      sql += ' AND mode = $1';
      params.push(condition.mode);
    }

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToBlockedTimeRange(row));
  }

  static mapRowToBlockedTimeRange(row: any): IBlockedTimeRange {
    return {
      id: row.id,
      mode: row.mode,
      startTime: row.start_time,
      endTime: row.end_time,
      reason: row.reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
