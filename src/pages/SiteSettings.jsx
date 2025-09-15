import { useState, useRef } from 'react'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { useNotification } from '../context/NotificationContext'
import './SiteSettings.css'

const SiteSettings = () => {
  const { settings, updateSettings, updateNavigationItems, resetToDefaults, uploadImage, loading } = useSiteSettings()
  const { showSuccess, showError } = useNotification()
  const [activeTab, setActiveTab] = useState('general')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)
  const loginFileInputRef = useRef(null)

  const handleSiteSettingsUpdate = async (field, value) => {
    try {
      await updateSettings({ [field]: value })
      showSuccess('Settings updated successfully')
    } catch (error) {
      showError('Failed to update settings')
    }
  }

  const handleImageUpload = async (file, type) => {
    if (!file) return

    setIsUploading(true)
    try {
      const imageDataUrl = await uploadImage(file)
      if (type === 'logo') {
        await updateSettings({ logoUrl: imageDataUrl, logoType: 'image' })
      } else if (type === 'loginLogo') {
        await updateSettings({ loginLogoUrl: imageDataUrl, loginLogoType: 'image' })
      }
      showSuccess('Image uploaded successfully')
    } catch (error) {
      showError(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlLogo = async (url, type) => {
    try {
      if (type === 'logo') {
        await updateSettings({ logoUrl: url, logoType: 'url' })
      } else if (type === 'loginLogo') {
        await updateSettings({ loginLogoUrl: url, loginLogoType: 'url' })
      }
      showSuccess('Logo URL updated successfully')
    } catch (error) {
      showError('Failed to update logo URL')
    }
  }

  const handleNavigationReorder = async (dragIndex, hoverIndex) => {
    try {
      const dragItem = settings.navigationItems[dragIndex]
      const newItems = [...settings.navigationItems]
      newItems.splice(dragIndex, 1)
      newItems.splice(hoverIndex, 0, dragItem)
      
      // Update order values
      const reorderedItems = newItems.map((item, index) => ({
        ...item,
        order: index + 1
      }))
      
      await updateNavigationItems(reorderedItems)
    } catch (error) {
      showError('Failed to reorder navigation items')
    }
  }

  const handleNavigationToggle = async (itemId) => {
    try {
      const updatedItems = settings.navigationItems.map(item => 
        item.id === itemId ? { ...item, enabled: !item.enabled } : item
      )
      await updateNavigationItems(updatedItems)
      showSuccess('Navigation updated successfully')
    } catch (error) {
      showError('Failed to update navigation')
    }
  }

  const handleNavigationLabelChange = async (itemId, newLabel) => {
    try {
      const updatedItems = settings.navigationItems.map(item => 
        item.id === itemId ? { ...item, label: newLabel } : item
      )
      await updateNavigationItems(updatedItems)
    } catch (error) {
      showError('Failed to update navigation label')
    }
  }

  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      try {
        await resetToDefaults()
        showSuccess('Settings reset to defaults')
      } catch (error) {
        showError('Failed to reset settings')
      }
    }
  }

  const moveItem = async (fromIndex, toIndex) => {
    try {
      const newItems = [...settings.navigationItems]
      const [movedItem] = newItems.splice(fromIndex, 1)
      newItems.splice(toIndex, 0, movedItem)
      
      const reorderedItems = newItems.map((item, index) => ({
        ...item,
        order: index + 1
      }))
      
      await updateNavigationItems(reorderedItems)
    } catch (error) {
      showError('Failed to move navigation item')
    }
  }

  if (loading) {
    return (
      <div className="site-settings">
        <div className="page-header">
          <h1>Site Settings</h1>
        </div>
        <div className="loading-container">
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="site-settings">
      <div className="page-header">
        <h1>Site Settings</h1>
        <p>Customize your application's appearance and navigation</p>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          <button 
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            General
          </button>
          <button 
            className={`tab-button ${activeTab === 'navigation' ? 'active' : ''}`}
            onClick={() => setActiveTab('navigation')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Navigation
          </button>
          <button 
            className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Login Page
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2>General Settings</h2>
              
              <div className="setting-group">
                <label htmlFor="siteTitle">Site Title</label>
                <input
                  type="text"
                  id="siteTitle"
                  value={settings.siteTitle}
                  onChange={(e) => handleSiteSettingsUpdate('siteTitle', e.target.value)}
                  placeholder="Enter site title"
                />
                <small>This will appear in the header navigation</small>
              </div>

              <div className="setting-group">
                <label>Logo</label>
                <div className="logo-options">
                  <div className="logo-option">
                    <input
                      type="radio"
                      id="logoText"
                      name="logoType"
                      value="text"
                      checked={settings.logoType === 'text'}
                      onChange={() => handleSiteSettingsUpdate('logoType', 'text')}
                    />
                    <label htmlFor="logoText">Text Only</label>
                  </div>
                  
                  <div className="logo-option">
                    <input
                      type="radio"
                      id="logoImage"
                      name="logoType"
                      value="image"
                      checked={settings.logoType === 'image'}
                      onChange={() => handleSiteSettingsUpdate('logoType', 'image')}
                    />
                    <label htmlFor="logoImage">Upload Image</label>
                  </div>
                  
                  <div className="logo-option">
                    <input
                      type="radio"
                      id="logoUrl"
                      name="logoType"
                      value="url"
                      checked={settings.logoType === 'url'}
                      onChange={() => handleSiteSettingsUpdate('logoType', 'url')}
                    />
                    <label htmlFor="logoUrl">Image URL</label>
                  </div>
                </div>

                {settings.logoType === 'image' && (
                  <div className="upload-section">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'logo')}
                      style={{ display: 'none' }}
                    />
                    <button 
                      className="upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Choose Image'}
                    </button>
                    {settings.logoUrl && (
                      <div className="logo-preview">
                        <img src={settings.logoUrl} alt="Logo preview" />
                      </div>
                    )}
                  </div>
                )}

                {settings.logoType === 'url' && (
                  <div className="url-section">
                    <input
                      type="url"
                      placeholder="Enter image URL"
                      value={settings.logoUrl}
                      onChange={(e) => handleUrlLogo(e.target.value, 'logo')}
                    />
                    {settings.logoUrl && (
                      <div className="logo-preview">
                        <img src={settings.logoUrl} alt="Logo preview" onError={(e) => e.target.style.display = 'none'} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'navigation' && (
            <div className="settings-section">
              <h2>Navigation Settings</h2>
              <p>Drag and drop to reorder navigation items. Toggle to enable/disable items.</p>
              
              <div className="navigation-list">
                {settings.navigationItems.map((item, index) => (
                  <div key={item.id} className="nav-item">
                    <div className="nav-item-header">
                      <div className="drag-handle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="9" cy="12" r="1" fill="currentColor"/>
                          <circle cx="9" cy="5" r="1" fill="currentColor"/>
                          <circle cx="9" cy="19" r="1" fill="currentColor"/>
                          <circle cx="15" cy="12" r="1" fill="currentColor"/>
                          <circle cx="15" cy="5" r="1" fill="currentColor"/>
                          <circle cx="15" cy="19" r="1" fill="currentColor"/>
                        </svg>
                      </div>
                      
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleNavigationLabelChange(item.id, e.target.value)}
                        className="nav-label-input"
                      />
                      
                      <div className="nav-controls">
                        <button
                          className="move-btn"
                          onClick={() => moveItem(index, Math.max(0, index - 1))}
                          disabled={index === 0}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          className="move-btn"
                          onClick={() => moveItem(index, Math.min(settings.navigationItems.length - 1, index + 1))}
                          disabled={index === settings.navigationItems.length - 1}
                          title="Move down"
                        >
                          ↓
                        </button>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={() => handleNavigationToggle(item.id)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    {item.children && (
                      <div className="nav-children">
                        <div className="nav-children-header">
                          <span>Sub-menu Items</span>
                        </div>
                        {item.children.map(child => (
                          <div key={child.id} className="nav-child-item">
                            <div className="child-item-content">
                              <input
                                type="text"
                                value={child.label}
                                onChange={(e) => {
                                  const updatedItems = settings.navigationItems.map(navItem =>
                                    navItem.id === item.id
                                      ? {
                                          ...navItem,
                                          children: navItem.children.map(childItem =>
                                            childItem.id === child.id
                                              ? { ...childItem, label: e.target.value }
                                              : childItem
                                          )
                                        }
                                      : navItem
                                  )
                                  ;(async () => {
                                    try {
                                      await updateNavigationItems(updatedItems)
                                      showSuccess('Sub-menu label updated successfully')
                                    } catch (error) {
                                      showError('Failed to update sub-menu label')
                                    }
                                  })()
                                }}
                                className="nav-child-label-input"
                                placeholder="Enter sub-menu label"
                              />
                            </div>
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={child.enabled}
                                onChange={() => {
                                  const updatedItems = settings.navigationItems.map(navItem =>
                                    navItem.id === item.id
                                      ? {
                                          ...navItem,
                                          children: navItem.children.map(childItem =>
                                            childItem.id === child.id
                                              ? { ...childItem, enabled: !childItem.enabled }
                                              : childItem
                                          )
                                        }
                                      : navItem
                                  )
                                  ;(async () => {
                                    try {
                                      await updateNavigationItems(updatedItems)
                                      showSuccess('Sub-menu item updated successfully')
                                    } catch (error) {
                                      showError('Failed to update sub-menu item')
                                    }
                                  })()
                                }}
                              />
                              <span className="slider"></span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'login' && (
            <div className="settings-section">
              <h2>Login Page Settings</h2>
              
              <div className="setting-group">
                <label htmlFor="loginTitle">Login Page Title</label>
                <input
                  type="text"
                  id="loginTitle"
                  value={settings.loginTitle}
                  onChange={(e) => handleSiteSettingsUpdate('loginTitle', e.target.value)}
                  placeholder="Enter login page title"
                />
                <small>This will appear on the login page</small>
              </div>

              <div className="setting-group">
                <label>Login Logo</label>
                <div className="logo-options">
                  <div className="logo-option">
                    <input
                      type="radio"
                      id="loginLogoSvg"
                      name="loginLogoType"
                      value="svg"
                      checked={settings.loginLogoType === 'svg'}
                      onChange={() => handleSiteSettingsUpdate('loginLogoType', 'svg')}
                    />
                    <label htmlFor="loginLogoSvg">Default SVG</label>
                  </div>
                  
                  <div className="logo-option">
                    <input
                      type="radio"
                      id="loginLogoImage"
                      name="loginLogoType"
                      value="image"
                      checked={settings.loginLogoType === 'image'}
                      onChange={() => handleSiteSettingsUpdate('loginLogoType', 'image')}
                    />
                    <label htmlFor="loginLogoImage">Upload Image</label>
                  </div>
                  
                  <div className="logo-option">
                    <input
                      type="radio"
                      id="loginLogoUrl"
                      name="loginLogoType"
                      value="url"
                      checked={settings.loginLogoType === 'url'}
                      onChange={() => handleSiteSettingsUpdate('loginLogoType', 'url')}
                    />
                    <label htmlFor="loginLogoUrl">Image URL</label>
                  </div>
                </div>

                {settings.loginLogoType === 'image' && (
                  <div className="upload-section">
                    <input
                      type="file"
                      ref={loginFileInputRef}
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'loginLogo')}
                      style={{ display: 'none' }}
                    />
                    <button 
                      className="upload-btn"
                      onClick={() => loginFileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Choose Image'}
                    </button>
                    {settings.loginLogoUrl && (
                      <div className="logo-preview">
                        <img src={settings.loginLogoUrl} alt="Login logo preview" />
                      </div>
                    )}
                  </div>
                )}

                {settings.loginLogoType === 'url' && (
                  <div className="url-section">
                    <input
                      type="url"
                      placeholder="Enter image URL"
                      value={settings.loginLogoUrl}
                      onChange={(e) => handleUrlLogo(e.target.value, 'loginLogo')}
                    />
                    {settings.loginLogoUrl && (
                      <div className="logo-preview">
                        <img src={settings.loginLogoUrl} alt="Login logo preview" onError={(e) => e.target.style.display = 'none'} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="settings-actions">
        <button className="reset-btn" onClick={handleResetSettings}>
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}

export default SiteSettings