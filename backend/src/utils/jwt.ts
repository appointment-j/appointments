import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorHandler';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  // Using the specific format that jsonwebtoken expects
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  } as SignOptions);
};

export const generateRefreshToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }
  
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as SignOptions);
};

export const hashRefreshToken = async (token: string): Promise<string> => {
  return bcrypt.hash(token, 10);
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }
  
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET) as JWTPayload;
};