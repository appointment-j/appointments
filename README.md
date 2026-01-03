# BatTechno Appointments Platform

A complete, production-ready appointment booking system with employee bonus management, FAQ system, and entry tracking.

## Features

- **Appointment Booking**: Book in-person or online appointments with a step-by-step wizard
- **Entry Gate Tracking**: Track site entries with detailed analytics
- **FAQ Management**: Admin-controlled FAQs with search and accordion display
- **Employee Bonus System**: Complete bonus/wallet/ledger system for employees
- **Multi-language Support**: Arabic (RTL) and English (LTR) with react-i18next
- **Role-based Access**: ADMIN, APPLICANT, and EMPLOYEE roles
- **Screen-based UI**: No scrolling pages - everything fits in viewport
- **Modern Design**: Orange + Gray theme with Framer Motion animations

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT authentication with refresh tokens (httpOnly cookies)
- Zod validation
- Nodemailer for emails

### Frontend
- React + Vite + TypeScript
- TailwindCSS
- Framer Motion
- react-hook-form + Zod
- react-i18next (Arabic RTL + English LTR)
- Axios with interceptors

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/          # Database, email config
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth, error handling
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── scripts/         # Seed scripts
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utilities (JWT, timezone)
│   │   └── server.ts        # Express server
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # Auth context
│   │   ├── i18n/            # Translations
│   │   ├── layouts/         # Layout components
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utilities (API, design tokens)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml
```

## Setup Instructions

### Prerequisites
- Node.js 20+
- MongoDB (or use Docker)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your values:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/battechno-appointments
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@battechno.com

ADMIN_EMAIL=admin@battechno.com
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=Admin User

FRONTEND_URL=http://localhost:5173
```

5. Run seed script to create admin user:
```bash
npm run seed
```

6. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Docker Setup

1. Create `.env` file in root directory with all required variables (see Backend Setup)

2. Start all services:
```bash
docker-compose up -d
```

3. Seed the database (run once):
```bash
docker-compose exec backend npm run seed
```

4. Access:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000
   - MongoDB: localhost:27017

## Default Admin Login

After running seed script:
- Email: `admin@battechno.com` (or as set in ADMIN_EMAIL)
- Password: `Admin123!` (or as set in ADMIN_PASSWORD)

## API Endpoints

### Public
- `POST /api/v1/entries` - Track site entry
- `GET /api/v1/faqs` - Get active FAQs
- `GET /api/v1/appointments/slots` - Get available slots

### Auth
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/verify-email` - Verify email
- `POST /api/v1/auth/forgot-password` - Forgot password
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/me` - Get current user

### Appointments (Protected)
- `POST /api/v1/appointments` - Book appointment
- `GET /api/v1/appointments/my` - Get my appointments
- `POST /api/v1/appointments/:id/cancel` - Cancel appointment
- `POST /api/v1/appointments/:id/reschedule` - Reschedule appointment

### Admin
- `GET /api/v1/appointments/admin` - Get all appointments
- `PATCH /api/v1/appointments/admin/:id` - Update appointment status
- `GET /api/v1/entries` - Get entries with filters
- `GET /api/v1/faqs/admin` - Get all FAQs
- `POST /api/v1/faqs` - Create FAQ
- `PATCH /api/v1/faqs/:id` - Update FAQ
- `DELETE /api/v1/faqs/:id` - Delete FAQ
- `POST /api/v1/faqs/reorder` - Reorder FAQs
- `GET /api/v1/admin/employees` - Get employees
- `POST /api/v1/admin/employees` - Create employee
- `PATCH /api/v1/admin/employees/:id` - Update employee
- `POST /api/v1/admin/employees/:id/invite` - Invite employee
- `POST /api/v1/admin/employees/:id/reset-password` - Reset password
- `POST /api/v1/admin/bonuses` - Add bonus
- `GET /api/v1/admin/bonuses` - Get bonus ledger
- `GET /api/v1/admin/bonuses/stats` - Get bonus stats

### Employee
- `GET /api/v1/employee/bonuses/me` - Get my bonuses

## Features Guide

### Entry Gate Tracking

1. Visit `/` - Gate screen appears
2. Click "Enter" - Entry is tracked via `POST /api/v1/entries`
3. Session storage set: `bt_gate_passed=1`
4. Navigate to `/home`

**Admin View** (`/admin/entries`):
- View hourly/daily statistics
- Filter by date, hour, language, authentication status
- View detailed entry list with pagination

### FAQ Management

**Public View** (`/faq`):
- Search FAQs
- Accordion display (expand/collapse)
- "Read more" modal for long answers

**Admin View** (`/admin/faqs`):
- Create/Edit/Delete FAQs
- Toggle active/inactive
- Reorder FAQs (drag-drop or buttons)
- Split view: list on left, form on right

### Employee Bonus System

**Admin** (`/admin/employees`):
- Create employees with email, phone, employee code
- Edit employee details
- Send invite emails
- Reset passwords
- Activate/Deactivate employees

**Admin** (`/admin/bonuses`):
- Add bonus to employee (amount + note)
- View complete ledger with filters
- View statistics and reports

**Employee** (`/employee/dashboard`):
- View current balance
- View this month total
- View last bonus details

**Employee** (`/employee/bonuses`):
- View complete bonus history
- Search by note
- Filter by date
- "Read more" modal for long notes

### Appointment Booking

1. **Step 1**: Choose mode (IN_PERSON or ONLINE)
2. **Step 2**: Choose date (calendar picker)
3. **Step 3**: Choose time (available slots shown)
4. **Step 4**: Add optional note
5. **Step 5**: Confirm booking

**Features**:
- Blocked days prevent booking
- Blocked time ranges per mode
- Email confirmations sent
- Reschedule and cancel options

## Design System

### Colors
- Primary Orange: `#F57C00`
- Soft Orange: `#FFB74D`
- Background Dark: `#0F1115`
- Background Light: `#F6F7F9`
- Gray Text: `#9AA3AF`
- Surface Dark: `#171A21`
- Surface Light: `#FFFFFF`

### Components
- `ScreenContainer`: Prevents page scroll, sets viewport height
- `Panel`: Internal scroll area for content
- `Button`: Primary, Secondary, Ghost variants
- `Input`: Text, email, password, textarea support
- `Card`: Rounded-2xl with hover effects

### Animations
- Fade in/out
- Slide transitions
- Card hover lift (y: -2)
- Button hover scale (1.02)
- Modal scale + fade

## Timezone

Default timezone: **Asia/Amman**
- All dates stored in UTC
- Displayed in local time (Asia/Amman)
- Entry tracking uses local date/hour

## Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed database
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## Environment Variables

See `.env.example` files in backend and frontend directories for all required variables.

## License

MIT

## Support

For issues and questions, please open an issue on the repository.

