# Quick Start Guide

## Prerequisites
- Node.js 20+ installed
- MongoDB running (or use Docker)

## 1. Backend Setup (5 minutes)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and email settings
npm run seed  # Creates admin user
npm run dev   # Starts on http://localhost:5000
```

## 2. Frontend Setup (3 minutes)

```bash
cd frontend
npm install
npm run dev   # Starts on http://localhost:5173
```

## 3. First Steps

1. **Visit the gate**: http://localhost:5173/
   - Click "Enter" to track entry
   - Navigate to home page

2. **Login as Admin**:
   - Go to http://localhost:5173/login
   - Email: `admin@battechno.com` (or your ADMIN_EMAIL)
   - Password: `Admin123!` (or your ADMIN_PASSWORD)

3. **Create an Employee**:
   - Go to `/admin/employees`
   - Click "Create New Employee"
   - Fill form and submit
   - Employee can login with their email/password

4. **Add Bonus to Employee**:
   - Go to `/admin/bonuses`
   - Select employee, enter amount and note
   - Submit

5. **Employee View**:
   - Employee logs in
   - Goes to `/employee/dashboard` to see balance
   - Goes to `/employee/bonuses` to see history

6. **Manage FAQs**:
   - Admin goes to `/admin/faqs`
   - Create/edit/delete FAQs
   - Public can view at `/faq`

7. **Book Appointment**:
   - User registers/logs in
   - Goes to `/app/appointments/book`
   - Follows 5-step wizard
   - Views appointments at `/app/appointments/my`

## Docker Alternative

```bash
# Create .env in root with all variables
docker-compose up -d
docker-compose exec backend npm run seed
# Access at http://localhost:5173
```

## Troubleshooting

**Backend won't start:**
- Check MongoDB is running
- Check .env file exists and has correct MONGODB_URI
- Check port 5000 is not in use

**Frontend won't start:**
- Check port 5173 is not in use
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

**Can't login:**
- Make sure seed script ran: `npm run seed` in backend
- Check admin credentials in .env match what you're using

**Email not sending:**
- Configure SMTP settings in .env
- For Gmail, use App Password (not regular password)
- Email sending failures won't block the app, but emails won't be sent

## Next Steps

- Configure email settings for production
- Change JWT secrets in production
- Set up proper MongoDB in production
- Configure CORS for your domain
- Set up SSL/HTTPS

