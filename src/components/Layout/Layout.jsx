import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppContext } from '../../context'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import './Layout.css'

const Layout = ({ children }) => {
  const location = useLocation()
  const { calculateStats, balance } = useAppContext()
  const { user, logout, isAdmin } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSiteSettings()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showInventoryDropdown, setShowInventoryDropdown] = useState(false)
  const userMenuRef = useRef(null)
  const inventoryDropdownRef = useRef(null)

  const stats = calculateStats()
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is inside a modal by looking for modal-overlay class
      const isInsideModal = event.target.closest('.modal-overlay');
      
      // Only close menus if click is not inside a modal
      if (!isInsideModal) {
        if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
          setShowUserMenu(false)
        }
        if (inventoryDropdownRef.current && !inventoryDropdownRef.current.contains(event.target)) {
          setShowInventoryDropdown(false)
        }
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
    setShowInventoryDropdown(false)
  }
  
  const toggleUserMenu = () => {
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
            {settings.logoType === 'text' ? (
              <h1>{settings.siteTitle}</h1>
            ) : settings.logoType === 'image' || settings.logoType === 'url' ? (
              <div className="logo-with-text">
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt={settings.siteTitle} className="site-logo" />
                )}
                <h1>{settings.siteTitle}</h1>
              </div>
            ) : (
              <h1>{settings.siteTitle}</h1>
            )}
          </div>
          
          <nav className={`main-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <ul>
              {settings.navigationItems
                .filter(item => item.enabled)
                .sort((a, b) => a.order - b.order)
                .map(item => {
                  if (item.isDropdown && item.children) {
                    return (
                      <li key={item.id} className="nav-dropdown" ref={inventoryDropdownRef}>
                        <button 
                          className={`nav-dropdown-trigger ${
                            item.children.some(child => location.pathname === child.path) ? 'active' : ''
                          }`}
                          onClick={() => setShowInventoryDropdown(!showInventoryDropdown)}
                        >
                          {item.label}
                          <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            className={`dropdown-chevron ${showInventoryDropdown ? 'open' : ''}`}
                          >
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        {showInventoryDropdown && (
                          <div className="nav-dropdown-menu">
                            {item.children
                              .filter(child => child.enabled)
                              .map(child => (
                                <Link 
                                  key={child.id}
                                  to={child.path} 
                                  className={location.pathname === child.path ? 'active' : ''}
                                  onClick={closeMobileMenu}
                                >
                                  {child.label}
                                </Link>
                              ))
                            }
                          </div>
                        )}
                      </li>
                    )
                  } else {
                    return (
                      <li key={item.id}>
                        <Link 
                          to={item.path} 
                          className={location.pathname === item.path ? 'active' : ''}
                          onClick={closeMobileMenu}
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  }
                })
              }
              
              {/* User Menu moved inline with navigation */}
              <li className="nav-user-menu">
                <div className="balance-display">
                  <span className="balance-label">Current Balance:</span>
                  <span className="balance-amount">₦{(balance || 0).toFixed(2)}</span>
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
                            <Link 
                              to="/settings" 
                              className="menu-item"
                              onClick={closeUserMenu}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Site Settings
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