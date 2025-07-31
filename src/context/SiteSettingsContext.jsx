import { createContext, useContext, useState, useEffect } from 'react'

const SiteSettingsContext = createContext()

// Default navigation items
const defaultNavItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/', enabled: true, order: 1 },
  { id: 'orders', label: 'Orders', path: '/chickens', enabled: true, order: 2 },
  { id: 'inventory', label: 'Inventory', path: '/inventory', enabled: true, order: 3, isDropdown: true, children: [
    { id: 'stock', label: 'General Stock', path: '/stock', enabled: true },
    { id: 'live-chickens', label: 'Live Chicken Stock', path: '/live-chickens', enabled: true },
    { id: 'feed', label: 'Feed Management', path: '/feed', enabled: true }
  ]},
  { id: 'transactions', label: 'Transactions', path: '/transactions', enabled: true, order: 4 },
  { id: 'reports', label: 'Reports', path: '/reports', enabled: true, order: 5 }
]

// Default settings
const defaultSettings = {
  siteTitle: 'Omzo Farmz',
  logoUrl: '',
  logoType: 'text', // 'text', 'image', 'url'
  navigationItems: defaultNavItems,
  loginTitle: 'Omzo Farmz',
  loginLogoUrl: '',
  loginLogoType: 'svg' // 'svg', 'image', 'url'
}

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('siteSettings')
    return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings
  })

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('siteSettings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const updateNavigationItems = (items) => {
    setSettings(prev => ({ ...prev, navigationItems: items }))
  }

  const resetToDefaults = () => {
    setSettings(defaultSettings)
    localStorage.removeItem('siteSettings')
  }

  const uploadImage = async (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'))
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select a valid image file'))
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('File size must be less than 5MB'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target.result)
      }
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      reader.readAsDataURL(file)
    })
  }

  const value = {
    settings,
    updateSettings,
    updateNavigationItems,
    resetToDefaults,
    uploadImage,
    defaultSettings
  }

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext)
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider')
  }
  return context
}

export default SiteSettingsContext