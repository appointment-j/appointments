import { query } from '../config/database';

export interface IAppointment {
  id: string;
  userId: string;
  mode: 'IN_PERSON' | 'ONLINE';
  dateLocal: string;
  timeLocal: string;
  startDateTimeUtc: Date;
  endDateTimeUtc: Date;
  note?: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
  handledByAdminName?: string;
  surveyResponseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Appointment {
  static async find(condition?: {
    userId?: string;
    status?: string;
    dateLocal?: { $gte?: string; $lte?: string };
  }): Promise<IAppointment[]> {
    let sql = 'SELECT * FROM appointments WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (condition?.userId) {
      sql += ` AND user_id = $${paramIndex++}`;
      params.push(condition.userId);
    }
    if (condition?.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(condition.status);
    }
    if (condition?.dateLocal) {
      if (condition.dateLocal.$gte) {
        sql += ` AND date_local >= $${paramIndex++}`;
        params.push(condition.dateLocal.$gte);
      }
      if (condition.dateLocal.$lte) {
        sql += ` AND date_local <= $${paramIndex++}`;
        params.push(condition.dateLocal.$lte);
      }
    }

    sql += ' ORDER BY start_date_time_utc DESC';

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToAppointment(row));
  }

  static async findOne(condition: {
    dateLocal?: string;
    timeLocal?: string;
    status?: string;
    userId?: string;
    id?: string;
  }): Promise<IAppointment | null> {
    let sql = 'SELECT * FROM appointments WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (condition.dateLocal) {
      sql += ` AND date_local = $${paramIndex++}`;
      params.push(condition.dateLocal);
    }
    if (condition.timeLocal) {
      sql += ` AND time_local = $${paramIndex++}`;
      params.push(condition.timeLocal);
    }
    if (condition.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(condition.status);
    }
    if (condition.userId) {
      sql += ` AND user_id = $${paramIndex++}`;
      params.push(condition.userId);
    }
    if (condition.id) {
      sql += ` AND id = $${paramIndex++}`;
      params.push(condition.id);
    }

    const result = await query(sql, params);
    if (result.rows.length === 0) return null;
    return this.mapRowToAppointment(result.rows[0]);
  }

  static async findById(id: string): Promise<IAppointment | null> {
    return this.findOne({ id });
  }

  static async create(data: {
    userId: string;
    mode: 'IN_PERSON' | 'ONLINE';
    dateLocal: string;
    timeLocal: string;
    startDateTimeUtc: Date;
    endDateTimeUtc: Date;
    note?: string;
    status?: 'UPCOMING' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
    surveyResponseId?: string;
  }): Promise<IAppointment> {
    const sql = `
      INSERT INTO appointments (
        user_id, mode, date_local, time_local, start_date_time_utc,
        end_date_time_utc, note, status, survey_response_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const params = [
      data.userId,
      data.mode,
      data.dateLocal,
      data.timeLocal,
      data.startDateTimeUtc,
      data.endDateTimeUtc,
      data.note || null,
      data.status || 'UPCOMING',
      data.surveyResponseId || null,
    ];

    const result = await query(sql, params);
    return this.mapRowToAppointment(result.rows[0]);
  }

  static async update(id: string, data: Partial<IAppointment>): Promise<IAppointment> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    if (data.handledByAdminName !== undefined) {
      updates.push(`handled_by_admin_name = $${paramIndex++}`);
      params.push(data.handledByAdminName);
    }
    if (data.dateLocal !== undefined) {
      updates.push(`date_local = $${paramIndex++}`);
      params.push(data.dateLocal);
    }
    if (data.timeLocal !== undefined) {
      updates.push(`time_local = $${paramIndex++}`);
      params.push(data.timeLocal);
    }
    if (data.startDateTimeUtc !== undefined) {
      updates.push(`start_date_time_utc = $${paramIndex++}`);
      params.push(data.startDateTimeUtc);
    }
    if (data.endDateTimeUtc !== undefined) {
      updates.push(`end_date_time_utc = $${paramIndex++}`);
      params.push(data.endDateTimeUtc);
    }
    if (data.note !== undefined) {
      updates.push(`note = $${paramIndex++}`);
      params.push(data.note);
    }
    if (data.surveyResponseId !== undefined) {
      updates.push(`survey_response_id = $${paramIndex++}`);
      params.push(data.surveyResponseId);
    }

    if (updates.length === 0) {
      const appointment = await this.findById(id);
      if (!appointment) throw new Error('Appointment not found');
      return appointment;
    }

    params.push(id);
    const sql = `UPDATE appointments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(sql, params);
    if (result.rows.length === 0) throw new Error('Appointment not found');
    return this.mapRowToAppointment(result.rows[0]);
  }

  static mapRowToAppointment(row: any): IAppointment {
    return {
      id: row.id,
      userId: row.user_id,
      mode: row.mode,
      dateLocal: row.date_local,
      timeLocal: row.time_local,
      startDateTimeUtc: row.start_date_time_utc,
      endDateTimeUtc: row.end_date_time_utc,
      note: row.note,
      status: row.status,
      handledByAdminName: row.handled_by_admin_name,
      surveyResponseId: row.survey_response_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
