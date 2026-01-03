import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { query } from '../config/database';

export interface AdminUserListQuery {
  q?: string;
  role?: string;
  isActive?: string;
  page?: string;
  limit?: string;
}

export const getUsers = async (
  req: Request<{}, {}, {}, AdminUserListQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q, role, isActive, page = '1', limit = '10' } = req.query;

    // Build SQL query with filtering and pagination
    let sql = `
      SELECT 
        id,
        full_name,
        email,
        phone,
        role,
        is_active,
        is_email_verified,
        created_at
      FROM users
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    // Add search filter (name, email, phone)
    if (q) {
      const searchParam = `%${q}%`;
      sql += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex + 1} OR phone ILIKE $${paramIndex + 2})`;
      params.push(searchParam, searchParam, searchParam);
      paramIndex += 3;
    }

    // Add role filter
    if (role && ['ADMIN', 'APPLICANT', 'EMPLOYEE'].includes(role.toUpperCase())) {
      sql += ` AND role = $${paramIndex}`;
      params.push(role.toUpperCase());
      paramIndex++;
    }

    // Add active status filter
    if (isActive !== undefined) {
      sql += ` AND is_active = $${paramIndex}`;
      params.push(isActive === 'true');
      paramIndex++;
    }

    // Add pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // max 100 per page
    const offset = (pageNum - 1) * limitNum;
    
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offset);

    // Get total count for pagination metadata
    let countSql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (q) {
      const searchParam = `%${q}%`;
      countSql += ` AND (full_name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex + 1} OR phone ILIKE $${countParamIndex + 2})`;
      countParams.push(searchParam, searchParam, searchParam);
      countParamIndex += 3;
    }

    if (role && ['ADMIN', 'APPLICANT', 'EMPLOYEE'].includes(role.toUpperCase())) {
      countSql += ` AND role = $${countParamIndex}`;
      countParams.push(role.toUpperCase());
      countParamIndex++;
    }

    if (isActive !== undefined) {
      countSql += ` AND is_active = $${countParamIndex}`;
      countParams.push(isActive === 'true');
      countParamIndex++;
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0]?.count || '0');

    const result = await query(sql, params);

    const users = result.rows.map((row: any) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      isActive: row.is_active,
      isEmailVerified: row.is_email_verified,
      createdAt: row.created_at,
    }));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (
  req: Request<{ id: string }, {}, { role: 'ADMIN' | 'APPLICANT' | 'EMPLOYEE' | 'SHOPHOUSE' }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['ADMIN', 'APPLICANT', 'EMPLOYEE'].includes(role.toUpperCase())) {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Valid roles are: ADMIN, APPLICANT, EMPLOYEE',
      });
      return;
    }

    // Get current user to check if they're trying to change their own role
    const currentUser = (req as any).user;
    if (currentUser && currentUser.id === id) {
      res.status(400).json({
        success: false,
        message: 'You cannot change your own role',
      });
      return;
    }

    // Update user role
    const updatedUser = await User.update(id, { role: role.toUpperCase() as any });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};