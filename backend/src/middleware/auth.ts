import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

export interface JWTPayload {
  userId?: string; // your current expected key
  id?: string;     // sometimes used
  sub?: string;    // sometimes used (JWT standard)
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

const normalizeRole = (role: unknown) => String(role || '').toUpperCase().trim();

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : undefined;

    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res
        .status(500)
        .json({ message: 'Server configuration error: JWT_SECRET not set' });
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;

    // ✅ Support multiple possible id fields
    const userId = decoded.userId || decoded.id || decoded.sub;
    if (!userId) {
      res.status(401).json({ message: 'Invalid token payload' });
      return;
    }

    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'User not found or inactive' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }
};

export const requireRole = (...roles: string[]) => {
  const allowedRoles = roles.map((r) => normalizeRole(r));

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const userRole = normalizeRole(req.user.role);

    // ✅ direct match
    if (allowedRoles.includes(userRole)) {
      next();
      return;
    }

    // ✅ keep your special EMPLOYEE/SHOPHOUSE swapping logic
    const wantsEmployee = allowedRoles.includes('EMPLOYEE');
    const wantsShopHouse = allowedRoles.includes('SHOPHOUSE');

    if (wantsEmployee && userRole === 'SHOPHOUSE') {
      next();
      return;
    }

    if (wantsShopHouse && userRole === 'EMPLOYEE') {
      next();
      return;
    }

    res.status(403).json({ message: 'Insufficient permissions' });
    return;
  };
};
