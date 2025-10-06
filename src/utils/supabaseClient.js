import { createClient } from '@supabase/supabase-js'
import { getRequestDeduper } from './requestDedupe'

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

// Initialize request deduper for enhanced performance
const requestDeduper = getRequestDeduper(supabase)

// Enhanced API client with intelligent caching and compression awareness
export class OptimizedSupabaseClient {
  constructor(supabaseClient) {
    this.supabase = supabaseClient
    this.responseCache = new Map()
    this.cacheTimeout = 300000 // 5 minutes default
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    }
    this.maxCacheSize = 1000 // Prevent memory leaks
    this.cacheInvalidationCallbacks = new Map()
  }

  // Enhanced cache key generation with better specificity
  generateCacheKey(table, columns = '*', filters = {}, options = {}) {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        result[key] = filters[key]
        return result
      }, {})

    const sortedOptions = Object.keys(options)
      .sort()
      .reduce((result, key) => {
        result[key] = options[key]
        return result
      }, {})

    return `${table}:${columns}:${JSON.stringify(sortedFilters)}:${JSON.stringify(sortedOptions)}`
  }

  // Enhanced caching with size management and statistics
  getFromCache(cacheKey) {
    const cached = this.responseCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      this.cacheStats.hits++
      return cached.data
    }

    // Remove expired cache entry
    if (cached) {
      this.responseCache.delete(cacheKey)
      this.cacheStats.evictions++
    }

    this.cacheStats.misses++
    return null
  }

  // Enhanced cache storage with size limits
  setCache(cacheKey, data) {
    // Implement LRU-style eviction if cache is full
    if (this.responseCache.size >= this.maxCacheSize) {
      const firstKey = this.responseCache.keys().next().value
      this.responseCache.delete(firstKey)
      this.cacheStats.evictions++
    }

    this.responseCache.set(cacheKey, {
      data: { data, count: data.count },
      timestamp: Date.now()
    })
    this.cacheStats.sets++
  }

  // Cache-aware select with enhanced compression preference and invalidation
  async select(table, columns = '*', filters = {}, options = {}) {
    const cacheKey = this.generateCacheKey(table, columns, filters, options)

    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    let query = this.supabase.from(table).select(columns, { count: 'exact' })

    // Apply filters with enhanced operators
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value)
      } else if (typeof value === 'object' && value.operator && value.value !== undefined) {
        query = query.filter(key, value.operator, value.value)
      } else if (typeof value === 'object' && value.gte !== undefined && value.lte !== undefined) {
        query = query.gte(key, value.gte).lte(key, value.lte)
      } else if (key.endsWith('_range')) {
        const actualKey = key.replace('_range', '')
        const [start, end] = value.split(',')
        query = query.gte(actualKey, start).lte(actualKey, end)
      } else {
        query = query.eq(key, value)
      }
    })

    // Apply options with enhanced sorting and pagination
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending })
    }
    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.range) {
      query = query.range(options.range.from, options.range.to)
    }

    // Add pagination metadata for better cache utilization
    const { data, error, count } = await query

    if (error) throw error

    // Cache the result with enhanced metadata
    const result = { data, count }
    this.setCache(cacheKey, result)

    return result
  }

  // Smart cache invalidation based on table mutations
  invalidateTableCache(tableName, specificIds = null) {
    const keysToDelete = []

    for (const key of this.responseCache.keys()) {
      if (key.startsWith(`${tableName}:`)) {
        if (!specificIds) {
          keysToDelete.push(key)
        } else {
          // For specific record invalidation, check if the cached data contains the record
          const cached = this.responseCache.get(key)
          if (cached && cached.data.data) {
            const shouldInvalidate = cached.data.data.some(record =>
              specificIds.includes(record.id)
            )
            if (shouldInvalidate) {
              keysToDelete.push(key)
            }
          }
        }
      }
    }

    keysToDelete.forEach(key => {
      this.responseCache.delete(key)
      this.cacheStats.evictions++
    })

    // Trigger external invalidation callbacks
    if (this.cacheInvalidationCallbacks.has(tableName)) {
      this.cacheInvalidationCallbacks.get(tableName).forEach(callback => {
        try {
          callback(specificIds)
        } catch (error) {
          console.warn('Cache invalidation callback error:', error)
        }
      })
    }
  }

  // Register cache invalidation callbacks for reactive updates
  onCacheInvalidation(tableName, callback) {
    if (!this.cacheInvalidationCallbacks.has(tableName)) {
      this.cacheInvalidationCallbacks.set(tableName, [])
    }
    this.cacheInvalidationCallbacks.get(tableName).push(callback)
  }

  // Remove cache invalidation callback
  offCacheInvalidation(tableName, callback) {
    if (this.cacheInvalidationCallbacks.has(tableName)) {
      const callbacks = this.cacheInvalidationCallbacks.get(tableName)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // Clear cache for specific table or all
  clearCache(table = null) {
    if (table) {
      this.invalidateTableCache(table)
    } else {
      this.responseCache.clear()
      this.cacheStats.evictions += this.responseCache.size
    }
  }

  // Get enhanced cache stats for monitoring
  getCacheStats() {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses
    const hitRate = totalRequests > 0 ? (this.cacheStats.hits / totalRequests) * 100 : 0

    return {
      size: this.responseCache.size,
      maxSize: this.maxCacheSize,
      hitRate: Math.round(hitRate * 100) / 100,
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      sets: this.cacheStats.sets,
      evictions: this.cacheStats.evictions,
      memoryUsage: Math.round(JSON.stringify([...this.responseCache.entries()]).length / 1024)
    }
  }

  // Smart cache warming for frequently accessed data
  async warmCache(table, warmConfig = {}) {
    const {
      columns = '*',
      filters = {},
      limit = 100,
      priority = 'normal'
    } = warmConfig

    try {
      // Warm cache with most frequently accessed data
      await this.select(table, columns, filters, {
        orderBy: { column: 'updated_at', ascending: false },
        limit
      })

      console.log(`Cache warmed for ${table} with priority: ${priority}`)
    } catch (error) {
      console.warn(`Cache warming failed for ${table}:`, error)
    }
  }

  // Adaptive cache timeout based on data volatility
  getAdaptiveCacheTimeout(tableName) {
    const volatilityMap = {
      'audit_logs': 60000, // 1 minute - very volatile
      'transactions': 120000, // 2 minutes - moderately volatile
      'chickens': 300000, // 5 minutes - moderate volatility
      'stock': 600000, // 10 minutes - low volatility
      'live_chickens': 600000, // 10 minutes - low volatility
      'dressed_chickens': 600000, // 10 minutes - low volatility
      'feed_inventory': 900000, // 15 minutes - very low volatility
      'users': 1800000, // 30 minutes - very low volatility
    }

    return volatilityMap[tableName] || this.cacheTimeout
  }
}

// Intelligent Subscription Manager for optimized real-time updates
export class SubscriptionManager {
  constructor(supabaseClient) {
    this.supabase = supabaseClient
    this.subscriptions = new Map()
    this.subscriptionConfigs = new Map()
    this.batchUpdates = new Map()
    this.batchTimeout = 1000 // 1 second batching window
    this.maxBatchSize = 50 // Maximum updates per batch
  }

  // Create optimized subscription with intelligent batching
  subscribe(tableName, config = {}) {
    const {
      event = 'INSERT',
      filter = null,
      batchUpdates = true,
      onUpdate = () => {},
      onError = () => {}
    } = config

    const subscriptionKey = `${tableName}_${event}_${JSON.stringify(filter)}`

    // Return existing subscription if already subscribed
    if (this.subscriptions.has(subscriptionKey)) {
      return this.subscriptions.get(subscriptionKey)
    }

    let subscription = null

    try {
      let channel = this.supabase
        .channel(`public:${tableName}`)
        .on('postgres_changes',
          {
            event,
            schema: 'public',
            table: tableName,
            filter: filter
          },
          (payload) => {
            if (batchUpdates) {
              this.handleBatchedUpdate(tableName, payload, onUpdate)
            } else {
              onUpdate(payload)
            }
          }
        )

      subscription = channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${tableName} changes`)
        } else if (status === 'CHANNEL_ERROR') {
          onError(new Error(`Subscription error for ${tableName}`))
        }
      })

      // Store subscription with cleanup function
      this.subscriptions.set(subscriptionKey, {
        subscription,
        unsubscribe: () => {
          channel.unsubscribe()
          this.subscriptions.delete(subscriptionKey)
        }
      })

      return this.subscriptions.get(subscriptionKey)

    } catch (error) {
      onError(error)
      return null
    }
  }

  // Handle batched updates to reduce UI thrashing
  handleBatchedUpdate(tableName, payload, callback) {
    if (!this.batchUpdates.has(tableName)) {
      this.batchUpdates.set(tableName, {
        updates: [],
        timeout: null,
        callback
      })
    }

    const batch = this.batchUpdates.get(tableName)
    batch.updates.push(payload)

    // Auto-flush if batch is full or timeout reached
    if (batch.updates.length >= this.maxBatchSize) {
      this.flushBatch(tableName)
    } else if (!batch.timeout) {
      batch.timeout = setTimeout(() => {
        this.flushBatch(tableName)
      }, this.batchTimeout)
    }
  }

  // Flush batched updates
  flushBatch(tableName) {
    const batch = this.batchUpdates.get(tableName)
    if (!batch || batch.updates.length === 0) return

    // Clear timeout
    if (batch.timeout) {
      clearTimeout(batch.timeout)
      batch.timeout = null
    }

    // Group updates by type for better processing
    const updatesByType = {
      INSERT: [],
      UPDATE: [],
      DELETE: []
    }

    batch.updates.forEach(update => {
      if (updatesByType[update.event]) {
        updatesByType[update.event].push(update)
      }
    })

    // Call callback with batched updates
    batch.callback({
      tableName,
      updates: batch.updates,
      updatesByType,
      timestamp: Date.now()
    })

    // Clear batch
    batch.updates = []

    // Remove from map if no more updates
    if (batch.updates.length === 0) {
      this.batchUpdates.delete(tableName)
    }
  }

  // Unsubscribe from specific table/event
  unsubscribe(tableName, event = null, filter = null) {
    const subscriptionKey = `${tableName}_${event || '*'}_${JSON.stringify(filter)}`

    if (this.subscriptions.has(subscriptionKey)) {
      const { unsubscribe } = this.subscriptions.get(subscriptionKey)
      unsubscribe()
      return true
    }

    // If no specific subscription found, unsubscribe from all for this table
    const keysToRemove = []
    for (const key of this.subscriptions.keys()) {
      if (key.startsWith(`${tableName}_`)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => {
      const { unsubscribe } = this.subscriptions.get(key)
      unsubscribe()
    })

    return keysToRemove.length > 0
  }

  // Get subscription statistics
  getSubscriptionStats() {
    return {
      activeSubscriptions: this.subscriptions.size,
      batchedUpdates: this.batchUpdates.size,
      totalBatchedUpdates: Array.from(this.batchUpdates.values())
        .reduce((sum, batch) => sum + batch.updates.length, 0)
    }
  }
}

// Export optimized client instance with enhanced request deduplication
export const optimizedSupabase = new OptimizedSupabaseClient(supabase)

// Integrate with enhanced request deduper and subscription manager
optimizedSupabase.requestDeduper = requestDeduper
export const subscriptionManager = new SubscriptionManager(supabase)