-- Migration to add SHOPHOUSE role to existing users table
-- Run this if your database was created with the old schema

-- First, drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with SHOPHOUSE role included
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('ADMIN', 'APPLICANT', 'EMPLOYEE', 'SHOPHOUSE'));

-- Verify the constraint was added correctly
SELECT conname, contype, condef 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND contype = 'c';