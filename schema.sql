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

-- Note: Admin users should be created through the application interface

-- Enable Row Level Security (RLS)
ALTER TABLE public.chickens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

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