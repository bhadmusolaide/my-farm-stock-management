# Site Settings Preservation Guide

This document explains how to update your Supabase schema without overwriting existing site settings.

## The Problem

When running the full [schema.sql](file:///c:/Users/USER/Documents/my-farm-stock-management-master/schema.sql) file in Supabase, existing site settings (site name, navigation names, etc.) get overwritten because the schema contains default data insertion statements.

## The Solution

### 1. Updated Schema File

The main [schema.sql](file:///c:/Users/USER/Documents/my-farm-stock-management-master/schema.sql) file has been modified to only insert default settings if no settings exist:

```sql
INSERT INTO public.site_settings (settings_data)
SELECT '{...}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);
```

This ensures that existing settings are preserved when updating the schema.

### 2. Enhanced SiteSettingsContext

The [SiteSettingsContext.jsx](file:///c:/Users/USER/Documents/my-farm-stock-management-master/src/context/SiteSettingsContext.jsx) file has been updated with additional checks to prevent overwriting existing settings during initialization.

### 3. Separate Site Settings Schema File

A new file `site_settings_schema.sql` contains only the site settings table schema without any default data. Use this file when you need to update only the site settings table structure.

## Best Practices for Future Schema Updates

1. **For full schema updates**: Run the main [schema.sql](file:///c:/Users/USER/Documents/my-farm-stock-management-master/schema.sql) file. The updated logic will preserve your existing settings.

2. **For site settings table updates only**: Use the `site_settings_schema.sql` file to update just the site settings table structure.

3. **For manual verification**: Before running any schema updates, you can check if settings exist:
   ```sql
   SELECT COUNT(*) FROM site_settings;
   ```

## How It Works

1. The schema uses `WHERE NOT EXISTS` to only insert default settings when no settings are present
2. The SiteSettingsContext checks for existing settings before initializing defaults
3. The upsert functionality ensures settings can be updated without creating duplicates

This approach ensures your custom site settings are preserved across schema updates while still providing sensible defaults for new installations.