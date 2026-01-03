import { query } from '../config/database';

export interface IAppointmentSlot {
  id: string;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  capacity: number;
  allowOnline: boolean;
  allowInPerson: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AppointmentSlot {
  static async find(condition?: {
    date?: string;
    isActive?: boolean;
    from?: string;
    to?: string;
  }): Promise<IAppointmentSlot[]> {
    let sql = 'SELECT * FROM appointment_slots WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (condition?.date) {
      sql += ` AND DATE(start_at) = $${paramIndex++}`;
      params.push(condition.date);
    }
    
    if (condition?.isActive !== undefined) {
      sql += ` AND is_active = $${paramIndex++}`;
      params.push(condition.isActive);
    }
    
    if (condition?.from) {
      sql += ` AND start_at >= $${paramIndex++}`;
      params.push(condition.from);
    }
    
    if (condition?.to) {
      sql += ` AND start_at <= $${paramIndex++}`;
      params.push(condition.to);
    }

    sql += ' ORDER BY start_at ASC';

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToAppointmentSlot(row));
  }

  static async findById(id: string): Promise<IAppointmentSlot | null> {
    const sql = 'SELECT * FROM appointment_slots WHERE id = $1';
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToAppointmentSlot(result.rows[0]);
  }

  static async create(data: {
    startAt: Date;
    endAt: Date;
    isActive?: boolean;
    capacity?: number;
    allowOnline?: boolean;
    allowInPerson?: boolean;
  }): Promise<IAppointmentSlot> {
    const sql = `
      INSERT INTO appointment_slots (
        start_at, end_at, is_active, capacity, allow_online, allow_in_person
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await query(sql, [
      data.startAt,
      data.endAt,
      data.isActive ?? true,
      data.capacity ?? 3,
      data.allowOnline ?? true,
      data.allowInPerson ?? true,
    ]);
    return this.mapRowToAppointmentSlot(result.rows[0]);
  }

  static async update(id: string, data: Partial<IAppointmentSlot>): Promise<IAppointmentSlot> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(data.isActive);
    }
    if (data.capacity !== undefined) {
      updates.push(`capacity = $${paramIndex++}`);
      params.push(data.capacity);
    }
    if (data.allowOnline !== undefined) {
      updates.push(`allow_online = $${paramIndex++}`);
      params.push(data.allowOnline);
    }
    if (data.allowInPerson !== undefined) {
      updates.push(`allow_in_person = $${paramIndex++}`);
      params.push(data.allowInPerson);
    }

    if (updates.length === 0) {
      const slot = await this.findById(id);
      if (!slot) throw new Error('Appointment slot not found');
      return slot;
    }

    params.push(id);
    const sql = `UPDATE appointment_slots SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(sql, params);
    if (result.rows.length === 0) throw new Error('Appointment slot not found');
    return this.mapRowToAppointmentSlot(result.rows[0]);
  }

  static mapRowToAppointmentSlot(row: any): IAppointmentSlot {
    return {
      id: row.id,
      startAt: row.start_at,
      endAt: row.end_at,
      isActive: row.is_active,
      capacity: row.capacity,
      allowOnline: row.allow_online,
      allowInPerson: row.allow_in_person,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}