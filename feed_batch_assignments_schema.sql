-- Feed Batch Assignments Schema
-- This creates a many-to-many relationship between feed inventory and live chicken batches
-- Run this SQL in your Supabase SQL Editor after the main schema.sql

-- Create feed_batch_assignments table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.feed_batch_assignments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    feed_id TEXT NOT NULL REFERENCES public.feed_inventory(id) ON DELETE CASCADE,
    chicken_batch_id TEXT NOT NULL REFERENCES public.live_chickens(id) ON DELETE CASCADE,
    assigned_quantity_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of feed and batch
    UNIQUE(feed_id, chicken_batch_id)
);

-- Add deduct_from_balance field to feed_inventory table
ALTER TABLE public.feed_inventory 
ADD COLUMN IF NOT EXISTS deduct_from_balance BOOLEAN DEFAULT false;

-- Add notes field to track balance deduction
ALTER TABLE public.feed_inventory 
ADD COLUMN IF NOT EXISTS balance_deducted BOOLEAN DEFAULT false;

-- Enable RLS for feed_batch_assignments
ALTER TABLE public.feed_batch_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies are now handled by the main schema.sql file
-- This avoids duplication and ensures consistency

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.feed_batch_assignments 
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feed_batch_assignments_feed_id ON public.feed_batch_assignments(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_batch_assignments_chicken_batch_id ON public.feed_batch_assignments(chicken_batch_id);
CREATE INDEX IF NOT EXISTS idx_feed_batch_assignments_assigned_date ON public.feed_batch_assignments(assigned_date DESC);

-- Add comments for documentation
COMMENT ON TABLE public.feed_batch_assignments IS 'Many-to-many relationship between feed inventory and live chicken batches';
COMMENT ON COLUMN public.feed_inventory.deduct_from_balance IS 'Whether to deduct feed cost from current balance when adding stock';
COMMENT ON COLUMN public.feed_inventory.balance_deducted IS 'Whether the feed cost has been deducted from balance';