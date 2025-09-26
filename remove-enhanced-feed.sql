-- Update site_settings to remove Enhanced Feed Management from navigation
UPDATE public.site_settings 
SET settings_data = jsonb_set(
  settings_data,
  '{navigationItems,2,children}',
  (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(settings_data->'navigationItems'->2->'children') elem
    WHERE elem->>'id' != 'enhanced-feed'
  )
)
WHERE id = 1;