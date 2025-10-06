-- Test script to check current database state before migration
-- Run this to see what exists in your database

-- Check if dressed_chickens table exists and its columns
SELECT
    'Checking dressed_chickens table structure...' as info;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'dressed_chickens'
ORDER BY ordinal_position;

-- Check if the new configuration tables exist
SELECT
    'Checking for new configuration tables...' as info;

SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'chicken_size_categories',
    'chicken_part_types',
    'chicken_part_standards',
    'chicken_processing_config'
);

-- Show current dressed_chickens data count
SELECT
    'Current dressed_chickens record count:' as info,
    COUNT(*) as count
FROM public.dressed_chickens;

-- Show sample of existing data (if any)
SELECT
    'Sample existing dressed_chickens data:' as info;

SELECT
    id,
    batch_id,
    size_category,
    current_count,
    status,
    processing_date
FROM public.dressed_chickens
ORDER BY processing_date DESC
LIMIT 5;

-- Migration readiness check
SELECT
    'MIGRATION READINESS CHECK' as section;

SELECT
    CASE
        WHEN EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'dressed_chickens'
            AND column_name = 'size_category_id'
        ) THEN '✅ size_category_id column exists'
        ELSE '❌ size_category_id column missing - migration needed'
    END as size_category_id_check,

    CASE
        WHEN EXISTS(
            SELECT 1 FROM pg_tables
            WHERE tablename = 'chicken_size_categories'
        ) THEN '✅ chicken_size_categories table exists'
        ELSE '❌ chicken_size_categories table missing'
    END as config_tables_check;

SELECT
    'NEXT STEPS:' as instructions;

SELECT
    '1. If size_category_id column is missing, run: migration-flexible-chicken-processing.sql' as step1,
    '2. If configuration tables are missing, ensure schema.sql was run first' as step2,
    '3. Restart your application after successful migration' as step3;