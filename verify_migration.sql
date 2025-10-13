-- ==========================================
-- VERIFICATION SCRIPT
-- ==========================================
-- Run this to verify the migration was successful
-- ==========================================

-- Check 1: Verify feed_batch_assignments table exists
SELECT 
    'feed_batch_assignments table exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'feed_batch_assignments'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL - Table does not exist'
    END as status;

-- Check 2: Verify all columns in feed_batch_assignments
SELECT 
    'feed_batch_assignments columns' as check_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'feed_batch_assignments'
ORDER BY ordinal_position;

-- Check 3: Verify auto_assigned column specifically
SELECT 
    'auto_assigned column exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'feed_batch_assignments' 
            AND column_name = 'auto_assigned'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL - Column does not exist'
    END as status;

-- Check 4: Verify feed_alerts table exists
SELECT 
    'feed_alerts table exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'feed_alerts'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL - Table does not exist'
    END as status;

-- Check 5: Verify batch_feed_summary table exists
SELECT 
    'batch_feed_summary table exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'batch_feed_summary'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL - Table does not exist'
    END as status;

-- Check 6: Verify new columns in feed_inventory
SELECT 
    'feed_inventory new columns' as check_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'feed_inventory' 
AND column_name IN ('deduct_from_balance', 'balance_deducted', 'auto_assigned', 'total_cost', 'remaining_kg', 'initial_quantity_kg')
ORDER BY column_name;

-- Check 7: Verify auto_logged column in feed_consumption
SELECT 
    'auto_logged column in feed_consumption' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'feed_consumption' 
            AND column_name = 'auto_logged'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL - Column does not exist'
    END as status;

-- Check 8: Test a simple select from feed_batch_assignments
SELECT 
    'Can query feed_batch_assignments' as check_name,
    '✅ PASS - Table is queryable' as status
FROM feed_batch_assignments
LIMIT 1;

-- If the above fails, this will show the error

-- Check 9: Verify RLS policies exist
SELECT 
    'RLS policies for feed_batch_assignments' as check_name,
    policyname,
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'feed_batch_assignments';

-- Check 10: Verify indexes exist
SELECT 
    'Indexes on feed_batch_assignments' as check_name,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'feed_batch_assignments';

-- ==========================================
-- SUMMARY
-- ==========================================
SELECT 
    '=== MIGRATION SUMMARY ===' as summary,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('feed_batch_assignments', 'feed_alerts', 'batch_feed_summary')) as new_tables_created,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feed_inventory' AND column_name IN ('deduct_from_balance', 'balance_deducted', 'auto_assigned', 'total_cost', 'remaining_kg', 'initial_quantity_kg')) as feed_inventory_columns_added,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feed_consumption' AND column_name = 'auto_logged') as feed_consumption_columns_added;

