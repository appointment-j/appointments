import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/authRoutes';
import entryRoutes from './routes/entryRoutes';
import faqRoutes from './routes/faqRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import employeeRoutes from './routes/employeeRoutes';
import bonusRoutes from './routes/bonusRoutes';
import employeeBonusRoutes from './routes/employeeBonusRoutes';
import employeeDashboardRoutes from './routes/employeeDashboardRoutes';
import adminDashboardRoutes from './routes/adminDashboardRoutes';
import adminUsersRoutes from './routes/adminUsersRoutes';
import employeeTargetRoutes from './routes/employeeTargetRoutes';
import employeeOnlyTargetRoutes from './routes/employeeOnlyTargetRoutes';
import employeeDailyWorkRoutes from './routes/employeeDailyWorkRoutes';
import adminDailyWorkRoutes from './routes/adminDailyWorkRoutes';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 5000, // limit each IP to 100 requests in production, 5000 in development
});

// More permissive rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 10000, // higher limit for auth endpoints
});

app.use('/auth', authLimiter);
app.use( apiLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/entries', entryRoutes);
app.use('/faqs', faqRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/admin/employees', employeeRoutes);
app.use('/admin/bonuses', bonusRoutes);
app.use('/employee/bonuses', employeeBonusRoutes);
app.use('/employee/dashboard', employeeDashboardRoutes);
app.use('/admin', adminDashboardRoutes);
app.use('/admin', adminUsersRoutes);
app.use('/employee/targets', employeeOnlyTargetRoutes);
app.use('/admin/targets', employeeTargetRoutes);
app.use('/employee/daily-work', employeeDailyWorkRoutes);
app.use('/admin/daily-work', adminDailyWorkRoutes);


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('✅ Environment variables validated successfully');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

