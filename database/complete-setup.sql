-- =====================================================
-- BatTechno Appointments - Complete Database Setup
-- نسخ هذا الملف بالكامل والصقه في Neon SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'APPLICANT' CHECK (role IN ('ADMIN', 'APPLICANT', 'EMPLOYEE')),
    language VARCHAR(2) NOT NULL DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
    employee_code VARCHAR(100) UNIQUE,
    job_title VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    refresh_token_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_code ON users(employee_code);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- SITE ENTRIES TABLE
-- =====================================================
CREATE TABLE site_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at_utc TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_local VARCHAR(10) NOT NULL, -- YYYY-MM-DD
    hour_local INTEGER NOT NULL CHECK (hour_local >= 0 AND hour_local <= 23),
    ip VARCHAR(255) NOT NULL,
    user_agent TEXT NOT NULL,
    referrer TEXT,
    language VARCHAR(50) NOT NULL,
    is_authenticated BOOLEAN NOT NULL DEFAULT false,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_site_entries_created_at_utc ON site_entries(created_at_utc);
CREATE INDEX idx_site_entries_date_hour ON site_entries(date_local, hour_local);
CREATE INDEX idx_site_entries_user_id ON site_entries(user_id);

-- =====================================================
-- FAQs TABLE
-- =====================================================
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_ar TEXT NOT NULL,
    answer_ar TEXT NOT NULL,
    question_en TEXT NOT NULL,
    answer_en TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faqs_order ON faqs("order");
CREATE INDEX idx_faqs_is_active ON faqs(is_active);

-- =====================================================
-- APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('IN_PERSON', 'ONLINE')),
    date_local VARCHAR(10) NOT NULL, -- YYYY-MM-DD
    time_local VARCHAR(5) NOT NULL, -- HH:mm
    start_date_time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date_time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'COMPLETED', 'CANCELED', 'NO_SHOW')),
    handled_by_admin_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_user_date ON appointments(user_id, date_local);
CREATE INDEX idx_appointments_start_date_time ON appointments(start_date_time_utc);
CREATE INDEX idx_appointments_status ON appointments(status);

-- =====================================================
-- BLOCKED DAYS TABLE
-- =====================================================
CREATE TABLE blocked_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date VARCHAR(10) UNIQUE NOT NULL, -- YYYY-MM-DD
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blocked_days_date ON blocked_days(date);

-- =====================================================
-- BLOCKED TIME RANGES TABLE
-- =====================================================
CREATE TABLE blocked_time_ranges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('IN_PERSON', 'ONLINE')),
    start_time VARCHAR(5) NOT NULL, -- HH:mm
    end_time VARCHAR(5) NOT NULL, -- HH:mm
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blocked_time_ranges_mode ON blocked_time_ranges(mode);

-- =====================================================
-- TUTORIALS TABLE
-- =====================================================
CREATE TABLE tutorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    video_url TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tutorials_order ON tutorials("order");
CREATE INDEX idx_tutorials_is_active ON tutorials(is_active);

-- =====================================================
-- SURVEY FIELDS TABLE
-- =====================================================
CREATE TABLE survey_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label_ar VARCHAR(255) NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'textarea', 'select', 'number', 'date')),
    options TEXT[], -- Array for select type
    is_required BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_survey_fields_order ON survey_fields("order");
CREATE INDEX idx_survey_fields_is_active ON survey_fields(is_active);

-- =====================================================
-- SURVEY ANSWERS TABLE
-- =====================================================
CREATE TABLE survey_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES survey_fields(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_survey_answers_appointment ON survey_answers(appointment_id);
CREATE INDEX idx_survey_answers_field ON survey_answers(field_id);

-- =====================================================
-- EMPLOYEE BONUS ENTRIES TABLE
-- =====================================================
CREATE TABLE employee_bonus_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'JOD',
    note TEXT NOT NULL,
    created_at_utc TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'PENDING')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bonus_entries_employee_date ON employee_bonus_entries(employee_id, created_at_utc);
CREATE INDEX idx_bonus_entries_status ON employee_bonus_entries(status);
CREATE INDEX idx_bonus_entries_admin ON employee_bonus_entries(created_by_admin_id);

-- =====================================================
-- FUNCTION TO UPDATE updated_at TIMESTAMP
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE updated_at
-- =====================================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_entries_updated_at BEFORE UPDATE ON site_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocked_days_updated_at BEFORE UPDATE ON blocked_days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocked_time_ranges_updated_at BEFORE UPDATE ON blocked_time_ranges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutorials_updated_at BEFORE UPDATE ON tutorials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_fields_updated_at BEFORE UPDATE ON survey_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_answers_updated_at BEFORE UPDATE ON survey_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_bonus_entries_updated_at BEFORE UPDATE ON employee_bonus_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA - Sample FAQs
-- =====================================================
INSERT INTO faqs (question_ar, answer_ar, question_en, answer_en, "order", is_active) VALUES
(
    'كيف يمكنني حجز موعد؟',
    'يمكنك حجز موعد من خلال صفحة حجز المواعيد. اختر نوع الموعد (حضوري أو عن بعد)، ثم اختر التاريخ والوقت المناسبين.',
    'How can I book an appointment?',
    'You can book an appointment through the booking page. Choose the appointment type (in-person or online), then select a suitable date and time.',
    1,
    true
),
(
    'ما هي أوقات العمل؟',
    'أوقات العمل من الساعة 9 صباحاً حتى 5 مساءً، من الأحد إلى الخميس.',
    'What are the working hours?',
    'Working hours are from 9 AM to 5 PM, Sunday to Thursday.',
    2,
    true
),
(
    'كيف يمكنني إلغاء موعد؟',
    'يمكنك إلغاء موعد من خلال صفحة مواعيدي. اختر الموعد المراد إلغاؤه واضغط على زر الإلغاء.',
    'How can I cancel an appointment?',
    'You can cancel an appointment through the My Appointments page. Select the appointment you want to cancel and click the cancel button.',
    3,
    true
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- تم إنشاء قاعدة البيانات بنجاح! ✅
-- Database created successfully! ✅
-- 
-- الجداول المُنشأة:
-- - users
-- - site_entries
-- - faqs
-- - appointments
-- - blocked_days
-- - blocked_time_ranges
-- - tutorials
-- - survey_fields
-- - survey_answers
-- - employee_bonus_entries
--
-- ملاحظة: يجب إنشاء Admin User من خلال Backend Seed Script
-- لأن كلمة المرور تحتاج إلى bcrypt hashing

