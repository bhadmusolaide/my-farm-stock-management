import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

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
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)

  // Load settings from Supabase on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('settings_data')
        .order('id', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error)
        return
      }

      if (data?.settings_data) {
        setSettings({ ...defaultSettings, ...data.settings_data })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettingsToSupabase = async (newSettings) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          id: 1,
          settings_data: newSettings,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving settings:', error)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const updateSettings = async (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    await saveSettingsToSupabase(updatedSettings)
  }

  const updateNavigationItems = async (items) => {
    const updatedSettings = { ...settings, navigationItems: items }
    setSettings(updatedSettings)
    await saveSettingsToSupabase(updatedSettings)
  }

  const resetToDefaults = async () => {
    setSettings(defaultSettings)
    await saveSettingsToSupabase(defaultSettings)
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
    defaultSettings,
    loading
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