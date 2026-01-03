import { query } from '../config/database';

export type BonusStatus = 'APPROVED' | 'PENDING';

export interface IEmployeeBonusEntry {
  id: string;
  employeeId: string; // ✅ الأساسي string (زي ما هو بالجدول)
  amount: number;
  currency: string;
  note: string;
  createdAtUtc: Date;
  createdByAdminId: string; // ✅ الأساسي string
  status: BonusStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** ✅ نوع خاص للـ Admin List (populated) */
export type IEmployeeBonusEntryWithUsers = Omit<
  IEmployeeBonusEntry,
  'employeeId' | 'createdByAdminId'
> & {
  employeeId: { fullName: string; email: string; employeeCode?: string } | null;
  createdByAdminId: { fullName: string; email: string } | null;
};

export class EmployeeBonusEntry {
  static async create(data: {
    employeeId: string;
    amount: number;
    currency?: string;
    note: string;
    createdByAdminId: string;
    status?: BonusStatus;
  }): Promise<IEmployeeBonusEntry> {
    const sql = `
      INSERT INTO employee_bonus_entries (
        employee_id, amount, currency, note, created_by_admin_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      data.employeeId,
      data.amount,
      data.currency || 'JOD',
      data.note,
      data.createdByAdminId,
      data.status || 'APPROVED',
    ];

    const result = await query(sql, params);
    return this.mapRowToEntry(result.rows[0]);
  }

  static async find(condition?: {
    employeeId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    amountMin?: number;
    amountMax?: number;
    search?: string;
  }): Promise<IEmployeeBonusEntry[]> {
    let sql = 'SELECT * FROM employee_bonus_entries WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (condition?.employeeId) {
      sql += ` AND employee_id = $${paramIndex++}`;
      params.push(condition.employeeId);
    }
    if (condition?.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(condition.status);
    }
    if (condition?.dateFrom) {
      sql += ` AND created_at_utc >= $${paramIndex++}`;
      params.push(condition.dateFrom);
    }
    if (condition?.dateTo) {
      sql += ` AND created_at_utc <= $${paramIndex++}`;
      params.push(condition.dateTo);
    }
    if (condition?.amountMin !== undefined) {
      sql += ` AND amount >= $${paramIndex++}`;
      params.push(condition.amountMin);
    }
    if (condition?.amountMax !== undefined) {
      sql += ` AND amount <= $${paramIndex++}`;
      params.push(condition.amountMax);
    }
    if (condition?.search) {
      sql += ` AND note ILIKE $${paramIndex++}`;
      params.push(`%${condition.search}%`);
    }

    sql += ' ORDER BY created_at_utc DESC';

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToEntry(row));
  }

  /** ✅ Admin helper: bring employee + admin info (shape matches frontend) */
  static async findWithEmployee(condition?: {
    employeeId?: string;
    status?: BonusStatus;
    search?: string;
  }): Promise<IEmployeeBonusEntryWithUsers[]> {
    let sql = `
      SELECT
        e.*,

        emp.full_name     AS emp_full_name,
        emp.email         AS emp_email,
        emp.employee_code AS emp_employee_code,

        adm.full_name     AS adm_full_name,
        adm.email         AS adm_email

      FROM employee_bonus_entries e
      LEFT JOIN users emp ON emp.id = e.employee_id
      LEFT JOIN users adm ON adm.id = e.created_by_admin_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let idx = 1;

    if (condition?.employeeId) {
      sql += ` AND e.employee_id = $${idx++}`;
      params.push(condition.employeeId);
    }

    if (condition?.status) {
      sql += ` AND e.status = $${idx++}`;
      params.push(condition.status);
    }

    if (condition?.search) {
      sql += ` AND e.note ILIKE $${idx++}`;
      params.push(`%${condition.search}%`);
    }

    sql += ' ORDER BY e.created_at_utc DESC';

    const result = await query(sql, params);

    return result.rows.map((row: any) => {
      const entry = this.mapRowToEntry(row);

      const employeeObj =
        row.emp_email != null
          ? {
              fullName: String(row.emp_full_name ?? ''),
              email: String(row.emp_email ?? ''),
              employeeCode: row.emp_employee_code != null ? String(row.emp_employee_code) : undefined,
            }
          : null;

      const adminObj =
        row.adm_email != null
          ? {
              fullName: String(row.adm_full_name ?? ''),
              email: String(row.adm_email ?? ''),
            }
          : null;

      // ✅ نرجع نوع populated بدون تعارض
      const populated: IEmployeeBonusEntryWithUsers = {
        ...entry,
        employeeId: employeeObj,
        createdByAdminId: adminObj,
      };

      return populated;
    });
  }

  /** ✅ Admin update */
  static async update(
    id: string,
    data: Partial<Pick<IEmployeeBonusEntry, 'amount' | 'currency' | 'note' | 'status'>>
  ): Promise<IEmployeeBonusEntry | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (data.amount !== undefined) {
      updates.push(`amount = $${idx++}`);
      params.push(data.amount);
    }
    if (data.currency !== undefined) {
      updates.push(`currency = $${idx++}`);
      params.push(data.currency);
    }
    if (data.note !== undefined) {
      updates.push(`note = $${idx++}`);
      params.push(data.note);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${idx++}`);
      params.push(data.status);
    }

    if (updates.length === 0) {
      const r = await query('SELECT * FROM employee_bonus_entries WHERE id = $1', [id]);
      if (r.rows.length === 0) return null;
      return this.mapRowToEntry(r.rows[0]);
    }

    params.push(id);

    const sql = `
      UPDATE employee_bonus_entries
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *
    `;

    const result = await query(sql, params);
    if (result.rows.length === 0) return null;

    return this.mapRowToEntry(result.rows[0]);
  }

  /** ✅ Admin delete */
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM employee_bonus_entries WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }

  static mapRowToEntry(row: any): IEmployeeBonusEntry {
    return {
      id: row.id,
      employeeId: row.employee_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      note: row.note,
      createdAtUtc: row.created_at_utc,
      createdByAdminId: row.created_by_admin_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
