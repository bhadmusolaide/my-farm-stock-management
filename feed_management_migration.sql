-- ==========================================
-- FEED MANAGEMENT FEATURE MIGRATION SCRIPT
-- ==========================================
-- This script adds new tables and columns for the enhanced Feed Management feature
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Step 1: Create feed_batch_assignments table
CREATE TABLE IF NOT EXISTS public.feed_batch_assignments (
    id TEXT PRIMARY KEY,
    feed_id TEXT REFERENCES public.feed_inventory(id) ON DELETE CASCADE,
    chicken_batch_id TEXT REFERENCES public.live_chickens(id) ON DELETE CASCADE,
    assigned_quantity_kg DECIMAL(10,2) NOT NULL,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    auto_assigned BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create feed_alerts table
CREATE TABLE IF NOT EXISTS public.feed_alerts (
    id TEXT PRIMARY KEY,
    alert_type TEXT NOT NULL, -- 'low_stock', 'no_consumption', 'fcr_deviation', 'expiry_warning'
    severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
    feed_id TEXT REFERENCES public.feed_inventory(id) ON DELETE CASCADE,
    chicken_batch_id TEXT REFERENCES public.live_chickens(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    action_link TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create batch_feed_summary table
CREATE TABLE IF NOT EXISTS public.batch_feed_summary (
    id TEXT PRIMARY KEY,
    chicken_batch_id TEXT REFERENCES public.live_chickens(id) ON DELETE CASCADE,
    total_feed_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_feed_bags DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_feed_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    average_fcr DECIMAL(10,4),
    total_weight_gain DECIMAL(10,2),
    feed_efficiency_rating TEXT,
    summary_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Add new columns to feed_inventory table (if they don't exist)
DO $$ 
BEGIN
    -- Add deduct_from_balance column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'feed_inventory' 
        AND column_name = 'deduct_from_balance'
    ) THEN
        ALTER TABLE public.feed_inventory ADD COLUMN deduct_from_balance BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add balance_deducted column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'feed_inventory' 
        AND column_name = 'balance_deducted'
    ) THEN
        ALTER TABLE public.feed_inventory ADD COLUMN balance_deducted BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add auto_assigned column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'feed_inventory' 
        AND column_name = 'auto_assigned'
    ) THEN
        ALTER TABLE public.feed_inventory ADD COLUMN auto_assigned BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add total_cost column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'feed_inventory' 
        AND column_name = 'total_cost'
    ) THEN
        ALTER TABLE public.feed_inventory ADD COLUMN total_cost DECIMAL(10,2);
    END IF;

    -- Add remaining_kg column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'feed_inventory' 
        AND column_name = 'remaining_kg'
    ) THEN
        ALTER TABLE public.feed_inventory ADD COLUMN remaining_kg DECIMAL(10,2);
    END IF;

    -- Add initial_quantity_kg column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'feed_inventory' 
        AND column_name = 'initial_quantity_kg'
    ) THEN
        ALTER TABLE public.feed_inventory ADD COLUMN initial_quantity_kg DECIMAL(10,2);
    END IF;
END $$;

-- Step 5: Add auto_logged column to feed_consumption table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'feed_consumption' 
        AND column_name = 'auto_logged'
    ) THEN
        ALTER TABLE public.feed_consumption ADD COLUMN auto_logged BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Step 6: Enable Row Level Security on new tables
ALTER TABLE public.feed_batch_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_feed_summary ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for new tables
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.feed_batch_assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.feed_batch_assignments;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.feed_batch_assignments;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.feed_batch_assignments;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.feed_alerts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.feed_alerts;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.feed_alerts;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.feed_alerts;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.batch_feed_summary;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.batch_feed_summary;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.batch_feed_summary;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.batch_feed_summary;

-- Create policies for feed_batch_assignments
CREATE POLICY "Enable read access for all users" ON public.feed_batch_assignments FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.feed_batch_assignments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.feed_batch_assignments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.feed_batch_assignments FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for feed_alerts
CREATE POLICY "Enable read access for all users" ON public.feed_alerts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.feed_alerts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.feed_alerts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.feed_alerts FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for batch_feed_summary
CREATE POLICY "Enable read access for all users" ON public.batch_feed_summary FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.batch_feed_summary FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.batch_feed_summary FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.batch_feed_summary FOR DELETE USING (auth.role() = 'authenticated');

-- Step 8: Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS handle_updated_at ON public.feed_batch_assignments;
DROP TRIGGER IF EXISTS handle_updated_at ON public.feed_alerts;
DROP TRIGGER IF EXISTS handle_updated_at ON public.batch_feed_summary;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.feed_batch_assignments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.feed_alerts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.batch_feed_summary FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feed_batch_assignments_feed_id ON public.feed_batch_assignments(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_batch_assignments_chicken_batch_id ON public.feed_batch_assignments(chicken_batch_id);
CREATE INDEX IF NOT EXISTS idx_feed_batch_assignments_assigned_date ON public.feed_batch_assignments(assigned_date DESC);

CREATE INDEX IF NOT EXISTS idx_feed_alerts_alert_type ON public.feed_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_feed_alerts_severity ON public.feed_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_feed_alerts_acknowledged ON public.feed_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_feed_alerts_feed_id ON public.feed_alerts(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_alerts_chicken_batch_id ON public.feed_alerts(chicken_batch_id);

CREATE INDEX IF NOT EXISTS idx_batch_feed_summary_chicken_batch_id ON public.batch_feed_summary(chicken_batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_feed_summary_summary_date ON public.batch_feed_summary(summary_date DESC);

-- Step 10: Add table comments
COMMENT ON TABLE public.feed_batch_assignments IS 'Feed assignments to chicken batches for tracking allocation';
COMMENT ON TABLE public.feed_alerts IS 'Feed-related alerts for low stock, consumption gaps, and FCR deviations';
COMMENT ON TABLE public.batch_feed_summary IS 'End-of-batch feed summaries with FCR and cost analysis';

-- Step 11: Update existing feed_inventory records to set initial values
UPDATE public.feed_inventory 
SET 
    initial_quantity_kg = quantity_kg,
    remaining_kg = quantity_kg,
    total_cost = (number_of_bags * cost_per_bag)
WHERE initial_quantity_kg IS NULL;

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
-- You can now use the enhanced Feed Management features!
-- ==========================================

SELECT 'Feed Management Migration Completed Successfully!' as status;

