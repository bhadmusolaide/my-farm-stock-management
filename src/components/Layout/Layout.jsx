import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import './Layout.css'

const Layout = ({ children }) => {
  const location = useLocation()
  const { calculateStats } = useAppContext()
  const { user, logout, isAdmin } = useAuth()
  const { theme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)
  
  const stats = calculateStats()
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }
  
  const toggleUserMenu = () => {
    console.log('Toggling user menu, current state:', showUserMenu)
    setShowUserMenu(!showUserMenu)
  }
  
  const closeUserMenu = () => {
    setShowUserMenu(false)
  }
  
  const handleLogout = async () => {
    await logout()
    closeUserMenu()
  }
  
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-container">
            <h1>Omzo Farmz</h1>
          </div>
          
          <nav className={`main-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <ul>
              <li>
                <Link 
                  to="/" 
                  className={location.pathname === '/' ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  to="/chickens" 
                  className={location.pathname === '/chickens' ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  Orders
                </Link>
              </li>
              <li>
                <Link 
                  to="/stock" 
                  className={location.pathname === '/stock' ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  Inventory
                </Link>
              </li>
              <li>
                <Link 
                  to="/transactions" 
                  className={location.pathname === '/transactions' ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  Transactions
                </Link>
              </li>
              <li>
                <Link 
                  to="/reports" 
                  className={location.pathname === '/reports' ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  Reports
                </Link>
              </li>
              
              {/* User Menu moved inline with navigation */}
              <li className="nav-user-menu">
                <div className="balance-display">
                  <span className="balance-label">Current Balance:</span>
                  <span className="balance-amount">₦{stats.balance.toFixed(2)}</span>
                </div>
                <div className="user-menu-container" ref={userMenuRef}>
                  <button 
                     className="user-menu-trigger"
                     onClick={toggleUserMenu}
                     aria-label="User menu"
                     style={{ position: 'relative' }}
                   >
                     <div className="user-avatar">
                       {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                     </div>
                     <svg 
                       width="16" 
                       height="16" 
                       viewBox="0 0 24 24" 
                       fill="none" 
                       xmlns="http://www.w3.org/2000/svg"
                       className={`chevron ${showUserMenu ? 'open' : ''}`}
                     >
                       <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                     </svg>
                   </button>
                  
                  {showUserMenu && (
                    <div 
                      className="user-menu-dropdown" 
                      style={{
                        display: 'block', 
                        visibility: 'visible',
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        zIndex: '9999',
                        backgroundColor: 'white',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
                        borderRadius: '16px',
                        minWidth: '220px',
                        marginTop: '0.75rem'
                      }}
                    >
                      <div className="user-info">
                        <div className="user-details">
                          <div className="user-full-name">{user?.full_name}</div>
                          <div className="user-email">{user?.email}</div>
                          <div className="user-role">{user?.role?.charAt(0)?.toUpperCase() + user?.role?.slice(1)}</div>
                        </div>
                      </div>
                      
                      {isAdmin && (
                        <>
                          <div className="menu-divider"></div>
                          <div className="menu-section">
                            <Link 
                              to="/users" 
                              className="menu-item"
                              onClick={closeUserMenu}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              User Management
                            </Link>
                            <Link 
                              to="/audit" 
                              className="menu-item"
                              onClick={closeUserMenu}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Audit Trail
                            </Link>
                          </div>
                        </>
                      )}
                      
                      <div className="menu-divider"></div>
                      <button className="logout-btn" onClick={handleLogout}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l4-4-4-4m4 4H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </li>
            </ul>
          </nav>
          
          {/* Header right section with theme toggle */}
          <div className="header-right">
            <ThemeToggle />
          </div>
          
          <button 
            className="mobile-menu-toggle" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>
      
      <main className="app-main">
        {children}
      </main>
      
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Omzo Farmz Stock Manager</p>
      </footer>
    </div>
  )
}

export default Layout