import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { sendVerificationEmail } from '../config/email';
import jwt from 'jsonwebtoken';

export const createEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fullName, email, phone, password, employeeCode, jobTitle, isActive } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    if (employeeCode) {
      const existingCode = await User.findOne({ employeeCode });
      if (existingCode) {
        res.status(400).json({ message: 'Employee code already exists' });
        return;
      }
    }

    const passwordHash = password
      ? await bcrypt.hash(password, 12)
      : await bcrypt.hash('TempPass123!', 12);

    const user = await User.create({
      fullName,
      email,
      phone,
      passwordHash,
      role: 'EMPLOYEE',
      employeeCode: employeeCode || `EMP-${Date.now()}`,
      jobTitle,
      isActive: isActive !== undefined ? isActive : true,
      isEmailVerified: false,
    });

    // Send invite email if no password provided
    if (!password) {
      const inviteToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: '7d',
      });
      try {
        await sendVerificationEmail(email, inviteToken);
      } catch (emailError) {
        console.error('Email send failed:', emailError);
      }
    }

    res.status(201).json({
      message: 'Employee created',
      employee: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        employeeCode: user.employeeCode,
        jobTitle: user.jobTitle,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployees = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, isActive } = req.query;
    const condition: any = { role: 'EMPLOYEE' };

    if (isActive !== undefined) {
      condition.isActive = isActive === 'true';
    }

    let employees = await User.find(condition);

    // Filter by search if provided
    if (search) {
      const searchLower = (search as string).toLowerCase();
      employees = employees.filter(
        (emp) =>
          emp.fullName.toLowerCase().includes(searchLower) ||
          emp.email.toLowerCase().includes(searchLower) ||
          emp.employeeCode?.toLowerCase().includes(searchLower)
      );
    }

    // Remove sensitive data
    const safeEmployees = employees.map((emp) => ({
      id: emp.id,
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      employeeCode: emp.employeeCode,
      jobTitle: emp.jobTitle,
      isActive: emp.isActive,
      createdAt: emp.createdAt,
    }));

    res.json({ employees: safeEmployees });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, employeeCode, jobTitle, isActive } = req.body;

    const employee = await User.findById(id);
    if (!employee || employee.role !== 'EMPLOYEE') {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const updates: Partial<IUser> = {};

    if (email && email !== employee.email) {
      const existing = await User.findOne({ email });
      if (existing && existing.id !== id) {
        res.status(400).json({ message: 'Email already exists' });
        return;
      }
      updates.email = email;
    }

    if (employeeCode && employeeCode !== employee.employeeCode) {
      const existing = await User.findOne({ employeeCode });
      if (existing && existing.id !== id) {
        res.status(400).json({ message: 'Employee code already exists' });
        return;
      }
      updates.employeeCode = employeeCode;
    }

    if (fullName !== undefined) updates.fullName = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (jobTitle !== undefined) updates.jobTitle = jobTitle;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await User.update(id, updates);

    res.json({
      message: 'Employee updated',
      employee: {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        employeeCode: updated.employeeCode,
        jobTitle: updated.jobTitle,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resetEmployeePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const employee = await User.findById(id);
    if (!employee || employee.role !== 'EMPLOYEE') {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const newPassword = password || 'TempPass123!';
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.update(id, { passwordHash });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

export const inviteEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const employee = await User.findById(id);
    if (!employee || employee.role !== 'EMPLOYEE') {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const inviteToken = jwt.sign({ userId: employee.id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    try {
      await sendVerificationEmail(employee.email, inviteToken);
      res.json({ message: 'Invite email sent' });
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      // Don't return 500 for email failures, just log and return success
      // since the token was generated and stored properly
      res.json({ message: 'Invite email failed to send but employee is ready for access' });
    }
  } catch (error) {
    next(error);
  }
};
