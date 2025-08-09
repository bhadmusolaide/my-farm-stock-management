-- Add missing columns to live_chickens table
-- Run this in your Supabase SQL Editor

ALTER TABLE live_chickens ADD COLUMN IF NOT EXISTS mortality INTEGER DEFAULT 0;
ALTER TABLE live_chickens ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'live_chickens' 
ORDER BY ordinal_position;