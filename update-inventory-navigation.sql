-- Update only the inventory navigation section to ensure it has the correct items
UPDATE public.site_settings 
SET settings_data = jsonb_set(
  settings_data,
  '{navigationItems,2,children}',
  '[
    {"id": "stock", "label": "General Stock", "path": "/stock", "enabled": true},
    {"id": "live-chickens", "label": "Live Chicken Stock", "path": "/live-chickens", "enabled": true},
    {"id": "lifecycle", "label": "Lifecycle Tracking", "path": "/lifecycle", "enabled": true},
    {"id": "feed", "label": "Feed Management", "path": "/feed", "enabled": true},
    {"id": "enhanced-feed", "label": "Enhanced Feed Management", "path": "/enhanced-feed", "enabled": true},
    {"id": "dressed-chicken", "label": "Dressed Chicken Stock", "path": "/dressed-chicken", "enabled": true}
  ]'::jsonb
)
WHERE id = 1;