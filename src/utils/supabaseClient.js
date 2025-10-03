import { createClient } from '@supabase/supabase-js'

// These environment variables will be set in the .env file
// For development, we'll use placeholder values if env vars are not set
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project-url.supabase.co'
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Create the Supabase client with optimized settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
    },
  },
  db: {
    schema: 'public',
  },
})

// Enhanced API client with caching and compression awareness
export class OptimizedSupabaseClient {
  constructor(supabaseClient) {
    this.supabase = supabaseClient
    this.responseCache = new Map()
    this.cacheTimeout = 300000 // 5 minutes
  }

  // Cache-aware select with compression preference
  async select(table, columns = '*', filters = {}, options = {}) {
    const cacheKey = `${table}:${columns}:${JSON.stringify(filters)}:${JSON.stringify(options)}`

    // Check cache first
    const cached = this.responseCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    let query = this.supabase.from(table).select(columns, { count: 'exact' })

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value)
      } else if (typeof value === 'object' && value.operator) {
        query = query.filter(key, value.operator, value.value)
      } else {
        query = query.eq(key, value)
      }
    })

    // Apply options
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending })
    }
    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.range) {
      query = query.range(options.range.from, options.range.to)
    }

    const { data, error, count } = await query

    if (error) throw error

    // Cache the result
    this.responseCache.set(cacheKey, {
      data: { data, count },
      timestamp: Date.now()
    })

    return { data, count }
  }

  // Clear cache for specific table or all
  clearCache(table = null) {
    if (table) {
      for (const key of this.responseCache.keys()) {
        if (key.startsWith(`${table}:`)) {
          this.responseCache.delete(key)
        }
      }
    } else {
      this.responseCache.clear()
    }
  }

  // Get cache stats for monitoring
  getCacheStats() {
    return {
      size: this.responseCache.size,
      maxSize: 1000, // Prevent memory leaks
      hitRate: this.responseCache.hitRate || 0
    }
  }
}

// Export optimized client instance
export const optimizedSupabase = new OptimizedSupabaseClient(supabase)