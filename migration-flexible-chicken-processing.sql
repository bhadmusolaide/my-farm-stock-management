/*
==========================================
FLEXIBLE CHICKEN PROCESSING SYSTEM MIGRATION
==========================================

This migration script sets up the new flexible chicken processing system
and migrates existing data to work with the enhanced structure.

RUN ORDER:
1. First, run the main schema.sql file to create all tables
2. Then run this migration script to:
   - Set up default configuration data
   - Migrate existing dressed_chickens records
   - Create default part standards

SAFETY:
- This script is designed to be safe for existing databases
- It only adds new data and updates existing records where needed
- No existing data will be lost

ROLLBACK:
If you need to rollback, you can:
1. Drop the new configuration tables
2. Restore dressed_chickens table from backup
3. Remove the new columns from dressed_chickens table
*/

-- ==========================================
-- STEP 1: INSERT DEFAULT CONFIGURATION DATA
-- ==========================================

-- Insert default size categories (only if they don't exist)
INSERT INTO public.chicken_size_categories (id, name, description, min_weight, max_weight, sort_order, is_active)
SELECT 'small', 'Small', 'Small sized chickens under 1.2kg', 0.8, 1.2, 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_size_categories WHERE name = 'Small');

INSERT INTO public.chicken_size_categories (id, name, description, min_weight, max_weight, sort_order, is_active)
SELECT 'medium', 'Medium', 'Medium sized chickens 1.2-1.8kg', 1.2, 1.8, 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_size_categories WHERE name = 'Medium');

INSERT INTO public.chicken_size_categories (id, name, description, min_weight, max_weight, sort_order, is_active)
SELECT 'large', 'Large', 'Large sized chickens 1.8-2.5kg', 1.8, 2.5, 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_size_categories WHERE name = 'Large');

INSERT INTO public.chicken_size_categories (id, name, description, min_weight, max_weight, sort_order, is_active)
SELECT 'extra-large', 'Extra Large', 'Extra large chickens over 2.5kg', 2.5, 10.0, 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_size_categories WHERE name = 'Extra Large');

-- Insert default part types (only if they don't exist)
INSERT INTO public.chicken_part_types (id, name, description, default_count_per_bird, unit_of_measure, sort_order, is_active)
SELECT 'neck', 'Neck', 'Chicken neck portion', 1, 'count', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_part_types WHERE name = 'Neck');

INSERT INTO public.chicken_part_types (id, name, description, default_count_per_bird, unit_of_measure, sort_order, is_active)
SELECT 'feet', 'Feet', 'Chicken feet (2 per bird)', 2, 'count', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_part_types WHERE name = 'Feet');

INSERT INTO public.chicken_part_types (id, name, description, default_count_per_bird, unit_of_measure, sort_order, is_active)
SELECT 'gizzard', 'Gizzard', 'Chicken gizzard', 1, 'count', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_part_types WHERE name = 'Gizzard');

INSERT INTO public.chicken_part_types (id, name, description, default_count_per_bird, unit_of_measure, sort_order, is_active)
SELECT 'liver', 'Liver', 'Chicken liver', 1, 'count', 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_part_types WHERE name = 'Liver');

INSERT INTO public.chicken_part_types (id, name, description, default_count_per_bird, unit_of_measure, sort_order, is_active)
SELECT 'dog_food', 'Dog Food', 'Head and liver mix for dog food', 1, 'count', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_part_types WHERE name = 'Dog Food');

-- Insert default processing configuration (only if it doesn't exist)
INSERT INTO public.chicken_processing_config (
    id, config_name, config_type, default_size_category_id,
    auto_calculate_parts, allow_part_editing, require_weight_validation,
    config_data, is_active
)
SELECT
    'default_global_config',
    'Default Global Configuration',
    'global',
    (SELECT id FROM public.chicken_size_categories WHERE name = 'Medium' LIMIT 1),
    false,
    true,
    false,
    '{"allow_custom_size_categories": true, "default_processing_method": "standard"}'::jsonb,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.chicken_processing_config
    WHERE config_name = 'Default Global Configuration'
);

-- ==========================================
-- STEP 2: CREATE DEFAULT PART STANDARDS
-- ==========================================

-- Create default part standards for existing data (if they don't exist)
INSERT INTO public.chicken_part_standards (
    id, breed, size_category_id, part_type_id, standard_weight_kg,
    weight_variance_percent, sample_size, measured_by, measurement_date,
    notes, is_active
)
SELECT
    'default_' || sc.name || '_' || pt.name || '_standard',
    'Broiler', -- Default breed for existing data
    sc.id,
    pt.id,
    CASE
        WHEN pt.name = 'Neck' THEN 0.150
        WHEN pt.name = 'Feet' THEN 0.100
        WHEN pt.name = 'Gizzard' THEN 0.050
        WHEN pt.name = 'Liver' THEN 0.040
        WHEN pt.name = 'Dog Food' THEN 0.300
        ELSE 0.100
    END,
    15, -- Default 15% variance
    50, -- Default sample size
    'Migration Script',
    CURRENT_DATE,
    'Auto-generated from existing hardcoded values',
    true
FROM public.chicken_size_categories sc
CROSS JOIN public.chicken_part_types pt
WHERE NOT EXISTS (
    SELECT 1 FROM public.chicken_part_standards cps
    WHERE cps.breed = 'Broiler'
    AND cps.size_category_id = sc.id
    AND cps.part_type_id = pt.id
);

-- ==========================================
-- STEP 3: MIGRATE EXISTING DRESSED CHICKENS
-- ==========================================

-- First, add the new columns to existing dressed_chickens table (if they don't exist)
ALTER TABLE public.dressed_chickens
ADD COLUMN IF NOT EXISTS size_category_id TEXT,
ADD COLUMN IF NOT EXISTS size_category_custom TEXT,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing dressed_chickens to use size_category_id instead of size_category text
UPDATE public.dressed_chickens
SET
    size_category_id = (
        SELECT id FROM public.chicken_size_categories
        WHERE name = dressed_chickens.size_category
        LIMIT 1
    ),
    size_category_custom = COALESCE(dressed_chickens.size_category, 'Medium')
WHERE size_category IS NOT NULL
AND (size_category_id IS NULL OR size_category_id = '');

-- Add created_by field to existing dressed_chickens records (set to admin user if exists)
UPDATE public.dressed_chickens
SET created_by = (
    SELECT id FROM auth.users
    WHERE email = 'admin@farmstock.com'
    LIMIT 1
)
WHERE created_by IS NULL;

-- ==========================================
-- STEP 4: CREATE MISSING INDEXES
-- ==========================================

-- Create indexes for new configuration tables
CREATE INDEX IF NOT EXISTS idx_chicken_size_categories_active ON public.chicken_size_categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_chicken_size_categories_name ON public.chicken_size_categories(name);
CREATE INDEX IF NOT EXISTS idx_chicken_part_types_active ON public.chicken_part_types(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_chicken_part_types_name ON public.chicken_part_types(name);
CREATE INDEX IF NOT EXISTS idx_chicken_part_standards_breed ON public.chicken_part_standards(breed);
CREATE INDEX IF NOT EXISTS idx_chicken_part_standards_breed_size ON public.chicken_part_standards(breed, size_category_id);
CREATE INDEX IF NOT EXISTS idx_chicken_part_standards_part_type ON public.chicken_part_standards(part_type_id);
CREATE INDEX IF NOT EXISTS idx_chicken_part_standards_active ON public.chicken_part_standards(is_active);
CREATE INDEX IF NOT EXISTS idx_chicken_processing_config_type ON public.chicken_processing_config(config_type);
CREATE INDEX IF NOT EXISTS idx_chicken_processing_config_breed ON public.chicken_processing_config(breed);
CREATE INDEX IF NOT EXISTS idx_chicken_processing_config_active ON public.chicken_processing_config(is_active);

-- Create enhanced indexes for dressed_chickens table
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_size_category_id ON public.dressed_chickens(size_category_id);
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_size_category_custom ON public.dressed_chickens(size_category_custom);
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_created_by ON public.dressed_chickens(created_by);

-- ==========================================
-- STEP 5: ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS for the new tables
ALTER TABLE public.chicken_size_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicken_part_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicken_part_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicken_processing_config ENABLE ROW LEVEL SECURITY;

-- Apply standard RLS policies to the new tables
CREATE OR REPLACE FUNCTION create_standard_rls_policies(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.%I', table_name);

    -- Create standard policies
    EXECUTE format('CREATE POLICY "Enable read access for all users" ON public.%I FOR SELECT USING (true)', table_name);
    EXECUTE format('CREATE POLICY "Enable insert for authenticated users only" ON public.%I FOR INSERT WITH CHECK (auth.role() = ''authenticated'')', table_name);
    EXECUTE format('CREATE POLICY "Enable update for authenticated users only" ON public.%I FOR UPDATE USING (auth.role() = ''authenticated'')', table_name);
    EXECUTE format('CREATE POLICY "Enable delete for authenticated users only" ON public.%I FOR DELETE USING (auth.role() = ''authenticated'')', table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply standard RLS policies to the new tables
SELECT create_standard_rls_policies('chicken_size_categories');
SELECT create_standard_rls_policies('chicken_part_types');
SELECT create_standard_rls_policies('chicken_part_standards');
SELECT create_standard_rls_policies('chicken_processing_config');

-- Clean up the utility function
DROP FUNCTION create_standard_rls_policies(TEXT);

-- ==========================================
-- STEP 6: CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ==========================================

-- Create triggers for updated_at column for new configuration tables
DROP TRIGGER IF EXISTS update_chicken_size_categories_updated_at ON public.chicken_size_categories;
CREATE TRIGGER update_chicken_size_categories_updated_at
    BEFORE UPDATE ON public.chicken_size_categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_chicken_part_types_updated_at ON public.chicken_part_types;
CREATE TRIGGER update_chicken_part_types_updated_at
    BEFORE UPDATE ON public.chicken_part_types
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_chicken_part_standards_updated_at ON public.chicken_part_standards;
CREATE TRIGGER update_chicken_part_standards_updated_at
    BEFORE UPDATE ON public.chicken_part_standards
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_chicken_processing_config_updated_at ON public.chicken_processing_config;
CREATE TRIGGER update_chicken_processing_config_updated_at
    BEFORE UPDATE ON public.chicken_processing_config
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- STEP 7: UPDATE SITE SETTINGS FOR NEW PAGE
-- ==========================================

-- Add Processing Configuration to site settings navigation
UPDATE public.site_settings
SET settings_data = jsonb_set(
    settings_data,
    '{navigationItems}',
    (settings_data->'navigationItems') || '[
        {
            "id": "processing-config",
            "label": "Processing Config",
            "path": "/processing-config",
            "icon": "⚙️",
            "enabled": true
        }
    ]'::jsonb
)
WHERE settings_data->'navigationItems' @> '[{"id": "inventory"}]'::jsonb;

-- ==========================================
-- STEP 8: VERIFICATION QUERIES
-- ==========================================

-- Verify the migration completed successfully
SELECT
    'MIGRATION SUMMARY' as section,
    '================' as separator;

SELECT
    'Configuration Tables' as section,
    '===================' as separator;

SELECT
    'Size Categories' as table_name,
    COUNT(*) as record_count
FROM public.chicken_size_categories
WHERE is_active = true;

SELECT
    'Part Types' as table_name,
    COUNT(*) as record_count
FROM public.chicken_part_types
WHERE is_active = true;

SELECT
    'Part Standards' as table_name,
    COUNT(*) as record_count
FROM public.chicken_part_standards
WHERE is_active = true;

SELECT
    'Processing Configs' as table_name,
    COUNT(*) as record_count
FROM public.chicken_processing_config
WHERE is_active = true;

SELECT
    'Dressed Chickens Migration' as section,
    '==========================' as separator;

SELECT
    'Total Dressed Chickens' as metric,
    COUNT(*) as value
FROM public.dressed_chickens;

SELECT
    'With Size Category ID' as metric,
    COUNT(*) as value
FROM public.dressed_chickens
WHERE size_category_id IS NOT NULL;

SELECT
    'With Created By' as metric,
    COUNT(*) as value
FROM public.dressed_chickens
WHERE created_by IS NOT NULL;

-- ==========================================
-- STEP 9: MIGRATION COMPLETE MESSAGE
-- ==========================================

SELECT
    '🎉 MIGRATION COMPLETED SUCCESSFULLY!' as status,
    '=====================================' as separator;

SELECT
    '✅ All configuration tables created and populated' as message
UNION ALL
SELECT '✅ Default size categories and part types added'
UNION ALL
SELECT '✅ Default part standards created for Broiler breed'
UNION ALL
SELECT '✅ Existing dressed chickens migrated to new structure'
UNION ALL
SELECT '✅ Row Level Security policies applied'
UNION ALL
SELECT '✅ Indexes created for optimal performance'
UNION ALL
SELECT '✅ Site settings updated with new navigation'
UNION ALL
SELECT '✅ Ready to use flexible chicken processing system!';

-- ==========================================
-- ROLLBACK INSTRUCTIONS (IF NEEDED)
-- ==========================================

/*
TO ROLLBACK THIS MIGRATION:

1. Drop the new configuration tables:
   DROP TABLE IF EXISTS public.chicken_processing_config CASCADE;
   DROP TABLE IF EXISTS public.chicken_part_standards CASCADE;
   DROP TABLE IF EXISTS public.chicken_part_types CASCADE;
   DROP TABLE IF EXISTS public.chicken_size_categories CASCADE;

2. Restore dressed_chickens table from backup or remove new columns:
   ALTER TABLE public.dressed_chickens
   DROP COLUMN IF EXISTS size_category_id,
   DROP COLUMN IF EXISTS size_category_custom,
   DROP COLUMN IF EXISTS processing_method,
   DROP COLUMN IF EXISTS quality_grade,
   DROP COLUMN IF EXISTS custom_fields,
   DROP COLUMN IF EXISTS created_by;

3. Remove from site settings navigation (manual step in admin panel)
*/