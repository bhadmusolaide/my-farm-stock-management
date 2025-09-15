-- Update the site settings to use the correct navigation structure with dropdown
UPDATE public.site_settings 
SET settings_data = '{
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
      {"id": "enhanced-feed", "label": "Enhanced Feed Management", "path": "/enhanced-feed", "enabled": true}
    ]},
    {"id": "transactions", "label": "Transactions", "path": "/transactions", "icon": "💰", "enabled": true, "order": 4},
    {"id": "reports", "label": "Reports", "path": "/reports", "icon": "📈", "enabled": true, "order": 5}
  ]
}'
WHERE id = 1;