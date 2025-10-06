-- Chicken Stock Management Database Schema
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Create chickens table
CREATE TABLE IF NOT EXISTS public.chickens (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    customer TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    count INTEGER NOT NULL,
    size DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    calculation_mode TEXT DEFAULT 'count_size_cost',
    inventory_type TEXT DEFAULT 'live', -- 'live', 'dressed', 'parts'
    batch_id TEXT, -- Links to live_chickens or dressed_chickens depending on inventory_type
    part_type TEXT, -- For parts orders: 'neck', 'feet', 'gizzard', 'dog_food'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (for existing databases)
ALTER TABLE public.chickens ADD COLUMN IF NOT EXISTS inventory_type TEXT DEFAULT 'live';
ALTER TABLE public.chickens ADD COLUMN IF NOT EXISTS part_type TEXT;

-- Create stock table
CREATE TABLE IF NOT EXISTS public.stock (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    count INTEGER NOT NULL,
    size DECIMAL(10,2) NOT NULL,
    cost_per_kg DECIMAL(10,2) NOT NULL,
    calculation_mode TEXT DEFAULT 'count_size_cost',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    type TEXT NOT NULL, -- 'fund', 'expense', 'stock_expense', 'withdrawal'
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create balance table
CREATE TABLE IF NOT EXISTS public.balance (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create live_chickens table
CREATE TABLE IF NOT EXISTS public.live_chickens (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    breed TEXT NOT NULL,
    initial_count INTEGER NOT NULL,
    current_count INTEGER NOT NULL,
    hatch_date DATE NOT NULL,
    expected_weight DECIMAL(10,2),
    current_weight DECIMAL(10,2),
    feed_type TEXT,
    status TEXT NOT NULL DEFAULT 'healthy', -- 'healthy', 'sick', 'quarantine', 'processing'
    mortality INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add lifecycle tracking columns if they don't exist
ALTER TABLE public.live_chickens ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'arrival';
ALTER TABLE public.live_chickens ADD COLUMN IF NOT EXISTS stage_arrival_date DATE;
ALTER TABLE public.live_chickens ADD COLUMN IF NOT EXISTS stage_brooding_date DATE;
ALTER TABLE public.live_chickens ADD COLUMN IF NOT EXISTS stage_growing_date DATE;
ALTER TABLE public.live_chickens ADD COLUMN IF NOT EXISTS stage_processing_date DATE;
ALTER TABLE public.live_chickens ADD COLUMN IF NOT EXISTS stage_freezer_date DATE;
ALTER TABLE public.live_chickens ADD COLUMN IF NOT EXISTS completed_date DATE;

-- Create feed_inventory table
CREATE TABLE IF NOT EXISTS public.feed_inventory (
    id TEXT PRIMARY KEY,
    batch_number TEXT NOT NULL,
    feed_type TEXT NOT NULL,
    brand TEXT NOT NULL,
    quantity_kg DECIMAL(10,2) NOT NULL,
    cost_per_kg DECIMAL(10,2) NOT NULL,
    cost_per_bag DECIMAL(10,2),
    number_of_bags INTEGER,
    purchase_date DATE NOT NULL,
    expiry_date DATE,
    supplier TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'expired', 'consumed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feed_consumption table
CREATE TABLE IF NOT EXISTS public.feed_consumption (
    id TEXT PRIMARY KEY,
    feed_id TEXT REFERENCES public.feed_inventory(id),
    chicken_batch_id TEXT REFERENCES public.live_chickens(id),
    quantity_consumed DECIMAL(10,2) NOT NULL,
    consumption_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vaccination_records table
CREATE TABLE IF NOT EXISTS public.vaccination_records (
    id TEXT PRIMARY KEY,
    chicken_batch_id TEXT REFERENCES public.live_chickens(id),
    vaccine_name TEXT NOT NULL,
    vaccine_type TEXT NOT NULL, -- 'preventive', 'treatment', 'booster'
    vaccination_date DATE NOT NULL,
    next_due_date DATE,
    dosage TEXT,
    administered_by TEXT,
    batch_number TEXT,
    notes TEXT,
    status TEXT DEFAULT 'completed', -- 'scheduled', 'completed', 'overdue'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health_records table
CREATE TABLE IF NOT EXISTS public.health_records (
    id TEXT PRIMARY KEY,
    chicken_batch_id TEXT REFERENCES public.live_chickens(id),
    health_check_date DATE NOT NULL,
    overall_health TEXT NOT NULL DEFAULT 'good', -- 'excellent', 'good', 'fair', 'poor'
    symptoms TEXT,
    treatment_given TEXT,
    veterinarian TEXT,
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial balance record
INSERT INTO public.balance (amount) VALUES (0) ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.chickens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chickens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_consumption ENABLE ROW LEVEL SECURITY;

-- Create standard RLS policies for all tables
-- This replaces the repetitive policy creation with a more maintainable approach

-- Function to create standard RLS policies
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

-- Apply standard RLS policies to all existing tables
SELECT create_standard_rls_policies('chickens');
SELECT create_standard_rls_policies('stock');
SELECT create_standard_rls_policies('transactions');
SELECT create_standard_rls_policies('balance');
SELECT create_standard_rls_policies('users');
SELECT create_standard_rls_policies('audit_logs');
SELECT create_standard_rls_policies('live_chickens');
SELECT create_standard_rls_policies('feed_inventory');
SELECT create_standard_rls_policies('feed_consumption');

-- Create chicken_inventory_transactions table for tracking inventory changes
CREATE TABLE IF NOT EXISTS public.chicken_inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    batch_id TEXT NOT NULL REFERENCES live_chickens(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('sale', 'mortality', 'transfer', 'adjustment')),
    quantity_changed INTEGER NOT NULL CHECK (quantity_changed != 0),
    reason TEXT,
    reference_id VARCHAR(255),
    reference_type VARCHAR(50),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create chicken_size_categories table for configurable size definitions
CREATE TABLE IF NOT EXISTS public.chicken_size_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- Custom size name (e.g., "Farm Standard", "Export Grade")
    description TEXT,
    min_weight DECIMAL(10,2), -- Minimum weight for this category
    max_weight DECIMAL(10,2), -- Maximum weight for this category
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chicken_part_types table for defining available part types
CREATE TABLE IF NOT EXISTS public.chicken_part_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- Part name (e.g., "neck", "feet", "gizzard", "liver")
    description TEXT,
    default_count_per_bird DECIMAL(10,2) DEFAULT 1, -- Default quantity per whole chicken
    unit_of_measure TEXT DEFAULT 'count', -- 'count', 'kg', 'lbs'
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chicken_part_standards table for breed/size specific weight standards
CREATE TABLE IF NOT EXISTS public.chicken_part_standards (
    id TEXT PRIMARY KEY,
    breed TEXT NOT NULL, -- Chicken breed (e.g., "Broiler", "Layer")
    size_category_id TEXT REFERENCES public.chicken_size_categories(id),
    part_type_id TEXT REFERENCES public.chicken_part_types(id),
    standard_weight_kg DECIMAL(10,3) NOT NULL, -- Standard weight in kg per part
    weight_variance_percent DECIMAL(5,2) DEFAULT 10, -- Allowed variance percentage
    sample_size INTEGER, -- Number of measurements this standard is based on
    measured_by TEXT, -- Person who took measurements
    measurement_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(breed, size_category_id, part_type_id)
);

-- Create chicken_processing_config table for farm-specific processing rules
CREATE TABLE IF NOT EXISTS public.chicken_processing_config (
    id TEXT PRIMARY KEY,
    config_name TEXT NOT NULL,
    config_type TEXT NOT NULL CHECK (config_type IN ('global', 'breed_specific', 'seasonal')),
    breed TEXT, -- NULL for global configs
    season_start_month INTEGER CHECK (season_start_month >= 1 AND season_start_month <= 12),
    season_end_month INTEGER CHECK (season_end_month >= 1 AND season_end_month <= 12),
    default_size_category_id TEXT REFERENCES public.chicken_size_categories(id),
    auto_calculate_parts BOOLEAN DEFAULT false, -- Whether to auto-calculate parts from whole count
    allow_part_editing BOOLEAN DEFAULT true,
    require_weight_validation BOOLEAN DEFAULT false,
    config_data JSONB DEFAULT '{}', -- Additional flexible configuration
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dressed_chickens table for tracking processed/dressed chicken inventory
CREATE TABLE IF NOT EXISTS public.dressed_chickens (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    processing_date DATE NOT NULL,
    initial_count INTEGER NOT NULL,
    current_count INTEGER NOT NULL,
    average_weight DECIMAL(10,2) NOT NULL,
    size_category_id TEXT REFERENCES public.chicken_size_categories(id), -- Reference to size_categories table
    size_category_custom TEXT, -- Custom size name if not using predefined categories
    status TEXT NOT NULL DEFAULT 'in-storage', -- 'in-storage', 'sold', 'expired'
    storage_location TEXT,
    expiry_date DATE,
    notes TEXT,
    parts_count JSONB DEFAULT '{}', -- Tracks count of specific parts: {"neck": 85, "feet": 85, "gizzard": 85, "liver": 42}
    parts_weight JSONB DEFAULT '{}', -- Tracks weight of specific parts: {"neck": 2.1, "feet": 1.8, "gizzard": 3.2, "liver": 1.8}
    -- Partial processing fields
    processing_quantity INTEGER, -- Number of birds processed from the batch
    remaining_birds INTEGER, -- Number of birds left in the original batch
    create_new_batch_for_remaining BOOLEAN DEFAULT FALSE, -- Whether to create a new batch for remaining birds
    remaining_batch_id TEXT, -- ID of the new batch created for remaining birds
    -- Enhanced fields for flexibility
    custom_fields JSONB DEFAULT '{}', -- Additional custom fields for farm-specific data
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create batch_relationships table for tracking relationships between batches
CREATE TABLE IF NOT EXISTS public.batch_relationships (
    id TEXT PRIMARY KEY,
    source_batch_id TEXT NOT NULL,
    source_batch_type TEXT NOT NULL CHECK (source_batch_type IN ('live_chickens', 'dressed_chickens', 'feed_inventory')),
    target_batch_id TEXT NOT NULL,
    target_batch_type TEXT NOT NULL CHECK (target_batch_type IN ('live_chickens', 'dressed_chickens', 'feed_inventory')),
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('fed_to', 'processed_from', 'sold_to', 'transferred_to', 'split_from', 'partial_processed_from')),
    quantity INTEGER CHECK (quantity IS NULL OR quantity >= 0),
    notes TEXT,
    -- Enhanced audit fields for better tracking
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Soft delete capability
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS for the new tables
ALTER TABLE public.chicken_inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dressed_chickens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicken_size_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicken_part_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicken_part_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicken_processing_config ENABLE ROW LEVEL SECURITY;

-- Apply standard RLS policies to the new tables
SELECT create_standard_rls_policies('chicken_inventory_transactions');
SELECT create_standard_rls_policies('dressed_chickens');
SELECT create_standard_rls_policies('batch_relationships');
SELECT create_standard_rls_policies('chicken_size_categories');
SELECT create_standard_rls_policies('chicken_part_types');
SELECT create_standard_rls_policies('chicken_part_standards');
SELECT create_standard_rls_policies('chicken_processing_config');

-- Clean up the utility function
DROP FUNCTION create_standard_rls_policies(TEXT);

-- Migration script has been moved to a separate file: migration-flexible-chicken-processing.sql
-- Run that file after this schema file to complete the setup and migrate existing data.

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chicken_transactions_batch ON public.chicken_inventory_transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_chicken_transactions_date ON public.chicken_inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_chicken_transactions_type ON public.chicken_inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_chicken_transactions_batch_date ON public.chicken_inventory_transactions(batch_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_chicken_transactions_reference ON public.chicken_inventory_transactions(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_batch_id ON public.dressed_chickens(batch_id);
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_processing_date ON public.dressed_chickens(processing_date);
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_status ON public.dressed_chickens(status);
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_size_category_id ON public.dressed_chickens(size_category_id);
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_size_category_custom ON public.dressed_chickens(size_category_custom);
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_expiry_date ON public.dressed_chickens(expiry_date);
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_processing_quantity ON public.dressed_chickens(processing_quantity);
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_remaining_batch_id ON public.dressed_chickens(remaining_batch_id);
CREATE INDEX IF NOT EXISTS idx_dressed_chickens_created_by ON public.dressed_chickens(created_by);
-- Indexes for new configuration tables
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
-- Enhanced indexes for better query performance and constraints
CREATE INDEX IF NOT EXISTS idx_batch_relationships_source ON public.batch_relationships(source_batch_id, source_batch_type);
CREATE INDEX IF NOT EXISTS idx_batch_relationships_target ON public.batch_relationships(target_batch_id, target_batch_type);
CREATE INDEX IF NOT EXISTS idx_batch_relationships_type ON public.batch_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_batch_relationships_active ON public.batch_relationships(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_relationships_composite ON public.batch_relationships(source_batch_id, source_batch_type, target_batch_id, target_batch_type, relationship_type);
CREATE INDEX IF NOT EXISTS idx_batch_relationships_quantity ON public.batch_relationships(quantity) WHERE quantity IS NOT NULL;

-- Create trigger for updated_at column
DROP TRIGGER IF EXISTS update_chicken_transactions_updated_at ON public.chicken_inventory_transactions;
CREATE TRIGGER update_chicken_transactions_updated_at
    BEFORE UPDATE ON public.chicken_inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for updated_at column for dressed chickens
DROP TRIGGER IF EXISTS update_dressed_chickens_updated_at ON public.dressed_chickens;
CREATE TRIGGER update_dressed_chickens_updated_at
    BEFORE UPDATE ON public.dressed_chickens
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

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

-- Add comments for the new columns
COMMENT ON COLUMN public.dressed_chickens.processing_quantity IS 'Number of birds processed from the original batch';
COMMENT ON COLUMN public.dressed_chickens.remaining_birds IS 'Number of birds left in the original batch after processing';
COMMENT ON COLUMN public.dressed_chickens.create_new_batch_for_remaining IS 'Whether a new batch was created for remaining birds';
COMMENT ON COLUMN public.dressed_chickens.remaining_batch_id IS 'ID of the new batch created for remaining birds';

-- Create enhanced triggers for batch relationships
DROP TRIGGER IF EXISTS update_batch_relationships_updated_at ON public.batch_relationships;
CREATE TRIGGER update_batch_relationships_updated_at
    BEFORE UPDATE ON public.batch_relationships
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to automatically set created_by from current user
CREATE OR REPLACE FUNCTION public.handle_batch_relationships_audit()
RETURNS TRIGGER AS $$
BEGIN
    -- Set created_by on insert if not provided
    IF NEW.created_by IS NULL AND auth.uid() IS NOT NULL THEN
        NEW.created_by := auth.uid();
    END IF;

    -- Set updated_by on update if not provided
    IF OLD IS NOT NULL AND NEW.updated_by IS NULL AND auth.uid() IS NOT NULL THEN
        NEW.updated_by := auth.uid();
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS handle_batch_relationships_audit_trigger ON public.batch_relationships;
CREATE TRIGGER handle_batch_relationships_audit_trigger
    BEFORE INSERT OR UPDATE ON public.batch_relationships
    FOR EACH ROW EXECUTE FUNCTION public.handle_batch_relationships_audit();

/*
==========================================
SEPARATE MIGRATION FILE FOR EXISTING DATABASES
==========================================
If the main schema.sql fails due to existing tables, copy and paste
the following script into a NEW file in your Supabase SQL Editor:
*/

-- ==========================================
-- BATCH RELATIONSHIPS ENHANCEMENT MIGRATION
-- ==========================================
-- Run this script if your batch_relationships table already exists

-- Step 1: Add new columns (safe for existing tables)
ALTER TABLE public.batch_relationships ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.batch_relationships ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
ALTER TABLE public.batch_relationships ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.batch_relationships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Set default values for existing records
UPDATE public.batch_relationships SET is_active = true WHERE is_active IS NULL;

-- Step 3: Add check constraints (will fail if existing data is invalid)
-- Remove this section if you have existing invalid data
ALTER TABLE public.batch_relationships ADD CONSTRAINT check_source_batch_type CHECK (source_batch_type IN ('live_chickens', 'dressed_chickens', 'feed_inventory'));
ALTER TABLE public.batch_relationships ADD CONSTRAINT check_target_batch_type CHECK (target_batch_type IN ('live_chickens', 'dressed_chickens', 'feed_inventory'));
ALTER TABLE public.batch_relationships ADD CONSTRAINT check_relationship_type CHECK (relationship_type IN ('fed_to', 'processed_from', 'sold_to', 'transferred_to', 'split_from', 'partial_processed_from'));
ALTER TABLE public.batch_relationships ADD CONSTRAINT check_quantity_positive CHECK (quantity IS NULL OR quantity >= 0);

-- Step 4: Create enhanced indexes
CREATE INDEX IF NOT EXISTS idx_batch_relationships_active ON public.batch_relationships(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_relationships_composite ON public.batch_relationships(source_batch_id, source_batch_type, target_batch_id, target_batch_type, relationship_type);
CREATE INDEX IF NOT EXISTS idx_batch_relationships_quantity ON public.batch_relationships(quantity) WHERE quantity IS NOT NULL;

-- Step 5: Create audit trigger
CREATE OR REPLACE FUNCTION public.handle_batch_relationships_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL AND auth.uid() IS NOT NULL THEN
        NEW.created_by := auth.uid();
    END IF;

    IF OLD IS NOT NULL AND NEW.updated_by IS NULL AND auth.uid() IS NOT NULL THEN
        NEW.updated_by := auth.uid();
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS handle_batch_relationships_audit_trigger ON public.batch_relationships;
CREATE TRIGGER handle_batch_relationships_audit_trigger
    BEFORE INSERT OR UPDATE ON public.batch_relationships
    FOR EACH ROW EXECUTE FUNCTION public.handle_batch_relationships_audit();

-- Step 6: Verify the migration worked
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'batch_relationships'
ORDER BY ordinal_position;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.chickens;
DROP TRIGGER IF EXISTS handle_updated_at ON public.stock;
DROP TRIGGER IF EXISTS handle_updated_at ON public.transactions;
DROP TRIGGER IF EXISTS handle_updated_at ON public.balance;
DROP TRIGGER IF EXISTS handle_updated_at ON public.users;
DROP TRIGGER IF EXISTS handle_updated_at ON public.live_chickens;
DROP TRIGGER IF EXISTS handle_updated_at ON public.feed_inventory;
DROP TRIGGER IF EXISTS handle_updated_at ON public.feed_consumption;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.chickens FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.stock FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.balance FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.live_chickens FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.feed_inventory FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.feed_consumption FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chickens_date ON public.chickens(date DESC);
CREATE INDEX IF NOT EXISTS idx_chickens_customer ON public.chickens(customer);
CREATE INDEX IF NOT EXISTS idx_chickens_status ON public.chickens(status);
CREATE INDEX IF NOT EXISTS idx_chickens_batch_id ON public.chickens(batch_id); -- Add index for batch_id
CREATE INDEX IF NOT EXISTS idx_stock_date ON public.stock(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_chickens_breed ON public.live_chickens(breed);
CREATE INDEX IF NOT EXISTS idx_live_chickens_status ON public.live_chickens(status);
CREATE INDEX IF NOT EXISTS idx_live_chickens_batch_id ON public.live_chickens(batch_id);
CREATE INDEX IF NOT EXISTS idx_live_chickens_hatch_date ON public.live_chickens(hatch_date DESC);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_feed_type ON public.feed_inventory(feed_type);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_status ON public.feed_inventory(status);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_expiry_date ON public.feed_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_feed_consumption_feed_id ON public.feed_consumption(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_consumption_chicken_batch_id ON public.feed_consumption(chicken_batch_id);
CREATE INDEX IF NOT EXISTS idx_feed_consumption_consumption_date ON public.feed_consumption(consumption_date DESC);

-- Create weight_history table for tracking weight measurements over time
CREATE TABLE IF NOT EXISTS public.weight_history (
    id TEXT PRIMARY KEY,
    chicken_batch_id TEXT REFERENCES public.live_chickens(id) ON DELETE CASCADE,
    weight DECIMAL(10,2) NOT NULL,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for weight_history table
CREATE INDEX IF NOT EXISTS idx_weight_history_chicken_batch_id ON public.weight_history(chicken_batch_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_recorded_date ON public.weight_history(recorded_date DESC);

-- Enable RLS for the weight_history table
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

-- Apply standard RLS policies to the weight_history table
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

-- Apply standard RLS policies to the weight_history table
SELECT create_standard_rls_policies('weight_history');

-- Create trigger for updated_at column for weight history
DROP TRIGGER IF EXISTS update_weight_history_updated_at ON public.weight_history;
CREATE TRIGGER update_weight_history_updated_at
    BEFORE UPDATE ON public.weight_history
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert admin user (password: admin123 - change this in production!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO public.users (id, email, password_hash, full_name, role, is_active)
VALUES (
    gen_random_uuid(),
    'admin@farmstock.com',
    '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ',
    'System Administrator',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id SERIAL PRIMARY KEY,
    settings_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default site settings only if the table is empty
INSERT INTO public.site_settings (settings_data)
SELECT '{
  "siteTitle": "Farm Stock Management",
  "logoType": "text",
  "logoUrl": "",
  "loginTitle": "Farm Stock Management",
  "loginLogoType": "svg",
  "loginLogoUrl": "",
  "navigationItems": [
    {"id": "dashboard", "label": "Dashboard", "path": "/", "icon": "📊", "enabled": true, "order": 1},
    {"id": "chickens", "label": "Chicken Orders", "path": "/chickens", "icon": "🐔", "enabled": true, "order": 2},
    {"id": "inventory", "label": "Inventory", "path": "/inventory", "icon": "📦", "enabled": true, "order": 3, "isDropdown": true, "children": [
      {"id": "stock", "label": "General Stock", "path": "/stock", "enabled": true},
      {"id": "live-chickens", "label": "Live Chicken Stock", "path": "/live-chickens", "enabled": true},
      {"id": "lifecycle", "label": "Lifecycle Tracking", "path": "/lifecycle", "enabled": true},
      {"id": "feed", "label": "Feed Management", "path": "/feed", "enabled": true},
      {"id": "dressed-chicken", "label": "Dressed Chicken Stock", "path": "/dressed-chicken", "enabled": true},
      {"id": "processing-config", "label": "Processing Config", "path": "/processing-config", "enabled": true}
    ]},
    {"id": "transactions", "label": "Transactions", "path": "/transactions", "icon": "💰", "enabled": true, "order": 4},
    {"id": "reports", "label": "Reports", "path": "/reports", "icon": "📈", "enabled": true, "order": 5}
  ]
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- Insert default size categories only if the table is empty
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

-- Insert default part types only if the table is empty
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

-- Insert default processing configuration only if the table is empty
INSERT INTO public.chicken_processing_config (id, config_name, config_type, default_size_category_id, auto_calculate_parts, allow_part_editing, require_weight_validation, config_data)
SELECT 'default_global_config', 'Default Global Configuration', 'global',
       (SELECT id FROM public.chicken_size_categories WHERE name = 'Medium' LIMIT 1),
       false, true, false, '{"allow_custom_size_categories": true, "default_processing_method": "standard"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.chicken_processing_config WHERE config_name = 'Default Global Configuration');

-- Comments for documentation
COMMENT ON TABLE public.chickens IS 'Customer chicken orders and sales';
COMMENT ON TABLE public.stock IS 'Chicken stock inventory';
COMMENT ON TABLE public.transactions IS 'Financial transactions (income/expenses)';
COMMENT ON TABLE public.balance IS 'Current account balance';
COMMENT ON TABLE public.users IS 'System users and authentication';
COMMENT ON TABLE public.audit_logs IS 'Audit trail for all system actions';
COMMENT ON TABLE public.live_chickens IS 'Live chicken batch tracking and management';
COMMENT ON TABLE public.feed_inventory IS 'Feed inventory management';
COMMENT ON TABLE public.feed_consumption IS 'Feed consumption tracking by chicken batches';
COMMENT ON TABLE public.site_settings IS 'Global site settings and configuration';
COMMENT ON TABLE public.chicken_inventory_transactions IS 'Audit trail for all changes to live chicken inventory (sales, mortality, transfers, etc.)';
COMMENT ON TABLE public.dressed_chickens IS 'Processed/dressed chicken inventory tracking with support for partial batch processing';
-- Enhanced comments for the batch_relationships table
COMMENT ON TABLE public.batch_relationships IS 'Enhanced relationships between different batches with audit trails, validation constraints, and soft delete support';
COMMENT ON COLUMN public.batch_relationships.source_batch_type IS 'Type of source batch with enforced constraints: live_chickens, dressed_chickens, feed_inventory';
COMMENT ON COLUMN public.batch_relationships.target_batch_type IS 'Type of target batch with enforced constraints: live_chickens, dressed_chickens, feed_inventory';
COMMENT ON COLUMN public.batch_relationships.relationship_type IS 'Type of relationship with enforced constraints: fed_to, processed_from, sold_to, transferred_to, split_from, partial_processed_from';
COMMENT ON COLUMN public.batch_relationships.quantity IS 'Quantity associated with the relationship (must be >= 0)';
COMMENT ON COLUMN public.batch_relationships.created_by IS 'User who created the relationship record (auto-populated)';
COMMENT ON COLUMN public.batch_relationships.updated_by IS 'User who last updated the relationship record (auto-populated)';
COMMENT ON COLUMN public.batch_relationships.deleted_at IS 'Soft delete timestamp (NULL means active record)';
COMMENT ON COLUMN public.batch_relationships.is_active IS 'Whether the relationship is active (default: true)';

/*
==========================================
BATCH RELATIONSHIPS MIGRATION SCRIPT
==========================================
If you get a "column does not exist" error, it means your database
already has the batch_relationships table but it's missing the new columns.

Run this script SEPARATELY in your Supabase SQL Editor:
*/

-- Step 1: Add new columns (only if they don't exist)
ALTER TABLE public.batch_relationships ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.batch_relationships ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
ALTER TABLE public.batch_relationships ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.batch_relationships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Set default values for existing records
UPDATE public.batch_relationships SET is_active = true WHERE is_active IS NULL;

-- Step 3: Add check constraints (these will only work if existing data is valid)
-- Note: If you have existing invalid data, you'll need to clean it up first
ALTER TABLE public.batch_relationships ADD CONSTRAINT check_source_batch_type CHECK (source_batch_type IN ('live_chickens', 'dressed_chickens', 'feed_inventory'));
ALTER TABLE public.batch_relationships ADD CONSTRAINT check_target_batch_type CHECK (target_batch_type IN ('live_chickens', 'dressed_chickens', 'feed_inventory'));
ALTER TABLE public.batch_relationships ADD CONSTRAINT check_relationship_type CHECK (relationship_type IN ('fed_to', 'processed_from', 'sold_to', 'transferred_to', 'split_from', 'partial_processed_from'));
ALTER TABLE public.batch_relationships ADD CONSTRAINT check_quantity_positive CHECK (quantity IS NULL OR quantity >= 0);

-- Step 4: Create the enhanced indexes
CREATE INDEX IF NOT EXISTS idx_batch_relationships_active ON public.batch_relationships(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_relationships_composite ON public.batch_relationships(source_batch_id, source_batch_type, target_batch_id, target_batch_type, relationship_type);
CREATE INDEX IF NOT EXISTS idx_batch_relationships_quantity ON public.batch_relationships(quantity) WHERE quantity IS NOT NULL;

-- Step 5: Create the audit trigger
CREATE OR REPLACE FUNCTION public.handle_batch_relationships_audit()
RETURNS TRIGGER AS $$
BEGIN
    -- Set created_by on insert if not provided
    IF NEW.created_by IS NULL AND auth.uid() IS NOT NULL THEN
        NEW.created_by := auth.uid();
    END IF;

    -- Set updated_by on update if not provided
    IF OLD IS NOT NULL AND NEW.updated_by IS NULL AND auth.uid() IS NOT NULL THEN
        NEW.updated_by := auth.uid();
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS handle_batch_relationships_audit_trigger ON public.batch_relationships;
CREATE TRIGGER handle_batch_relationships_audit_trigger
    BEFORE INSERT OR UPDATE ON public.batch_relationships
    FOR EACH ROW EXECUTE FUNCTION public.handle_batch_relationships_audit();