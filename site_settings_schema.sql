-- Site Settings Schema Only (without default data)
-- Use this file when updating your schema to preserve existing site settings

-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id SERIAL PRIMARY KEY,
    settings_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at column
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS for the site_settings table
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create standard RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.site_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.site_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.site_settings;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.site_settings;

CREATE POLICY "Enable read access for all users" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.site_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.site_settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.site_settings FOR DELETE USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE public.site_settings IS 'Global site settings and configuration';