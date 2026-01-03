import { query } from '../config/database';
import bcrypt from 'bcryptjs';

export interface IUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: 'ADMIN' | 'APPLICANT' | 'EMPLOYEE';
  language: 'ar' | 'en';
  employeeCode?: string;
  jobTitle?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EmployeeLite = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
};

export class User {
  static async findOne(condition: { email?: string; id?: string; employeeCode?: string }): Promise<IUser | null> {
    let sql = 'SELECT * FROM users WHERE ';
    const params: any[] = [];
    const conditions: string[] = [];

    if (condition.email) {
      conditions.push(`email = $${params.length + 1}`);
      params.push(condition.email);
    }
    if (condition.id) {
      conditions.push(`id = $${params.length + 1}`);
      params.push(condition.id);
    }
    if (condition.employeeCode) {
      conditions.push(`employee_code = $${params.length + 1}`);
      params.push(condition.employeeCode);
    }

    if (conditions.length === 0) return null;
    sql += conditions.join(' AND ');

    const result = await query(sql, params);
    if (result.rows.length === 0) return null;

    return this.mapRowToUser(result.rows[0]);
  }

  static async findById(id: string): Promise<IUser | null> {
    return this.findOne({ id });
  }

  static async create(data: {
    fullName: string;
    email: string;
    phone?: string;
    passwordHash: string;
    role?: 'ADMIN' | 'APPLICANT' | 'EMPLOYEE' | 'SHOPHOUSE';
    language?: 'ar' | 'en';
    employeeCode?: string;
    jobTitle?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
  }): Promise<IUser> {
    const sql = `
      INSERT INTO users (
        full_name, email, phone, password_hash, role, language,
        employee_code, job_title, is_active, is_email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const params = [
      data.fullName,
      data.email,
      data.phone || null,
      data.passwordHash,
      data.role || 'APPLICANT',
      data.language || 'ar',
      data.employeeCode || null,
      data.jobTitle || null,
      data.isActive !== undefined ? data.isActive : true,
      data.isEmailVerified !== undefined ? data.isEmailVerified : false,
    ];

    const result = await query(sql, params);
    return this.mapRowToUser(result.rows[0]);
  }

  static async update(id: string, data: Partial<IUser>): Promise<IUser> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.fullName !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      params.push(data.fullName);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      params.push(data.email);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      params.push(data.phone);
    }
    if (data.passwordHash !== undefined) {
      updates.push(`password_hash = $${paramIndex++}`);
      params.push(data.passwordHash);
    }
    if (data.role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      params.push(data.role);
    }
    if (data.language !== undefined) {
      updates.push(`language = $${paramIndex++}`);
      params.push(data.language);
    }
    if (data.employeeCode !== undefined) {
      updates.push(`employee_code = $${paramIndex++}`);
      params.push(data.employeeCode);
    }
    if (data.jobTitle !== undefined) {
      updates.push(`job_title = $${paramIndex++}`);
      params.push(data.jobTitle);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(data.isActive);
    }
    if (data.isEmailVerified !== undefined) {
      updates.push(`is_email_verified = $${paramIndex++}`);
      params.push(data.isEmailVerified);
    }
    if (data.refreshTokenHash !== undefined) {
      updates.push(`refresh_token_hash = $${paramIndex++}`);
      params.push(data.refreshTokenHash);
    }

    if (updates.length === 0) {
      const user = await this.findById(id);
      if (!user) throw new Error('User not found');
      return user;
    }

    params.push(id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(sql, params);
    if (result.rows.length === 0) throw new Error('User not found');
    return this.mapRowToUser(result.rows[0]);
  }

  static async find(condition?: { role?: string; isActive?: boolean }): Promise<IUser[]> {
    let sql = 'SELECT * FROM users';
    const params: any[] = [];
    const conditions: string[] = [];

    if (condition?.role) {
      conditions.push(`role = $${params.length + 1}`);
      params.push(condition.role);
    }
    if (condition?.isActive !== undefined) {
      conditions.push(`is_active = $${params.length + 1}`);
      params.push(condition.isActive);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToUser(row));
  }

  static async countDocuments(condition?: any): Promise<number> {
    let sql = 'SELECT COUNT(*) FROM users';
    const params: any[] = [];
    const conditions: string[] = [];

    if (condition?.role) {
      conditions.push(`role = $${params.length + 1}`);
      params.push(condition.role);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  // ✅ NEW: Get ALL employees (full IUser mapping)
  static async findEmployees(options?: { includeInactive?: boolean }): Promise<IUser[]> {
    const includeInactive = options?.includeInactive ?? true;
    if (includeInactive) {
      return this.find({ role: 'EMPLOYEE' });
    }
    return this.find({ role: 'EMPLOYEE', isActive: true });
  }

  // ✅ NEW: Lightweight list for dropdowns (Admin targets/employees)
  static async findEmployeesLite(options?: { includeInactive?: boolean }): Promise<EmployeeLite[]> {
    const includeInactive = options?.includeInactive ?? true;

    const params: any[] = ['EMPLOYEE'];
    let sql = `
      SELECT id, full_name, email, is_active
      FROM users
      WHERE role = $1
    `;

    if (!includeInactive) {
      sql += ` AND is_active = true`;
    }

    sql += ` ORDER BY full_name ASC`;

    const result = await query(sql, params);

    return (result.rows || []).map((row: any) => ({
      id: row.id,
      name: row.full_name,
      email: row.email,
      isActive: !!row.is_active,
    }));
  }

  static mapRowToUser(row: any): IUser {
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      passwordHash: row.password_hash,
      role: row.role,
      language: row.language,
      employeeCode: row.employee_code,
      jobTitle: row.job_title,
      isActive: row.is_active,
      isEmailVerified: row.is_email_verified,
      refreshTokenHash: row.refresh_token_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Helper method for password comparison
  static async comparePassword(user: IUser, candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, user.passwordHash);
  }
}
