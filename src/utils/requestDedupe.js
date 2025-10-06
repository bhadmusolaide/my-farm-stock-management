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

// Enhanced request deduplication with intelligent batching
export class EnhancedRequestDeduper extends RequestDeduper {
  constructor() {
    super()
    this.requestBatches = new Map()
    this.batchTimeout = 50 // 50ms batch window
    this.maxBatchSize = 10
  }

  // Enhanced batching for similar requests
  async makeRequestWithBatching(method, url, params = {}, options = {}) {
    const requestKey = this.generateKey(method, url, params)

    // Check for exact duplicates first
    if (method === 'GET' || method === 'SELECT') {
      const cached = this.getCached(requestKey)
      if (cached) return cached
    }

    if (this.isPending(requestKey)) {
      return this.pendingRequests.get(requestKey)
    }

    // Check if this can be batched with similar requests
    if (method === 'SELECT' && options.batchable !== false) {
      const batchKey = this.getBatchKey(url, params)
      if (batchKey && this.requestBatches.has(batchKey)) {
        const batch = this.requestBatches.get(batchKey)
        if (batch.requests.length < this.maxBatchSize) {
          return this.addToBatch(batch, requestKey, method, url, params, options)
        }
      }
    }

    // Execute individual request
    return this.makeRequest(method, url, params, options)
  }

  // Get batch key for similar requests
  getBatchKey(url, params) {
    if (url.includes('audit_logs') || url.includes('transactions')) {
      return null // Don't batch these as they're usually unique
    }
    return `${url}_${JSON.stringify(this.getBatchableParams(params))}`
  }

  // Get only the batchable parameters
  getBatchableParams(params) {
    const batchableKeys = ['limit', 'order', 'select']
    return Object.keys(params)
      .filter(key => batchableKeys.includes(key))
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {})
  }

  // Add request to batch
  addToBatch(batch, requestKey, method, url, params, options) {
    return new Promise((resolve, reject) => {
      const request = { resolve, reject, requestKey, params }
      batch.requests.push(request)
      batch.params.push(params)

      // Set timeout for batch execution
      if (!batch.timeout) {
        batch.timeout = setTimeout(() => {
          this.executeBatch(batch)
        }, this.batchTimeout)
      }

      // Handle batch size limit
      if (batch.requests.length >= this.maxBatchSize) {
        clearTimeout(batch.timeout)
        this.executeBatch(batch)
      }
    })
  }

  // Execute batched requests
  async executeBatch(batch) {
    const { batchKey, requests, url, method } = batch

    try {
      // Merge parameters from all requests in batch
      const mergedParams = this.mergeBatchParams(batch.params)

      // Execute single request with merged parameters
      const result = await this.executeRequest(method, url, mergedParams, {})

      // Distribute results to individual requests
      requests.forEach((request, index) => {
        const filteredResult = this.filterBatchResult(result, request.params, mergedParams)
        this.setCache(request.requestKey, filteredResult)
        request.resolve(filteredResult)
      })

    } catch (error) {
      // Reject all requests in batch on error
      requests.forEach(request => request.reject(error))
    } finally {
      this.requestBatches.delete(batchKey)
    }
  }

  // Merge parameters for batched requests
  mergeBatchParams(paramsList) {
    const merged = {}

    paramsList.forEach(params => {
      Object.keys(params).forEach(key => {
        if (!merged[key]) {
          merged[key] = []
        }
        if (Array.isArray(params[key])) {
          merged[key] = merged[key].concat(params[key])
        } else {
          merged[key].push(params[key])
        }
      })
    })

    return merged
  }

  // Filter batch result for individual request
  filterBatchResult(result, requestParams, mergedParams) {
    if (!result.data || !Array.isArray(result.data)) {
      return result
    }

    // Filter results based on original request parameters
    let filteredData = [...result.data]

    Object.keys(requestParams).forEach(key => {
      if (key !== 'limit' && key !== 'order' && key !== 'select') {
        const value = requestParams[key]
        filteredData = filteredData.filter(item => item[key] === value)
      }
    })

    return { ...result, data: filteredData }
  }

  // Initialize batch for new requests
  initializeBatch(batchKey, method, url) {
    const batch = {
      batchKey,
      method,
      url,
      requests: [],
      params: [],
      created: Date.now()
    }

    this.requestBatches.set(batchKey, batch)
    return batch
  }
}

// Create enhanced deduper instance
export const enhancedDeduper = new EnhancedRequestDeduper()

// Enhanced usage analytics for database cost monitoring and optimization
export class DatabaseUsageAnalytics {
  constructor() {
    this.metrics = {
      requests: [],
      costs: [],
      performance: [],
      cache: [],
      errors: []
    }
    this.retentionPeriod = 30 * 24 * 60 * 60 * 1000 // 30 days
    this.costPerGB = 0.09 // Supabase cost per GB (example rate)
    this.costPerRequest = 0.0004 // Example cost per request
    this.startTime = Date.now()
  }

  // Track database request with cost estimation
  trackRequest(endpoint, method, options = {}) {
    const {
      dataSize = 0,
      responseTime = 0,
      cached = false,
      error = null,
      tableName = null
    } = options

    const request = {
      timestamp: Date.now(),
      endpoint,
      method,
      tableName,
      dataSize,
      responseTime,
      cached,
      error,
      // Estimate costs
      estimatedCost: this.estimateRequestCost(dataSize, cached),
      // Performance metrics
      isSlowQuery: responseTime > 1000, // > 1 second
      isLargeResponse: dataSize > 1024 * 1024 // > 1MB
    }

    this.metrics.requests.push(request)
    this.metrics.costs.push({
      timestamp: request.timestamp,
      cost: request.estimatedCost,
      type: cached ? 'cached' : 'fresh',
      tableName
    })

    if (error) {
      this.metrics.errors.push({
        timestamp: request.timestamp,
        endpoint,
        error: error.message || error,
        tableName
      })
    }

    // Cleanup old data
    this.cleanupOldData()

    return request
  }

  // Estimate the cost of a request
  estimateRequestCost(dataSize, cached) {
    const gbTransferred = dataSize / (1024 * 1024 * 1024)
    const dataTransferCost = gbTransferred * this.costPerGB

    // Cached requests have minimal compute cost
    const requestCost = cached ? this.costPerRequest * 0.1 : this.costPerRequest

    return dataTransferCost + requestCost
  }

  // Get cost summary for time period
  getCostSummary(startTime = null, endTime = null) {
    const start = startTime || (Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    const end = endTime || Date.now()

    const relevantCosts = this.metrics.costs.filter(
      cost => cost.timestamp >= start && cost.timestamp <= end
    )

    const totalCost = relevantCosts.reduce((sum, cost) => sum + cost.cost, 0)
    const cachedCost = relevantCosts.filter(c => c.type === 'cached').reduce((sum, c) => sum + c.cost, 0)
    const freshCost = relevantCosts.filter(c => c.type === 'fresh').reduce((sum, c) => sum + c.cost, 0)

    return {
      period: { start, end },
      totalCost,
      cachedCost,
      freshCost,
      savingsFromCache: freshCost - cachedCost,
      savingsPercentage: freshCost > 0 ? ((freshCost - cachedCost) / freshCost) * 100 : 0,
      requestCount: relevantCosts.length
    }
  }

  // Get performance insights
  getPerformanceInsights() {
    const recentRequests = this.metrics.requests.filter(
      req => Date.now() - req.timestamp < 60 * 60 * 1000 // Last hour
    )

    const slowQueries = recentRequests.filter(req => req.isSlowQuery)
    const errors = this.metrics.errors.filter(
      err => Date.now() - err.timestamp < 60 * 60 * 1000 // Last hour
    )

    const avgResponseTime = recentRequests.reduce((sum, req) => sum + req.responseTime, 0) / recentRequests.length || 0
    const cacheHitRate = recentRequests.filter(req => req.cached).length / recentRequests.length * 100 || 0

    return {
      slowQueries: slowQueries.length,
      errors: errors.length,
      avgResponseTime: Math.round(avgResponseTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      totalRequests: recentRequests.length,
      errorRate: (errors.length / recentRequests.length) * 100 || 0
    }
  }

  // Get optimization recommendations
  getOptimizationRecommendations() {
    const insights = this.getPerformanceInsights()
    const costSummary = this.getCostSummary()
    const recommendations = []

    // Cache optimization recommendations
    if (insights.cacheHitRate < 70) {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        title: 'Improve Cache Hit Rate',
        description: 'Cache hit rate is below 70%. Consider increasing cache timeouts for stable data.',
        potentialSavings: costSummary.totalCost * 0.3
      })
    }

    // Performance recommendations
    if (insights.slowQueries > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Optimize Slow Queries',
        description: `${insights.slowQueries} slow queries detected. Consider adding database indexes.`,
        potentialSavings: insights.slowQueries * this.costPerRequest * 0.5
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // Generate comprehensive report
  generateReport(days = 7) {
    const endTime = Date.now()
    const startTime = endTime - (days * 24 * 60 * 60 * 1000)

    const costSummary = this.getCostSummary(startTime, endTime)
    const performanceInsights = this.getPerformanceInsights()
    const recommendations = this.getOptimizationRecommendations()

    return {
      period: { start: startTime, end: endTime, days },
      summary: costSummary,
      performance: performanceInsights,
      recommendations,
      metadata: {
        generatedAt: new Date().toISOString(),
        retentionPeriod: this.retentionPeriod,
        currentCostRates: {
          perGB: this.costPerGB,
          perRequest: this.costPerRequest
        }
      }
    }
  }

  // Cleanup old metrics data
  cleanupOldData() {
    const cutoffTime = Date.now() - this.retentionPeriod

    Object.keys(this.metrics).forEach(metricType => {
      if (Array.isArray(this.metrics[metricType])) {
        this.metrics[metricType] = this.metrics[metricType].filter(
          item => item.timestamp > cutoffTime
        )
      }
    })
  }
}

// Create analytics instance
export const usageAnalytics = new DatabaseUsageAnalytics()

// Export instances
export const optimizedLoader = new OptimizedDataLoader(enhancedDeduper)
export const storageOptimizer = new StorageOptimizer()
export const performanceMonitor = new PerformanceMonitor()

export default RequestDeduper;