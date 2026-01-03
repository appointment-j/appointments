-- BatTechno Appointments Database Schema for PostgreSQL (Neon)
-- Run this script in Neon SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
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

-- Site Entries Table
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

-- FAQs Table
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

-- Appointments Table
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

-- Blocked Days Table
CREATE TABLE blocked_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date VARCHAR(10) UNIQUE NOT NULL, -- YYYY-MM-DD
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blocked_days_date ON blocked_days(date);

-- Blocked Time Ranges Table
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

-- Tutorials Table
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

-- Survey Fields Table
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

-- Survey Answers Table
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

-- Employee Bonus Entries Table
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

-- Employee Notifications Table
CREATE TABLE employee_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('BONUS', 'TARGET_CREATED')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    related_bonus_entry_id UUID REFERENCES employee_bonus_entries(id) ON DELETE SET NULL,
    related_target_id UUID REFERENCES employee_targets(id) ON DELETE SET NULL,
    created_at_utc TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_employee_id ON employee_notifications(employee_id);
CREATE INDEX idx_notifications_is_read ON employee_notifications(is_read);
CREATE INDEX idx_notifications_type ON employee_notifications(type);
CREATE INDEX idx_notifications_bonus_entry_id ON employee_notifications(related_bonus_entry_id);
CREATE INDEX idx_notifications_target_id ON employee_notifications(related_target_id);

-- Employee Targets Table
CREATE TABLE employee_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_value DECIMAL(10, 2) NOT NULL,
    current_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'EXPIRED')),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_targets_employee_id ON employee_targets(employee_id);
CREATE INDEX idx_employee_targets_month ON employee_targets(month);
CREATE INDEX idx_employee_targets_status ON employee_targets(status);
CREATE INDEX idx_employee_targets_end_date ON employee_targets(end_date);

-- Survey Responses Table
CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    age INTEGER,
    social_status VARCHAR(50),
    phone VARCHAR(50) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    national_id VARCHAR(50),
    passport_id VARCHAR(50),
    region VARCHAR(255),
    major VARCHAR(255),
    university VARCHAR(255),
    heard_from VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_survey_responses_phone ON survey_responses(phone);
CREATE INDEX idx_survey_responses_created_at ON survey_responses(created_at);

-- Appointment Slots Table
CREATE TABLE appointment_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    capacity INTEGER NOT NULL DEFAULT 3,
    allow_online BOOLEAN NOT NULL DEFAULT true,
    allow_in_person BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointment_slots_start_at ON appointment_slots(start_at);
CREATE INDEX idx_appointment_slots_end_at ON appointment_slots(end_at);
CREATE INDEX idx_appointment_slots_active ON appointment_slots(is_active);

-- Appointments Table (updated to reference survey_responses)
-- Add foreign key to survey_responses
ALTER TABLE appointments ADD COLUMN survey_response_id UUID REFERENCES survey_responses(id) ON DELETE SET NULL;

-- Admin Control Tables
-- Appointment Day Rules Table
CREATE TABLE appointment_day_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_date DATE UNIQUE NOT NULL,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    is_online_only BOOLEAN NOT NULL DEFAULT false,
    default_capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointment_day_rules_date ON appointment_day_rules(day_date);

-- Appointment Slot Rules Table
CREATE TABLE appointment_slot_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID UNIQUE REFERENCES appointment_slots(id) ON DELETE CASCADE,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    is_online_only BOOLEAN NOT NULL DEFAULT false,
    capacity INTEGER,
    allow_online BOOLEAN,
    allow_in_person BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointment_slot_rules_slot ON appointment_slot_rules(slot_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
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

CREATE TRIGGER update_employee_notifications_updated_at BEFORE UPDATE ON employee_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_targets_updated_at BEFORE UPDATE ON employee_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_responses_updated_at BEFORE UPDATE ON survey_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_slots_updated_at BEFORE UPDATE ON appointment_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_day_rules_updated_at BEFORE UPDATE ON appointment_day_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_slot_rules_updated_at BEFORE UPDATE ON appointment_slot_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Daily Work Logs Table
CREATE TABLE daily_work_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL, -- YYYY-MM-DD
    title VARCHAR(255),
    description TEXT NOT NULL,

    admin_note TEXT,
    is_reviewed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_work_logs_employee_id ON daily_work_logs(employee_id);
CREATE INDEX idx_daily_work_logs_date ON daily_work_logs(date);
CREATE INDEX idx_daily_work_logs_is_reviewed ON daily_work_logs(is_reviewed);

CREATE TRIGGER update_daily_work_logs_updated_at BEFORE UPDATE ON daily_work_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

