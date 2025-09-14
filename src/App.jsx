import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AppProvider } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import Layout from './components/Layout/Layout'
import MigrationPrompt from './components/UI/MigrationPrompt'
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner'
import { useAppContext } from './context/AppContext'

// Lazy load page components for better code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ChickenOrders = lazy(() => import('./pages/ChickenOrders'))
const StockInventory = lazy(() => import('./pages/StockInventory'))
const LiveChickenStock = lazy(() => import('./pages/LiveChickenStock'))
const FeedManagement = lazy(() => import('./pages/FeedManagement'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Reports = lazy(() => import('./pages/Reports'))
const Login = lazy(() => import('./pages/Login'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const AuditTrail = lazy(() => import('./pages/AuditTrail'))
const SiteSettings = lazy(() => import('./pages/SiteSettings'))
const ChickenLifecycle = lazy(() => import('./pages/ChickenLifecycle'))
const EnhancedFeedManagement = lazy(() => import('./pages/EnhancedFeedManagement'))
const ProcessingManagement = lazy(() => import('./pages/ProcessingManagement'))
const BatchRelationshipMapping = lazy(() => import('./pages/BatchRelationshipMapping'))
const UnifiedInventoryDashboard = lazy(() => import('./pages/UnifiedInventoryDashboard'))

// Import theme styles
import './styles/theme.css'
import './styles/DarkModeOverride.css'


// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh'
      }}>
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Admin Route Component
function AdminRoute({ children }) {
  const { isAdmin } = useAuth()
  
  return isAdmin ? children : <Navigate to="/" replace />
}

function AppContent() {
  const { migrationStatus } = useAppContext()
  const { isAuthenticated } = useAuth()
  
  // Show migration prompt if needed (only for authenticated users)
  if (isAuthenticated && migrationStatus.needed && !migrationStatus.completed && !migrationStatus.inProgress) {
    return <MigrationPrompt />
  }
  
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh'
      }}>
        <LoadingSpinner size="large" text="Loading page..." />
      </div>
    }>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/chickens" element={
          <ProtectedRoute>
            <Layout>
              <ChickenOrders />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/stock" element={
          <ProtectedRoute>
            <Layout>
              <StockInventory />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/live-chickens" element={
          <ProtectedRoute>
            <Layout>
              <LiveChickenStock />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/lifecycle" element={
          <ProtectedRoute>
            <Layout>
              <ChickenLifecycle />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/feed" element={
          <ProtectedRoute>
            <Layout>
              <FeedManagement />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/enhanced-feed" element={
          <ProtectedRoute>
            <Layout>
              <EnhancedFeedManagement />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/processing" element={
          <ProtectedRoute>
            <Layout>
              <ProcessingManagement />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/batch-relationships" element={
          <ProtectedRoute>
            <Layout>
              <BatchRelationshipMapping />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/unified-inventory" element={
          <ProtectedRoute>
            <Layout>
              <UnifiedInventoryDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute>
            <Layout>
              <Transactions />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <UserManagement />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        } />
        <Route path="/audit" element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <AuditTrail />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <SiteSettings />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <SiteSettingsProvider>
            <AuthProvider>
              <AppProvider>
                <NotificationProvider>
                  <AppContent />
                </NotificationProvider>
              </AppProvider>
            </AuthProvider>
          </SiteSettingsProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App