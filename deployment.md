# Deployment Instructions

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open http://localhost:5173

## Production Deployment

### Supabase Configuration

1. Create a Supabase project at https://supabase.com
2. Update `.env` with your Supabase URL and keys:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Single Page Application (SPA) Routing Fix

To fix 404 errors on page refresh in production, configure your web server to serve `index.html` for all non-static routes:

#### Nginx Configuration
Add to your nginx.conf or site configuration:
```
server {
    listen 80;
    server_name yourdomain.com;
    
    root /path/to/your/build;
    index index.html;
    
    # Handle React Router - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

#### Apache Configuration (.htaccess)
Create or update `.htaccess` in your build directory:
```
RewriteEngine On
RewriteBase /

# Don't rewrite files or directories
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Rewrite all other URLs to index.html
RewriteRule . /index.html [L]
```

#### Netlify Configuration
In `netlify.toml`:
```
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Vercel Configuration
In `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Firebase Hosting Configuration
In `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Build for Production

1. Build the project: `npm run build`
2. The production build will be in the `dist` folder
3. Deploy the contents of `dist` to your web server

### Environment Variables

Ensure your `.env` file contains the correct Supabase configuration:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Database Setup

1. Run the `schema.sql` file in your Supabase SQL Editor to create all tables
2. The default admin user is:
   - Email: `admin@farmstock.com`
   - Password: `admin123`
3. Update the password hash in production for security

### Local Storage Fallback

The app uses localStorage as fallback when Supabase is not available. For production, ensure proper error handling and consider using a proper database.

### Common Issues

1. **404 on refresh**: Ensure server configuration serves index.html for all routes
2. **Supabase connection**: Verify your Supabase URL and keys in .env
3. **CORS errors**: Make sure your Supabase project allows requests from your domain
4. **Authentication**: The app uses Supabase Auth - ensure proper configuration

### Testing

1. Test all navigation routes
2. Verify Supabase integration for data persistence
3. Check responsive design on mobile devices
4. Test with and without internet connection (localStorage fallback)