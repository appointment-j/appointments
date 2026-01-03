import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

const isDev = process.env.NODE_ENV === 'development';

const normalizeStatusCode = (code: any): number => {
  const n = Number(code);
  if (Number.isFinite(n) && n >= 100 && n <= 599) return n;
  return 500;
};

// Postgres codes helper
const mapPostgresError = (err: any): AppError | null => {
  const code = err?.code;

  // Table not found
  if (code === '42P01' || String(err?.message || '').includes('does not exist')) {
    return new AppError('Database table not found. Please check database configuration.', 500, {
      pgCode: code,
    });
  }

  // Connection refused / network issues
  if (code === 'ECONNREFUSED' || String(err?.message || '').toLowerCase().includes('connection')) {
    return new AppError('Database connection failed. Please check database server.', 503, {
      pgCode: code,
    });
  }

  return null;
};

// JWT helper
const mapJwtError = (err: any): AppError | null => {
  const name = err?.name;
  if (name === 'JsonWebTokenError') return new AppError('Invalid token', 401);
  if (name === 'TokenExpiredError') return new AppError('Token expired', 401);
  return null;
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // 1) If already AppError
  if (err instanceof AppError) {
    const statusCode = normalizeStatusCode(err.statusCode);

    res.status(statusCode).json({
      success: false,
      statusCode,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      ...(isDev ? { stack: err.stack } : {}),
    });
    return;
  }

  const anyErr = err as any;

  // 2) Map Postgres errors
  const pgMapped = mapPostgresError(anyErr);
  if (pgMapped) {
    res.status(pgMapped.statusCode).json({
      success: false,
      statusCode: pgMapped.statusCode,
      message: pgMapped.message,
      ...(pgMapped.details ? { details: pgMapped.details } : {}),
      ...(isDev ? { stack: pgMapped.stack } : {}),
    });
    return;
  }

  // 3) Map JWT errors
  const jwtMapped = mapJwtError(anyErr);
  if (jwtMapped) {
    res.status(jwtMapped.statusCode).json({
      success: false,
      statusCode: jwtMapped.statusCode,
      message: jwtMapped.message,
      ...(isDev ? { stack: jwtMapped.stack } : {}),
    });
    return;
  }

  // 4) Axios-like / external request errors (optional)
  if (anyErr?.isAxiosError) {
    const statusCode = normalizeStatusCode(anyErr?.response?.status || 500);
    res.status(statusCode).json({
      success: false,
      statusCode,
      message: anyErr?.message || 'Request failed',
      ...(isDev ? { details: anyErr?.response?.data, stack: anyErr?.stack } : {}),
    });
    return;
  }

  // 5) Default
  console.error('Unexpected error:', err);

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: 'Internal server error',
    ...(isDev ? { stack: err.stack } : {}),
  });
};
