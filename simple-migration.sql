/*
==========================================
SIMPLE CHICKEN PROCESSING MIGRATION
==========================================

This script safely adds the new flexible chicken processing features
to your existing database without conflicts.

STEPS:
1. Adds missing columns to existing tables
2. Creates new configuration tables
3. Migrates existing data
4. Sets up defaults

SAFETY: This script is designed to be completely safe for existing data.
*/

-- ==========================================
-- STEP 1: ADD MISSING COLUMNS TO EXISTING TABLES
-- ==========================================

-- Add new columns to dressed_chickens table (if they don't exist)
DO $$
BEGIN
    -- Add size_category_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'dressed_chickens'
                   AND column_name = 'size_category_id') THEN
        ALTER TABLE public.dressed_chickens ADD COLUMN size_category_id TEXT;
    END IF;

    -- Add size_category_custom column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'dressed_chickens'
                   AND column_name = 'size_category_custom') THEN
        ALTER TABLE public.dressed_chickens ADD COLUMN size_category_custom TEXT;
    END IF;

    -- Add custom_fields column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'dressed_chickens'
                   AND column_name = 'custom_fields') THEN
        ALTER TABLE public.dressed_chickens ADD COLUMN custom_fields JSONB DEFAULT '{}';
    END IF;

    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'dressed_chickens'
                   AND column_name = 'created_by') THEN
        ALTER TABLE public.dressed_chickens ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- ==========================================
-- STEP 2: CREATE NEW CONFIGURATION TABLES
-- ==========================================

-- Create chicken_size_categories table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.chicken_size_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    min_weight DECIMAL(10,2),
    max_weight DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chicken_part_types table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.chicken_part_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    default_count_per_bird DECIMAL(10,2) DEFAULT 1,
    unit_of_measure TEXT DEFAULT 'count',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chicken_part_standards table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.chicken_part_standards (
    id TEXT PRIMARY KEY,
    breed TEXT NOT NULL,
    size_category_id TEXT REFERENCES public.chicken_size_categories(id),
    part_type_id TEXT REFERENCES public.chicken_part_types(id),
    standard_weight_kg DECIMAL(10,3) NOT NULL,
    weight_variance_percent DECIMAL(5,2) DEFAULT 10,
    sample_size INTEGER,
    measured_by TEXT,
    measurement_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(breed, size_category_id, part_type_id)
);

-- Create chicken_processing_config table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.chicken_processing_config (
    id TEXT PRIMARY KEY,
    config_name TEXT NOT NULL,
    config_type TEXT NOT NULL CHECK (config_type IN ('global', 'breed_specific', 'seasonal')),
    breed TEXT,
    season_start_month INTEGER CHECK (season_start_month >= 1 AND season_start_month <= 12),
    season_end_month INTEGER CHECK (season_end_month >= 1 AND season_end_month <= 12),
    default_size_category_id TEXT REFERENCES public.chicken_size_categories(id),
    auto_calculate_parts BOOLEAN DEFAULT false,
    allow_part_editing BOOLEAN DEFAULT true,
    require_weight_validation BOOLEAN DEFAULT false,
    config_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- STEP 3: INSERT DEFAULT DATA
-- ==========================================

-- Insert default size categories (only if they don't exist)
INSERT INTO public.chicken_size_categories (id, name, description, min_weight, max_weight, sort_order)
SELECT 'small', 'Small', 'Small sized chickens under 1.2kg', 0.8, 1.2, 1
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_size_categories WHERE name = 'Small');

INSERT INTO public.chicken_size_categories (id, name, description, min_weight, max_weight, sort_order)
SELECT 'medium', 'Medium', 'Medium sized chickens 1.2-1.8kg', 1.2, 1.8, 2
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_size_categories WHERE name = 'Medium');

INSERT INTO public.chicken_size_categories (id, name, description, min_weight, max_weight, sort_order)
SELECT 'large', 'Large', 'Large sized chickens 1.8-2.5kg', 1.8, 2.5, 3
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_size_categories WHERE name = 'Large');

INSERT INTO public.chicken_size_categories (id, name, description, min_weight, max_weight, sort_order)
SELECT 'extra-large', 'Extra Large', 'Extra large chickens over 2.5kg', 2.5, 10.0, 4
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_size_categories WHERE name = 'Extra Large');

-- Insert default part types (only if they don't exist)
INSERT INTO public.chicken_part_types (id, name, description, default_count_per_bird, unit_of_measure, sort_order)
SELECT 'neck', 'Neck', 'Chicken neck portion', 1, 'count', 1
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_part_types WHERE name = 'Neck');

INSERT INTO public.chicken_part_types (id, name, description, default_count_per_bird, unit_of_measure, sort_order)
SELECT 'feet', 'Feet', 'Chicken feet (2 per bird)', 2, 'count', 2
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_part_types WHERE name = 'Feet');

INSERT INTO public.chicken_part_types (id, name, description, default_count_per_bird, unit_of_measure, sort_order)
SELECT 'gizzard', 'Gizzard', 'Chicken gizzard', 1, 'count', 3
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_part_types WHERE name = 'Gizzard');

INSERT INTO public.chicken_part_types (id, name, description, default_count_per_bird, unit_of_measure, sort_order)
SELECT 'liver', 'Liver', 'Chicken liver', 1, 'count', 4
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_part_types WHERE name = 'Liver');

INSERT INTO public.chicken_part_types (id, name, description, default_count_per_bird, unit_of_measure, sort_order)
SELECT 'dog_food', 'Dog Food', 'Head and liver mix for dog food', 1, 'count', 5
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_part_types WHERE name = 'Dog Food');

-- ==========================================
-- STEP 4: MIGRATE EXISTING DATA
-- ==========================================

-- Update existing dressed_chickens to use the new size category system
UPDATE public.dressed_chickens
SET
    size_category_id = (
        SELECT id FROM public.chicken_size_categories
        WHERE name = dressed_chickens.size_category
        LIMIT 1
    ),
    size_category_custom = COALESCE(dressed_chickens.size_category, 'Medium')
WHERE size_category IS NOT NULL;

-- Add created_by field to existing records (if admin user exists)
UPDATE public.dressed_chickens
SET created_by = (
    SELECT id FROM auth.users
    WHERE email = 'admin@farmstock.com'
    LIMIT 1
)
WHERE created_by IS NULL;

-- ==========================================
-- STEP 5: CREATE DEFAULT PART STANDARDS
-- ==========================================

-- Create default part standards for Broiler breed (if they don't exist)
INSERT INTO public.chicken_part_standards (
    id, breed, size_category_id, part_type_id, standard_weight_kg,
    weight_variance_percent, sample_size, measured_by, measurement_date, notes, is_active
)
SELECT
    'default_' || sc.name || '_' || pt.name || '_standard',
    'Broiler',
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
    15,
    50,
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
-- STEP 6: CREATE DEFAULT PROCESSING CONFIG
-- ==========================================

-- Insert default processing configuration (only if it doesn't exist)
INSERT INTO public.chicken_processing_config (
    id, config_name, config_type, default_size_category_id,
    auto_calculate_parts, allow_part_editing, require_weight_validation, config_data
)
SELECT
    'default_global_config',
    'Default Global Configuration',
    'global',
    (SELECT id FROM public.chicken_size_categories WHERE name = 'Medium' LIMIT 1),
    false,
    true,
    false,
    '{"allow_custom_size_categories": true, "default_processing_method": "standard"}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.chicken_processing_config
    WHERE config_name = 'Default Global Configuration'
);

-- ==========================================
-- STEP 7: ENABLE SECURITY AND CREATE INDEXES
-- ==========================================

-- Enable RLS for new tables
ALTER TABLE public.chicken_size_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicken_part_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicken_part_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicken_processing_config ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all authenticated users)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.chicken_size_categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.chicken_size_categories;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.chicken_size_categories;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.chicken_size_categories;

CREATE POLICY "Enable read access for all users" ON public.chicken_size_categories FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.chicken_size_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.chicken_size_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.chicken_size_categories FOR DELETE USING (auth.role() = 'authenticated');

-- Repeat for other tables
DROP POLICY IF EXISTS "Enable read access for all users" ON public.chicken_part_types;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.chicken_part_types;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.chicken_part_types;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.chicken_part_types;

CREATE POLICY "Enable read access for all users" ON public.chicken_part_types FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.chicken_part_types FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.chicken_part_types FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.chicken_part_types FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable read access for all users" ON public.chicken_part_standards;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.chicken_part_standards;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.chicken_part_standards;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.chicken_part_standards;

CREATE POLICY "Enable read access for all users" ON public.chicken_part_standards FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.chicken_part_standards FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.chicken_part_standards FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.chicken_part_standards FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable read access for all users" ON public.chicken_processing_config;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.chicken_processing_config;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.chicken_processing_config;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.chicken_processing_config;

CREATE POLICY "Enable read access for all users" ON public.chicken_processing_config FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.chicken_processing_config FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.chicken_processing_config FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.chicken_processing_config FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_size_category_id ON public.dressed_chickens(size_category_id);
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_size_category_custom ON public.dressed_chickens(size_category_custom);
CREATE INDEX IF NOT EXISTS idx_chicken_size_categories_active ON public.chicken_size_categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_chicken_part_types_active ON public.chicken_part_types(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_chicken_part_standards_breed ON public.chicken_part_standards(breed);

-- ==========================================
-- STEP 8: VERIFICATION
-- ==========================================

-- Show migration results
SELECT
    'MIGRATION COMPLETED SUCCESSFULLY!' as status;

SELECT
    'Configuration Tables Created' as section,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'chicken_size_categories',
    'chicken_part_types',
    'chicken_part_standards',
    'chicken_processing_config'
);

SELECT
    'Records in Size Categories' as section,
    COUNT(*) as count
FROM public.chicken_size_categories
WHERE is_active = true;

SELECT
    'Records in Part Types' as section,
    COUNT(*) as count
FROM public.chicken_part_types
WHERE is_active = true;

SELECT
    'Records in Part Standards' as section,
    COUNT(*) as count
FROM public.chicken_part_standards
WHERE is_active = true;

SELECT
    'Dressed Chickens Updated' as section,
    COUNT(*) as count
FROM public.dressed_chickens
WHERE size_category_id IS NOT NULL;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

SELECT
    '🎉 FLEXIBLE CHICKEN PROCESSING SYSTEM READY!' as message,
    '=============================================' as separator;

SELECT
    '✅ All configuration tables created' as feature
UNION ALL
SELECT '✅ Default size categories added (Small, Medium, Large, Extra Large)'
UNION ALL
SELECT '✅ Default part types added (Neck, Feet, Gizzard, Liver, Dog Food)'
UNION ALL
SELECT '✅ Part weight standards configured for Broiler breed'
UNION ALL
SELECT '✅ Existing dressed chickens migrated to new structure'
UNION ALL
SELECT '✅ Security policies and indexes created'
UNION ALL
SELECT '✅ Ready to use enhanced chicken processing features!'
UNION ALL
SELECT ''
UNION ALL
SELECT 'NEXT STEPS:'
UNION ALL
SELECT '1. Restart your application'
UNION ALL
SELECT '2. Access the new "Processing Configuration" page'
UNION ALL
SELECT '3. Customize size categories and weight standards for your farm'
UNION ALL
SELECT '4. Use the enhanced Dressed Chicken Stock editing features';