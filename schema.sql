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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Create RLS policies for chickens table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.chickens;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.chickens;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.chickens;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.chickens;
CREATE POLICY "Enable read access for all users" ON public.chickens FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.chickens FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.chickens FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.chickens FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for stock table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stock;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.stock;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.stock;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.stock;
CREATE POLICY "Enable read access for all users" ON public.stock FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.stock FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.stock FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.stock FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for transactions table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.transactions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.transactions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.transactions;
CREATE POLICY "Enable read access for all users" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.transactions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.transactions FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for balance table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.balance;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.balance;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.balance;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.balance;
CREATE POLICY "Enable read access for all users" ON public.balance FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.balance FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.balance FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.balance FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for users table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.users;
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.users FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.users FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for audit_logs table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.audit_logs;
CREATE POLICY "Enable read access for all users" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.audit_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.audit_logs FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for live_chickens table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.live_chickens;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.live_chickens;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.live_chickens;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.live_chickens;
CREATE POLICY "Enable read access for all users" ON public.live_chickens FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.live_chickens FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.live_chickens FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.live_chickens FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for feed_inventory table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.feed_inventory;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.feed_inventory;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.feed_inventory;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.feed_inventory;
CREATE POLICY "Enable read access for all users" ON public.feed_inventory FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.feed_inventory FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.feed_inventory FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.feed_inventory FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for feed_consumption table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.feed_consumption;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.feed_consumption;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.feed_consumption;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.feed_consumption;
CREATE POLICY "Enable read access for all users" ON public.feed_consumption FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.feed_consumption FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.feed_consumption FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.feed_consumption FOR DELETE USING (auth.role() = 'authenticated');

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

-- Insert default site settings
INSERT INTO public.site_settings (settings_data) VALUES ('{
  "siteTitle": "Farm Stock Management",
  "logoType": "text",
  "logoUrl": "",
  "loginTitle": "Farm Stock Management",
  "loginLogoType": "svg",
  "loginLogoUrl": "",
  "navigationItems": [
    {"id": "dashboard", "label": "Dashboard", "path": "/", "icon": "📊", "enabled": true},
    {"id": "chickens", "label": "Chicken Orders", "path": "/chickens", "icon": "🐔", "enabled": true},
    {"id": "stock", "label": "Stock Management", "path": "/stock", "icon": "📦", "enabled": true},
    {"id": "live-chickens", "label": "Live Chickens", "path": "/live-chickens", "icon": "🐓", "enabled": true},
    {"id": "feed", "label": "Feed Management", "path": "/feed", "icon": "🌾", "enabled": true},
    {"id": "transactions", "label": "Transactions", "path": "/transactions", "icon": "💰", "enabled": true},
    {"id": "reports", "label": "Reports", "path": "/reports", "icon": "📈", "enabled": true}
  ]
}') ON CONFLICT DO NOTHING;

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