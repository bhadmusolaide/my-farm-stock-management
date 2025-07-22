# 🐔 Omzo-Farmz Stock Management System

A modern, full-featured web application for managing chicken stock inventory, orders, transactions, and business operations. Built with React, Vite, and Supabase.

## ✨ Features

### 📊 **Dashboard & Analytics**
- Real-time business metrics and KPIs
- Interactive charts and data visualization
- Quick overview of orders, stock, and financial status

### 🛒 **Order Management**
- Create and manage chicken orders
- Track customer information and delivery locations
- Monitor order status (pending, completed, cancelled)
- Calculate balances and payment tracking

### 📦 **Stock Inventory**
- Track chicken stock levels and sizes
- Monitor cost per kg and total inventory value
- Add new stock entries with detailed descriptions
- Real-time stock level updates

### 💰 **Financial Management**
- Record funds, expenses, and withdrawals
- Track stock-related expenses
- Monitor cash flow and balance
- Generate financial reports

### 📈 **Reports & Analytics**
- Generate comprehensive business reports
- Export data for external analysis
- Track performance metrics over time

### 👥 **User Management** (Admin Only)
- Create and manage user accounts
- Role-based access control (Admin/User)
- User activation/deactivation
- Audit trail for all user actions

### 🔍 **Audit Trail**
- Complete activity logging
- Track all CRUD operations
- User action history
- Security and compliance monitoring

### 🎨 **Modern UI/UX**
- Responsive design for all devices
- Dark mode support
- Loading states and error handling
- Toast notifications for user feedback
- Professional and intuitive interface

## 🚀 Tech Stack

- **Frontend:** React 18, Vite, React Router
- **Backend:** Supabase (PostgreSQL, Authentication, Real-time)
- **Styling:** CSS3 with modern design patterns
- **State Management:** React Context API
- **Build Tool:** Vite
- **Deployment:** Ready for Vercel, Netlify, or any static hosting

## 📋 Prerequisites

- Node.js 16+ and npm
- Supabase account
- Modern web browser

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd omzo-farmz
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `schema.sql` in your Supabase SQL Editor
3. Configure Row Level Security (RLS) policies

### 5. Create Admin User
Since the app doesn't have public registration, create your first admin user:

**Option A: Direct Database Insert**
```sql
INSERT INTO public.users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES (
  'admin-' || extract(epoch from now()),
  'admin@yourcompany.com',
  'temp_password_hash',
  'System Administrator',
  'admin',
  true,
  NOW(),
  NOW()
);
```

Then set up Supabase Auth for this user in your Supabase Dashboard.

### 6. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to access the application.

## 🏗️ Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ErrorBoundary/   # Error handling
│   ├── Layout/          # App layout and navigation
│   ├── LoadingSpinner/  # Loading states
│   ├── Notification/    # Toast notifications
│   └── UI/              # UI components
├── context/             # React Context providers
│   ├── AppContext.jsx   # App state management
│   ├── AuthContext.jsx  # Authentication
│   └── NotificationContext.jsx # Notifications
├── hooks/               # Custom React hooks
├── pages/               # Application pages/routes
│   ├── Dashboard.jsx
│   ├── ChickenOrders.jsx
│   ├── StockInventory.jsx
│   ├── Transactions.jsx
│   ├── Reports.jsx
│   ├── UserManagement.jsx
│   ├── AuditTrail.jsx
│   └── Login.jsx
├── utils/               # Utility functions
│   └── validation.js    # Form validation
├── App.jsx              # Main app component
├── main.jsx             # App entry point
└── supabaseClient.js    # Supabase configuration
```

## 🔐 Security Features

- **Row Level Security (RLS)** on all database tables
- **Role-based access control** (Admin/User permissions)
- **Secure authentication** with Supabase Auth
- **Input validation** and sanitization
- **Audit logging** for all operations
- **Environment variable protection**

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Netlify
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables

### Other Static Hosts
The `dist/` folder can be deployed to any static hosting service.

## 🔧 Configuration

### Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Database Configuration
Refer to `schema.sql` for the complete database schema including:
- Tables for chickens, stock, transactions, users, audit logs
- Indexes for performance optimization
- Triggers for automatic timestamp updates
- RLS policies for security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced reporting and analytics
- [ ] Integration with accounting software
- [ ] Multi-location support
- [ ] Automated notifications and alerts
- [ ] Inventory forecasting
- [ ] Customer portal

---

**Built with ❤️ for efficient chicken stock management**

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
