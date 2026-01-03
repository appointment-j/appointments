import { query } from '../config/database';

export interface IAppointmentSlotRule {
  id: string;
  slotId: string;
  isBlocked: boolean;
  isOnlineOnly: boolean;
  capacity: number | null;
  allowOnline: boolean | null;
  allowInPerson: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AppointmentSlotRule {
  static async find(condition?: {
    slotId?: string;
  }): Promise<IAppointmentSlotRule[]> {
    let sql = 'SELECT * FROM appointment_slot_rules WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (condition?.slotId) {
      sql += ` AND slot_id = $${paramIndex++}`;
      params.push(condition.slotId);
    }

    sql += ' ORDER BY created_at ASC';

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToAppointmentSlotRule(row));
  }

  static async findOne(condition: { slotId: string }): Promise<IAppointmentSlotRule | null> {
    const sql = 'SELECT * FROM appointment_slot_rules WHERE slot_id = $1';
    const result = await query(sql, [condition.slotId]);
    if (result.rows.length === 0) return null;
    return this.mapRowToAppointmentSlotRule(result.rows[0]);
  }

  static async upsert(data: {
    slotId: string;
    isBlocked?: boolean;
    isOnlineOnly?: boolean;
    capacity?: number | null;
    allowOnline?: boolean | null;
    allowInPerson?: boolean | null;
  }): Promise<IAppointmentSlotRule> {
    const sql = `
      INSERT INTO appointment_slot_rules (
        slot_id, is_blocked, is_online_only, capacity, allow_online, allow_in_person
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (slot_id) 
      DO UPDATE SET 
        is_blocked = EXCLUDED.is_blocked,
        is_online_only = EXCLUDED.is_online_only,
        capacity = EXCLUDED.capacity,
        allow_online = EXCLUDED.allow_online,
        allow_in_person = EXCLUDED.allow_in_person
      RETURNING *
    `;
    const result = await query(sql, [
      data.slotId,
      data.isBlocked ?? false,
      data.isOnlineOnly ?? false,
      data.capacity ?? null,
      data.allowOnline ?? null,
      data.allowInPerson ?? null,
    ]);
    return this.mapRowToAppointmentSlotRule(result.rows[0]);
  }

  static async deleteBySlotId(slotId: string): Promise<void> {
    const sql = 'DELETE FROM appointment_slot_rules WHERE slot_id = $1';
    await query(sql, [slotId]);
  }

  static mapRowToAppointmentSlotRule(row: any): IAppointmentSlotRule {
    return {
      id: row.id,
      slotId: row.slot_id,
      isBlocked: row.is_blocked,
      isOnlineOnly: row.is_online_only,
      capacity: row.capacity,
      allowOnline: row.allow_online,
      allowInPerson: row.allow_in_person,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}