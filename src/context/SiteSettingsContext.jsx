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
    { id: 'lifecycle', label: 'Lifecycle Tracking', path: '/lifecycle', enabled: true },
    { id: 'feed', label: 'Feed Management', path: '/feed', enabled: true },
    { id: 'enhanced-feed', label: 'Enhanced Feed Management', path: '/enhanced-feed', enabled: true },
    { id: 'processing', label: 'Processing Management', path: '/processing', enabled: true },
    { id: 'batch-relationships', label: 'Batch Relationships', path: '/batch-relationships', enabled: true },
    { id: 'unified-inventory', label: 'Unified Inventory', path: '/unified-inventory', enabled: true }
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

  // Real-time subscription for site settings changes
  useEffect(() => {
    const subscription = supabase
      .channel('site-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        () => {
          console.log('Site settings changed, reloading...')
          loadSettings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('site_settings')
        .select('settings_data')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error)
        // If table doesn't exist, create it
        if (error.code === '42P01') {
          await initializeSettingsTable()
        }
        return
      }

      if (data?.settings_data) {
        console.log('Loaded settings from database:', data.settings_data)
        setSettings({ ...defaultSettings, ...data.settings_data })
      } else {
        // No settings found, initialize with defaults
        console.log('No settings found in database, using defaults')
        await initializeSettingsTable()
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeSettingsTable = async () => {
    try {
      // Create table if it doesn't exist
      const { error: createError } = await supabase.rpc('create_site_settings_table')
      if (createError && createError.message.includes('already exists')) {
        // Table exists, initialize with defaults
        await saveSettingsToSupabase(defaultSettings)
      }
      
      // Insert default settings
      await saveSettingsToSupabase(defaultSettings)
      setSettings(defaultSettings)
      console.log('Initialized site settings table with defaults')
    } catch (error) {
      console.error('Error initializing settings table:', error)
      // Fallback to local defaults
      setSettings(defaultSettings)
    }
  }

  const saveSettingsToSupabase = async (newSettings) => {
    try {
      console.log('Saving settings to database:', newSettings)
      
      // First, ensure the table exists by trying to create it (idempotent)
      try {
        const { error: createError } = await supabase.rpc('create_site_settings_table')
        if (createError) {
          console.warn('Settings table creation warning:', createError)
        }
      } catch (createErr) {
        console.warn('Could not verify settings table existence:', createErr)
      }
  
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          id: 1,
          settings_data: newSettings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
  
      if (error) {
        console.error('Error saving settings to database:', error)
        throw error
      }
  
      console.log('Settings saved successfully to database')
      
      // Trigger real-time update for other clients
      await supabase
        .channel('site-settings-update')
        .send({
          type: 'broadcast',
          event: 'settings-updated',
          payload: { timestamp: new Date().toISOString() }
        })
  
    } catch (error) {
      console.error('Error saving settings:', error)
      throw error
    }
  }

  const updateSettings = async (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    await saveSettingsToSupabase(updatedSettings)
    
    // Force reload to ensure latest data
    await loadSettings()
  }
  
  const updateNavigationItems = async (items) => {
    const updatedSettings = { ...settings, navigationItems: items }
    setSettings(updatedSettings)
    await saveSettingsToSupabase(updatedSettings)
    
    // Force reload to ensure latest data
    await loadSettings()
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