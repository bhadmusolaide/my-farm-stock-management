// Request deduplication utility to prevent duplicate API calls
class RequestDeduper {
  constructor() {
    this.pendingRequests = new Map();
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes cache for better egress reduction
  }

  // Generate a unique key for the request
  generateKey(method, url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    return `${method}:${url}:${JSON.stringify(sortedParams)}`;
  }

  // Check if request is already pending
  isPending(key) {
    return this.pendingRequests.has(key);
  }

  // Get cached result if available and not expired
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    // Remove expired cache
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  // Set a request as pending
  setPending(key, promise) {
    this.pendingRequests.set(key, promise);

    // Clean up when promise resolves
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return promise;
  }

  // Cache a successful result
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache for a specific key or pattern
  clearCache(keyPattern) {
    if (keyPattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(keyPattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Make a deduplicated request
  async makeRequest(method, url, params = {}, options = {}) {
    const key = this.generateKey(method, url, params);

    // Check cache first (for GET requests)
    if (method === 'GET' || method === 'SELECT') {
      const cached = this.getCached(key);
      if (cached) {
        return cached;
      }
    }

    // Check if request is already pending
    if (this.isPending(key)) {
      return this.pendingRequests.get(key);
    }

    // Create the actual request function
    const makeActualRequest = async () => {
      try {
        // This would be replaced with actual API call logic
        // For now, return a placeholder
        const result = await this.executeRequest(method, url, params, options);

        // Cache successful GET results
        if ((method === 'GET' || method === 'SELECT') && result) {
          this.setCache(key, result);
        }

        return result;
      } catch (error) {
        // Don't cache errors
        throw error;
      }
    };

    // Set as pending and execute
    return this.setPending(key, makeActualRequest());
  }

  // Execute the actual request (to be implemented by specific API clients)
  async executeRequest(method, url, params, options) {
    // This should be overridden by the specific implementation
    throw new Error('executeRequest must be implemented by subclass');
  }
}

// Supabase-specific request deduper
export class SupabaseRequestDeduper extends RequestDeduper {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  async executeRequest(method, tableName, params, options) {
    try {
      let query = this.supabase.from(tableName);

      // Apply method-specific logic
      switch (method) {
        case 'SELECT':
          if (params.select) query = query.select(params.select);
          if (params.eq) {
            Object.entries(params.eq).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          if (params.ilike) {
            Object.entries(params.ilike).forEach(([key, value]) => {
              query = query.ilike(key, value);
            });
          }
          if (params.gte) {
            Object.entries(params.gte).forEach(([key, value]) => {
              query = query.gte(key, value);
            });
          }
          if (params.lte) {
            Object.entries(params.lte).forEach(([key, value]) => {
              query = query.lte(key, value);
            });
          }
          if (params.order) {
            query = query.order(params.order.column, { ascending: params.order.ascending });
          }
          if (params.range) {
            query = query.range(params.range.from, params.range.to);
          }
          if (params.limit) query = query.limit(params.limit);
          if (params.single) query = query.single();

          const { data, error, count } = await query;
          if (error) throw error;
          return { data, count };

        case 'INSERT':
          const { data: insertData, error: insertError } = await query.insert(params.data);
          if (insertError) throw insertError;
          return insertData;

        case 'UPDATE':
          if (params.eq) {
            Object.entries(params.eq).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          const { data: updateData, error: updateError } = await query.update(params.data);
          if (updateError) throw updateError;
          return updateData;

        case 'DELETE':
          if (params.eq) {
            Object.entries(params.eq).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          const { error: deleteError } = await query.delete();
          if (deleteError) throw deleteError;
          return true;

        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    } catch (error) {
      console.error('Supabase request error:', error);
      throw error;
    }
  }
}

// Create singleton instance
let deduperInstance = null;

export const getRequestDeduper = (supabaseClient) => {
  if (!deduperInstance) {
    deduperInstance = new SupabaseRequestDeduper(supabaseClient);
  }
  return deduperInstance;
};

// Batched audit logger to reduce egress from frequent individual writes
export class BatchedAuditLogger {
  constructor() {
    this.auditQueue = []
    this.batchSize = 10
    this.flushInterval = 5000 // 5 seconds
    this.isFlushing = false

    // Auto-flush every 5 seconds
    setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  // Queue audit log entry
  queueAudit(action, tableName, recordId, oldValues, newValues, userId = null) {
    this.auditQueue.push({
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      user_id: userId,
      created_at: new Date().toISOString()
    })

    // Auto-flush if batch is full
    if (this.auditQueue.length >= this.batchSize) {
      this.flush()
    }
  }

  // Flush queued audits to database
  async flush() {
    if (this.auditQueue.length === 0 || this.isFlushing) return

    this.isFlushing = true
    const batch = [...this.auditQueue]
    this.auditQueue = []

    try {
      // This would integrate with your Supabase client
      // For now, just log the batch size
      console.log(`Flushing ${batch.length} audit records`)

      // TODO: Implement actual batch insert to audit_logs table
      // const { error } = await supabase.from('audit_logs').insert(batch)
      // if (error) throw error

    } catch (error) {
      console.error('Failed to flush audit logs:', error)
      // Re-queue failed items
      this.auditQueue.unshift(...batch)
    } finally {
      this.isFlushing = false
    }
  }

  // Force flush (useful before app unload)
  async forceFlush() {
    while (this.auditQueue.length > 0 || this.isFlushing) {
      await this.flush()
      if (this.auditQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }
}

// Export singleton instance
export const auditLogger = new BatchedAuditLogger()

// Optimized data loader with pagination and selective loading
export class OptimizedDataLoader {
  constructor(requestDeduper) {
    this.deduper = requestDeduper
    this.loadingStates = new Map()
  }

  // Load data with pagination and selective columns
  async loadWithPagination(table, options = {}) {
    const {
      page = 1,
      pageSize = 20,
      columns = '*',
      filters = {},
      orderBy = { column: 'created_at', ascending: false },
      useCache = true
    } = options

    const cacheKey = `${table}_${page}_${pageSize}_${columns}_${JSON.stringify(filters)}_${JSON.stringify(orderBy)}`

    // Prevent duplicate requests
    if (this.loadingStates.get(cacheKey)) {
      return this.loadingStates.get(cacheKey)
    }

    const loadPromise = (async () => {
      try {
        // Use optimized Supabase client if available
        if (window.optimizedSupabase) {
          return await window.optimizedSupabase.select(table, columns, filters, {
            orderBy,
            limit: pageSize,
            range: {
              from: (page - 1) * pageSize,
              to: page * pageSize - 1
            }
          })
        }

        // Fallback to existing loadPaginatedData
        if (window.loadPaginatedData) {
          return await window.loadPaginatedData(table, page, pageSize, filters)
        }

        throw new Error('No data loading method available')
      } finally {
        this.loadingStates.delete(cacheKey)
      }
    })()

    if (useCache) {
      this.loadingStates.set(cacheKey, loadPromise)
    }

    return loadPromise
  }

  // Batch load multiple tables efficiently
  async batchLoad(tables) {
    const promises = tables.map(table => this.loadWithPagination(table.table, table.options))
    return Promise.allSettled(promises)
  }

  // Smart preloading for likely next pages
  preloadNextPage(currentPage, table, options) {
    if (currentPage < 10) { // Only preload first 10 pages
      this.loadWithPagination(table, {
        ...options,
        page: currentPage + 1,
        useCache: false // Background load
      }).catch(() => {
        // Silently fail preload
      })
    }
  }
}

// localStorage optimization utility
export class StorageOptimizer {
  constructor() {
    this.maxStorageSize = 5 * 1024 * 1024 // 5MB limit
    this.cleanupThreshold = 4 * 1024 * 1024 // Cleanup at 4MB
  }

  // Get current storage size
  getStorageSize() {
    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage.getItem(key).length + key.length
      }
    }
    return total
  }

  // Cleanup old data when threshold exceeded
  cleanup() {
    const currentSize = this.getStorageSize()
    if (currentSize < this.cleanupThreshold) return

    // Get all keys with timestamps
    const keysWithTime = []
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const item = JSON.parse(localStorage.getItem(key) || '{}')
        keysWithTime.push({
          key,
          size: localStorage.getItem(key).length,
          timestamp: item.updated_at || item.timestamp || 0
        })
      }
    }

    // Sort by timestamp (oldest first) and remove until under limit
    keysWithTime.sort((a, b) => a.timestamp - b.timestamp)

    let removedSize = 0
    for (const item of keysWithTime) {
      if (currentSize - removedSize < this.maxStorageSize) break

      localStorage.removeItem(item.key)
      removedSize += item.size
    }
  }

  // Set item with size check and cleanup
  setItem(key, value) {
    const serializedValue = JSON.stringify(value)
    const itemSize = serializedValue.length + key.length

    // Check if adding this item would exceed limit
    if (this.getStorageSize() + itemSize > this.maxStorageSize) {
      this.cleanup()
    }

    localStorage.setItem(key, serializedValue)
  }
}

// Performance monitoring utility
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.egressTracking = {
      totalRequests: 0,
      totalBytesTransferred: 0,
      cacheHits: 0,
      cacheMisses: 0,
      startTime: Date.now()
    }
  }

  // Track API request metrics
  trackRequest(endpoint, method, bytesTransferred, cached = false) {
    const key = `${method}:${endpoint}`

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        count: 0,
        totalBytes: 0,
        avgResponseTime: 0,
        lastAccessed: Date.now()
      })
    }

    const metric = this.metrics.get(key)
    metric.count++
    metric.totalBytes += bytesTransferred
    metric.lastAccessed = Date.now()

    // Update egress tracking
    this.egressTracking.totalRequests++
    this.egressTracking.totalBytesTransferred += bytesTransferred

    if (cached) {
      this.egressTracking.cacheHits++
    } else {
      this.egressTracking.cacheMisses++
    }
  }

  // Get performance report
  getReport() {
    const uptime = Date.now() - this.egressTracking.startTime
    const hitRate = this.egressTracking.cacheHits /
      (this.egressTracking.cacheHits + this.egressTracking.cacheMisses) || 0

    return {
      uptime: Math.round(uptime / 1000),
      totalRequests: this.egressTracking.totalRequests,
      totalBytesTransferred: this.egressTracking.totalBytesTransferred,
      cacheHitRate: Math.round(hitRate * 100),
      avgBytesPerRequest: Math.round(this.egressTracking.totalBytesTransferred / this.egressTracking.totalRequests) || 0,
      topEndpoints: Array.from(this.metrics.entries())
        .sort((a, b) => b[1].totalBytes - a[1].totalBytes)
        .slice(0, 5)
    }
  }

  // Reset metrics
  reset() {
    this.metrics.clear()
    this.egressTracking = {
      totalRequests: 0,
      totalBytesTransferred: 0,
      cacheHits: 0,
      cacheMisses: 0,
      startTime: Date.now()
    }
  }
}

// Export instances
export const optimizedLoader = new OptimizedDataLoader()
export const storageOptimizer = new StorageOptimizer()
export const performanceMonitor = new PerformanceMonitor()

export default RequestDeduper;