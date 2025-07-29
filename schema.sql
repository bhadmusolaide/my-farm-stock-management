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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    id TEXT PRIMARY KEY,
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
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id),
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout'
    table_name TEXT, -- 'chickens', 'stock', 'transactions', etc.
    record_id TEXT, -- ID of the affected record
    old_values JSONB, -- Previous values (for updates/deletes)
    new_values JSONB, -- New values (for creates/updates)
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial balance record
INSERT INTO public.balance (amount) VALUES (0) ON CONFLICT DO NOTHING;

-- Add location column to existing chickens table (if it doesn't exist)
ALTER TABLE public.chickens ADD COLUMN IF NOT EXISTS location TEXT;

-- Add calculation_mode column to existing tables (if they don't exist)
ALTER TABLE public.chickens ADD COLUMN IF NOT EXISTS calculation_mode TEXT DEFAULT 'count_size_cost';
ALTER TABLE public.stock ADD COLUMN IF NOT EXISTS calculation_mode TEXT DEFAULT 'count_size_cost';

-- Create live_chickens table for batch tracking
CREATE TABLE IF NOT EXISTS public.live_chickens (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    batchId TEXT NOT NULL, -- Frontend compatibility
    breed TEXT NOT NULL,
    initial_count INTEGER NOT NULL,
    initialCount INTEGER NOT NULL, -- Frontend compatibility
    current_count INTEGER NOT NULL,
    currentCount INTEGER NOT NULL, -- Frontend compatibility
    hatch_date DATE NOT NULL,
    hatchDate DATE NOT NULL, -- Frontend compatibility
    expected_weight DECIMAL(10,2),
    expectedWeight DECIMAL(10,2), -- Frontend compatibility
    current_weight DECIMAL(10,2),
    currentWeight DECIMAL(10,2), -- Frontend compatibility
    feed_type TEXT,
    feedType TEXT, -- Frontend compatibility
    status TEXT NOT NULL DEFAULT 'healthy', -- 'healthy', 'sick', 'quarantine'
    mortality INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Frontend compatibility
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feed_inventory table
CREATE TABLE IF NOT EXISTS public.feed_inventory (
    id TEXT PRIMARY KEY,
    feed_type TEXT NOT NULL,
    feedType TEXT NOT NULL, -- Frontend compatibility
    brand TEXT,
    quantity_kg DECIMAL(10,2) NOT NULL,
    quantityKg DECIMAL(10,2) NOT NULL, -- Frontend compatibility
    cost_per_kg DECIMAL(10,2) NOT NULL,
    costPerKg DECIMAL(10,2) NOT NULL, -- Frontend compatibility
    supplier TEXT,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    purchaseDate DATE NOT NULL DEFAULT CURRENT_DATE, -- Frontend compatibility
    expiry_date DATE,
    expiryDate DATE, -- Frontend compatibility
    batch_number TEXT,
    batchNumber TEXT, -- Frontend compatibility
    status TEXT DEFAULT 'active', -- 'active', 'expired', 'consumed'
    date DATE NOT NULL DEFAULT CURRENT_DATE, -- Frontend compatibility
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Frontend compatibility
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feed_consumption table
CREATE TABLE IF NOT EXISTS public.feed_consumption (
    id TEXT PRIMARY KEY,
    feed_id TEXT REFERENCES public.feed_inventory(id),
    feedId TEXT REFERENCES public.feed_inventory(id), -- Frontend compatibility
    chicken_batch_id TEXT REFERENCES public.live_chickens(id),
    chickenBatchId TEXT REFERENCES public.live_chickens(id), -- Frontend compatibility
    quantity_consumed DECIMAL(10,2) NOT NULL,
    quantityConsumed DECIMAL(10,2) NOT NULL, -- Frontend compatibility
    consumption_date DATE NOT NULL DEFAULT CURRENT_DATE,
    consumptionDate DATE NOT NULL DEFAULT CURRENT_DATE, -- Frontend compatibility
    date DATE NOT NULL DEFAULT CURRENT_DATE, -- Frontend compatibility
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Frontend compatibility
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Admin users should be created through the application interface

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.chickens;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.stock;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.transactions;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.balance;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable all operations for anonymous users" ON public.chickens;
DROP POLICY IF EXISTS "Enable all operations for anonymous users" ON public.stock;
DROP POLICY IF EXISTS "Enable all operations for anonymous users" ON public.transactions;
DROP POLICY IF EXISTS "Enable all operations for anonymous users" ON public.balance;
DROP POLICY IF EXISTS "Enable all operations for anonymous users" ON public.users;
DROP POLICY IF EXISTS "Enable all operations for anonymous users" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.live_chickens;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.feed_inventory;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.feed_consumption;
DROP POLICY IF EXISTS "Enable all operations for anonymous users" ON public.live_chickens;
DROP POLICY IF EXISTS "Enable all operations for anonymous users" ON public.feed_inventory;
DROP POLICY IF EXISTS "Enable all operations for anonymous users" ON public.feed_consumption;

-- Create policies for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON public.chickens
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.stock
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.transactions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.balance
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.users
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.audit_logs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.live_chickens
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.feed_inventory
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.feed_consumption
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for anonymous users (if needed)
CREATE POLICY "Enable all operations for anonymous users" ON public.chickens
    FOR ALL USING (auth.role() = 'anon');

CREATE POLICY "Enable all operations for anonymous users" ON public.stock
    FOR ALL USING (auth.role() = 'anon');

CREATE POLICY "Enable all operations for anonymous users" ON public.transactions
    FOR ALL USING (auth.role() = 'anon');

CREATE POLICY "Enable all operations for anonymous users" ON public.balance
    FOR ALL USING (auth.role() = 'anon');

CREATE POLICY "Enable all operations for anonymous users" ON public.users
    FOR ALL USING (auth.role() = 'anon');

CREATE POLICY "Enable all operations for anonymous users" ON public.audit_logs
    FOR ALL USING (auth.role() = 'anon');

CREATE POLICY "Enable all operations for anonymous users" ON public.live_chickens
    FOR ALL USING (auth.role() = 'anon');

CREATE POLICY "Enable all operations for anonymous users" ON public.feed_inventory
    FOR ALL USING (auth.role() = 'anon');

CREATE POLICY "Enable all operations for anonymous users" ON public.feed_consumption
    FOR ALL USING (auth.role() = 'anon');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chickens_date ON public.chickens(date DESC);
CREATE INDEX IF NOT EXISTS idx_chickens_status ON public.chickens(status);
CREATE INDEX IF NOT EXISTS idx_stock_date ON public.stock(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_chickens_batch_id ON public.live_chickens(batch_id);
CREATE INDEX IF NOT EXISTS idx_live_chickens_batchId ON public.live_chickens(batchId);
CREATE INDEX IF NOT EXISTS idx_live_chickens_breed ON public.live_chickens(breed);
CREATE INDEX IF NOT EXISTS idx_live_chickens_status ON public.live_chickens(status);
CREATE INDEX IF NOT EXISTS idx_live_chickens_hatch_date ON public.live_chickens(hatch_date DESC);
CREATE INDEX IF NOT EXISTS idx_live_chickens_hatchDate ON public.live_chickens(hatchDate DESC);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_feed_type ON public.feed_inventory(feed_type);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_purchase_date ON public.feed_inventory(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_purchaseDate ON public.feed_inventory(purchaseDate DESC);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_expiry_date ON public.feed_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_expiryDate ON public.feed_inventory(expiryDate);
CREATE INDEX IF NOT EXISTS idx_feed_consumption_feed_id ON public.feed_consumption(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_consumption_chicken_batch_id ON public.feed_consumption(chicken_batch_id);
CREATE INDEX IF NOT EXISTS idx_feed_consumption_date ON public.feed_consumption(consumption_date DESC);
CREATE INDEX IF NOT EXISTS idx_feed_consumption_consumptionDate ON public.feed_consumption(consumptionDate DESC);
CREATE INDEX IF NOT EXISTS idx_feed_consumption_frontend_date ON public.feed_consumption(date DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_chickens_updated_at ON public.chickens;
DROP TRIGGER IF EXISTS update_stock_updated_at ON public.stock;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
DROP TRIGGER IF EXISTS update_balance_updated_at ON public.balance;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_live_chickens_updated_at ON public.live_chickens;
DROP TRIGGER IF EXISTS update_feed_inventory_updated_at ON public.feed_inventory;
DROP TRIGGER IF EXISTS update_feed_consumption_updated_at ON public.feed_consumption;

-- Create triggers for updated_at columns
CREATE TRIGGER update_chickens_updated_at
    BEFORE UPDATE ON public.chickens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_updated_at
    BEFORE UPDATE ON public.stock
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balance_updated_at
    BEFORE UPDATE ON public.balance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_chickens_updated_at
    BEFORE UPDATE ON public.live_chickens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feed_inventory_updated_at
    BEFORE UPDATE ON public.feed_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feed_consumption_updated_at
    BEFORE UPDATE ON public.feed_consumption
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();