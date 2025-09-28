import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

const SiteSettingsContext = createContext()

// Default navigation items
const defaultNavItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/', enabled: true, order: 1 },
  { id: 'chickens', label: 'Chicken Orders', path: '/chickens', enabled: true, order: 2 },
  { id: 'inventory', label: 'Inventory', path: '/inventory', enabled: true, order: 3, isDropdown: true, children: [
    { id: 'stock', label: 'General Stock', path: '/stock', enabled: true },
    { id: 'live-chickens', label: 'Live Chicken Stock', path: '/live-chickens', enabled: true },
    { id: 'lifecycle', label: 'Lifecycle Tracking', path: '/lifecycle', enabled: true },
    { id: 'feed', label: 'Feed Management', path: '/feed', enabled: true },
    { id: 'dressed-chicken', label: 'Dressed Chicken Stock', path: '/dressed-chicken', enabled: true }
  ]},
  { id: 'transactions', label: 'Transactions', path: '/transactions', enabled: true, order: 4 },
  { id: 'reports', label: 'Reports', path: '/reports', enabled: true, order: 5 }
]

// Default settings
const defaultSettings = {
  siteTitle: 'Farm Stock Management',
  logoUrl: '',
  logoType: 'text', // 'text', 'image', 'url'
  navigationItems: defaultNavItems,
  loginTitle: 'Farm Stock Management',
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
    let subscription
    
    const setupSubscription = async () => {
      subscription = supabase
        .channel('site-settings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'site_settings'
          },
          () => {
            loadSettings()
          }
        )
        .subscribe()
    }
    
    setupSubscription()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
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
        // Prioritize database data over defaults for saved values
        setSettings({ ...data.settings_data, ...defaultSettings })
      } else {
        // No settings found, initialize with defaults
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
      // First check if any settings already exist
      const { data: existingSettings, error: selectError } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1)

      // If there's an error other than table not found, log it
      if (selectError && selectError.code !== '42P01') {
        console.warn('Settings table query warning:', selectError)
      }

      // If settings exist, don't overwrite them
      if (existingSettings && existingSettings.length > 0) {
        return
      }

      // Use service role key for admin operations if available
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      
      if (serviceRoleKey) {
        // Temporarily switch to service role for table creation
        const { error: createError } = await supabase.rpc('create_site_settings_table')
        if (createError) {
          console.warn('Settings table creation warning:', createError)
        }
      }
      
      // Insert default settings only if no settings exist
      await saveSettingsToSupabase(defaultSettings)
      setSettings(defaultSettings)
    } catch (error) {
      console.error('Error initializing settings table:', error)
      // Fallback to local defaults
      setSettings(defaultSettings)
    }
  }
  
  const saveSettingsToSupabase = async (newSettings) => {
    try {
      // Perform upsert operation
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
        throw new Error(`Database save failed: ${error.message}`)
      }
      
      // Trigger real-time update for other clients using main client
      const channel = supabase.channel('site-settings-update')
      channel.send({
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
    // State is already updated locally; subscription handles sync for other clients
    // No immediate reload needed to prevent loading stale data
  }
  
  const updateNavigationItems = async (items) => {
    const updatedSettings = { ...settings, navigationItems: items }
    setSettings(updatedSettings)
    await saveSettingsToSupabase(updatedSettings)
    // State is already updated locally; subscription handles sync for other clients
    // No immediate reload needed to prevent loading stale data
  }

  const resetToDefaults = async () => {
    setSettings(defaultSettings)
    await saveSettingsToSupabase(defaultSettings)
    // Optionally reload to confirm
    await loadSettings()
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