import { query } from '../config/database';

export interface ISiteEntry {
  id: string;
  createdAtUtc: Date;
  dateLocal: string;
  hourLocal: number;
  ip: string;
  userAgent: string;
  referrer?: string;
  language: string;
  isAuthenticated: boolean;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SiteEntry {
  static async create(data: {
    createdAtUtc: Date;
    dateLocal: string;
    hourLocal: number;
    ip: string;
    userAgent: string;
    referrer?: string;
    language: string;
    isAuthenticated: boolean;
    userId?: string;
  }): Promise<ISiteEntry> {
    const sql = `
      INSERT INTO site_entries (
        created_at_utc, date_local, hour_local, ip, user_agent,
        referrer, language, is_authenticated, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const params = [
      data.createdAtUtc,
      data.dateLocal,
      data.hourLocal,
      data.ip,
      data.userAgent,
      data.referrer || null,
      data.language,
      data.isAuthenticated,
      data.userId || null,
    ];

    const result = await query(sql, params);
    return this.mapRowToEntry(result.rows[0]);
  }

  static async find(condition?: {
    dateFrom?: string;
    dateTo?: string;
    hourFrom?: number;
    hourTo?: number;
    language?: string;
    isAuthenticated?: boolean;
    userId?: string;
  }): Promise<ISiteEntry[]> {
    let sql = 'SELECT * FROM site_entries WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (condition?.dateFrom) {
      sql += ` AND date_local >= $${paramIndex++}`;
      params.push(condition.dateFrom);
    }
    if (condition?.dateTo) {
      sql += ` AND date_local <= $${paramIndex++}`;
      params.push(condition.dateTo);
    }
    if (condition?.hourFrom !== undefined) {
      sql += ` AND hour_local >= $${paramIndex++}`;
      params.push(condition.hourFrom);
    }
    if (condition?.hourTo !== undefined) {
      sql += ` AND hour_local <= $${paramIndex++}`;
      params.push(condition.hourTo);
    }
    if (condition?.language) {
      sql += ` AND language = $${paramIndex++}`;
      params.push(condition.language);
    }
    if (condition?.isAuthenticated !== undefined) {
      sql += ` AND is_authenticated = $${paramIndex++}`;
      params.push(condition.isAuthenticated);
    }
    if (condition?.userId) {
      sql += ` AND user_id = $${paramIndex++}`;
      params.push(condition.userId);
    }

    sql += ' ORDER BY created_at_utc DESC';

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToEntry(row));
  }

  static async countDocuments(condition?: any): Promise<number> {
    let sql = 'SELECT COUNT(*) FROM site_entries WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (condition?.dateFrom) {
      sql += ` AND date_local >= $${paramIndex++}`;
      params.push(condition.dateFrom);
    }
    if (condition?.dateTo) {
      sql += ` AND date_local <= $${paramIndex++}`;
      params.push(condition.dateTo);
    }
    if (condition?.hourFrom !== undefined) {
      sql += ` AND hour_local >= $${paramIndex++}`;
      params.push(condition.hourFrom);
    }
    if (condition?.hourTo !== undefined) {
      sql += ` AND hour_local <= $${paramIndex++}`;
      params.push(condition.hourTo);
    }
    if (condition?.language) {
      sql += ` AND language = $${paramIndex++}`;
      params.push(condition.language);
    }
    if (condition?.isAuthenticated !== undefined) {
      sql += ` AND is_authenticated = $${paramIndex++}`;
      params.push(condition.isAuthenticated);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  static mapRowToEntry(row: any): ISiteEntry {
    return {
      id: row.id,
      createdAtUtc: row.created_at_utc,
      dateLocal: row.date_local,
      hourLocal: row.hour_local,
      ip: row.ip,
      userAgent: row.user_agent,
      referrer: row.referrer,
      language: row.language,
      isAuthenticated: row.is_authenticated,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
